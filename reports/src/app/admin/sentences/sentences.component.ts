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
    singleStreamDataView: boolean = true;

    constructor(private databaseService: DatabaseService) {}

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
            this.databaseService.getSentences().pipe(take(1)).subscribe(returnData => {
                // add data to the sentenceData array...
                returnData.forEach(data => {
                    this.sentenceData.push(data.data());
                })
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
                        // if a single stream is needed only select the appropriate routes...
                        // console.log(dataStem.name ? dataStem.name : "here",value, index, route, !singleStream, value === index, (routePosition + 1) === route.length);
                        
                        if(!singleStream || (route[routePosition + 1] === index) || ((routePosition + 1) === route.length)) {
                            data.forEach((key: string) => {
                                // get the value for the key value pair
                                const val: string | boolean | number = (dataStem[key] ? dataStem[key] : undefined);
                                // if it exists add it to the array
                                if(val !== undefined) {
                                    const add = { [key]: val };
                                    newReturnData[index] = { ...newReturnData[index], ...add};
                                }
                            })
                        }
                    })

                } catch {
                    // no subdata, this is the end of the road....
                    let noSubDataReturn: {} = {};

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
                    }

                    newReturnData = [noSubDataReturn];
                }

                // add the data to the return variable...
                ret[routePosition] = newReturnData;

                // set the data stream as the subcategories of the first branch...
                sntncData = sntncData[value].subcategories;
            
            } catch {
                // nothing here yet...
            }
        })

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

        const sentences = this.getSentenceData(route, true, ['sentence', 'endpoint', 'starter']);
        // console.log(sentences);
        console.log(this.viewData);

        // let depth: number = 0;
        // let sentenceFromRoute: {sentence: string, starter: boolean, endpoint: boolean, depth: number}[] = [];

        // this.sentenceData.forEach(function iterate(value: sentence, i: number, arr) {
            
        //     // if this is the correct point in the route or if its the end of the route...
        //     if(i === route[depth] || depth === route.length) {
        //         const sentence: string = value.sentence ? value.sentence : undefined;
        //         const starter: boolean = value.starter ? value.starter : false;
        //         const endpoint: boolean = value.endpoint ? value.endpoint : false;
                
        //         if(sentence) {
        //             sentenceFromRoute[sentenceFromRoute.length] = {sentence: sentence, starter: starter, endpoint: endpoint, depth: depth};
        //         }

        //         if(Array.isArray(value.subcategories)) {
        //             depth++;    // increase depth
        //             value.subcategories.forEach(iterate);  // reiterate
        //         }   
        //     }
        // });

        // console.log(sentenceFromRoute);

        // // this.possibilities = possibilities;

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
        this.viewData = this.getSentenceData(this.route, this.singleStreamDataView, this.selection);
        this.changeComparsion();
    }
    
    modifyEndpointData(position: number, subPosition: number, currentState: boolean) {
        this.modifyData(position, subPosition, 'endpoint', !currentState);
        this.viewData = this.getSentenceData(this.route, this.singleStreamDataView, this.selection);
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
