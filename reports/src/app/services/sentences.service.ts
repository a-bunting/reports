import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { GroupsService, Student } from 'src/app/services/groups.service';
import { DatabaseService } from '../services/database.service';
import { TestValues } from './reports.service';
import { TemplateTest, Test, TestsService, TestVariable } from './tests.service';

export interface sentence {
    id: string;
    endpoint?: boolean, starter?: boolean, 
    name?: string, sentence?: string[]
    subcategories?: [sentence], tests?: TemplateTest[], 
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

    constructor(private databaseService: DatabaseService, private testsService: TestsService, private groupService: GroupsService) { }

    /**
     * Gets the sentence data from memory or from the database and returns it as an observable...
     * @returns 
     */
    getSentencesDatabase(uid?: string, forcedFromDatabase: boolean = false): Observable<sentence>{
        // check if there is an instance of the sentences database in localstorage...
        if(localStorage.getItem('sentences-data') !== null && forcedFromDatabase === false) {
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
     * Updated form of getsentencedata which takes multiple options into account...
     * @param route 
     * @param singleStream 
     * @param data 
     * @returns 
     */
    getCompoundSentenceData(route: string[], singleStream: boolean = true, data: string[] = ['id']): [sentence[]][] {
        let returnSentences: [sentence[]][] = [];
        let routeOptions: string[][] = this.cartesianProduct(route.map(x => x.split('/')));
        // foreach route found in the caresian product, ierate looking for the specified data.
        routeOptions.forEach((sentenceOption: string[]) => {
            let newOption: [sentence[]] = this.getSentenceData(sentenceOption, singleStream, data);
            returnSentences.push(newOption);
        })
        // return and will need to iterate over the results...
        return returnSentences;
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





    generateTestedSentenceOptions(route: [string[]], userData: Student, tests: TestValues[]): string[] {

        let report: string[] = [""];

        route.forEach((route: string[], i: number) => {
            // check if its a new paragraph...
            if(route[0] === "newParagraph") {
                report.map((temp: string) => temp += "</p><p>");
            } else {
                // starting paragraph tag
                if(i === 0) { report.map((temp: string) => temp += "<p>") }

                // generate sentence option 1
                const str = this.generateTestedSentence(route, userData, tests);

                report.map((temp: string) => { temp += str; })
                // add all sentences to the final report array
                str.forEach((temp: string) => { 
                    report.push(temp); 
                })
                
                // close paragraph tag
                if (i === route.length - 1) { report.map((temp: string) => temp += "</p>") }
            }
        })

        return report;
    }


    generateTestedSentence(route: string[], userData?: Student, tests?: TestValues[]): string[] {

        let options: string[] = [];
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
    
        // for some reason there are repeat sentences, delete them simply for now...
        let unfiltered: [{sentence: string, depth: number, delete: boolean}] = [{sentence: "", depth: 0, delete: true}];
        unfiltered.shift(); // this is so hax :/
    
        sentences.forEach(a => {
            let i = unfiltered.findIndex(b => a.sentence === b.sentence);
            i === -1 ? unfiltered.push(a) : null;
        })

        unfiltered.forEach(opt => {
            options.push(opt.sentence);
        })

        return options;
    }


    newTestSentenceOptionCreator(fullRoute: [string[]], userData?: Student, tests?: TestValues[]): string[] {

        let finalOptions: string[][] = [];
        
        // iterate over each part of the route...
        fullRoute.forEach((route: string[]) => {
            
            let textArrays: string[][] = [];
            let data: sentence[] = this.sentenceData;

            route.forEach((unSplitRoute: string) => {
    
                // split the route by / bars...
                let splitRoutes: string[] = unSplitRoute.split('/');
                let routeData: string[][] = [];
    
                splitRoutes.forEach((routeId: string) => {
    
                    // THIS IS ALL CHECKING TESTS AGAINST USER DATA
                    // find out if this route is applicable to the user with any tests that might be happening.
                    let routeIndex: number = data.findIndex((temp: sentence) => temp.id === routeId);
                    let testResults: boolean[] = [];
                    let allTrue: boolean = true;
                    // check if there are any tests applicable on this data
                    
                    // check first that the route still existts - if the template has changed the id may have disappeared.
                    // Poor system ready for renewal before its evenb launched :)
                    if(routeIndex !== -1 && tests) {
                        if("tests" in data[routeIndex]) {
                            // check if the user passes the tests...
                            // console.log(data[routeIndex].tests);
                            let applicableTests: TemplateTest[] = data[routeIndex].tests;

                            // looop over all tests
                            applicableTests.forEach((testTemp: TemplateTest) => {
                                // get the correct test from the test database...
                                let test: Test = this.testsService.getTest(testTemp.identifier);
                                let newUserData: Student = { id: userData.id, data: {} };

                                // get the data needed from the user...
                                let testVariables: TestVariable[] = test.variables;

                                testVariables.forEach((variable: TestVariable) => {
                                    // find each variable identifvier in the userdata...
                                    // STUDENT OBJECT CHANGE TEST PHRASE
                                    variable.identifier in userData.data ? newUserData.data[variable.identifier] = userData.data[variable.identifier] : newUserData.data[variable.identifier] = "";
                                })
                                // any settings may also needed and should be added to the array
                                // NOT SURE THIS WILL WORK...
                                let testIndex: number = tests.findIndex((tVal: TestValues) => tVal.identifier === testTemp.identifier);
                                
                                if("settings" in test) {
                                    newUserData.data['settings'] = tests[testIndex].settings.value;
                                }
        
                                // submit the user data to the test to check if its truthy or falsey
                                let testValue = test.calculateValueFunction(newUserData);

                                let result: boolean = test.testFunction(testValue, testTemp.values.value);
                                // push the result onto the array...
                                testResults.push(result);
                            })
                            // this returns true if all tests are true. If any test is false, then eliminate this from the game!!
                            allTrue = !testResults.some((x: boolean) => x === false);
                        }
                    }
                    // END OF TESTS AGAINST USER DATA
    
    
                    if(allTrue) {
                        // iterate on the data
                        let sentenceValues: string[] = this.iterateSentenceFunction(data, routeId);
            
                        // push to the main array
                        if(sentenceValues !== undefined) {
                            sentenceValues.length > 0 ? routeData.push(sentenceValues) : null;
                        }
                    }
    
                })
    
                // flatten this array so all options available to the user are on the same array...
                textArrays.push(routeData.flat());
    
                // ALL ID1/ID2/ID3 should be the last entry, it wouldnt make sense otherwise...
                // find the index of the category just found and  make the data variables the subcategories...
                // will return -1 for a split route as it wont find that unique id...
                let subIndex: number =  data.findIndex((temp: sentence) => temp.id === unSplitRoute);
                
                // all of the previous data is on the same level so only increment data after they all have run.
                if(subIndex !== -1) {
                    if("subcategories" in data[subIndex]) {
                        data = data[subIndex].subcategories;
                    }
                }
    
            })
    
            // weed out empty arrays
            let newArray: string[][] = textArrays.filter((temp: string[]) => temp.length > 0 && /\S/.test(temp[0]));
            // now to find all the sentence options by a cartesian transform on the data...
            let returnArray: string[][] = this.cartesianProduct(newArray);
            // and iterate over joining all the strings up for an array of options
            let finalSentences: string[] = returnArray.map((str: string[]) => str.join('')).map((str: string) => str += '.');

            finalOptions.push(finalSentences);
        })

        // weed out empty arrays
        let newArray: string[][] = finalOptions.filter((temp: string[]) => temp.length > 0 && /\S/.test(temp[0]));
        // now to find all the sentence options by a cartesian transform on the data...
        let returnArray: string[][] = this.cartesianProduct(newArray);
        // and iterate over joining all the strings up for an array of options
        let finalSentences: string[] = returnArray.map((str: string[]) => str.join(''));

        // and return all options :)
        return finalSentences;
    }


    /**
     * Simply extracts sentence strings from a sentence object based upon a route id
     * 
     * @param data 
     * @param routeId 
     * @returns 
     */
    iterateSentenceFunction(data: sentence[], routeId: string): string[] {
        // get the relevant sentence
        let sentenceIndex: number = data.findIndex((temp: sentence) => temp.id === routeId);
        // get the sentence text array...
        let sentences: string[];
        // check the sentence exists...
        if(sentenceIndex !== -1) {
            // if there are sentences attached to this then push them to the return value
            if("sentence" in data[sentenceIndex]) {
                // if there are sentences then return them.
                sentences = data[sentenceIndex].sentence;
            }
        }
        return sentences;
    }



    /**
     * Generates an example sentence and gives the quantity of potential reports for this template
     * 
     * Takes something of the form:
     * [
     *  [id1, id2, id3], 
     *  [newparagraph],
     *  [id4,id5,id6]... etc
     * ]
     * 
     * @param routeArray 
     * @returns 
     */
    generateExampleReport(routeArray: [string[]]): {report: string, options: number} {
        let report: string = "";
        let quantity: number = 1;

        routeArray.forEach((route: string[], i: number) => {
            // check if its a new paragraph...
            if(route[0] !== "newParagraph") {
                // generate sentence option 1
                const str = this.generateSentenceOptions(route);
                quantity = quantity * str.length;
                report += str[0].sentence;
            }
        })

        return {report: report, options: quantity};
    }

    /**
     * Takes something of the form:
     * [
     *  [id1, id2, id3/id4/id5/id6], 
     *  [newparagraph],
     *  [id7,id8/id9,id10]... etc
     * ]
     * 
     * with the / to indicate options being the differentiator.
     * 
     * RETURNS a single report with the number of possible reports... 
     * 
     * @param routeArray 
     */
    generateCompoundReport(routeArray: [string[]], select: number = 1): {report: string, options: number} {
        // this function takes a route with options such as id1/id2/id3 etc and translates it into a report.
        let sentenceOptions: {report: string[], options: number} = {report: [""], options: 1};
        let optionCalculator: number = 1;
        
        // iterate over each sentence stem
        routeArray.forEach((route: string[]) => {
            // first get all postenital combinations
            let routeOptions: string[][] = this.cartesianProduct(route.map(x => x.split('/')));
            // get an array of random numbers relating to sentences in the database. If select is -1 all sentence selected...
            let selections: number[] = [...Array(select).keys()].map(x => select === -1 ? x : Math.floor(Math.random() * (routeOptions.length - 1)));
            // remove any repeats
            selections = [... new Set(selections)];

            // iterate over each of the route options
            // this can definately be slicker in terms of efficiency but for nowMEH
            routeOptions.forEach((routePossibility: string[], index: number) => {
                let exampleReports: {report: string, options: number} = this.generateExampleReport([routePossibility]);
                // get the options calculation
                optionCalculator *= exampleReports.options;
                // select the random value for the report
                if(selections.includes(index)) {
                    sentenceOptions.report.push(exampleReports.report);
                }
            })
        })
        // return
        return { report: sentenceOptions.report.join('').trim(), options: optionCalculator };
    }

    // test1: [number[]] = [[4, 5, 4, 5]];
    // test2: number[][] = [[4, 5],[4, 5]];
    
    route = ['id1/id2', 'id3/id4', 'id5/id6'];
    routePreSplit: string[][] = [['id1', 'id2'], ['id3','id4'], ['id5','id6']];
    
    // dont this way to make sure I am happy with the map function which I havent used before!
    output: string[][] = this.cartesianProduct(this.routePreSplit);

    // function is more my style :)
    /**
     * Cartesian product function... may be useful for the sentence generation also...
     * @param route 
     * @returns 
     */
    cartesianProduct(route: string[][]): string[][] {
        // check if the length of the route is equal to 0, and if it is just return a blank array        
        if (route.length === 0) {
            return [];
        }
        
        // create two new arrays, one with the first entries, and one with the rest of the entries.
        const first: string[] = route[0]; // set first to the first entry in the route, which for the first iteration is ['id1','id2'] 
        const rest: string[][] = route.slice(1); // remove this first entry from the rest of the array
    
        // if the rest of the entries has no length then we do not want to carry on, so we return
        // the first entry with each individual entry set as an array.
        // in the case of the first iteration (assumeing it was a single array) this would return [['id1'],['id2']]
        if (rest.length == 0) {
            return first.map(x => [x]);
        }
        
        // if this was not the last entry we first need to iterate forward towards it, so simply recurse on this
        // function with the reamining entries, in this case [['id3','id4'], ['id5','id6']]]
        const cartesianEnd = this.cartesianProduct(rest);
    
        // finally caretesianEnd has the return values of all the recursive data
        // first is entered as ['id1','id2']
        // id is started as id1
        // the return values of all progressive data is then mapped as ['id1', ... then the rest of the subsequent id combinations]
        // in successive iterations this looks differently, for example when caretesianProduct triggers the first time then 
        // the 'first' variable has id as 'id3' and rest as 'id4'
        return first.flatMap(id => cartesianEnd.map(restOfIds => [id, ...restOfIds]))
    }


    singleOptionStemGenerator(route: string[]): [string[]] {

        let returnArray: [string[]];

        route.forEach((options: string) => {
            // split into the various options
            let splitOption: string[] = options.split('/');

            splitOption.forEach((str: string) => {
                if(route.length > 1) {
                    this.singleOptionStemGenerator(route.splice(0, 1));
                } else {
                    return str;
                }
            })
        });
        return returnArray;
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
                const testIdent: string = (<HTMLInputElement>document.getElementById('newTest')).value;
                // const test: Test = this.testsService.testsList.find((temp: Test) => temp.name === testName);
                const test: Test = this.testsService.testsList.find((temp: Test) => temp.identifier === testIdent);

                if(test !== undefined) {
                    // if the test was found add it...
                    const options: string[] | number[] = (test.test.options ? test.test.options : null);
                    const newTest: TemplateTest = {name: test.name, identifier: test.identifier, values: {name: test.test.name, value: "", options: options}};
                    // first add the test
                    if(testsAlreadyMade) {
                        value.subcategories[subPosition]['tests'].push(newTest);
                    } else {
                        value.subcategories[subPosition]['tests'] = [newTest];
                    }
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
                value.subcategories[subPosition].tests.splice(testNumber, 1);
                return true;
            } catch (e) {
                return false;
            }
        }
        return this.modifyData(position, callback, route);
    }

    modifyTestValue(position: number, index: number, testIndex: number, route: string[], modifiedValue: string | number) {
        const callback: Function = (value: sentence) => {
            try {
                value.subcategories[index].tests[testIndex].values.value = modifiedValue;
                return true;
            } catch (e) {
                return false;
            }
        }
        return this.modifyData(position, callback, route);
    }

    modifyTestName(position: number, index: number, testIndex: number, route: string[], modifiedValue: string): boolean {
        const callback: Function = (value: sentence) => {
            try {
                value.subcategories[index].tests[testIndex].name = modifiedValue;
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

    testValueValidation(value: string, test: Test): boolean {
        return test.test.validityFunction(value);
    }

    /**
     * A helper function to strip off any ${g|v|[]}$ and leave the name intact
     * @param report 
     */
    stripVariables(report: string): string {
        // first if there is a (notation) then escape it so it works properly...
        // then get to replacing text!W
        let strReplace = new RegExp('\\$\\{([vgn]{1,2}\\|+([^\\}\\[]*)+(\\[.*?])?)\\}\\$', 'gi');
        let regExData: string[];

        while((regExData = strReplace.exec(report)) !== null) {
            let replaceStr: string = regExData[3] ? regExData[3].split(',').join(' or ') : regExData[2];
            report = report.replace(regExData[0], '<span class="create-template__highlight">'+replaceStr+'</span>');
            strReplace.lastIndex = 0;
        }

        return report;
    }
}