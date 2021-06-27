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
    sentenceData: sentence[] = [];
    viewData: [sentence[]] = [[]];
    route: [string] = [""];
    selection: string[] = ['id', 'name','sentence', 'starter', 'tests', 'meta', 'comparison', 'function'];

    autosave: boolean = false;
    unsavedChanges: boolean = false;
    databaseMismatch: boolean = false; // if the local and database versions do not match this is true.
    singleStreamDataView: boolean = false;

    user: User;

    constructor(    private databaseService: DatabaseService, 
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

        // get the data from the database...
        this.sentenceService.getSentencesDatabase().subscribe((data: sentence) => {
            this.sentenceData[0] = data;
            // set the data on the display
            this.initialData = JSON.parse(JSON.stringify(this.sentenceData));
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
            this.databaseService.uploadSentences(doc, this.sentenceData[0]).subscribe(returnData => {
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

    // /**
    //  * Generate a new random ID...
    //  * @returns 
    //  */
    // generateId(): string {
    //     let newId: string = "";
    //     // get the characterset, length of character set and intended length of random ID.
    //     const characterset: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    //     const numberOfCharacters: number = characterset.length;
    //     const length: number = 5;   // 5 seems good, 62^5
    //     // generate a random number
    //     for(let i = 0; i < length; i++) {
    //         newId += characterset.charAt(Math.floor(Math.random() * numberOfCharacters));
    //     }
    //     return newId;
    // }

    // /**
    // * Get the data for the route selected.
    // * 
    //  * @param route the array of subcategories through the sentenceData array 
    //  * @param singleStream  whether or not to go down the route only or butterfly out
    //  * @param data a list of key values to return (i.e. name, sentence etc)
    //  */
    // getSentenceData(route: string[], singleStream: boolean, data?: string[]): [sentence[]] {
    //     // route must always start with a 0
    //     route[0] = this.sentenceData[0].id;

    //     // id must always be included for id purposed...
    //     data.indexOf("id") === -1 ? data.push("id") : "";

    //     let ret: [sentence[]] = [[]];
    //     let sntncData: sentence[] = this.sentenceData;

    //     // iterate over the route...
    //     route.forEach((value: string, routePosition: number) => {                
    //         let subData: sentence[];
    //         let newReturnData: [{}] = [{}];

    //         for(let i = 0 ; i < sntncData.length ; i++) {
    //             if(sntncData[i].id === value) {
    //                 // this is the route we need...
    //                 // check to see if any subroutes exist, and if not create one..
    //                 if(Array.isArray(sntncData[i].subcategories)) {
    //                     subData = sntncData[i].subcategories;
    //                 } else {
    //                     sntncData[i].subcategories = [{name: "New", id: this.generateId()}];
    //                     subData = sntncData[i].subcategories;
    //                 }

    //                 // check to see if there is subdata, and if not just use the sentence stem
    //                 subData.forEach((dataStem: sentence, index: number) => {
    //                     // if a single stream is needed only select the appropriate routes...
    //                     if(!singleStream || (route[routePosition+1] === dataStem.id) || ((routePosition + 1) === route.length)) {
    //                         data.forEach((key: string) => {
    //                             // get the value for the key value pair
    //                             const val: string | boolean | number = (dataStem[key] ? dataStem[key] : undefined);  
    //                             // if it exists add it to the array
    //                             if(val !== undefined) {
    //                                 const add = { [key]: val };
    //                                 newReturnData[index] = { ...newReturnData[index], ...add};
    //                             }
    //                         })
    //                         const editParameters = { order: routePosition, index: index };
    //                         newReturnData[index] = { ...newReturnData[index], ...editParameters};
    //                     }
    //                 })
    //                 // add the data to the return variable...
    //                 // no empty objects...                
    //                 ret[routePosition] = newReturnData.filter(stem => Object.keys(stem).length !== 0);
    //                 // set the data stream as the subcategories of the first branch...
    //                 sntncData = sntncData[i].subcategories;
    //             }
    //         }
            
    //     })
    //     return ret;
    // }
    
    // getRouteNames(): string[] {
    //     let routeNames: string[] = [];
    //     let route = this.route;
    //     let depth: number = 0;

    //     this.sentenceData.forEach(function iterate(routeId: sentence, index: number) {

    //         if(route[depth] === routeId.id) {
    //             routeNames[depth] = routeId.name;
    
    //             if(index < route.length && Array.isArray(routeId.subcategories)) {
    //                 depth++;
    //                 routeId.subcategories.forEach(iterate);
    //             }
    //         }
    //     })
    //     return routeNames;
    // }

    possibilities;

    // /** function to generate all options for this route to check it works fine.
    //  * @param route use an array like this:
    //  */

    // generateSentenceOptions(route: string[]): void {
    //     const data = this.getSentenceData(route, true, ['name', 'sentence', 'starter', 'tests']);
    //     let sentences: [{sentence: string, depth: number, delete: boolean}] = [{sentence: "", depth: 0, delete: true}];

    //     // iterate over each level of the sentence builder...
    //     data.forEach((stem: sentence[], depth: number) => {
    //         // iterate overall options within a level
    //         const oldSentences = [...sentences];

    //         stem.forEach((newStem: sentence) => {
                
    //             if(newStem.sentence) {
    //                 newStem.sentence.forEach((sentenceStem: string) => {
                        
    //                     const sentence = sentenceStem;
    //                     const starter = newStem.starter ? newStem.starter : false;
        
    //                     if(sentence) {
    //                         oldSentences.forEach((previousSentence, idx) => {
                                
    //                             let newSentence: string = previousSentence.sentence + sentence;
        
    //                             // only if the new sentence is deeper than the old sentence can it be added.
    //                             // peers do not add (sentences with the same depth)
    //                             if(previousSentence.depth < (depth + 1)) {
    //                                 if(starter) {
    //                                     // if this is a starting sentence it should both add to previous elements
    //                                     // and have its own element.
    //                                     // ADD TO PREVIOUS SENTENCE
    //                                     sentences.push({sentence: newSentence, depth: depth, delete: false});
    //                                     sentences[idx].delete = true;
    //                                     // ADD NEW ELEMENT WITH THIS AS THE STARTER
    //                                     sentences.push({sentence: sentence, depth: depth, delete: false});
    //                                 } else {
    //                                     // if this is NOT a starting element it should add to previous elements
    //                                     // but NOT be added as its own element. Previous elements cannot happen without this
    //                                     // so the previous element should be flagged for deletion.
    //                                     // ADD TO PREVIOUS SENTENCE
    //                                     sentences.push({sentence: newSentence, depth: depth, delete: false});
    //                                     // DELETE THE PREVIOUS SENTENCE
    //                                     sentences[idx].delete = true;
    //                                 }
    //                             }
    //                         })
    //                     }
    //                 });
    //             }
    //         })

    //         // after the first iteration remove the blank first entry
    //         if(depth === 0) { sentences.splice(0, 1); }

    //         // iterate over the sentences and delete all that need to be deleted.
    //         for(let i = sentences.length - 1 ; i >= 0 ; i--) {
    //             if(sentences[i].delete === true) {
    //                 sentences.splice(i, 1);
    //             }
    //         }
    //     })

    //     // delete duplicates for some reason (to fix later).
    //     this.possibilities = sentences.filter((obj, index) => (sentences.findIndex(test => test.sentence === obj.sentence)) === index);
    //     this.possibilities.sort((a: sentence, b: sentence) => { return a.sentence.length - b.sentence.length });
    // }

    setFullDataView() {
        this.singleStreamDataView = !this.singleStreamDataView;
        this.viewData = this.getSentenceData(this.route, this.singleStreamDataView, this.selection);
    }

    lastPositionChange: {position: number, index: number, id: string} = {position: null, index: null, id: null};

    setView(position: number, index: number, id: string) {        
        this.lastPositionChange = {position: position, index: index, id: id};
        this.route[position+1] = id;
        this.route.splice(position+2);
        this.viewData = this.getSentenceData(this.route, this.singleStreamDataView, this.selection);
        this.generateSentenceOptions(this.route);
    }

    // /**
    //  * The function used to modify the array - called with a callback from a separate function
    //  * 
    //  * @param position position in the array (levels of subcat)
    //  * @param subPosition position in the subcat
    //  * @param key the {key: value} pair to target
    //  * @param newValue new value for the key
    //  * @param callback the function to do the modification.
    //  */
    // modifyData(position: number, subPosition: number, key: string, newValue: string | boolean | number, callback?: Function): void {
    //     let depth: number = 0;
    //     let route = this.route;
    //     let complete: boolean = false;
        
    //     this.sentenceData.forEach(function iterate(value: sentence, i: number) {
    //         if(value.id === route[depth] && !complete) {
    //             if(position === depth && !complete) {
    //                 // need to ensure this can add to the array if it isnt there already...
    //                 if(callback) {
    //                     callback(value);
    //                 } else {
    //                     value.subcategories[subPosition][key] = newValue;
    //                 }
    //                 complete = true;
    //             } else {
    //                 depth++;
    //                 Array.isArray(value.subcategories) && !complete && value.subcategories.forEach(iterate);
    //             }
    //         }
    //     })

    //     // toggle autosave if data has been modified and toggle unsaved changes if there is no autosave.
    //     this.autosave ? this.saveChanges() : this.unsavedChanges = true;

    //     // redraw the grid and check for save status...
    //     this.viewData = this.getSentenceData(this.route, this.singleStreamDataView, this.selection);
    //     this.changeComparsion();

    //     // regenerate the sentence options
    //     this.generateSentenceOptions(this.route);

    // }

    // /**
    //  * Add a new sub level to a part of the array
    //  * @param position depth of the subarrays
    //  */
    // addNewSubLevel(position: number): void {
    //     const callback: Function = (value: sentence) => {
    //         value.subcategories.push({name: `${value.subcategories.length + 1}`, id: `${this.generateId()}`});
    //     }
    //     this.modifyData(position, null, null, null, callback);
    // }


    // HOW TO ADD THIS TO THE SENTENCES SERVICE
    addTest: {order: number, index: number} = {order: null, index: null};
    
    // /**
    //  * Add a new test to a stem...
    //  * 
    //  * @param position depth into the array
    //  * @param subPosition position on a subcategory
    //  */
    // addNewTest(position: number, subPosition: number): void {
    //     const callback: Function = (value: sentence) => {

    //         const testsAlreadyMade: boolean = (value.subcategories[subPosition]['tests']) ? true : false;
    //         const newTest: {name: string} = {name: (<HTMLInputElement>document.getElementById('newTest')).value };

    //         if(testsAlreadyMade) {
    //             value.subcategories[subPosition]['tests'].push(newTest);
    //         } else {
    //             value.subcategories[subPosition]['tests'] = [newTest];
    //         }

    //         this.addTest = {order: null, index: null};
    //     }
    //     this.modifyData(position, subPosition, null, null, callback);
    // }

    // /**
    //  * Remove a test from something
    //  * @param position dpeth into the array
    //  * @param subPosition position in the subcategory
    //  * @param testNumber the index of the test
    //  */
    // removeTest(position: number, subPosition: number, testNumber: number): void {
    //     const callback: Function = (value: sentence) => {
    //         value.subcategories[subPosition].tests.splice(testNumber, 1);
    //     }
    //     this.modifyData(position, subPosition, null, null, callback);
    // }

    /**
     * Adds a test selection box to the position and index
     * @param position 
     * @param index 
     */
    addNewTestSelectionBox(position: number, index: number): void {
        this.addTest = {order: position, index: index};
    }

    // /**
    //  * Check if the test you want to add is already on the object
    //  * @param tests lists of the tests
    //  * @param name name of the test you want to add
    //  * @returns true or false if it exists or not...
    //  */
    // checkIfTestAlreadyAdded(tests: Object[], name: string): boolean {
    //     return tests.includes(each => each.name === name);
    // }

    // /**
    //  * Filters the lists of tests to exclude those tests already added.
    //  * Used for the dropdown box when adding a new test.
    //  * 
    //  * Does not currently work for some reason.
    //  * 
    //  * @param testsAdded lists of the tests already added
    //  * @param allTests List of all the tests in the system.
    //  * @returns 
    //  */
    // filterTests(testsAdded: {name: string}[], allTests: Test[]) {
    //     if(testsAdded) {
    //         return allTests.filter(test => testsAdded.indexOf(each => { test.name === each.name }) === -1 );
    //     } else {
    //         return allTests;
    //     }
    // }

    undoChain: {commandName: string, data: sentence, fn: Function}[] = [];
    maxUndo: number = 10;

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

    // /**
    //  * Delete this sentence stem
    //  * 
    //  * @param position depth within the array
    //  * @param index position within the subcategories
    //  */
    // deleteRoute(position: number, index: number): void {
    //     const callback: Function = (value: sentence) => {
    //         // add to undo what is about to happen
    //         const fn: Function = (data: sentence) => {
    //             value.subcategories.push(data);
    //         }
    //         // add to undo list
    //         this.addToUndo("Deletion of " + value.subcategories[index].name, value.subcategories[index], fn);
    //         // remove the item from the array
    //         value.subcategories.splice(index, 1);

    //         // reset the view 
    //         try {
    //             this.setView(this.lastPositionChange.position, this.lastPositionChange.index, this.lastPositionChange.id);
    //         } catch(e) {
    //             this.setView(position - 1, 0, this.route[position]);
    //         }
    //     }
    //     this.modifyData(position, index, null, null, callback);
    // }

    // /**
    //  * Modify the sentence data (the text)
    //  * @param position position within the array
    //  * @param subPosition position within the sub array
    //  * @param sentenceIndex position in the sentence index
    //  * @param newComment the replacement comment
    //  */
    // modifySentenceData(position: number, subPosition: number, sentenceIndex: number, newComment): void {
    //     const callback: Function = (value: sentence) => {
    //         value.subcategories[subPosition]['sentence'][sentenceIndex] = newComment.target.innerText;
    //     }
    //     this.modifyData(position, subPosition, null, null, callback);
    // }
    
    // /**
    //  * Add a new sentence to a sentence stem
    //  * @param position position within the array
    //  * @param subPosition position within the subcategories
    //  */
    // addNewSentence(position: number, subPosition: number) {
    //     const callback: Function = (value: sentence) => {
    //         const sentencesAlreadyMade: boolean = (value.subcategories[subPosition]['sentence']) ? true : false;
            
    //         if(sentencesAlreadyMade) {
    //             value.subcategories[subPosition]['sentence'].push("");
    //         } else {
    //             value.subcategories[subPosition]['sentence'] = [""];
    //         }
    //     }
    //     this.modifyData(position, subPosition, null, null, callback);
    // }
    
    // /**
    //  * Delete a sentence from the database
    //  * @param position position within the array
    //  * @param subPosition position within the subcategories
    //  * @param sentenceIndex position within the sentence array
    //  */
    // deleteSentence(position: number, subPosition: number, sentenceIndex: number) {
    //     const callback: Function = (value: sentence) => {
    //         value.subcategories[subPosition].sentence.splice(sentenceIndex, 1);
    //     }
    //     this.modifyData(position, subPosition, null, null, callback);
    // }

    // /**
    //  * Modify the name of the stem
    //  * @param position position within the array
    //  * @param subPosition position within the subcategories
    //  * @param newComment new name
    //  */
    // modifyName(position: number, subPosition: number, newComment) {
    //     this.modifyData(position, subPosition, 'name', newComment.target.innerText);
    // }

    // /**
    //  * Modify the start point data (true -> false, false -> true)
    //  * @param position position within the array
    //  * @param subPosition position within the subcategories
    //  * @param currentState current state of the start data
    //  */
    // modifyStartpointData(position: number, subPosition: number, currentState: boolean) {
    //     this.modifyData(position, subPosition, 'starter', !currentState);
    // }

    // copy and paste items in the view...
    // copiedItem: sentence;

    // /**
    //  * Copy a sentence type from the database...
    //  * @param position The position of thecopied item
    //  * @param subPosition The position within the subposition array
    //  */
    // copyItem(position: number, subPosition: number) {
    //     const callback: Function = (value: sentence) => {
    //         // slow copy but good enough for this use case...
    //         this.copiedItem = JSON.parse(JSON.stringify(value.subcategories[subPosition]));
    //     }
    //     this.modifyData(position, subPosition, null, null, callback);
    // }

    // /**
    //  * Clear the copied item
    //  */
    // clearCopiedItem(): void {
    //     this.copiedItem = undefined;
    // }

    // /**
    //  * Paste the copied item into this position.
    //  * @param position The point to place the pasted item.
    //  */
    // pasteItem(position: number): void {
    //     if(this.copiedItem) {
    //         const callback: Function = (value: sentence) => {
    //             // all the items need a new id.
    //             // new generate id function (as this.generateId cant be passed into the recursive function)
    //             const genNewId: Function = (): string => { return this.generateId() }
    //             this.copiedItem.id = genNewId();

    //             // recursively iterate through the copied item to replace the ids on the new items (the only part which isnt copied...)
    //             this.copiedItem.subcategories.forEach(function iterate(stem: sentence, index: number) {
    //                 // generate a new id
    //                 stem.id = genNewId();
    //                 // iterate over the subcategories and add an id to each
    //                 if(Array.isArray(stem.subcategories)) {
    //                     stem.subcategories.forEach(iterate);
    //                 }
    //             }, genNewId)

    //             // put the pasted item into the right place.
    //             value.subcategories.push(this.copiedItem);
    //             this.copiedItem = undefined;
    //         }
    //         // attempt to paste it...
    //         try {  
    //             this.modifyData(position, null, null, null, callback);
    //         } catch (error) {
    //             // display output error
    //             console.log(`Error pasting item: ${error.message}`);
    //         }
    //         // remove the copied item from the variable
    //         this.copiedItem = undefined;
    //     }
    // }

    // /**
    //  * Reorder the item to the left - essentially making it the same level as its master.
    //  * @param position the depth of the item within the database
    //  * @param subPosition the position in the subcategory of the parent
    //  */
    // reOrderItemLeft(position: number, subPosition: number) {
    //     const callback: Function = (value: sentence) => {
    //         const subCallback: Function = (subValue: sentence) => {
    //             // duplicate the item one position down
    //             subValue.subcategories.push(value.subcategories[subPosition]);
    //         }
    //         this.modifyData(position - 1, subPosition, null, null, subCallback);
    //         // and remove the initial value
    //         value.subcategories.splice(subPosition, 1);
    //     }
    //     this.modifyData(position, subPosition, null, null, callback);
    // }

    autosaveToggle() {
        this.autosave = !this.autosave;
        this.saveChanges();
    }

    resetRoute() {
        this.route = [""];
        this.viewData = this.getSentenceData(this.route, this.singleStreamDataView, this.selection);
    }

    saveChanges() {
        if(this.autosave || (!this.autosave && this.unsavedChanges)) {
            this.unsavedChanges = false;
            // and then need to commit to the database.
            localStorage.setItem('sentences-data', JSON.stringify(this.sentenceData));
        }
    }

    /**
     * Simple method to quickly compare the current dataset against the initial dataset.
     * @returns true is the are equal, false otherwise
     */
    changeComparsion(): boolean {
        let changes: boolean = (JSON.stringify(this.initialData) === JSON.stringify(this.sentenceData));
        changes ? this.unsavedChanges = false : this.unsavedChanges = true;
        changes ? this.databaseMismatch = false : this.databaseMismatch = true;
        return changes;
    }

}