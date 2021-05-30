import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { DatabaseService, sentence } from '../../services/database.service';

@Component({
  selector: 'app-sentences',
  templateUrl: './sentences.component.html',
  styleUrls: ['./sentences.component.scss']
})
export class SentencesComponent implements OnInit {

    levels: number = 1;
    isLoading: boolean = true;
    sentenceData: sentence[];
    visibleData: sentence[] = [];

    dataPath: [{id: number; name: string[]}] = [{id: 0, name: [""]}];
    
    constructor(private databaseService: DatabaseService) {}

    ngOnInit(): void {
        this.databaseService.getSentences().subscribe(returnData => {
            this.sentenceData = returnData;
            
            // find the depth of the sentence array
            // dperecate maybe, this is poor
            let levels: number = this.calculateDepth(returnData);
            this.visibleData[0] = returnData;// bad idea..
            // console.log(`Sentence structure depth: ${levels}`);

            // more streamlined version.
            this.dataPath[0] = {id: 0, name: this.getInitialNameArray()};

            console.log(this.dataPath);
            
            this.isLoading = false;
        });
    }

    getInitialNameArray() {
        let newStringAarray: string[] = [];
        
        this.sentenceData.forEach(data => {
            newStringAarray.push(data.name);
        });

        return newStringAarray;
    }

    getNameArray(index: number): string[] {
        let newStringAarray: string[];


        for(let o = 0; o < this.sentenceData[index].length ; o++) {
            newStringAarray.push(this.sentenceData[index][o].name);
        }

        return newStringAarray;
    }

    selectStemUpdated(level: number, stem: number) {
        let newPath: [{id: number; name: string[]}] = [{id: 0, name: [""]}];

        for(let i = 0; i < level; i++) {
            newPath[i] = this.dataPath[i];
        }
    }








    selectStem(parentCategory: number, categoryId: number): void {
        console.log(parentCategory, categoryId);

        console.log(this.visibleData[parentCategory][categoryId]);

        if(this.visibleData[parentCategory][categoryId].subCategories) {
            this.visibleData[parentCategory+1] = this.visibleData[parentCategory][categoryId].subCategories;
        }
    }

    /**
     * Calculates the maximum depth of sentence stems.
     * 
     * Tenatative working - not fully tested because of the pita of generating the data. Keep testing.
     * 
     * @param data 
     * @returns 
     */
    calculateDepth(data: sentence[]): number {
        let depth: number = 0;
        for(let i = 0; i < data.length ; i++) {
            if(data[i].subCategories) {
                depth++;
                let newDepth: number = this.calculateDepth(data[i].subCategories);
            
                if(newDepth > depth) {
                    depth = newDepth;
                }
            }
        } 
        return depth;
    }
    
}
