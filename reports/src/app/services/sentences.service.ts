import { createOfflineCompileUrlResolver } from '@angular/compiler';
import { Injectable } from '@angular/core';
import { from, of, Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { DatabaseService } from '../services/database.service';

export interface sentence {
    id?: string;
    endpoint?: boolean, starter?: boolean, 
    name?: string, sentence?: string[], meta?: string | number
    subcategories?: [sentence], tests?: {name: string}[], 
    index?: number; order?: number
}

@Injectable({
  providedIn: 'root'
})
export class SentencesService {

    sentenceData: sentence[] = [];

    constructor(private databaseService: DatabaseService) { }

    /**
     * Gets the sentence data from memory or from the database and returns it as an observable...
     * @returns 
     */
    getSentencesDatabase(): Observable<sentence>{
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
            // no instance of the saved data so geta  fresh version.
            return this.databaseService.getSentences('template').pipe(take(1), map(returnData => {
                // add data to the sentenceData array...
                // (this is an array as originally multiple database could be retrieved but then only one...)
                this.sentenceData[0] = returnData.data();
                console.log(this.sentenceData);
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
     * @param route the array of subcategories through the sentenceData array 
     * @param singleStream  whether or not to go down the route only or butterfly out
     * @param data a list of key values to return (i.e. name, sentence etc)
     */
    //  getSentenceData(route: number[], singleStream: boolean, data?: string[]): [sentence[]] {
    //     // route must always start with a 0
    //     route[0] = 0;

    //     let ret: [sentence[]] = [[]];
    //     let sntncData: sentence[] = this.sentenceData;

    //     route.forEach((value: number, routePosition: number) => {                
    //         let subData: sentence[];
    //         let newReturnData: [{}] = [{}];

    //         // check to see if any subroutes exist, and if not create one..
    //         if(Array.isArray(sntncData[value].subcategories)) {
    //             subData = sntncData[value].subcategories;
    //         } else {
    //             sntncData[value].subcategories = [{name: "New"}];
    //             subData = sntncData[value].subcategories;
    //         }
            
    //         // check to see if there is subdata, and if not just use the sentence stem
    //         subData.forEach((dataStem: sentence, index: number) => {
    //             // if a single stream is needed only select the appropriate routes...
    //             if(!singleStream || (route[routePosition+1] === index) || ((routePosition + 1) === route.length)) {
    //                 data.forEach((key: string) => {
    //                     // get the value for the key value pair
    //                     const val: string | boolean | number = (dataStem[key] ? dataStem[key] : undefined);  
    //                     // if it exists add it to the array
    //                     if(val !== undefined) {
    //                         const add = { [key]: val };
    //                         newReturnData[index] = { ...newReturnData[index], ...add};
    //                     }
    //                 })
    //                 const editParameters = { order: routePosition, index: index };
    //                 newReturnData[index] = { ...newReturnData[index], ...editParameters};
    //             }
    //         })
    //         // add the data to the return variable...
    //         // no empty objects...                
    //         ret[routePosition] = newReturnData.filter(stem => Object.keys(stem).length !== 0);
    //         // set the data stream as the subcategories of the first branch...
    //         sntncData = sntncData[value].subcategories;
    //     })
    //     return ret;
    // }


}
