import { Component, OnDestroy, OnInit } from '@angular/core';
import { User } from 'src/app/utilities/authentication/user.model';
import { AuthenticationService } from 'src/app/utilities/authentication/authentication.service';
import { DatabaseService } from '../../services/database.service';
import { TestsService, Test } from '../../services/tests.service';
import { SentencesService, sentence } from '../../services/sentences.service';

@Component({
  selector: 'app-admin-sentences',
  templateUrl: './admin-sentences.component.html',
  styleUrls: ['./admin-sentences.component.scss']
})
export class AdminSentencesComponent implements OnInit, OnDestroy {

    // if the page is loading
    isLoading: boolean = true;
    // these do NOT need to be an array, but in a slow start everything got coded this way and so thats how it is!...
    initialData: sentence[];
    // the data to display
    viewData: [sentence[]] = [[]];
    // the current route, an array of strings which have a unique id to the path
    route: [string] = [""];
    // the things to include in the viewdata (the bits required on the ui);
    // this might just slow everything down to be honest...
    selection: string[] = ['id', 'name','sentence', 'starter', 'tests', 'meta', 'comparison', 'function'];

    // boolean comparitors to maintain visual things on the ui
    autosave: boolean = false; // should this autosave?
    unsavedChanges: boolean = false; // any unsaved changes?
    databaseMismatch: boolean = false; // if the local and database versions do not match this is true.
    singleStreamDataView: boolean = false; // should the whole database be shown or only the path you are on

    // if a test is being added this is not empty...
    addTest: {order: number, index: number} = {order: null, index: null};
    // the possible sentence combinations
    possibilities: {sentence: string, depth: number, delete: boolean}[];
    // the last change in ui to maintain the view when changing things.
    lastPositionChange: {position: number, index: number, id: string} = {position: null, index: null, id: null};
    // undo functionality - chain holds the objects and functions to perform the undos.
    undoChain: {commandName: string, data: sentence, fn: Function}[] = [];
    maxUndo: number = 10;
    // user object
    user: User;

    constructor(private databaseService: DatabaseService, 
                private auth: AuthenticationService, 
                private testsService: TestsService,
                private sentenceService: SentencesService) {
                
                // get the user details...
                auth.user.subscribe((newUser: User) => {
                    this.user = newUser;
                })
    }

    /**
     * On init get the database...
     */
    ngOnInit(): void {
        this.isLoading = true;

        // get the sentence data from the database...
        this.sentenceService.getSentencesDatabase('template').subscribe((data: sentence) => {
            const sentenceData: sentence[] = [data];
            // set the data on the display
            this.initialData = JSON.parse(JSON.stringify(sentenceData));
            this.viewData = this.sentenceService.getSentenceData(this.route, this.singleStreamDataView, this.selection);
            this.sentenceService.generateSentenceOptions(this.route);
        }, (error) => {
            console.log(`Error gathering the database: ${error.message}`);
        }, () => {
            this.isLoading = false;
        })
    }

    /**
     * On destroy upload the database to the development database...
     */
    ngOnDestroy() {
        // when leaving without specifically comitting only upload to the development version
        this.reUploadToFirebase('dev');
    }

    /**
     * Upload the changed version of the database to firebase.
     * @param docName 
     */
    reUploadToFirebase(docName?: string) {
        if(this.databaseMismatch) {
            this.isLoading = true; // no edits allowed during reupload...
            this.databaseMismatch = false; // disable the changes button and reenable if failure.
    
            // const doc = docName ? docName : 'template';
            const doc = docName ? docName : 'template';
            // this.databaseService.uploadSentences(doc, this.sentenceData[0]).subscribe(returnData => {
            this.databaseService.uploadSentences(doc, this.sentenceService.getCurrentSentenceData()[0]).subscribe(returnData => {
                // changes comitted
                this.isLoading = false;
            }, error => {
                // error occured, which means changes were not committed.
                console.log(`Error reuploading to database: ${error.message}`);
                this.databaseMismatch = true;
                this.isLoading = false;
            })
        }
    }

    /**
     * See the full data view - i.e. all sub routes that were not traversed...
     */
    setFullDataView() {
        this.singleStreamDataView = !this.singleStreamDataView;
        this.viewData = this.sentenceService.getSentenceData(this.route, this.singleStreamDataView, this.selection);
    }

    /**
     * Set variables after a view change request (i.e. to navigate deeper)
     * @param position 
     * @param index 
     * @param id 
     */
    setView(position: number, index: number, id: string) {        
        this.lastPositionChange = {position: position, index: index, id: id};
        this.route[position+1] = id;
        this.route.splice(position+2);
        this.viewData = this.sentenceService.getSentenceData(this.route, this.singleStreamDataView, this.selection);
        this.possibilities = this.sentenceService.generateSentenceOptions(this.route);
    }

    /**
     * Adds a test selection box to the position and index
     * @param position 
     * @param index 
     */
    addNewTestSelectionBox(position: number, index: number): void {
        this.addTest = {order: position, index: index};
    }

    /**
     * Adds a command to the undo chain.
     * @param command 
     * @param data 
     * @param fn 
     */
    addToUndo(command: string, data: sentence, fn: Function) {
        this.undoChain.push({commandName: command, data: data, fn: fn});
        // undo chain is limited for memory reasons......
        if(this.undoChain.length > this.maxUndo) {
            // remove the first element of the chain, this can no onger be undone.
            this.undoChain.shift();
        }
    }

    /**
     * Undoes the last change in the system.
     * Only works for deleting objects (not name changes, move to the left or anything like that...)
     */
    undoLastChange(): void {
        // get the function and the data
        const fn: Function = this.undoChain[this.undoChain.length - 1].fn;
        const data: sentence = this.undoChain[this.undoChain.length - 1].data;
        // execute the undo operation
        fn(data);
        // remove from the undo list
        this.undoChain.pop();
        // reset the view with the changes...
        // DATA . ID NOT NECESSARILY WHAT NEEDS TO HAPPEN BUT FOR CHECKING...
        this.setView(this.lastPositionChange.position, this.lastPositionChange.index, data.id);
    }

    /**
     * Toggle autosave
     */
    autosaveToggle(): void {
        this.autosave = !this.autosave;
        this.saveChanges();
    }

    /**
     * Reset the route...
     */
    resetRoute(): void {
        this.route = [""];
        this.viewData = this.sentenceService.getSentenceData(this.route, this.singleStreamDataView, this.selection);
    }

    /**
     * remove the error text
     */
    removeError(): void {
        this.errorText = undefined;
    }

    /**
     * Commit any changes to the stored database (local storage)
     */
    saveChanges(): void {
        if(this.autosave || (!this.autosave && this.unsavedChanges)) {
            this.unsavedChanges = false;
            // and then need to commit to the database.
            localStorage.setItem('sentences-data', JSON.stringify(this.sentenceService.getCurrentSentenceData()));
        }
    }

    /**
     * Simple method to quickly compare the current dataset against the initial dataset.
     * @returns true is the are equal, false otherwise
     */
    changeComparsion(): boolean {
        const sentenceData: sentence[] = this.sentenceService.getCurrentSentenceData();
        let changes: boolean = (JSON.stringify(this.initialData) === JSON.stringify(sentenceData));
        changes ? this.unsavedChanges = false : this.unsavedChanges = true;
        changes ? this.databaseMismatch = false : this.databaseMismatch = true;
        return changes;
    }

    modifySuccess(): void {
        // toggle autosave if data has been modified and toggle unsaved changes if there is no autosave.
        this.autosave ? this.saveChanges() : this.unsavedChanges = true;
        // redraw the grid and check for save status...
        this.viewData = this.sentenceService.getSentenceData(this.route, this.singleStreamDataView, this.selection);
        this.changeComparsion();
        // regenerate the sentence options
        this.possibilities = this.sentenceService.generateSentenceOptions(this.route);
        // set the view
        this.setView(this.lastPositionChange.position, this.lastPositionChange.index, this.lastPositionChange.id);
    }
    
    errorText: string;

    // ORDERING FUNCTIONS - FULL DETAIL IN SENTENCE SERVICE
    reOrderItemLeft(position: number, subPosition: number): void {
        const reorder: boolean = this.sentenceService.reOrderItemLeft(position, subPosition, this.route);
        reorder ? this.modifySuccess() : this.errorText = "Re ordering of item failed...";
    }

    addNewSubLevel(position: number): void {
        const added: boolean = this.sentenceService.addNewSubLevel(position, this.route);
        added ? this.modifySuccess() : this.errorText = "Addition of sub level failed...";
    }

    // NOT FINISHED - FINISH ON MAIN COMPUTER.
    deleteRoute(position: number, subPosition: number): void {
        const deleted: {text: string, stem: sentence, fn: Function} = this.sentenceService.deleteRoute(position, subPosition, this.route);
        
        if(deleted) {
            this.addToUndo(deleted.text, deleted.stem, deleted.fn);
            this.modifySuccess();
        } else {
            this.errorText = "Deletion of route failed...";
        }
    }

    // SENTENCES FUNCTIONS - FULL DETAIL IN SENTENCE SERVICE
    deleteSentence(position: number, subPosition: number, sentenceIndex: number): void {
        const deleted: boolean = this.sentenceService.deleteSentence(position, subPosition, sentenceIndex, this.route);
        deleted ? this.modifySuccess() : this.errorText = "Deletion of sentence failed...";
    }

    addNewSentence(position: number, subPosition: number): void {
        const added: boolean = this.sentenceService.addNewSentence(position, subPosition, this.route);
        added ? this.modifySuccess() : this.errorText = "Addition of sentence failed...";
    }

    modifySentence(position: number, subPosition: number, sentenceIndex: number, modifiedComment): void {
        const modified: boolean = this.sentenceService.modifySentenceData(position, subPosition, sentenceIndex, modifiedComment, this.route);
        modified ? this.modifySuccess() : this.errorText = "Modification of sentence failed...";
    }

    // CHNAGE FUNCTIONS GENERAL - FULL DETAIL IN SENTENCES SERVICE
    modifyName(position: number, subPosition: number, newName): void {
        const name: boolean = this.sentenceService.modifyName(position, subPosition, newName, this.route);
        name ? this.modifySuccess() : this.errorText = "Modification of name failed...";
    }

    modifyStartpointData(position: number, subPosition: number, currentState: boolean): void {
        const startpoint: boolean = this.sentenceService.modifyStartpointData(position, subPosition, currentState, this.route);
        startpoint ? this.modifySuccess() : this.errorText = "Toggling of start point failed...";
    }

    // TESTS STUFF - CHECK FOR SENTENCE SERVICE FOR MAIN COMMENTS.
    removeTest(position: number, subPosition: number, testNumber: number): void {
        const removed: boolean = this.sentenceService.removeTest(position, subPosition, testNumber, this.route);
        removed ? this.modifySuccess() : this.errorText = "Removal of test failed...";
    }

    addNewTest(position: number, subposition: number): void {
        const added: boolean = this.sentenceService.addNewTest(position, subposition, this.route);

        if(added) {
            this.addTest = { order: null, index: null };
            this.modifySuccess();
        } else {
            this.errorText = "Addition of test failed...";
        }
    }

    /**
     * Changes the value of a test option...
     * @param position 
     * @param index 
     * @param testIndex 
     * @param value 
     */
     changeTestOptionValue(position: number, index: number, testIndex: number, value: string) {
        const modified: boolean = this.sentenceService.modifyTestValue(position, index, testIndex, this.route, value);
        modified ? this.modifySuccess() : this.errorText = "Modification of test failed...";
    }

    // COPY AND PASTE FUNCTION - FULL DETIAL IN SENTENCE SERVICE  for PASTE
    copiedItem: sentence;

    /**
     * Copy a sentence type from the database...
     * @param position The position of thecopied item
     * @param subPosition The position within the subposition array
     */
    copyItem(position: number, subPosition: number): void {
        const newCopyItem: sentence = this.sentenceService.copyItem(position, subPosition, this.route);
        
        if(newCopyItem) {
            this.copiedItem = newCopyItem;
            this.modifySuccess();
        } else {
            this.errorText = "Copy of item failed...";
        }
    }

    /** Clear the copied item  */
    clearCopiedItem(): void { this.copiedItem = undefined; }

    /**
     * Paste the item...
     * @param position 
     */
    pasteItem(position: number): void {
        const paste: boolean = this.sentenceService.pasteItem(position, this.copiedItem, this.route);

        if(paste) {
            this.copiedItem = undefined;
            this.modifySuccess();
        } else {
            this.errorText = "Pasting of item failed...";
        }
    }

    /**
     * Filters the lists of tests to exclude those tests already added.
     * Used for the dropdown box when adding a new test.
     * @param testsAdded lists of the tests already added
     * @param allTests List of all the tests in the system.
     * @returns 
     */
    filterTests(testsAdded: {name: string}[], allTests: Test[]): Test[] {
        if(testsAdded) {
            return allTests.filter(test => testsAdded.indexOf(each => { test.name === each.name }) === -1 );
        } else {
            return allTests;
        }
    }

    // Some getters to make the HTML a little easier
    getRouteNames(): string[] {
        return this.sentenceService.getRouteNames(this.route);
    }

    /**
     * Retrives the description for a test value to inform the user.
     * @param testName 
     * @returns 
     */
    getTestDescription(testName: string): string {
        let test: Test = this.testsService.testsList.find((temp: Test) => temp.name === testName);
        // if the test was found in the list return the description.
        if(test !== undefined) {
            return test.test.description;
        } else {
            return "Test description not found...";
        }
    }

}