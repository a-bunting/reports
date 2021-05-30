import { Injectable } from '@angular/core';
import { blockTemplate } from '../templates/templates.component'; // defined in templates
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../utilities/auth/auth.service';
import { exhaustMap, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

/**
{
    "name": "sentences",
    "endpoint": true, 
    "starter": true, 
    "sentence": "", 
    "meta": 0,
    "subCategories" : [

    ]
}
**/

export interface sentence {
    endpoint?: boolean, starter?: boolean, 
    name: string, sentence?: string, meta?: string | number
    subCategories: [sentence], tests?: [test]
}

export interface test {
    comparison: string, function: string
}

@Injectable({
  providedIn: 'root'
})

export class DatabaseService {

  constructor(private http: HttpClient, private authService: AuthService) { }

    getSentences(): Observable<any> {
        return this.http.get('https://reports-be41b-default-rtdb.europe-west1.firebasedatabase.app/sentences/0/subCategories.json');
    }

    recursiveArray(data) {
        let sentencesArray: sentence;
        for(const keys in data) {
            
        }
        return data;
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
