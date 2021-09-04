import { Injectable } from '@angular/core';
import { DocumentSnapshot, QuerySnapshot } from '@angular/fire/firestore';
import { from, Observable, of } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { Student } from '../classes/create-group/create-group.component';
import { DatabaseService } from '../services/database.service';
import { Template } from '../templates/templates.component';

export interface ReportTemplate {
    id: string; name: string; manager: string;
    variables: VariableValues[]; globals: GlobalValues[]; 
    reports: Report[];
}

export interface Report {
    user: Student; template: Template; report: string; generated: number;
}

export interface GlobalValues {
    identifier: string; value: string | number; options: string[]
}

export interface VariableValues {
    identifier: string, key: string, options: string[]
}

@Injectable({
  providedIn: 'root'
})

export class ReportsService {

    reports: ReportTemplate[] = [];

    constructor(private db: DatabaseService) { }

    /**
     * Retrieves all user reports from the database...
     * 
     * todo: add local storage;
     * 
     * @returns 
     */
    getReports(): Observable<ReportTemplate[]> {
        this.reports = [];
        // get from the DB
        return this.db.getReports().pipe(take(1), map((queryResults: QuerySnapshot<ReportTemplate>) => {
            let reportsNew: ReportTemplate[] = [];
            // build the rpeorts...
            queryResults.forEach((report: DocumentSnapshot<ReportTemplate>) => {
                let newReport: ReportTemplate = report.data();
                // add the id...
                newReport.id = report.id;
                // and push tot he main array
                reportsNew.push(newReport);
            })
            // set the variable
            this.reports = reportsNew;
            // set the local sotrage
            this.setlocalStorage(this.reports);
            // return
            return reportsNew;
        }, error => {
            console.log(`Error: ${error}`);
        }))
    }

    /**
     * stores the data in the local storage
     * 
     * @param reports 
     */
    setlocalStorage(reports: ReportTemplate[]): void {
        localStorage.setItem('reports-data', JSON.stringify(reports));
    }

    /**
     * Gets an individual report.
     * @param id 
     * @returns 
     */
    getReport(id: string): Observable<ReportTemplate> {
        if(this.reports.length === 0) {
            // load the reports into the menu
            return this.getReports().pipe(take(1), map((data: ReportTemplate[]) => {
                this.reports = data;
                // return the correct report.
                return this.returnReport(id);
            }, error => {
                console.log(`Error: ${error}`);
            }))
        } else {
            return of(this.returnReport(id));
        }
    }

    /** 
     * Returns a single report from the database...
     * @param id 
     * @returns 
     */
    returnReport(id: string): ReportTemplate {
        let reportIndex = this.reports.findIndex((repo: ReportTemplate) => repo.id === id);
        // and return
        if(reportIndex !== -1) {
            return this.reports[reportIndex];
        }
    }
}
