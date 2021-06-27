import { createOfflineCompileUrlResolver } from '@angular/compiler';
import { Injectable } from '@angular/core';
import { from, of, Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { DatabaseService } from '../services/database.service';
import { TestsService, Test } from './tests.service';

export interface sentence {
    id: string;
    endpoint?: boolean, starter?: boolean, 
    name?: string, sentence?: string[], meta?: string | number
    subcategories?: [sentence], tests?: {name: string}[], 
    index?: number; order?: number
}

@Injectable({
  providedIn: 'root'
})
export class SentencesService {

    // these do NOT need to be an array, but in a slow start everything got coded this way and so thats how it is!...
    sentenceData: sentence[] = [];

    constructor(private databaseService: DatabaseService, private testsService: TestsService) { }

    /**
     * Gets the sentence data from memory or from the database and returns it as an observable...
     * @returns 
     */
    getSentencesDatabase(): Observable<sentence>{
        // check if there is an instance of the sentences database in localstorage...
        if(localStorage.getItem('sentences-data') !== null) {
            // retrieve the data from local storage and parse it into the sentence data...
            this.sentenceData = JSON.parse(localStorage.getItem('sentences-data'));               
            // set the data on the display
            return of(this.sentenceData[0]).pipe(take(1), tap(returnData => {
                // return the data array...
                return returnData;
            }));
        } else {
            // no instance of the saved data so geta  fresh version.
            return this.databaseService.getSentences('template').pipe(take(1), map(returnData => {
                // add data to the sentenceData array...
                // (this is an array as originally multiple database could be retrieved but then only one...)
                this.sentenceData[0] = returnData.data();
                console.log(this.sentenceData);
                // set the data into local storage to make it quicker ot retrieve next time...
                localStorage.setItem('sentences-data', JSON.stringify(this.sentenceData));
                // and return
                return this.sentenceData[0];
            }, (error: any) => {
                console.log(`Error retrieving data: ${error.message}`);
            }));
        }
    }

    /**
     * 
     * @returns Returns the current state of the database.
     */
    getCurrentSentenceData(): sentence[] {
        return this.sentenceData;
    }

    /**
    * Get the data for the route selected.
    * 
     * @param route the array of subcategories through the sentenceData array 
     * @param singleStream  whether or not to go down the route only or butterfly out
     * @param data a list of key values to return (i.e. name, sentence etc)
     */
     getSentenceData(route: string[], singleStream: boolean, data?: string[]): [sentence[]] {
        // route must always start with a 0
        route[0] = this.sentenceData[0].id;

        // id must always be included for id purposed...
        data.indexOf("id") === -1 ? data.push("id") : "";

        let ret: [sentence[]] = [[]];
        let sntncData: sentence[] = this.sentenceData;

        // iterate over the route...
        route.forEach((value: string, routePosition: number) => {                
            let subData: sentence[];
            let newReturnData: [{}] = [{}];

            for(let i = 0 ; i < sntncData.length ; i++) {
                if(sntncData[i].id === value) {
                    // this is the route we need...
                    // check to see if any subroutes exist, and if not create one..
                    if(Array.isArray(sntncData[i].subcategories)) {
                        subData = sntncData[i].subcategories;
                    } else {
                        sntncData[i].subcategories = [{name: "New", id: this.generateId()}];
                        subData = sntncData[i].subcategories;
                    }

                    // check to see if there is subdata, and if not just use the sentence stem
                    subData.forEach((dataStem: sentence, index: number) => {
                        // if a single stream is needed only select the appropriate routes...
                        if(!singleStream || (route[routePosition+1] === dataStem.id) || ((routePosition + 1) === route.length)) {
                            data.forEach((key: string) => {
                                // get the value for the key value pair
                                const val: string | boolean | number = (dataStem[key] ? dataStem[key] : undefined);  
                                // if it exists add it to the array
                                if(val !== undefined) {
                                    const add = { [key]: val };
                                    newReturnData[index] = { ...newReturnData[index], ...add};
                                }
                            })
                            const editParameters = { order: routePosition, index: index };
                            newReturnData[index] = { ...newReturnData[index], ...editParameters};
                        }
                    })
                    // add the data to the return variable...
                    // no empty objects...                
                    ret[routePosition] = newReturnData.filter(stem => Object.keys(stem).length !== 0);
                    // set the data stream as the subcategories of the first branch...
                    sntncData = sntncData[i].subcategories;
                }
            }
            
        })
        return ret;
    }

    /**
     * Get the names on the path for the given routes
     * @param route 
     * @returns string of names
     */
    getRouteNames(route: string[]): string[] {
        let routeNames: string[] = [];
        let depth: number = 0;

        this.sentenceData.forEach(function iterate(routeId: sentence, index: number) {
            if(route[depth] === routeId.id) {
                routeNames[depth] = routeId.name;
                // recursively iterate through the sentence data
                if(index < route.length && Array.isArray(routeId.subcategories)) {
                    depth++;
                    routeId.subcategories.forEach(iterate);
                }
            }
        })
        return routeNames;
    }

    /**
     * Generates all potential options for sentences that could be make from a route
     * @param route 
     */
    //  generateSentenceOptions(route: string[]): void {
     generateSentenceOptions(route: string[]): {sentences: string, depth: number, delete: boolean} {
         const data = this.getSentenceData(route, true, ['name', 'sentence', 'starter', 'tests']);
         let sentences: [{sentence: string, depth: number, delete: boolean}] = [{sentence: "", depth: 0, delete: true}];
 
         // iterate over each level of the sentence builder...
         data.forEach((stem: sentence[], depth: number) => {
             // iterate overall options within a level
             const oldSentences = [...sentences];
 
             stem.forEach((newStem: sentence) => {
                 
                 if(newStem.sentence) {
                     newStem.sentence.forEach((sentenceStem: string) => {
                         
                         const sentence = sentenceStem;
                         const starter = newStem.starter ? newStem.starter : false;
         
                         if(sentence) {
                             oldSentences.forEach((previousSentence, idx) => {
                                 
                                 let newSentence: string = previousSentence.sentence + sentence;
         
                                 // only if the new sentence is deeper than the old sentence can it be added.
                                 // peers do not add (sentences with the same depth)
                                 if(previousSentence.depth < (depth + 1)) {
                                     if(starter) {
                                         // if this is a starting sentence it should both add to previous elements
                                         // and have its own element.
                                         // ADD TO PREVIOUS SENTENCE
                                         sentences.push({sentence: newSentence, depth: depth, delete: false});
                                         sentences[idx].delete = true;
                                         // ADD NEW ELEMENT WITH THIS AS THE STARTER
                                         sentences.push({sentence: sentence, depth: depth, delete: false});
                                     } else {
                                         // if this is NOT a starting element it should add to previous elements
                                         // but NOT be added as its own element. Previous elements cannot happen without this
                                         // so the previous element should be flagged for deletion.
                                         // ADD TO PREVIOUS SENTENCE
                                         sentences.push({sentence: newSentence, depth: depth, delete: false});
                                         // DELETE THE PREVIOUS SENTENCE
                                         sentences[idx].delete = true;
                                     }
                                 }
                             })
                         }
                     });
                 }
             })
 
             // after the first iteration remove the blank first entry
             if(depth === 0) { sentences.splice(0, 1); }
 
             // iterate over the sentences and delete all that need to be deleted.
             for(let i = sentences.length - 1 ; i >= 0 ; i--) {
                 if(sentences[i].delete === true) {
                     sentences.splice(i, 1);
                 }
             }

             return sentences;
         })
 
         // delete duplicates for some reason (to fix later).
         sentences.filter((obj, index) => (sentences.findIndex(test => test.sentence === obj.sentence)) === index);
         sentences.sort((a: sentence, b: sentence) => { return a.sentence.length - b.sentence.length });
        
        return sentences;
         //  this.possibilities = sentences.filter((obj, index) => (sentences.findIndex(test => test.sentence === obj.sentence)) === index);
        //  this.possibilities.sort((a: sentence, b: sentence) => { return a.sentence.length - b.sentence.length });
     }

    /**
     * The function used to modify the array - called with a callback from a separate function
     * 
     * @param position position in the array (levels of subcat)
     * @param subPosition position in the subcat
     * @param key the {key: value} pair to target
     * @param newValue new value for the key
     * @param callback the function to do the modification.
     */
    // modifyData(position: number, subPosition: number, key: string, newValue: string | boolean | number, callback?: Function): void {
    modifyData(position: number, callback: Function, route: string[]): boolean {
        let depth: number = 0;
        let complete: boolean = false;
        
        this.sentenceData.forEach(function iterate(value: sentence, i: number) {
            if(value.id === route[depth] && !complete) {
                if(position === depth && !complete) {
                    // need to ensure this can add to the array if it isnt there already...
                    callback(value);
                    // delet this row below when implemented fully.
                    // value.subcategories[subPosition][key] = newValue;
                    complete = true;
                    return true;
                } else {
                    depth++;
                    Array.isArray(value.subcategories) && !complete && value.subcategories.forEach(iterate);
                }
            }
        })

        return false;

        // toggle autosave if data has been modified and toggle unsaved changes if there is no autosave.
        this.autosave ? this.saveChanges() : this.unsavedChanges = true;

        // redraw the grid and check for save status...
        this.viewData = this.getSentenceData(this.route, this.singleStreamDataView, this.selection);
        this.changeComparsion();

        // regenerate the sentence options
        this.generateSentenceOptions(this.route);

    }

    /**
     * Add a new sub level to a part of the array
     * @param position depth of the subarrays
     */
    addNewSubLevel(position: number): void {
        const callback: Function = (value: sentence) => {
            value.subcategories.push({name: `${value.subcategories.length + 1}`, id: `${this.generateId()}`});
        }
        this.modifyData(position, null, null, null, callback);
    }

    /**
     * Add a new test to a stem...
     * 
     * @param position depth into the array
     * @param subPosition position on a subcategory
     */
     addNewTest(position: number, subPosition: number): void {
        const callback: Function = (value: sentence) => {

            const testsAlreadyMade: boolean = (value.subcategories[subPosition]['tests']) ? true : false;
            const newTest: {name: string} = {name: (<HTMLInputElement>document.getElementById('newTest')).value };

            if(testsAlreadyMade) {
                value.subcategories[subPosition]['tests'].push(newTest);
            } else {
                value.subcategories[subPosition]['tests'] = [newTest];
            }

            this.addTest = {order: null, index: null};
        }
        this.modifyData(position, subPosition, null, null, callback);
    }

     /**
     * Remove a test from something
     * @param position dpeth into the array
     * @param subPosition position in the subcategory
     * @param testNumber the index of the test
     */
      removeTest(position: number, subPosition: number, testNumber: number): void {
        const callback: Function = (value: sentence) => {
            value.subcategories[subPosition].tests.splice(testNumber, 1);
        }
        this.modifyData(position, subPosition, null, null, callback);
    }

    /**
     * Check if the test you want to add is already on the object
     * @param tests lists of the tests
     * @param name name of the test you want to add
     * @returns true or false if it exists or not...
     */
     checkIfTestAlreadyAdded(tests: Object[], name: string): boolean {
        return tests.includes(each => each.name === name);
    }

    /**
     * Filters the lists of tests to exclude those tests already added.
     * Used for the dropdown box when adding a new test.
     * 
     * Does not currently work for some reason.
     * 
     * @param testsAdded lists of the tests already added
     * @param allTests List of all the tests in the system.
     * @returns 
     */
     filterTests(testsAdded: {name: string}[], allTests: Test[]) {
        if(testsAdded) {
            return allTests.filter(test => testsAdded.indexOf(each => { test.name === each.name }) === -1 );
        } else {
            return allTests;
        }
    }

    /**
     * Delete this sentence stem
     * 
     * @param position depth within the array
     * @param index position within the subcategories
     */
     deleteRoute(position: number, index: number): void {
        const callback: Function = (value: sentence) => {
            // add to undo what is about to happen
            const fn: Function = (data: sentence) => {
                value.subcategories.push(data);
            }
            // add to undo list
            this.addToUndo("Deletion of " + value.subcategories[index].name, value.subcategories[index], fn);
            // remove the item from the array
            value.subcategories.splice(index, 1);

            // reset the view 
            try {
                this.setView(this.lastPositionChange.position, this.lastPositionChange.index, this.lastPositionChange.id);
            } catch(e) {
                this.setView(position - 1, 0, this.route[position]);
            }
        }
        this.modifyData(position, index, null, null, callback);
    }

    /**
     * Modify the sentence data (the text)
     * @param position position within the array
     * @param subPosition position within the sub array
     * @param sentenceIndex position in the sentence index
     * @param newComment the replacement comment
     */
     modifySentenceData(position: number, subPosition: number, sentenceIndex: number, newComment): void {
        const callback: Function = (value: sentence) => {
            value.subcategories[subPosition]['sentence'][sentenceIndex] = newComment.target.innerText;
        }
        this.modifyData(position, subPosition, null, null, callback);
    }
    
    /**
     * Add a new sentence to a sentence stem
     * @param position position within the array
     * @param subPosition position within the subcategories
     */
    addNewSentence(position: number, subPosition: number) {
        const callback: Function = (value: sentence) => {
            const sentencesAlreadyMade: boolean = (value.subcategories[subPosition]['sentence']) ? true : false;
            
            if(sentencesAlreadyMade) {
                value.subcategories[subPosition]['sentence'].push("");
            } else {
                value.subcategories[subPosition]['sentence'] = [""];
            }
        }
        this.modifyData(position, subPosition, null, null, callback);
    }
    
    /**
     * Delete a sentence from the database
     * @param position position within the array
     * @param subPosition position within the subcategories
     * @param sentenceIndex position within the sentence array
     */
    deleteSentence(position: number, subPosition: number, sentenceIndex: number) {
        const callback: Function = (value: sentence) => {
            value.subcategories[subPosition].sentence.splice(sentenceIndex, 1);
        }
        this.modifyData(position, subPosition, null, null, callback);
    }

    /**
     * Modify the name of the stem
     * @param position position within the array
     * @param subPosition position within the subcategories
     * @param newComment new name
     */
    modifyName(position: number, subPosition: number, newComment) {
        this.modifyData(position, subPosition, 'name', newComment.target.innerText);
    }

    /**
     * Modify the start point data (true -> false, false -> true)
     * @param position position within the array
     * @param subPosition position within the subcategories
     * @param currentState current state of the start data
     */
    modifyStartpointData(position: number, subPosition: number, currentState: boolean) {
        this.modifyData(position, subPosition, 'starter', !currentState);
    }

    copiedItem: sentence;

    /**
     * Copy a sentence type from the database...
     * @param position The position of thecopied item
     * @param subPosition The position within the subposition array
     */
    copyItem(position: number, subPosition: number) {
        const callback: Function = (value: sentence) => {
            // slow copy but good enough for this use case...
            this.copiedItem = JSON.parse(JSON.stringify(value.subcategories[subPosition]));
        }
        this.modifyData(position, subPosition, null, null, callback);
    }

    /**
     * Clear the copied item
     */
    clearCopiedItem(): void {
        this.copiedItem = undefined;
    }

    /**
     * Paste the copied item into this position.
     * @param position The point to place the pasted item.
     */
    pasteItem(position: number): void {
        if(this.copiedItem) {
            const callback: Function = (value: sentence) => {
                // all the items need a new id.
                // new generate id function (as this.generateId cant be passed into the recursive function)
                const genNewId: Function = (): string => { return this.generateId() }
                this.copiedItem.id = genNewId();

                // recursively iterate through the copied item to replace the ids on the new items (the only part which isnt copied...)
                this.copiedItem.subcategories.forEach(function iterate(stem: sentence, index: number) {
                    // generate a new id
                    stem.id = genNewId();
                    // iterate over the subcategories and add an id to each
                    if(Array.isArray(stem.subcategories)) {
                        stem.subcategories.forEach(iterate);
                    }
                }, genNewId)

                // put the pasted item into the right place.
                value.subcategories.push(this.copiedItem);
                this.copiedItem = undefined;
            }
            // attempt to paste it...
            try {  
                this.modifyData(position, null, null, null, callback);
            } catch (error) {
                // display output error
                console.log(`Error pasting item: ${error.message}`);
            }
            // remove the copied item from the variable
            this.copiedItem = undefined;
        }
    }

    /**
     * Reorder the item to the left - essentially making it the same level as its master.
     * @param position the depth of the item within the database
     * @param subPosition the position in the subcategory of the parent
     */
    reOrderItemLeft(position: number, subPosition: number) {
        const callback: Function = (value: sentence) => {
            const subCallback: Function = (subValue: sentence) => {
                // duplicate the item one position down
                subValue.subcategories.push(value.subcategories[subPosition]);
            }
            this.modifyData(position - 1, subPosition, null, null, subCallback);
            // and remove the initial value
            value.subcategories.splice(subPosition, 1);
        }
        this.modifyData(position, subPosition, null, null, callback);
    }
    
    /**
     * Generate a new random ID...
     * @returns 
     */
     generateId(): string {
        let newId: string = "";
        // get the characterset, length of character set and intended length of random ID.
        const characterset: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const numberOfCharacters: number = characterset.length;
        const length: number = 5;   // 5 seems good, 62^5
        // generate a random number
        for(let i = 0; i < length; i++) {
            newId += characterset.charAt(Math.floor(Math.random() * numberOfCharacters));
        }
        return newId;
    }
}
