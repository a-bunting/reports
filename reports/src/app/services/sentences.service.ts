import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { DatabaseService } from '../services/database.service';
import { TestsService } from './tests.service';

export interface sentence {
    id: string;
    endpoint?: boolean, starter?: boolean, 
    name?: string, sentence?: string[]
    subcategories?: [sentence], tests?: {name: string}[], 
    index?: number; order?: number
}

// export interface sentenceString {
//     text: string; tests?: {testname: string; value: number | string}[]
// }

// export interface sentence {
//     id: string;
//     endpoint?: boolean, starter?: boolean, 
//     name?: string, sentence?: string[], meta?: string | number
//     subcategories?: [sentence], tests?: {name: string}[], 
//     index?: number; order?: number
// }

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
    getSentencesDatabase(uid?: string): Observable<sentence>{
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
            // no instance of the saved data so get a fresh version.
            const docId = uid ? uid : 'template';

            return this.databaseService.getSentences(docId).pipe(take(1), map(returnData => {
                // add data to the sentenceData array...
                // (this is an array as originally multiple database could be retrieved but then only one...)
                this.sentenceData[0] = returnData.data();
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

    replaceWithTemplate(uid: string): Observable<sentence> {
        // get tht template to write...
        const replace = this.databaseService.getSentences('template').pipe(take(1), tap(templateResults => {
            // and rewrite..
            // const rewrite = this.databaseService.uploadSentences(uid, templateResults.data()).pipe(take(1), tap(() => {
            //     // nothing to do here...
            // }, error => {
            //     console.log(`Error rewriting template: ${error.message}`)
            // }));
            // Dont auto rewrite to the database, but let the user have the opportunity to make that save...
            this.sentenceData[0] = templateResults.data();
            // set the data into local storage to make it quicker ot retrieve next time...
            localStorage.setItem('sentences-data', JSON.stringify(this.sentenceData));
            return this.sentenceData[0];
        }, error => {
            console.log(`Error rewriting template: ${error.message}`)
        }))

        return replace;
    }

    /**
    * Get the data for the route selected.
    * 
     * @param route the array of subcategories through the sentenceData array 
     * @param singleStream  whether or not to go down the route only or butterfly out
     * @param data a list of key values to return (i.e. name, sentence etc)
     */
     getSentenceData(route: string[], singleStream: boolean, data?: string[], infinite?: boolean): [sentence[]] {
        // route must always start with a 0
        route[0] = this.sentenceData[0].id;

        // id must always be included for id purposed...
        data.indexOf("id") === -1 ? data.push("id") : "";

        let ret: [any[]] = [[]]; // the any is a hax for now :/
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
                        // these two commented out lines were all that was here before infinite
                        // use if this breaks the function.
                        // sntncData[i].subcategories = [{name: "New", id: this.generateId()}];
                        // subData = sntncData[i].subcategories;
                        if(infinite || infinite === undefined) {
                            sntncData[i].subcategories = [{name: "New", id: this.generateId()}];
                            subData = sntncData[i].subcategories;
                        } else {
                            // add subctegories...
                            break;
                        }
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
                    // add the data to the return variable with no empty objects
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
    generateSentenceOptions(route: string[]): {sentence: string, depth: number, delete: boolean}[] {
        
        const data = this.getSentenceData(route, true, ['name', 'sentence', 'starter', 'tests']);
        let sentences: [{sentence: string, depth: number, delete: boolean}] = [{sentence: "", depth: 0, delete: true}];

        // iterate over each level of the sentence builder...
        data.forEach((stem: sentence[], depth: number) => {
            // iterate overall options within a level
            const oldSentences = [...sentences];

            stem.forEach((newStem: sentence) => {
                 
                if(newStem.sentence) {
                    newStem.sentence.forEach((sentenceStem: string) => {
                // if (options) {
                    // options.forEach((sentenceStem: string) => {

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

        // for some reason there are repeat sentences, delete them simply for now...
        let unfiltered: [{sentence: string, depth: number, delete: boolean}] = [{sentence: "", depth: 0, delete: true}];
        unfiltered.shift(); // this is so hax :/

        sentences.forEach(a => {
            let i = unfiltered.findIndex(b => a.sentence === b.sentence);
            i === -1 ? unfiltered.push(a) : null;
        })

        // sort by length
        unfiltered.sort((a: {sentence: string, depth: number, delete: boolean}, b: {sentence: string, depth: number, delete: boolean}) => { return a.sentence.length - b.sentence.length });
        
        return unfiltered;
    }

    /**
     * Generates an example sentence and gives the quantity of potential reports for this template
     * @param routeArray 
     * @returns 
     */
    generateExampleReport(routeArray: [string[]]): {report: string, options: number} {
        let report: string = "";
        let quantity: number = 1;

        routeArray.forEach((route: string[], i: number) => {
            // check if its a new paragraph...
            if(route[0] === "newParagraph") {
                report += "</p><p>";
            } else {
                // starting paragraph tag
                if(i === 0) { report += "<p>"; }

                // generate sentence option 1
                const str = this.generateSentenceOptions(route);
                quantity = quantity * str.length;
                report += str[0].sentence;

                // close paragraph tag
                if (i === routeArray.length - 1) { report += "</p>"; }
            }
        })

        return {report: report, options: quantity};
    }

    /**
     * The function used to modify the array - called with a callback from a separate function
     * DONE
     * @param position position in the array (levels of subcat)
     * @param subPosition position in the subcat
     * @param key the {key: value} pair to target
     * @param newValue new value for the key
     * @param callback the function to do the modification.
     */
    // modifyData(position: number, subPosition: number, key: string, newValue: string | boolean | number, callback?: Function): void {
    modifyData(position: number, callback: Function, route: string[]): any {
        let depth: number = 0;
        let complete: boolean = false;
        let returnValue;
        
        this.sentenceData.forEach(function iterate(value: sentence, i: number) {
            if(value.id === route[depth] && !complete) {
                if(position === depth && !complete) {
                    // need to ensure this can add to the array if it isnt there already...
                    returnValue = callback(value);
                    // delet this row below when implemented fully.
                    // value.subcategories[subPosition][key] = newValue;
                    complete = true;
                } else {
                    depth++;
                    Array.isArray(value.subcategories) && !complete && value.subcategories.forEach(iterate);
                }
            }
        })
        return returnValue;
    }

    /**
     * Add a new sub level to a part of the array
     * DONE
     * @param position depth of the subarrays
     */
    addNewSubLevel(position: number, route: string[]): boolean {
        const callback: Function = (value: sentence) => {
            try {
                value.subcategories.push({name: `${value.subcategories.length + 1}`, id: `${this.generateId()}`});
                return true;
            } catch(e) {
                return false;
            }
        }
        return this.modifyData(position, callback, route);
    }

    /**
     * Add a new test to a stem...
     * DONE
     * @param position depth into the array
     * @param subPosition position on a subcategory
     */
     addNewTest(position: number, subPosition: number, route: string[]): boolean {
        const callback: Function = (value: sentence) => {
            try {
                const testsAlreadyMade: boolean = (value.subcategories[subPosition]['tests']) ? true : false;
                const sentencesAlreadyMade: boolean = (value.subcategories[subPosition]['sentence']) ? true : false;
                const newTest: {name: string} = {name: (<HTMLInputElement>document.getElementById('newTest')).value };
    
                // first add the test
                if(testsAlreadyMade) {
                    value.subcategories[subPosition]['tests'].push(newTest);
                } else {
                    value.subcategories[subPosition]['tests'] = [newTest];
                }

                return true;
            } catch(e) {
                return false;
            }
        }
        return this.modifyData(position, callback, route);
    }

     /**
     * Remove a test from something
     * DONE
     * @param position dpeth into the array
     * @param subPosition position in the subcategory
     * @param testNumber the index of the test
     */
      removeTest(position: number, subPosition: number, testNumber: number, route: string[]): boolean {
        const callback: Function = (value: sentence) => {
            try {
                let testNameToDelete: string = value.subcategories[subPosition].tests[testNumber].name;
                value.subcategories[subPosition].tests.splice(testNumber, 1);
                // and remove from the sentences array also...
                // deprecated
                //
                // value.subcategories[subPosition].sentence.forEach((temp: sentenceString) => {
                //     let testIndex: number = temp.tests.findIndex((test) => test.testname === testNameToDelete);
                    
                //     if(testIndex !== -1) {
                //         // if found, splice it.
                //         temp.tests.splice(testIndex, 1);
                //     } else {
                //         // not found, doesnt exist??? error??
                //     }
                // })

                return true;
            } catch (e) {
                return false;
            }
        }
        return this.modifyData(position, callback, route);
    }

    /**
     * Check if the test you want to add is already on the object
     * 
     * UNKNWON IF NEEDED CHECK ON MAIN COMPUTER
     * 
     * @param tests lists of the tests
     * @param name name of the test you want to add
     * @returns true or false if it exists or not...
     */
     checkIfTestAlreadyAdded(tests: Object[], name: string): boolean {
        return tests.includes(each => each.name === name);
    }

    /**
     * Delete this sentence stem
     * DONE
     * @param position depth within the array
     * @param index position within the subcategories
     */
     deleteRoute(position: number, index: number, route: string[]): {text: string, stem: sentence, fn: Function} {
        const callback: Function = (value: sentence) => {
            // add to undo what is about to happen
            const fn: Function = (data: sentence) => {
                value.subcategories.push(data);
            }
            // add to undo list
            const returnValue: {text: string, stem: sentence, fn: Function} = {text: "Deletion of " + value.subcategories[index].name, stem:  value.subcategories[index], fn: fn};
            // remove the item from the array
            value.subcategories.splice(index, 1);
            // return the undo data...
            return returnValue;

        }
        return this.modifyData(position, callback, route);
    }

    /**
     * Modify the sentence data (the text)
     * DONE
     * @param position position within the array
     * @param subPosition position within the sub array
     * @param sentenceIndex position in the sentence index
     * @param newComment the replacement comment
     */
     modifySentenceData(position: number, subPosition: number, sentenceIndex: number, newComment, route: string[]): boolean {
        const callback: Function = (value: sentence) => {
            try {
                value.subcategories[subPosition]['sentence'][sentenceIndex] = newComment.target.innerText;
                return true;
            } catch (e) {
                console.log(`Error: ${e.message}`);
                return false;
            }
        }
        return this.modifyData(position, callback, route);
    }
    
    /**
     * Add a new sentence to a sentence stem
     * DONE
     * @param position position within the array
     * @param subPosition position within the subcategories
     */
    addNewSentence(position: number, subPosition: number, route: string[]) {
        const callback: Function = (value: sentence) => {
            const sentencesAlreadyMade: boolean = (value.subcategories[subPosition]['sentence']) ? true : false;
            
            try {
                if(sentencesAlreadyMade) {
                    value.subcategories[subPosition]['sentence'].push("");
                } else {
                    value.subcategories[subPosition]['sentence'] = [""];
                }
                return true;
            } catch(e) {
                return false;
            }
        }
        return this.modifyData(position, callback, route);
    }
    
    /**
     * Delete a sentence from the database
     * DONE
     * @param position position within the array
     * @param subPosition position within the subcategories
     * @param sentenceIndex position within the sentence array
     */
    deleteSentence(position: number, subPosition: number, sentenceIndex: number, route: string[]) {
        const callback: Function = (value: sentence) => {
            try {
                value.subcategories[subPosition].sentence.splice(sentenceIndex, 1);
                return true;
            } catch(e) {
                return false;
            }
        }
        return this.modifyData(position, callback, route);
    }

    /**
     * Modify the name of the stem
     * DONE
     * @param position position within the array
     * @param subPosition position within the subcategories
     * @param newComment new name
     */
    modifyName(position: number, subPosition: number, newComment, route: string[]): boolean {
        const callback = (value: sentence) => {
            try {
                value.subcategories[subPosition]['name'] = newComment.target.innerText;
                return true;
            } catch(e) {
                return false;
            }
        }
        return this.modifyData(position, callback, route);
    }

    /**
     * Modify the start point data (true -> false, false -> true)
     * DONE
     * @param position position within the array
     * @param subPosition position within the subcategories
     * @param currentState current state of the start data
     */
    modifyStartpointData(position: number, subPosition: number, currentState: boolean, route: string[]): boolean {
        const callback = (value: sentence) => {
            try {
                value.subcategories[subPosition]['starter'] = !currentState;
                return true;
            } catch(e) {
                return false;
            }
        }
        return this.modifyData(position, callback, route);
    }

    /**
     * Copy a sentence type from the database...
     * DONE
     * @param position The position of thecopied item
     * @param subPosition The position within the subposition array
     */
    copyItem(position: number, subPosition: number, route: string[]): sentence {
        const callback: Function = (value: sentence) => {
            // slow copy but good enough for this use case...
            try {
                return JSON.parse(JSON.stringify(value.subcategories[subPosition]));
            } catch (error) {
                return undefined;
            }
        }
        return this.modifyData(position, callback, route);
    }

    /**
     * Paste the copied item into this position.
     * @param position The point to place the pasted item.
     */
    pasteItem(position: number, copiedItem: sentence, route: string[]): boolean {
        const callback: Function = (value: sentence) => {
            // all the items need a new id.
            // new generate id function (as this.generateId cant be passed into the recursive function)
            const genNewId: Function = (): string => { return this.generateId() }
            copiedItem.id = genNewId();

            // recursively iterate through the copied item to replace the ids on the new items (the only part which isnt copied...)
            if(Array.isArray(copiedItem.subcategories)) {
                copiedItem.subcategories.forEach(function iterate(stem: sentence, index: number) {
                    // generate a new id
                    stem.id = genNewId();
                    // iterate over the subcategories and add an id to each
                    if(Array.isArray(stem.subcategories)) {
                        stem.subcategories.forEach(iterate);
                    }
                }, genNewId)
            }

            // put the pasted item into the right place.
            try {
                value.subcategories.push(copiedItem);
                return true;
            } catch(e) {
                return false;
            }
        }
        // attempt to paste it...
        return this.modifyData(position, callback, route);
    }

    /**
     * Reorder the item to the left - essentially making it the same level as its master.
     * MOVED OVER...
     * @param position the depth of the item within the database
     * @param subPosition the position in the subcategory of the parent
     */
    reOrderItemLeft(position: number, subPosition: number, route: string[]): boolean {
        const callback: Function = (value: sentence) => {
            const subCallback: Function = (subValue: sentence) => {
                // duplicate the item one position down
                subValue.subcategories.push(value.subcategories[subPosition]);
            }
            this.modifyData(position - 1, subCallback, route);
            // and remove the initial value
            value.subcategories.splice(subPosition, 1);
        }
        
        try {
            this.modifyData(position, callback, route);
            return true;
        } catch (error) {
            console.log(error.message);
            return false;
        }
    }
    
    /**
     * Generate a new random ID...
     * DONE
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

// backup db
// [{"id":"FFnsi","subcategories":[{"tests":[],"sentence":[{"text": ""}],"starter":false,"subcategories":[{"starter":true,"sentence":[{"text": "${v|forename}$ ${v|surname}$ has earned themselves [1] ${v|grade}$ grade in ${g|Subject Name}$ this ${g|Time Period[semester,term]}$."}],"id":"7B4IX","subcategories":[{"name":"Short","sentence":[{"text": ""}],"subcategories":[{"name":"1","sentence":[{"text": "."}],"subcategories":[{"name":"New","id":"gcj3p"}],"id":"X5Up6"}],"id":"xkvmt"},{"sentence":[],"name":"Medium","tests":[],"id":"hYLfU","subcategories":[{"tests":[{"name":"gradeChange"}],"sentence":[{"text": "not achieving quite as well as (LAST GRADE PERIOD)."}],"name":"1","id":"ucK6b"},{"name":"2","tests":[{"name":"gradeChange"}],"sentence":[{"text": "achieving just as well as (LAST GRADE PERIOD)."}],"id":"7wrSS"},{"name":"3","tests":[{"name":"gradeChange"}],"id":"I9i0H","sentence":[{"text": "achieving better than (LAST GRADE PERIOD)."}]},{"sentence":[{"text": "achieving far better than (GENDER) did in (LAST GRADE PERIOD)."}],"id":"PHEla","tests":[{"name":"gradeChange"}],"name":"4"}]},{"id":"zaAkK","subcategories":[{"sentence":[{"text": "where (GENDER) achieved a (LAST GRADE PERIOD GRADE)."}],"name":"1","id":"neFow"}],"name":"Long","sentence":[]}],"name":"Grade"},{"starter":true,"name":"Learning","id":"nn4gC","subcategories":[],"sentence":[{"text": "${v|forename}$ ${v|surname}$ has this ${g|Time Period[semester,term]}$ in ${g|Subject Name}$  learned about ${g|Topics Learned}$."},{"text": "${v|forename}$ ${v|surname}$ has learned about ${g|Topics Learned}$ this ${g|Time Period[semester,term]}$ in ${g|Subject Name}$"}]},{"id":"Jq1gA","name":"Basic (Jq1gA)","subcategories":[{"id":"sE9xO","name":"New"}],"sentence":[{"text":"This is a report of ${v|forename}$ ${v|surname}$'s progress throughout the last ${g|Time Period[semester,term]}$ in ${g|Subject Name}$"}]}],"name":"Intro","id":"7hYZS"},{"subcategories":[{"id":"wO91f","name":"1"}],"name":"What they did well","id":"7ZAK2","sentence":[{"text": ""}]}]}]