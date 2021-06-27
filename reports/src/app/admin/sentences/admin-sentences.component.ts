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

    isLoading: boolean = true;

    // these do NOT need to be an array, but in a slow start everything got coded this way and so thats how it is!...
    initialData: sentence[];
    viewData: [sentence[]] = [[]];
    route: [string] = [""];
    selection: string[] = ['id', 'name','sentence', 'starter', 'tests', 'meta', 'comparison', 'function'];

    autosave: boolean = false;
    unsavedChanges: boolean = false;
    databaseMismatch: boolean = false; // if the local and database versions do not match this is true.
    singleStreamDataView: boolean = false;

    // HOW TO ADD THIS TO THE SENTENCES SERVICE
    addTest: {order: number, index: number} = {order: null, index: null};
    possibilities;
    lastPositionChange: {position: number, index: number, id: string} = {position: null, index: null, id: null};
    undoChain: {commandName: string, data: sentence, fn: Function}[] = [];
    maxUndo: number = 10;

    user: User;

    constructor(private databaseService: DatabaseService, 
                private testsService: TestsService, 
                private auth: AuthenticationService, 
                private sentenceService: SentencesService) {
                
                // get the user details...
                auth.user.subscribe((newUser: User) => {
                    this.user = newUser;
                })
    }

    ngOnInit(): void {
        this.isLoading = true;

        // get the sentence data from the database...
        this.sentenceService.getSentencesDatabase().subscribe((data: sentence) => {
            const sentenceData: sentence = data;
            // set the data on the display
            this.initialData = JSON.parse(JSON.stringify(sentenceData[0]));
            this.viewData = this.sentenceService.getSentenceData(this.route, this.singleStreamDataView, this.selection);
            this.sentenceService.generateSentenceOptions(this.route);
            this.isLoading = false;
        }, (error) => {
            console.log(`Error gathering the database: ${error.message}`);
            this.isLoading = false;
        })
    }

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
        this.sentenceService.generateSentenceOptions(this.route);
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

    autosaveToggle() {
        this.autosave = !this.autosave;
        this.saveChanges();
    }

    resetRoute() {
        this.route = [""];
        this.viewData = this.sentenceService.getSentenceData(this.route, this.singleStreamDataView, this.selection);
    }

    saveChanges() {
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

    modifyData(position: number, callback: Function, route: string[]): void {
        const modify: boolean = this.sentenceService.modifyData(position, callback, this.route);

        if(modify) {

        }
        // toggle autosave if data has been modified and toggle unsaved changes if there is no autosave.
        this.autosave ? this.saveChanges() : this.unsavedChanges = true;
        // redraw the grid and check for save status...
        this.viewData = this.sentenceService.getSentenceData(this.route, this.singleStreamDataView, this.selection);
        this.changeComparsion();
        // regenerate the sentence options
        this.possibilities = this.sentenceService.generateSentenceOptions(this.route);
    }

}