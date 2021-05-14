import { Injectable } from '@angular/core';
import { blockTemplate } from '../templates/templates.component'; // defined in templates
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})


export class DatabaseService {

  constructor(private http: HttpClient) { }

    getSentences(): blockTemplate[] {
        let returnTemplate: blockTemplate[];
        // get the templates relevant to this user.

        this.http.get('https://reports-be41b-default-rtdb.europe-west1.firebasedatabase.app/sentences.json')
        .pipe(map(responseData => {
            // transform the data into a more usable format...
            const dataFormatted = this.recursiveArray(responseData);
            return dataFormatted;
        }))
        .subscribe(data => {
            console.log(data[0][0]);
        })

        return returnTemplate;
    }

    recursiveArray(data) {
        let sentencesArray = [];
        for(const keys in data) {

            // console.log(data[keys]);

            if(data[keys].length > 1) {
                sentencesArray.push(this.recursiveArray(keys));
            } else {
                sentencesArray.push(data[keys], keys);
            }
        }
        return sentencesArray;
    }

    getTemplate(): blockTemplate {
        let returnTemplate: blockTemplate;
        // get the requested template

        return returnTemplate;
    }

    storeNewTemplate(template: blockTemplate) {
        this.http.post(
            'https://reports-be41b-default-rtdb.europe-west1.firebasedatabase.app/templates.json', 
            template
        )
        .subscribe(posts => {
            
        });
    }

}
