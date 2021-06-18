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
    singleStreamDataView: boolean = false;

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

    // function to generate all options for this route to check it works fine.
    /**
     * 
     * * Returns an array like this:
    *
     * 
     * @param route use an array like this:
     */
    possibilities;

    // NEXT BIG ONE TO DO...
/**
 * 
 * 
 [
  [
    {
      "name": "Introductions",
      "sentence": "New sentence",
      "starter": true,
      "route": 0,
      "index": 0
    }
  ],
  [
    {
      "name": "Grade",
      "sentence": "this is",
      "endpoint": true,
      "route": 1,
      "index": 0
    }
  ],
  [
    {
      "name": "Grade",
      "route": 2,
      "index": 0
    }
  ],
  [
    {
      "name": "medium",
      "sentence": "hhhhh",
      "endpoint": true,
      "tests": [
        {
          "function": "gradeChange",
          "comparison": "meta"
        }
      ],
      "route": 3,
      "index": 1
    }
  ],
  [
    {
      "sentence": "not achieving quite as well as (LAST GRADE PERIOD).",
      "endpoint": true,
      "route": 4,
      "index": 0
    },
    {
      "sentence": "achieving just as well as (LAST GRADE PERIOD).",
      "endpoint": true,
      "route": 4,
      "index": 1
    },
    {
      "sentence": "achieving better than (LAST GRADE PERIOD).",
      "endpoint": true,
      "route": 4,
      "index": 2
    },
    {
      "sentence": "achieving far better than (GENDER) did in (LAST GRADE PERIOD).",
      "endpoint": true,
      "route": 4,
      "index": 3
    }
  ]
]

 * 
 * 
 * @param route 
 * 
 * 
 */

    generateSentenceOptions(route: number[]) {
        const data = this.getSentenceData(route, true, ['name', 'sentence', 'endpoint', 'starter', 'tests']);
        let sentences: [{sentence: string, depth: number, delete: boolean}] = [{sentence: "", depth: 0, delete: true}];

        // iterate over each level of the sentence builder...
        data.forEach((stem: sentence[], depth: number) => {
            // iterate overall options within a level
            const oldSentences = [...sentences];

            stem.forEach((newStem: sentence) => {
                const sentence = newStem.sentence ? newStem.sentence : undefined;
                const starter = newStem.starter ? newStem.starter : false;
                const endpoint = newStem.endpoint ? newStem.endpoint : false;

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

        // delete suplicates for some reason (to fix later).
        this.possibilities = sentences.filter((obj, index) => (sentences.findIndex((test, idx) => test.sentence === obj.sentence)) === index);
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
                        complete = true;
                    }
                } else {
                    depth++;
                    Array.isArray(value.subcategories) && !complete && value.subcategories.forEach(iterate);
                }
            }
        })

        // toggle autosave if data has been modified and toggle unsaved changes if there is no autosave.
        this.autosave ? this.saveChanges() : this.unsavedChanges = true;
    }

    addNewSubLevel(position: number) {
        
        const callback: Function = (value: sentence) => {
            value.subcategories.push({name: "new", order: position, index: value.subcategories.length-1});
            this.setView(position, value.subcategories.length-1);
        }
        
        this.modifyData(position, null, null, null, callback);
        
        // first get the subcategory data for this stem.
        // let depth: number = 0;
        // let route = this.route;
        // let complete: boolean = false;
        // let newView: {pos: number, ind: number};
        
        // this.sentenceData.forEach(function iterate(value: sentence, i: number) {
        //     if(i === route[depth] && !complete) {
        //         if(position === depth && !complete) {
        //             // need to ensure this can add to the array if it isnt there already...
        //             value.subcategories.push({name: "new", order: position, index: value.subcategories.length-1});
        //             newView = { pos: position, ind: value.subcategories.length-1}
        //             complete = true;
        //         } else {
        //             depth++;
        //             Array.isArray(value.subcategories) && !complete && value.subcategories.forEach(iterate);
        //         }
        //     }
        // })  
        // this.setView(newView.pos, newView.ind);
      }
  
      modifyTestsData() {
  
      }
  
      deleteRoute(position: number, index: number) {
  
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

    //    modifyData(position: number, subPosition: number, key: string, newValue: string | boolean | number) {

    // addNewLevel(position: number, subPosition: number) {
    //     // first get the subcategory data for this stem.
    //     let depth: number = 0;
    //     let route = this.route;
    //     let complete: boolean = false;
    //     let newView: {pos: number, ind: number};
        
    //     this.sentenceData.forEach(function iterate(value: sentence, i: number) {
    //         if(i === route[depth] && !complete) {
    //             if(position === depth && !complete) {
    //                 // need to ensure this can add to the array if it isnt there already...
    //                 if(Array.isArray(value.subcategories[subPosition].subcategories)) {
    //                     // if subcategories exist then this can be psuhed onto the array that
    //                     value.subcategories[subPosition].subcategories.push({name: "new", subcategories: [{name: "New"}]});
    //                     newView = {pos: position, ind: value.subcategories[subPosition].subcategories.length - 1};
    //                 } else {
    //                     // otherwise add the subcategories position and add to it...
    //                     value.subcategories[subPosition].subcategories = [{name: "new", subcategories: [{name: "New"}]}];
    //                     newView = {pos: position, ind: 0};
    //                 }
    //                 complete = true;
    //             } else {
    //                 depth++;
    //                 Array.isArray(value.subcategories) && !complete && value.subcategories.forEach(iterate);
    //             }
    //         }
    //     })

    //     this.viewData = this.getSentenceData(this.route, this.singleStreamDataView, this.selection);
    //     this.setView(newView.pos, newView.ind);
        
    // }

    

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
    */
}
