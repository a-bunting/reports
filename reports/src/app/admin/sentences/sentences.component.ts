import { HttpClient } from '@angular/common/http';
import { stringify } from '@angular/compiler/src/util';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { DatabaseService, sentence } from '../../services/database.service';

@Component({
  selector: 'app-sentences',
  templateUrl: './sentences.component.html',
  styleUrls: ['./sentences.component.scss']
})
export class SentencesComponent implements OnInit, OnDestroy {

    isLoading: boolean = true;
    initialData: sentence[];
    sentenceData: sentence[] = [];
    viewData: [sentence[]];
    route: [number] = [0];
    selection: string[] = ['name','sentence','endpoint', 'starter', 'tests', 'meta', 'comparison', 'function'];

    autosave: boolean = false;
    unsavedChanges: boolean = false;

    constructor(private databaseService: DatabaseService) {}

    ngOnInit(): void {

        // check if there is an instance of the sentences database in localstorage...
        if(localStorage.getItem('sentences-data') !== null) {
            // retrieve the data from local storage and parse it into the sentence data...
            this.sentenceData = JSON.parse(localStorage.getItem('sentences-data'));
            // set the initial data as the save point in case of edits. This needs to be a new copy, not a reference.
            this.initialData = JSON.parse(localStorage.getItem('sentences-data'));                
            // set the data on the display
            this.viewData = this.getSentenceData(this.route, false, this.selection);
            this.isLoading = false;
        } else {
            // no instance of the saved data so geta  fresh version.
            this.databaseService.getSentences().pipe(take(1)).subscribe(returnData => {
                // add data to the sentenceData array...
                returnData.forEach(data => {
                    this.sentenceData.push(data.data());
                })
                // set the initial data as the save point in case of edits. This needs to be a new copy, not a reference.
                this.initialData = JSON.parse(JSON.stringify(this.sentenceData));
                // set the data into local storage to make it quicker ot retrieve next time...
                localStorage.setItem('sentences-data', JSON.stringify(this.sentenceData));
                
                this.viewData = this.getSentenceData(this.route, false, this.selection);
                this.isLoading = false;
            }, (error: any) => {
                console.log(`Error retrieving data: ${error.message}`);
            });
        }
    }

    ngOnDestroy() {

    }

    /**
     * Displays the sentence data given a specific route through the array.
     * Returns an array like this: 
     [
        // this is level one
        [
            {key: name of stem, value: sentence stem},
            ...
        ],
        // this is level two
        [
            {key: name of stem, value: sentence stem},
            {key: name of stem, value: sentence stem}
        ]
    ]
    *
     * @param route the array of subcategories through the sentenceData array 
     * @param singleStream  whether or not to go down the route only or butterfly out
     * @param data a list of key values to return (i.e. name, sentence, endpoint etc)
     */
    getSentenceData(route: number[], singleStream: boolean, data?: string[]): [sentence[]] {
        // route must always start with a 0
        route[0] = 0;

        let ret: [sentence[]] = [[]];
        let sntncData = this.sentenceData;

        route.forEach((value: number, routePosition: number) => {
            try {
                let subData = sntncData[value].subcategories;
                let newReturnData: [{}] = [{}];

                try {
                    // check to see if there is subdata, and if not just use the sentence stem
                    subData.forEach((dataStem: sentence, index: number) => {
                        data.forEach((key: string) => {
                            // get the value for the key value pair
                            const val: string | boolean | number = (dataStem[key] ? dataStem[key] : undefined);
                            // if it exists add it to the array
                            if(val !== undefined) {
                                const add = { [key]: val };
                                newReturnData[index] = { ...newReturnData[index], ...add};
                            }
                        })
                    })
                } catch {
                    // no subdata, this is the end of the road....
                    let noSubDataReturn: {} = {};

                    data.forEach((key: string) => {
                        // get the value for the key value pair
                        const val: string | boolean | number = (subData[value][key] ? subData[value][key] : undefined);
                        // if it exists add it to the array
                        if(val !== undefined) {
                            const add = { [key]: val };
                            noSubDataReturn = { ...noSubDataReturn, ...add};
                        }
                    })

                    newReturnData = [noSubDataReturn];
                }

                // ret[routePosition] = returnData;
                ret[routePosition] = newReturnData;
                // set the data stream as the subcategories of the first branch...
                sntncData = sntncData[value].subcategories;
            } catch {
                // nothing here yet...
            }
        })

        this.generateSentenceOptions(this.route);

        return ret;
    }

    // function to generate all options for this route to check it works fine.
    /**
     * 
     * * Returns an array like this:
    *
     * 
     * @param route use an array like this:
     */
    possibilities: [{sentence: string, position: number}];

    generateSentenceOptions(route: number[]) {
        // const sentenceArray: [sentence[]] = this.getSentenceData(route, false, ['sentence', 'starter','endpoint'])
        let possibilities: [{sentence: string, position: number, starter: boolean, endpoint: boolean}] = [{sentence: "", position: 0, starter: true, endpoint: false}];
        let depth: number = 0;

        this.sentenceData.forEach(function iterate(value: sentence, i: number, arr) {
            
            // if this is the correct point in the route or if its the end of the route...
            if(i === route[depth] || depth === route.length) {
                // first if there is a sentence here add it to the options array...
                const sentence: string = value.sentence ? value.sentence : undefined;
                const starter: boolean = value.starter;
                const endpoint: boolean = value.endpoint;
                let removeArray: number[] = [];

                if(sentence) {

                    // setup an array of new possiblities
                    if(possibilities[0].sentence === "") {
                        possibilities[0] = {sentence: sentence, position: depth, starter: value.starter, endpoint: value.endpoint};
                    } else {
                        // this is what to remove from the main array given the state of the new sentence (i.e. if the new sentence is not a starter sentence
                        // then the old sentence shouldnt exist alone.)

                        possibilities.forEach((next, i) => {
                            if(depth > next.position) {
                                // this sentence concatenated with the old sentence.
                                possibilities.push({sentence: next.sentence + " " + sentence, position: depth, starter: value.starter, endpoint: value.endpoint});
                                
                                if(starter) {
                                    // this has an option to start so add it separately
                                    possibilities.push({sentence: sentence, position: depth, starter: value.starter, endpoint: value.endpoint});
                                } else {
                                    // if this is not a starting comment then delete the old comment
                                    removeArray.push(i);
                                }
                            }
                        })
                    }
                }

                // get rid of any elements which will not be compatible.
                removeArray.forEach(value => {
                    possibilities.splice(value, 1);
                })

                // if there are subcategories iterate into them first
                if(Array.isArray(value.subcategories)) {
                    depth++;    // increase depth
                    value.subcategories.forEach(iterate);  // reiterate
                    depth--;    // decrease dpeth as you traverse backwards.
                }
            
            }
        });

        this.possibilities = possibilities;

    }

    setView(position: number, index: number) {
        this.route[position+1] = index;
        this.route.splice(position+2);
        this.viewData = this.getSentenceData(this.route, false, this.selection);
    }

    modifyData(position: number, subPosition: number, key: string, newValue: string | boolean | number) {

        let depth: number = 0;
        let route = this.route;
        let complete: boolean = false;
        
        this.sentenceData.forEach(function iterate(value: sentence, i: number) {
            if(i === route[depth] && !complete) {
                if(position === depth && !complete) {
                    // need to ensure this can add to the array if it isnt there already...
                    value.subcategories[subPosition][key] = newValue;
                    complete = true;
                } else {
                    depth++;
                    Array.isArray(value.subcategories) && !complete && value.subcategories.forEach(iterate);
                }
            }
        })

        // toggle autosave if data has been modified and toggle unsaved changes if there is no autosave.
        this.autosave ? this.saveChanges() : this.unsavedChanges = true;
    }

    modifySentenceData(position: number, subPosition: number, newComment) {
        this.modifyData(position, subPosition, 'sentence', newComment.target.innerText);
        this.changeComparsion();
    }

    modifyStartpointData(position: number, subPosition: number, currentState: boolean) {
        this.modifyData(position, subPosition, 'starter', !currentState);
        this.viewData = this.getSentenceData(this.route, false, this.selection);
        this.changeComparsion();
    }
    
    modifyEndpointData(position: number, subPosition: number, currentState: boolean) {
        this.modifyData(position, subPosition, 'endpoint', !currentState);
        this.viewData = this.getSentenceData(this.route, false, this.selection);
        this.changeComparsion();
    }

    modifyTestsData() {

    }

    autosaveToggle() {
        this.autosave = !this.autosave;
        this.saveChanges();
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

    /*
    - Take an array of numbers which determines the route.
    - Always includes the top tier.

    Uses the data from the setneces database which looks like this:

    [{
        "subcategories": [{
            "subcategories": [{
                "name": "Grade",
                "subcategories": [{
                    "name": "Grade",
                    "subcategories": [{
                        "subcategories": [{
                            "endpoint": true,
                            "sentence": "where (GENDER) achieved a (LAST GRADE PERIOD GRADE)."
                        }],
                        "name": "Long"
                    }, {
                        "name": "medium",
                        "tests": [{
                            "function": "gradeChange",
                            "comparison": "meta"
                        }],
                        "subcategories": [{
                            "endpoint": true,
                            "sentence": "not achieving quite as well as (LAST GRADE PERIOD).",
                            "meta": -2
                        }, {
                            "sentence": "achieving just as well as (LAST GRADE PERIOD).",
                            "meta": 0,
                            "endpoint": true
                        }, {
                            "meta": 2,
                            "endpoint": true,
                            "sentence": "achieving better than (LAST GRADE PERIOD)."
                        }, {
                            "sentence": "achieving far better than (GENDER) did in (LAST GRADE PERIOD).",
                            "meta": 20,
                            "endpoint": true
                        }]
                    }, {
                        "subcategories": [{
                            "sentence": ".",
                            "endpoint": true
                        }],
                        "name": "short"
                    }]
                }],
                "endpoint": true,
                "sentence": "earning (*GENDER NOUN)self an (LETTER) throughout the period"
            }, {
                "name": "Learning",
                "subcategories": [{
                    "endpoint": true,
                    "sentence": "where (GENDER}NAME) learned about (TOPICS)."
                }, {
                    "starter": true,
                    "sentence": "During this (PERIOD) (NAME}GENDER) learned about (TOPICS)",
                    "endpoint": true
                }]
            }],
            "name": "Introductions",
            "starter": true
        }, {
            "sentence": "Not written - Test",
            "name": "What they did well",
            "endpoint": true
        }]
    }]

    Needs to return something like this

    */

    // viewData: [[{name: string, sentence: string}]];

    // getSentenceData(route: number[], singleStream: boolean, data?: string[]) {
    //     // route must always start with a 0
    //     route[0] = 0;
    //     console.log(route);

    //     let ret: [[{name: string, sentence: string}]] = [[{name: null, sentence: null}]];
    //     let sntncData = this.sentenceData;

    //     route.forEach((value: number, routePosition: number) => {
    //         try {
    //             let subData = sntncData[value].subcategories;
    //             let returnData: [{name: string, sentence: string}] = [{name: null, sentence: null}];

    //             try {
    //                 // check to see if there is subdata, and if not just use the sentence stem
    //                 subData.forEach((dataStem: sentence, index: number) => {
    //                     const name = (dataStem.name ? dataStem.name : null);
    //                     const sentence = (dataStem.sentence ? dataStem.sentence : null);
    //                     returnData[index] = {name: name, sentence: sentence};
    //                 })
    //             } catch {
    //                 // no subdata, this is the end of the road....
    //                 const name = (subData[value].name !== null ? subData[value].name : null);
    //                 const sentence = (subData[value].sentence !== null ? subData[value].sentence : null);
    //                 returnData = [{name: name, sentence: sentence}];
    //             }

    //             ret[routePosition] = returnData;
    //             // set the data stream as the subcategories of the first branch...
    //             sntncData = sntncData[value].subcategories;
    //         } catch {
    //             // nothing here yet...
    //         }
    //     })

    //     this.viewData = ret;
    // }

    /*
    [{…}]
        0:
            name: "Introduction"
            starter: true
            subcategories: {0: {…}, 1: {…}} - cant use length or foreach on this...
    */

}
