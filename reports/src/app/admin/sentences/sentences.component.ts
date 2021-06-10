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

    levels: number = 1;
    isLoading: boolean = true;
    sentenceData: sentence[] = [];
    // viewData: sentence[] = [];

    dataPath: [{id: number; name: string[]}] = [{id: 0, name: [""]}];
    
    constructor(private databaseService: DatabaseService) {}

    ngOnInit(): void {
        this.databaseService.getSentences().pipe(take(1)).subscribe(returnData => {
            // add data to the sentenceData array...
            returnData.forEach(data => {
                this.sentenceData.push(data.data());
            })
            console.log(this.sentenceData);

            this.rebuildView();

            this.isLoading = false;
        }, (error: any) => {
            console.log(`Error retrieving data: ${error.message}`);
        });
    }

    setViewData(path: number[]): sentenceStem[] {
        // set a new variable to populate
        let viewData: sentenceStem[] = this.getInitialView();
        // iterate over the path
        path.forEach((route: number) => {
            // not working yet
            //let sentenceStem: sentenceStem;
            //viewData.push(this.sentenceData[route])
        })
        // return the view data
        console.log(path);
        return viewData;
    }

    getInitialView(): sentenceStem[] {
        var viewLevel: sentenceStem[] = [];

        this.sentenceData.forEach((sentence: sentence) => {
            let subcats: boolean = typeof sentence.subcategories === undefined ? false : true;
            let newSentence: sentenceStem = {name: sentence.name, subcategories: subcats};
            viewLevel.push(newSentence);
        });

        return viewLevel;
    }


    route: number[] = [];
    viewData: sentenceStem[][] = [[]];

    onStemClick(level: number, id: number) {
        this.route[level] = id;
        this.route.length = level - 1; // get rid of all subsequent items.
        this.rebuildView();
    }

    topLevelStems() {

    }

    rebuildView() {

        let newData: [sentenceStem[]] = [null];
        let subdata: sentence[] = this.sentenceData;

        this.route.forEach((route: number) => {
            let data: sentence = subdata[route];
            let levelData: sentenceStem[] = [];

            // console.log(data);

            try {

                console.log("subcat");
                console.log(data.subcategories);

                let i: number  = 0;

                while(data.subcategories[i]) {
                    let subcats: boolean = typeof data.subcategories[i] === undefined ? false : true;
                    levelData.push({name: data.subcategories[i].name, subcategories: subcats});
                    i++;
                }

            } catch (error) {
                console.log(`error: ${error.message}`);
            }

            newData.push(levelData);

            try {
                subdata = subdata[route].subcategories;
            } catch (error) {
                subdata = subdata;
            }
        })

        console.log(newData);
        this.viewData = newData;
    }

    generateBottomLevelViewData(data: sentence[]): sentenceStem[] {

        return senste0
    }

    /*
    [{…}]
        0:
            name: "Introduction"
            starter: true
            subcategories: {0: {…}, 1: {…}} - cant use length or foreach on this...
    */

}
