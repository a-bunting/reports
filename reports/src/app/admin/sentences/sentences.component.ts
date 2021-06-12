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
    
    constructor(private databaseService: DatabaseService) {}

    ngOnInit(): void {

        // check if there is an instance of the sentences database in localstorage...
        if(localStorage.getItem('sentences-data') !== null) {
            // retrieve the data from local storage and parse it into the sentence data...
            this.sentenceData = JSON.parse(localStorage.getItem('sentences-data'));
            this.getSentenceData(this.route, false);
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
                
                this.getSentenceData(this.route, false);
                this.isLoading = false;
            }, (error: any) => {
                console.log(`Error retrieving data: ${error.message}`);
            });
        }
    }

    viewData: [[{name: string, sentence: string}]];

    getSentenceData(route: number[], singleStream: boolean, data?: string[]) {
        // route must always start with a 0
        route[0] = 0;
        console.log(route);

        let ret: [[{name: string, sentence: string}]] = [[{name: null, sentence: null}]];
        let sntncData = this.sentenceData;

        route.forEach((value: number, routePosition: number) => {
            try {
                let subData = sntncData[value].subcategories;
                let returnData: [{name: string, sentence: string}] = [{name: null, sentence: null}];

                try {
                    // check to see if there is subdata, and if not just use the sentence stem
                    subData.forEach((dataStem: sentence, index: number) => {
                        const name = (dataStem.name ? dataStem.name : null);
                        const sentence = (dataStem.sentence ? dataStem.sentence : null);
                        returnData[index] = {name: name, sentence: sentence};
                    })
                } catch {
                    // no subdata, this is the end of the road....
                    const name = (subData[value].name !== null ? subData[value].name : null);
                    const sentence = (subData[value].sentence !== null ? subData[value].sentence : null);
                    returnData = [{name: name, sentence: sentence}];
                }

                ret[routePosition] = returnData;
                // set the data stream as the subcategories of the first branch...
                sntncData = sntncData[value].subcategories;
            } catch {
                // nothing here yet...
            }
        })

        this.viewData = ret;
    }

    modifyComment(newComment, position: number, index: number) {
        console.log(typeof newComment)
        console.log(newComment.target.innerText);
    }

    // current version just displays the data but does nothing with it...
    getSentenceDataWORKINGBASIC(route: number[], singleStream: boolean, data?: string[]) {
        // route must always start with a 0
        route[0] = 0;
        console.log(route);

        let ret: [[{name: string, sentence: string}]] = [[{name: null, sentence: null}]];
        let sntncData = this.sentenceData;

        route.forEach((value: number, routePosition: number) => {
            try {
                let subData = sntncData[value].subcategories;
                let returnData: [{name: string, sentence: string}] = [{name: null, sentence: null}];

                try {
                    // check to see if there is subdata, and if not just use the sentence stem
                    subData.forEach((dataStem: sentence, index: number) => {
                        const name = (dataStem.name ? dataStem.name : null);
                        const sentence = (dataStem.sentence ? dataStem.sentence : null);
                        returnData[index] = {name: name, sentence: sentence};
                    })
                } catch {
                    // no subdata, this is the end of the road....
                    const name = (subData[value].name !== null ? subData[value].name : null);
                    const sentence = (subData[value].sentence !== null ? subData[value].sentence : null);
                    returnData = [{name: name, sentence: sentence}];
                }

                ret[routePosition] = returnData;
                // set the data stream as the subcategories of the first branch...
                sntncData = sntncData[value].subcategories;
            } catch {
                // nothing here yet...
            }
        })

        this.viewData = ret;
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

    route: [number] = [0];

    setView(position: number, index: number) {
        this.route[position+1] = index;
        this.route.splice(position+2);
        this.getSentenceData(this.route, false);
    }


    /*
    [{…}]
        0:
            name: "Introduction"
            starter: true
            subcategories: {0: {…}, 1: {…}} - cant use length or foreach on this...
    */

}
