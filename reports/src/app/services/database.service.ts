import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { AuthenticationService } from '../utilities/authentication/authentication.service';
import { AngularFirestore, QuerySnapshot } from '@angular/fire/firestore';
import { User } from '../utilities/authentication/user.model';
import { sentence } from './sentences.service';
import { Group, Student } from '../classes/create-group/create-group.component';

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
        return this.firebase.collection('group', grp => grp.where('managers', 'array-contains', this.user.id)).get();
    }

    createGroup(data: Group): Observable<any> {
        return from(this.firebase.collection('group').add(data));
    }

    modifyGroup(data: Group, id: string): Observable<any> {
        return from(this.firebase.collection('group').doc(id).update(data));
    }

    deleteGroup(id: string): Observable<any> {
        return from(this.firebase.collection('group').doc(id).delete());
    }

    getUserName(uid: string): Observable<any> {
        // return this.firebase.collection('users').doc(uid).get().pipe(take(1), map((data: DocumentSnapshot<any>) => {
        //     return {name: data.data().name, email: data.data().email, id: uid};
        // }));
        return this.firebase.collection('users').doc(uid).get();
    }

    getTemplates(): Observable<any> {
        return this.firebase.collection('templates', template => template.where('manager', '==', this.user.id) || template.where('open','==', true)).get();
    }

}
