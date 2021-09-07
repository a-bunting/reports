import { Injectable } from '@angular/core';
import { DocumentSnapshot, QuerySnapshot } from '@angular/fire/firestore';
import { from, Observable, of } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { Group, Student } from '../classes/create-group/create-group.component';
import { DatabaseService } from '../services/database.service';
import { User } from '../utilities/authentication/user.model';
import { SentencesService } from './sentences.service';
import { Template } from './templates.service';

export interface ReportTemplate {
    id: string; name: string; manager: string;
    variables: VariableValues[]; globals: GlobalValues[]; 
    keys: string[];
    reports: Report[];
}

export interface Report {
    user: Student; template: Template; report: string; generated: number;
}

export interface GlobalValues {
    identifier: string; value: string | number; options: string[]
}

export interface VariableValues {
    identifier: string, key: string, value: string, options: string[]
}

@Injectable({
  providedIn: 'root'
})

export class ReportsService {

    reports: ReportTemplate[] = [];

    constructor(
        private db: DatabaseService,
        private sentenceService: SentencesService       
    ) { }

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

    /**
     * Takes a group and a template and parses it into a reports template.
     * @param group 
     * @param template 
     * @returns ReportTemplate
     */
     parseReport(group: Group, template: Template, reportName: string, repotId: string, user: User): ReportTemplate {
        // set the individual components - not needed verbose but for clarity in design phase
        let variables: [GlobalValues[], VariableValues[]] = this.generateVariables(template);
        let individualReports: Report[] = [];
        let reportsName: string = reportName;
        let manager: string = user.id;
        let reportId: string = repotId;
        let keys: string[] = group.keys;

        // parse each of the users into a new report for themselves - this lets us individualise each student
        group.students.forEach((student: Student) => {
            let newReport: Report = {
                user: {...student}, 
                template: {...template},
                report: "",
                generated: Date.now()
            }
            // and push to the main reports
            individualReports.push(newReport);
        })

        // and build the report itself...
        let report: ReportTemplate = {
            id: reportId, 
            name: reportsName, 
            manager: manager, 
            globals: variables[0],
            variables: variables[1],
            keys: keys,
            reports: individualReports
        };

        return report;

    }

    generateVariables(template: Template): [GlobalValues[], VariableValues[]] {
        let globals: GlobalValues[] = [];
        let variables: VariableValues[] = [];
        let splitRegex: RegExp = new RegExp('\\$\\{(.*?)\\}\\$', 'g');
        let duplicates: string[] = [];

        // look through the template for any globals that might be needed...
        template.template.forEach((section: string[]) => {
            this.sentenceService.generateSentenceOptions(section).forEach((option: {sentence: string, depth: number, delete: boolean}) => {
                
                let typeMatches: RegExpExecArray;
                // get the values form the sentence that are between ${brackets}$ and put them in values
                while(typeMatches = splitRegex.exec(option.sentence)) { 
                    let exists = duplicates.findIndex((temp: string) => temp === typeMatches[1]);
                    // test if its already been identified and if not, push onto the array
                    if(exists === -1) {
                        // duplicates array used to ensure no doubles...
                        duplicates.push(typeMatches[1]);

                        // find if its a global or variable
                        let data: string[] = typeMatches[1].split('|');

                        // get any options options (surrounded by [ ] separated by ,)
                        let optionsRegex: RegExp = new RegExp('\\[(.*?)\\]', 'g');
                        let optionsMatches: RegExpExecArray;
                        let options: string[] = [];

                        // and get the options, if any...
                        while(optionsMatches = optionsRegex.exec(data[1])) {
                            options = optionsMatches[1].split(',');
                        }

                        // finally build the variable to put into the reports array
                        let newVariable: GlobalValues | VariableValues;
                        let identifier: string = data[1].split('[')[0];

                        switch(data[0]) {
                            case 'g':
                                // this is a global values
                                newVariable = { identifier: identifier, value: "", options: options};
                                globals.push(newVariable);
                                break;
                            case 'v':
                                // this is a variable value (assume no |, or should I add v|??)
                                newVariable = { identifier: identifier, key: "", value: "", options: options};
                                variables.push(newVariable);
                                break;
                        }
                    }
                }
            })
        })
        // return both arrays...
        return [globals, variables];
    }
}
