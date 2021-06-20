// [{"subcategories":[{"subcategories":[{"sentence":"earning (*GENDER NOUN)self an (LETTER) throughout the period","subcategories":[{"subcategories":[{"subcategories":[{"endpoint":true,"sentence":"where (GENDER) achieved a (LAST GRADE PERIOD GRADE).","name":"Name"}],"name":"Long","sentence":"here is the middle :D","starter":false},{"tests":[{"comparison":"meta","function":"gradeChange"}],"subcategories":[{"sentence":"not achieving quite as well as (LAST GRADE PERIOD).","endpoint":true,"meta":-2},{"meta":0,"sentence":"achieving just as well as (LAST GRADE PERIOD). PIES LOL","endpoint":true},{"meta":2,"sentence":"achieving better than (LAST GRADE.","endpoint":true},{"sentence":"achieving far better than (GENDER) did in (LAST GRADE PERIOD).","meta":20,"endpoint":true}],"name":"medium","sentence":"","endpoint":true},{"name":"short","subcategories":[{"sentence":".","endpoint":true}],"starter":false}],"name":"Grade","sentence":""},{"name":"Learning","subcategories":[{"name":"1","subcategories":[],"sentence":"This is the final sentence..."}]}],"name":"Grade","endpoint":true,"starter":true},{"name":"Learning","subcategories":[{"endpoint":true,"sentence":"where (GENDER}NAME) learned about (TOPICS).","starter":false},{"sentence":"During this (PERIOD) (NAME}GENDER) learned about (TOPICS)","endpoint":true,"starter":false}]}],"name":"Introductions","starter":true,"endpoint":true,"sentence":"NAME Has had a good semster"},{"endpoint":true,"name":"What they did well","sentence":"","starter":false,"subcategories":[]}]}]
// backup data!

import { Component, OnDestroy, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { AuthService } from 'src/app/utilities/auth/auth.service';
import { User } from 'src/app/utilities/auth/user.model';
import { AuthenticationService } from 'src/app/utilities/authentication/authentication.service';
import { DatabaseService, sentence } from '../../services/database.service';
import { TestsService, Test } from '../../services/tests.service';

@Component({
  selector: 'app-sentences',
  templateUrl: './sentences.component.html',
  styleUrls: ['./sentences.component.scss']
})
export class SentencesComponent implements OnInit, OnDestroy {

    isLoading: boolean = true;

    // these do NOT need to be an array, but in a slow start everything got coded this way and so thats how it is!...
    initialData: sentence[];
    sentenceData: sentence[] = [];
    viewData: [sentence[]];
    route: [number] = [0];
    selection: string[] = ['name','sentence', 'starter', 'tests', 'meta', 'comparison', 'function'];

    autosave: boolean = false;
    unsavedChanges: boolean = false;
    singleStreamDataView: boolean = false;

    user: User;

    constructor(private databaseService: DatabaseService, private testsService: TestsService, private auth: AuthenticationService) {
        // get the user details...
        auth.user.subscribe((newUser: User) => {
            this.user = newUser;
        })
    }

    ngOnInit(): void {

        // check if there is an instance of the sentences database in localstorage...
        if(localStorage.getItem('sentences-data') !== null) {
            // retrieve the data from local storage and parse it into the sentence data...
            this.sentenceData = JSON.parse(localStorage.getItem('sentences-data'));
            // set the initial data as the save point in case of edits. This needs to be a new copy, not a reference.
            this.initialData = JSON.parse(localStorage.getItem('sentences-data'));                
            // set the data on the display
            this.viewData = this.getSentenceData(this.route, this.singleStreamDataView, this.selection);
            this.generateSentenceOptions(this.route);
            this.isLoading = false;
        } else {
            // no instance of the saved data so geta  fresh version.
            this.databaseService.getSentences('template').pipe(take(1)).subscribe(returnData => {
                // // add data to the sentenceData array...
                // returnData.forEach(data => {
                //     this.sentenceData.push(data.data());
                // })
                this.sentenceData[0] = returnData.data();
                // set the initial data as the save point in case of edits. This needs to be a new copy, not a reference.
                this.initialData = JSON.parse(JSON.stringify(this.sentenceData));
                // set the data into local storage to make it quicker ot retrieve next time...
                localStorage.setItem('sentences-data', JSON.stringify(this.sentenceData));
                
                this.viewData = this.getSentenceData(this.route, this.singleStreamDataView, this.selection);
                this.generateSentenceOptions(this.route);
                this.isLoading = false;
            }, (error: any) => {
                console.log(`Error retrieving data: ${error.message}`);
            });
        }
    }

    ngOnDestroy() {
        // when leaving without specifically comitting only upload to the development version
        this.reUploadToFirebase('dev');
    }

    reUploadToFirebase(docName?: string) {
        const doc = docName ? docName : 'template';
        this.databaseService.uploadSentences(doc, this.sentenceData[0]).subscribe(returnData => {
            console.log(returnData);
        })
    }

    /**
    *
     * @param route the array of subcategories through the sentenceData array 
     * @param singleStream  whether or not to go down the route only or butterfly out
     * @param data a list of key values to return (i.e. name, sentence etc)
     */
    getSentenceData(route: number[], singleStream: boolean, data?: string[]): [sentence[]] {
        // route must always start with a 0
        route[0] = 0;

        let ret: [sentence[]] = [[]];
        let sntncData = this.sentenceData;

        route.forEach((value: number, routePosition: number) => {
            try {
                let subData;
                if(Array.isArray(sntncData[value].subcategories)) {
                    subData = sntncData[value].subcategories;
                } else {
                    subData = sntncData[value];
                    subData.subcategories = [];
                }

                let newReturnData: [{}] = [{}];
                try {
                    // check to see if there is subdata, and if not just use the sentence stem
                    subData.forEach((dataStem: sentence, index: number) => {
                        // if a single stream is needed only select the appropriate routes...
                        if(!singleStream || (route[routePosition+1] === index) || ((routePosition + 1) === route.length)) {
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
                } catch {
                    // no subdata, this is the end of the road....
                    let noSubDataReturn: {} = {};
                    console.log("DONT DELETE THIS :D");

                    if(!singleStream || ((routePosition + 1) === route.length)) {
                        data.forEach((key: string) => {
                            // get the value for the key value pair
                            const val: string | boolean | number = (subData[value][key] ? subData[value][key] : undefined);
                            // if it exists add it to the array
                            if(val !== undefined) {
                                const add = { [key]: val };
                                noSubDataReturn = { ...noSubDataReturn, ...add};
                            }
                        }) 
                        // untested...
                        const editParameters = { route: routePosition, index: 0 };
                        noSubDataReturn = { ...noSubDataReturn, ...editParameters};    
                    }
                    newReturnData = [noSubDataReturn];
                }
                // add the data to the return variable...
                // no empty objects...                
                ret[routePosition] = newReturnData.filter(stem => Object.keys(stem).length !== 0);
                // set the data stream as the subcategories of the first branch...
                sntncData = sntncData[value].subcategories;
            } catch {
                // nothing here yet...
            }
        })
        return ret;
    }

    // not working...
    getRouteNames(): string[] {
        let routeNames: string[] = [];
        let route = this.route;

        this.sentenceData.forEach(function iterate(routeId: sentence, index: number) {
            routeNames[index] = routeId.name;

            if(index < route.length && Array.isArray(routeId.subcategories)) {
                routeId.subcategories.forEach(iterate);
            }
        })
        return routeNames;
    }

    /** function to generate all options for this route to check it works fine.
     * @param route use an array like this:
     */
    possibilities;

    generateSentenceOptions(route: number[]) {
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
        })

        // delete duplicates for some reason (to fix later).
        this.possibilities = sentences.filter((obj, index) => (sentences.findIndex(test => test.sentence === obj.sentence)) === index);
        this.possibilities.sort((a: sentence, b: sentence) => { return a.sentence.length - b.sentence.length });
    }

    setFullDataView() {
        this.singleStreamDataView = !this.singleStreamDataView;
        this.viewData = this.getSentenceData(this.route, this.singleStreamDataView, this.selection);
    }

    setView(position: number, index: number) {
        this.route[position+1] = index;
        this.route.splice(position+2);
        this.viewData = this.getSentenceData(this.route, this.singleStreamDataView, this.selection);
        this.generateSentenceOptions(this.route);
    }

    modifyData(position: number, subPosition: number, key: string, newValue: string | boolean | number, callback?: Function) {

        let depth: number = 0;
        let route = this.route;
        let complete: boolean = false;
        
        this.sentenceData.forEach(function iterate(value: sentence, i: number) {
            if(i === route[depth] && !complete) {
                if(position === depth && !complete) {
                    // need to ensure this can add to the array if it isnt there already...
                    if(callback) {
                        callback(value);
                    } else {
                        value.subcategories[subPosition][key] = newValue;
                    }
                    complete = true;
                } else {
                    depth++;
                    Array.isArray(value.subcategories) && !complete && value.subcategories.forEach(iterate);
                }
            }
        })

        // toggle autosave if data has been modified and toggle unsaved changes if there is no autosave.
        this.autosave ? this.saveChanges() : this.unsavedChanges = true;

        // redraw the grid and check for save status...
        this.viewData = this.getSentenceData(this.route, this.singleStreamDataView, this.selection);
        this.changeComparsion();

        // regenerate the sentence options
        this.generateSentenceOptions(this.route);

    }

    addNewSubLevel(position: number) {
        const callback: Function = (value: sentence) => {
            value.subcategories.push({name: "new"});
            this.setView(position, value.subcategories.length-1);
        }
        this.modifyData(position, null, null, null, callback);
    }

    // unfinished..
    addTest: {order: number, index: number} = {order: null, index: null};
    
    addNewTest(position: number, subPosition: number) {
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

    removeTest(position: number, subPosition: number, testNumber: number) {
        const callback: Function = (value: sentence) => {
            value.subcategories[subPosition].tests.splice(testNumber, 1);
        }
        this.modifyData(position, subPosition, null, null, callback);
    }

    addNewTestSelectionBox(position: number, index: number): void {
        this.addTest = {order: position, index: index};
    }

    checkIfTestAlreadyAdded(tests: Object[], name: string): boolean {
        return tests.includes(each => each.name === name);
    }

    // doesnt current seem to work for some reason...
    filterTests(testsAdded: {name: string}[], allTests: Test[]) {
        if(testsAdded) {
            return allTests.filter(test => testsAdded.indexOf(each => { test.name === each.name }) === -1 );
        } else {
            return allTests;
        }
    }

    deleteRoute(position: number, index: number) {
        const callback: Function = (value: sentence) => {
            value.subcategories.splice(index, 1);
            this.setView(position - 1, this.route[position]);
        }
        this.modifyData(position, index, null, null, callback);
    }

    modifySentenceData(position: number, subPosition: number, sentenceIndex: number, newComment) {
        console.log("here");
        const callback: Function = (value: sentence) => {
            value.subcategories[subPosition]['sentence'][sentenceIndex] = newComment.target.innerText;
        }
        this.modifyData(position, subPosition, null, null, callback);
    }
    
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

    modifyName(position: number, subPosition: number, newComment) {
        this.modifyData(position, subPosition, 'name', newComment.target.innerText);
    }

    modifyStartpointData(position: number, subPosition: number, currentState: boolean) {
        this.modifyData(position, subPosition, 'starter', !currentState);
    }

    autosaveToggle() {
        this.autosave = !this.autosave;
        this.saveChanges();
    }

    resetRoute() {
        this.route = [0];
        this.viewData = this.getSentenceData(this.route, this.singleStreamDataView, this.selection);
    }

    saveChanges() {
        this.unsavedChanges = false;
        // and then need to commit to the database.
        localStorage.setItem('sentences-data', JSON.stringify(this.sentenceData));
    }

    /**
     * Simple method to quickly compare the current dataset against the initial dataset.
     * @returns true is the are equal, false otherwise
     */
    changeComparsion(): boolean {
        let changes: boolean = (JSON.stringify(this.initialData) === JSON.stringify(this.sentenceData));
        changes ? this.unsavedChanges = false : this.unsavedChanges = true;
        return changes;
    }

}
