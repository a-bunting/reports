import { Injectable } from '@angular/core';
import { blockTemplate } from '../templates/templates.component'; // defined in templates
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../utilities/auth/auth.service';
import { catchError, map, take, tap } from 'rxjs/operators';
import { from, Observable, throwError } from 'rxjs';
import { AuthenticationService } from '../utilities/authentication/authentication.service';
import { AngularFirestore, QuerySnapshot, DocumentSnapshot } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';
import { User } from '../utilities/auth/user.model';

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

    private user: User;

    constructor(private auth: AuthenticationService, private http: HttpClient, private firebase: AngularFirestore) { 
        // subscribe to the user details;
        auth.user.subscribe((user: User) => {
            this.user = user;
        });
    }

    getSentences(): Observable<any> {
        return this.http.get('https://reports-be41b-default-rtdb.europe-west1.firebasedatabase.app/sentences/0/subCategories.json');
    }

    /**
     * Get all the groups this user is a part of
     * @returns Observable<QuerySnapshot<any>> to subscribe to...
     */
    getGroups(): Observable<QuerySnapshot<any>> {
        const userId = this.user.id;
        return this.firebase.collection('group', grp => grp.where('managers', 'array-contains', this.firebase.collection('users').doc(userId).ref)).get();
    }

    getUserName(uid: string): Observable<any> {
        return this.firebase.collection('users').doc(uid).get().pipe(take(1), tap((data: DocumentSnapshot<any>) => {
            return {name: data.data().name, email: data.data().email, id: uid};
        }));
    }

    // getTemplate(): blockTemplate {
    //     let returnTemplate: blockTemplate;
    //     // get the requested template

    //     return returnTemplate;
    // }

    // storeNewTemplate(template: blockTemplate) {
    //     this.http.post(
    //         'https://reports-be41b-default-rtdb.europe-west1.firebasedatabase.app/templates.json', 
    //         template
    //     )
    //     .subscribe(posts => {
            
    //     });
    // }

}
