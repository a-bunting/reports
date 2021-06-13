import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { DatabaseService, sentence } from '../../services/database.service';

interface sentenceStem {
    name: string, subcategories: boolean
}

@Component({
  selector: 'app-sentences',
  templateUrl: './sentences.component.html',
  styleUrls: ['./sentences.component.scss']
})
export class SentencesComponent implements OnInit {

    // detlete when done
    isLoading: boolean = true;
    sentenceData: sentence[] = [];
    viewData: [[{}]];
    
    constructor(private databaseService: DatabaseService) {}

    ngOnInit(): void {

        // check if there is an instance of the sentences database in localstorage...
        if(localStorage.getItem('sentences-data') !== null) {
            // retrieve the data from local storage and parse it into the sentence data...
            this.sentenceData = JSON.parse(localStorage.getItem('sentences-data'));
            this.getSentenceData(this.route, false, this.selection);
            this.isLoading = false;
        } else {
            // no instance of the saved data so geta  fresh version.
            this.databaseService.getSentences().pipe(take(1)).subscribe(returnData => {
                // add data to the sentenceData array...
                returnData.forEach(data => {
                    this.sentenceData.push(data.data());
                })
                // set the data into local storage to make it quicker ot retrieve next time...
                localStorage.setItem('sentences-data', JSON.stringify(this.sentenceData));
                
                this.getSentenceData(this.route, false, this.selection);
                this.isLoading = false;
            }, (error: any) => {
                console.log(`Error retrieving data: ${error.message}`);
            });
        }
    }

    // current version just displays the data but does nothing with it...
    getSentenceData(route: number[], singleStream: boolean, data?: string[]) {
        // route must always start with a 0
        route[0] = 0;
        //console.log(route);

        // let ret: [[{name: string, sentence: string}]] = [[{name: null, sentence: null}]];
        let ret: [[{}]] = [[{}]];
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
        console.log(ret);
        this.viewData = ret;
    }

    route: [number] = [0];
    selection: string[] = ['name','sentence','endpoint', 'starter', 'tests', 'meta', 'comparison', 'function'];

    setView(position: number, index: number) {
        this.route[position+1] = index;
        this.route.splice(position+2);
        this.getSentenceData(this.route, false, this.selection);
    }

    
    modifySentenceData(newComment, position: number, subPosition: number) {
        
        // let sntncData = this.sentenceData;
        // let newData = this.sentenceData;

        // this.route.forEach((routeId: number, i: number) => {
        //     sntncData = sntncData[routeId].subcategories;
        // });

        // // need to get to this point Headers.length.toExponential.
        // // this.sentenceData[this.route[0]]['subcategories'][this.route[1]]['subcategories'][index].sentence = newComment.target.innerText;

        // console.log(sntncData[index].sentence);
        // console.log(newComment.target.innerText);
    
        this.sentenceData.forEach(function iterate(sntnce, index) {
            if(index === position) {
                console.log(sntnce.subcategories[subPosition].sentence);
                return;
            }
            Array.isArray(sntnce.subcategories) && sntnce.subcategories.forEach(iterate);
        })

        // console.log(this.sentenceData);


    }

    modifyStartpointData() {
        
    }

    modifyEndpointData() {

    }

    modifyTestsData() {

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
    [
        // this is level one
        [
            {name: name of stem, sentence: sentence stem},
            {name: name of stem, sentence: sentence stem},
            {name: name of stem, sentence: sentence stem}
        ],
        // this is level two
        [
            {name: name of stem, sentence: sentence stem}
        ]
    ]
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
