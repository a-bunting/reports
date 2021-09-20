import { Injectable } from '@angular/core';
import { DocumentReference, DocumentSnapshot, QuerySnapshot } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { Group, Student } from '../classes/create-group/create-group.component';
import { DatabaseService } from '../services/database.service';
import { User } from '../utilities/authentication/user.model';
import { sentence, SentencesService } from './sentences.service';
import { Template } from './templates.service';
import { TemplateTest, Test, TestsService } from './tests.service';

export interface ReportTemplate {
    id: string; name: string; manager: string; templateId: string; groupId: string;
    variables: VariableValues[]; globals: GlobalValues[]; tests: TestValues[];
    keys: string[];
    reports: Report[];
}

export interface FBReportTemplate {
    id: string; name: string; manager: string;  templateId: string; groupId: string;
    variables: any, 
    globals: any; 
    tests: any;
    keys: string[];
    reports: Report[];
}

export interface Report {
    user: Student; template: Template; report: string; generated: number;
}

export interface GlobalValues {
    identifier: string; value: string ; options: string[]
}

export interface VariableValues {
    identifier: string, key: string, value: string, options: string[]
}

// note the firebae alternatives are because firebase does not support multidimensional arrays
export interface TestValues { 
    identifier: string, values: TestIndividualValue[]
}
export interface TestIndividualValue { 
    identifier: string; key: string; value: string, options: string[] 
}

@Injectable({
  providedIn: 'root'
})

export class ReportsService {

    reports: ReportTemplate[] = [];

    constructor(
        private db: DatabaseService,
        private sentenceService: SentencesService,
        private testsService: TestsService  
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
                let newReport: ReportTemplate = this.convertBackToArrays(report.data());
                // add the id...
                newReport.id = report.id;
                // rebuild the arrays :(
                let rebuilt: ReportTemplate = this.convertBackToArrays(newReport);
                
                // and push tot he main array
                // reportsNew.push(newReport);
                reportsNew.push(rebuilt);
            })

            // // this is a test function below to retrieve only the stringified object.
            // queryResults.forEach((report: DocumentSnapshot<any>) => {
            //     let newReport = report.data();
            //     console.log(`new`, newReport);
            //     // let repNew = JSON.parse(newReport);
            //     // add the id...
            //     newReport.id = report.id;
            //     // and push tot he main array
            //     reportsNew.push(newReport);
            // })
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
        let tests: TestValues[] = this.generateTests(template);
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
            groupId: group.id, 
            templateId: template.id,
            name: reportsName, 
            manager: manager, 
            globals: variables[0],
            variables: variables[1],
            tests: tests,
            keys: keys,
            reports: individualReports
        };

        console.log(report);

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
                        // let optionObject = {};

                        // and get the options, if any...
                        while(optionsMatches = optionsRegex.exec(data[1])) {
                            options = optionsMatches[1].split(',');
                            // let options = optionsMatches[1].split(',');
                            
                            // options.forEach((opt: string, l: number) => {
                            //     optionObject[l] = opt;
                            // })
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

    generateTests(template: Template): TestValues[] {
        let testVals: TestValues[] = [];

        template.template.forEach((template: string[]) => {
            // get the sentence data
            let testData: [sentence[]][] = this.sentenceService.getCompoundSentenceData(template, true, ['tests']);
            // loops over all options (need data for it all!)
            testData.forEach((individualOption: [sentence[]]) => {
                // and iterate
                individualOption.forEach((temp: sentence[]) => {
                    // iterate over the results... again!!               
                    temp.forEach((templateInfo: sentence) => {
                        // if tests exist...
                        if(templateInfo.tests) {

                            templateInfo.tests.forEach((test: TemplateTest) => {
                                // check if this test is already added
                                const testIndex = testVals.findIndex((t: TestValues) => test.name === t.identifier);
                                // if not there, add it...
                                if(testIndex === -1) {
                                    // get the test we are intersted in...
                                    let newTest: Test = this.testsService.getTest(test.name);
                                    let testOptions: string[] = newTest.test.options;
                                    // make an array to return...
                                    let testValues: TestValues = {identifier: test.name, values: []};
                                    // iterate over the variables imn the test...
                                    newTest.variables.forEach((test: string) => {
                                        // add the new test to the testvalues array...
                                        testValues.values.push(
                                            {
                                                identifier: test,
                                                key: "", 
                                                value: "", 
                                                options: testOptions ? testOptions : []
                                            }
                                        )
                                    })
                                    testVals.push(testValues);
                                } // else already added
                            })
                        }
                    })
                })
            })
        })
        // and return lol :(
        return testVals;
    }

    // database functions

    /**
     * Updates the report object in the database...
     * @param report 
     * @param reportId 
     * @returns 
     */
    updateReport(report: ReportTemplate, reportId: string): Observable<boolean> {
        // first convert the variables into maps so firebase supports the data type...
        // ALL TYPE HERE IS NULL, SINGLE FUNCTIONS
        // DO NOT USE OUTSIDE OF THIS...
        let reportCopyForFirebase = JSON.parse(JSON.stringify(report));

        let newTests = this.convertTestValuesToObjectArray(reportCopyForFirebase.tests);
        let newGlobals = this.convertGlobalValuesToObjectArray(reportCopyForFirebase.globals);
        let newVariables = this.convertVariableValuesToObjectArray(reportCopyForFirebase.variables);
        let newReports = this.convertTemplateRouteToObjectArray(reportCopyForFirebase.reports);

        reportCopyForFirebase.globals = newGlobals;
        reportCopyForFirebase.variables = newVariables;
        reportCopyForFirebase.tests = newTests;
        reportCopyForFirebase.reports = newReports;

        // call the database function and return true if it succeeds and false if it fails...
        return this.db.updateReport(reportCopyForFirebase, reportId).pipe(take(1), tap(() => {
            // success
            // update the reports structure...
            let reportsContainerId: number = this.reports.findIndex((temp: ReportTemplate) => temp.id === reportId);
            // and set the data based upon the result and then update local storage....
            if(reportsContainerId === -1) {
                // this report isnt on the reports object for some reason, add it...
                this.reports.push(report);
            } else {
                // found it, modify...
                this.reports[reportsContainerId] = report;
            }
            this.setlocalStorage(this.reports);

            return true;
        }, error => {
            console.log(`Error: ${error}`);
            return false;
        }));

    }

    /**
     * Create a new report object in the database, get the id...
     * @param report 
     * @returns 
     */
    createReport(report: ReportTemplate): Observable<DocumentReference> {
         // first convert the variables into maps so firebase supports the data type...
        // ALL TYPE HERE IS NULL, SINGLE FUNCTIONS
        // DO NOT USE OUTSIDE OF THIS...
        let reportCopyForFirebase = JSON.parse(JSON.stringify(report));

        let newTests = this.convertTestValuesToObjectArray(reportCopyForFirebase.tests);
        let newGlobals = this.convertGlobalValuesToObjectArray(reportCopyForFirebase.globals);
        let newVariables = this.convertVariableValuesToObjectArray(reportCopyForFirebase.variables);
        let newReports = this.convertTemplateRouteToObjectArray(reportCopyForFirebase.reports);

        reportCopyForFirebase.globals = newGlobals;
        reportCopyForFirebase.variables = newVariables;
        reportCopyForFirebase.tests = newTests;
        reportCopyForFirebase.reports = newReports;

        // return the observable///
        return this.db.addNewReport(reportCopyForFirebase).pipe(take(1), tap((res: DocumentReference) => {
            // success
            report.id = res.id;
            // add to the other reports.. and update local storage...
            this.reports.push(report);
            this.setlocalStorage(this.reports);
        }, error => {
            console.log(`Error: ${error}`);
            return false;
        }))
    }


    // firebase multidimenional support fucntions :(

    /**
     * Ridiculous multidimensional support sheninigans...
     * @param report 
     * @returns 
     */
    convertBackToArrays(report: FBReportTemplate): ReportTemplate {
        // do the template arrays first...    
        let templateArray = Object.values(report.reports[0].template.template);
        let newTemplateArray: [string[]] = [[]];
        // and sub routes...
        templateArray.forEach((route: {}, i: number) => {
            let newRoute: string[] = Object.values(route);
            if(i === 0) {
                newTemplateArray[0] = newRoute;
            } else {
                newTemplateArray.push(newRoute);
            }
        })
        // place back onto the users...
        report.reports.forEach((temp: Report) => {
            temp.template.template = newTemplateArray;
        });


        // VARIABLES....
        let newVariables: VariableValues[] = Object.values(report.variables);

        newVariables.forEach((usrVariable: VariableValues, i: number) => {
            let varOptions: string[] = Object.values(usrVariable.options);
            newVariables[i].options = varOptions;
        });

        // Globals....
        let newGlobals: GlobalValues[] = Object.values(report.globals);

        newGlobals.forEach((usrGlobal: GlobalValues, i: number) => {
            let varOptions: string[] = Object.values(usrGlobal.options);
            newGlobals[i].options = varOptions;
        });

        // now do the tests...
        let testsObject: TestValues[] = Object.values(report.tests);
        
        testsObject.forEach((test: TestValues, i: number) => {

            let valuesArray: TestIndividualValue[] = Object.values(test.values);

            valuesArray.forEach((individual: TestIndividualValue, s: number) => {
                let optionsArray: string[] = Object.values(individual.options);
                // valuesArray[s].values[s].options = optionsArray;
                valuesArray[s].options = optionsArray;
            })

            test.values = valuesArray;
        });
        
        // rebuild the report...        
        let newReport: ReportTemplate = {
            name: report.name,
            groupId: report.groupId, 
            templateId: report.templateId,
            id: report.id,
            manager: report.manager,
            variables: newVariables,
            globals: newGlobals,
            tests: testsObject,
            keys: report.keys,
            reports: report.reports
        }

        return newReport;
    }

    /**
     * The point of this is to convert the entirety of the tests array into an object
     * 
     * This is aid its storage on firebase which does not support multidimensional arrays.
     * 
     * @param tests 
     * @returns 
     */
    convertTestValuesToObjectArray(tests: TestValues[]): any {
        let returnObject: any = {};
        // iterate over all of the tests
        // use of the any object here liberally used to reduce type errors haxxily and to prevent the need
        // for a bunch of other objects/interfaces which will not use used outside of this function.
        tests.forEach((test: any, i: number) => {
            let valuesObject: any = {};
            // iterate over all of the tests...
            test.values.forEach((testValue: any, s: number) => {
                let testOptions: {} = {};
                testValue.options.forEach((opt: string, t: number) => {
                    testOptions[t] = opt;
                })
                testValue.options = testOptions;
                valuesObject[s] = testValue;
            })
            test.values = valuesObject;
            returnObject[i] = test;
        })
        return returnObject;
    }

    convertGlobalValuesToObjectArray(globals: GlobalValues[]): any {
        let returnObject: any = {};

        globals.forEach((global: any, i: number) => {
            let globalOptions: {} = {};

            global.options.forEach((globalValue: any, s: number) => {
                globalOptions[s] = globalValue;
            })
            global.options = globalOptions;
            returnObject[i] = global;
        })
        return returnObject;
    }

    convertVariableValuesToObjectArray(variables: VariableValues[]): any {
        let returnObject: any = {};

        variables.forEach((variables: any, i: number) => {
            let variablesOptions: {} = {};

            variables.options.forEach((variablesValue: any, s: number) => {
                variablesOptions[s] = variablesValue;
            })
            variables.options = variablesOptions;
            returnObject[i] = variables;
        })
        return returnObject;
    }

    convertTemplateRouteToObjectArray(report: Report[]): any {
        let returnObject: any[] = [...report];
        // get a single template, assume its the same for everyone at this point

        let singleTemplate: any = report[0].template.template;
        let singleReturn: {} = {};
        singleTemplate.forEach((temp: any, i: number) => {
            let route: {} = {};
            temp.forEach((option: string, s: number) => {
                route[s] = option;
            })
            temp = route;
            singleReturn[i] = temp;
        })
        // then place this back onto the reports...
        returnObject.forEach((rep: any) => {
            rep.template.template = singleReturn;
        })
        return returnObject;
    }
}