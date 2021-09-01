import { Injectable, OnChanges, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { AuthenticationService } from '../utilities/authentication/authentication.service';
import { AngularFirestore, DocumentSnapshot, QuerySnapshot } from '@angular/fire/firestore';
import { User } from '../utilities/authentication/user.model';
import { sentence } from './sentences.service';
import { Group, Student } from '../classes/create-group/create-group.component';
import { TemplateDB } from '../templates/templates.component';
import { ReportTemplate } from './reports.service';

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
    
    // basic things to record basic data. To estimate firebase costs.
    statWrite: number = 0;
    statRead: number = 0;
    public getWrites(): number { return this.statWrite; }
    public getReads(): number { return this.statRead; }
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

    // USERNAME
    getUserName(uid: string): Observable<any> {
        this.readOperation();
        return this.firebase.collection('users').doc(uid).get();
    }

    // GROUPS
    /**
     * Get all the groups this user is a part of
     * @returns Observable<QuerySnapshot<any>> to subscribe to...
     */
    getGroups(): Observable<any> {
        this.readOperation();
        return this.firebase.collection('group', grp => grp.where('managers', 'array-contains', this.user.id)).get();
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
    getTemplates(): Observable<any> {
        this.readOperation();
        return this.firebase.collection('templates', template => template.where('manager', '==', this.user.id) || template.where('open','==', true)).get();
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
    getReports(): Observable<any> {
        this.readOperation();
        return this.firebase.collection('reports', report => report.where('manager', '==', this.user.id)).get();
    }

    getReport(id: string): Observable<any> {
        this.readOperation();
        return this.firebase.collection('reports').doc(id).get();
    }

    updateReport(data: ReportTemplate, id: string): Observable<any> {
        this.writeOperation();
        return from(this.firebase.collection('reports').doc(id).update(data));
    }

    addNewReport(data: ReportTemplate): Observable<any> {
        this.writeOperation();
        return from(this.firebase.collection('reports').add(data));
    }

    deleteReport(id: string): Observable<any> {
        this.writeOperation();
        return from(this.firebase.collection('reports').doc(id).delete());
    }

}
