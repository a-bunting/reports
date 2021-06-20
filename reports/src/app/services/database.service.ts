import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { AuthenticationService } from '../utilities/authentication/authentication.service';
import { AngularFirestore, QuerySnapshot } from '@angular/fire/firestore';
import { User } from '../utilities/auth/user.model';

export interface sentence {
    endpoint?: boolean, starter?: boolean, 
    name?: string, sentence?: string[], meta?: string | number
    subcategories?: [sentence], tests?: {name: string}[], 
    index?: number; order?: number
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

    getSentences(docname: string): Observable<any> {
        return this.firebase.collection('sentences').doc(docname).get();    
    }

    uploadSentences(docname: string, data: sentence): Observable<any> {
        return from(this.firebase.collection('sentences').doc(docname).set(data));
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
        // return this.firebase.collection('users').doc(uid).get().pipe(take(1), map((data: DocumentSnapshot<any>) => {
        //     return {name: data.data().name, email: data.data().email, id: uid};
        // }));
        return this.firebase.collection('users').doc(uid).get();
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
