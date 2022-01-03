import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { AuthenticationService } from '../utilities/authentication/authentication.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { User } from '../utilities/authentication/user.model';
import { sentence } from './sentences.service';
import { Group } from 'src/app/services/groups.service';
import { TemplateDB } from '../services/templates.service';
import { ReportTemplate } from './reports.service';
import { BugReport } from '../utilities/bugreport/bugreport.component';
import { DocumentReference } from 'rxfire/firestore/interfaces';

@Injectable({
  providedIn: 'root'
})

export class DatabaseService {

    private user: User;

    constructor(private auth: AuthenticationService, private firebase: AngularFirestore) { 
        // subscribe to the user details;
        auth.user.subscribe((user: User) => {
            this.user = user;
        });
    }
    
    // basic things to record basic data. To estimate firebase costs.
    statWrite: number = 0;
    statRead: number = 0;
    public getWrites(): number { return this.statWrite; }
    public getReads(): number { return this.statRead; }
    // after a database change, refresh their token...
    readOperation(reads: number = 1): void { this.statRead+=reads; }
    writeOperation(writes: number = 1): void { this.statWrite+=writes; }

    // SENTENCES
    // database connections with angular firestore
    // name makes them explanatory - all return observables.
    getSentences(docname: string): Observable<any> {
        this.readOperation();
        return this.firebase.collection('sentences').doc(docname).get();    
    }

    uploadSentences(docname: string, data: sentence): Observable<any> {
        this.writeOperation();
        return from(this.firebase.collection('sentences').doc(docname).set(data));
    }

    updateTemplateData(): Observable<any> {
        this.writeOperation();
        return from(this.firebase.collection('appdata').doc('onload').update({sentenceDbUpdated: new Date().getTime()}));
    }

    getAppData(): Observable<any> {
        this.readOperation();
        return from(this.firebase.collection('appdata').doc('onload').get());
    }

    // USERNAME
    getUserName(uid: string): Observable<any> {
        this.readOperation();
        return this.firebase.collection('users').doc(uid).get();
    }

    modifyUserData(userid: string, data: {}): Observable<any> {
        this.writeOperation();
        return from(this.firebase.collection('users').doc(userid).update(data));
    }

    // GROUPS
    /**
     * Get all the groups this user is a part of
     * @returns Observable<QuerySnapshot<any>> to subscribe to...
     */
    getGroups(uid?: string): Observable<any> {
        this.readOperation();
        const userId: string = uid ?? this.user.id;
        return this.firebase.collection('group', grp => grp.where('managers', 'array-contains', userId)).get();
    }

    createGroup(data: Group): Observable<any> {
        this.writeOperation();
        return from(this.firebase.collection('group').add(data));
    }

    modifyGroup(data: Group, id: string): Observable<any> {
        this.writeOperation();
        return from(this.firebase.collection('group').doc(id).update(data));
    }

    deleteGroup(id: string): Observable<any> {
        this.writeOperation();
        return from(this.firebase.collection('group').doc(id).delete());
    }

    // TEMPLATES
    getTemplates(uid?: string): Observable<any> {
        this.readOperation();
        const userId: string = uid ?? this.user.id;
        return this.firebase.collection('templates', template => template.where('manager', '==', userId) || template.where('open','==', true)).get();
    }

    
    getTemplate(id: string): Observable<any> {
        this.readOperation();
        return this.firebase.collection('templates').doc(id).get();
    }

    addTemplate(data: TemplateDB): Observable<any> {
        this.writeOperation();
        return from(this.firebase.collection('templates').add(data))
    }

    updateTemplate(data: TemplateDB, id: string): Observable<any> {
        this.writeOperation();
        return from(this.firebase.collection('templates').doc(id).update(data));
    }

    deleteTemplate(id: string): Observable<any> {
        this.writeOperation();
        return from(this.firebase.collection('templates').doc(id).delete());
    }

    // REPORTS //
    getReports(uid?: string): Observable<any> {
        this.readOperation();
        const userId: string = uid ?? this.user.id;
        return this.firebase.collection('reports', report => report.where('manager', '==', userId)).get();
    }

    getReport(id: string): Observable<any> {
        this.readOperation();
        return this.firebase.collection('reports').doc(id).get();
    }

    updateReport(data: {}, id: string): Observable<any> {
        this.writeOperation();
        
        return from(this.firebase.collection('reports').doc(id).update({...data, lastUpdated: Date.now()}));
    }

    addNewReport(data: ReportTemplate): Observable<any> {
        this.writeOperation();
        return from(this.firebase.collection('reports').add(data));
    }

    deleteReport(id: string): Observable<any> {
        this.writeOperation();
        return from(this.firebase.collection('reports').doc(id).delete());
    }

    // bug report stuff...
    addBugReport(report: BugReport): Observable<any> {
        // add to the database...
        this.writeOperation();
        return from(this.firebase.collection('bugreports').add(report));
    }

    getAllBugReports(): Observable<any> {
        this.readOperation();
        return this.firebase.collection('bugreports').get();
    }
    
    getIncompletedBugReports(): Observable<any> {
        this.readOperation();
        return this.firebase.collection('bugreports', report => report.where('addressed', '==', false)).get();
    }

    updateBugReport(documentId: string, status: boolean): Observable<any> {
        this.writeOperation();
        return from(this.firebase.collection('bugreports').doc(documentId).update({'addressed': status}));
    }

}


