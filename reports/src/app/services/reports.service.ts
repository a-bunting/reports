import { Injectable } from '@angular/core';
import { DocumentReference, DocumentSnapshot, QuerySnapshot } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { GroupsService, Student, Group } from 'src/app/services/groups.service';
import { DatabaseService } from '../services/database.service';
import { User } from '../utilities/authentication/user.model';
import { sentence, SentencesService } from './sentences.service';
import { Template, TemplatesService } from './templates.service';
import { TemplateTest, Test, TestOptions, TestsService, TestVariable } from './tests.service';

export interface ReportTemplate {
    id: string; name: string; manager: string; templateId: string; groupId: string; lastUpdated: number;
    variables: VariableValues[]; globals: GlobalValues[]; tests: TestValues[];
    keys: string[];
    reports: Report[];
}

export interface FBReportTemplate {
    id: string; name: string; manager: string;  templateId: string; groupId: string;
    variables: any; lastUpdated: number;
    globals: any; 
    tests: any;
    keys: string[];
    reports: Report[];
}

export interface Report {
    userId: string, user: Student; template: Template; report: string; generated: number;
}

export interface GlobalValues {
    identifier: string; value: string ; options: string[]
}

export interface VariableValues {
    identifier: string, key: string, value: string, options: string[]
}

export interface TestValues { 
    identifier: string, settings?: { name: string; value: TestOptions; options: TestOptions[] }, values: TestIndividualValue[]
}

export interface TestIndividualValue { 
    identifier: string; name: string; key: string; value: string, options: string[] 
}

@Injectable({
  providedIn: 'root'
})

export class ReportsService {

    reports: ReportTemplate[] = [];

    constructor(
        private db: DatabaseService,
        private sentenceService: SentencesService,
        private testsService: TestsService,
        private groupsService: GroupsService, 
        private templateService: TemplatesService
    ) { }

    /**
     * Retrieves all user reports from the database...
     * todo: add local storage;
     * @returns 
     */
    getReports(forcedFromDatabase: boolean = false): Observable<ReportTemplate[]> {
        this.reports = [];

        // if the data exists locally, grab it!
        if(localStorage.getItem('reports-data') !== null && forcedFromDatabase === false) {
            // retrieve the data from local storage and parse it into the templates data...
            this.reports = JSON.parse(localStorage.getItem('reports-data'));               
            // set the data on the display
            // and return the data array...
            return of(this.reports).pipe(take(1), tap(returnData => { return returnData; }));
        } else {
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
                // set the variable
                this.reports = reportsNew;
                // set the local sotrage
                this.setlocalStorage(this.reports);
                return reportsNew;
            }, error => {
                console.log(`Error: ${error}`);
            }))
        }
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
     parseReport(groupId: string, templateId: string, reportName: string, repotId: string, user: User): ReportTemplate {
        // set the individual components - not needed verbose but for clarity in design phase
        let template: Template = this.templateService.getTemplate(templateId);
        let variables: [GlobalValues[], VariableValues[]] = this.generateVariables(template);
        let tests: TestValues[] = this.generateTests(template);
        let individualReports: Report[] = [];
        let reportsName: string = reportName;
        let manager: string = user.id;
        let reportId: string = repotId;
        
        let group: Group;
        this.groupsService.getGroup(groupId).subscribe((grp: Group) => { group = grp; });

        let keys: string[] = group.keys;

        // parse each of the users into a new report for themselves - this lets us individualise each student
        group.students.forEach((student: Student) => {
            let newReport: Report = {
                userId: student.id,
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
            reports: individualReports,
            lastUpdated: Date.now()
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
                                    let testValues: TestValues = {identifier: test.name, values: []};

                                    // if default settings are required then set those up here...
                                    if("settings" in newTest) {
                                        let settings: { name: string; value: TestOptions; options: TestOptions[] } = 
                                        {
                                            name: newTest.settings.name,
                                            value: { name: "", options: {}}, 
                                            options: newTest.settings.options
                                        }
                                        // default options apply...
                                        testValues.settings = settings;
                                    }

                                    let testOptions: string[];

                                    if(newTest.settings.options.length === 1) {
                                        testOptions = Object.values(newTest.settings.options[0].options);
                                    } else {
                                        testOptions = newTest.test.options;
                                    }

                                    // make an array to return...
                                    // iterate over the variables imn the test...
                                    newTest.variables.forEach((test: TestVariable) => {
                                        // add the new test to the testvalues array...
                                        testValues.values.push(
                                            {
                                                identifier: test.identifier,
                                                name: test.name,
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
     * Deletes a report from the database...
     * @param id 
     * @returns 
     */
    deleteReport(id: string): Observable<boolean> {
        return this.db.deleteReport(id).pipe(take(1), tap(() => {
            // remove from the local storage also..
            let repoIndex: number = this.reports.findIndex((temp: ReportTemplate) => temp.id === id);

            if(repoIndex !== -1) {
                // delete from the db, doesnt inform the caller of the error though and it will stay in local database.
                this.reports.splice(repoIndex, 1);
                this.setlocalStorage(this.reports);
            }
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
            reports: report.reports, 
            lastUpdated: report.lastUpdated
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

    /**
     * REPORT GENERATION
     */
    testExecutability(reportdocument: ReportTemplate): boolean {
        let execute: { global: boolean, variables: boolean, tests: boolean} = { global: true, variables: true, tests: true};
        // check global values have been set
        reportdocument.globals.every((global: GlobalValues) => {
            execute.global = (global.value === "" ? false : true);
            return (execute.global === true) ? true : false;
        })
        // check variables have a key assigned to them
        reportdocument.variables.every((variable: VariableValues) => {
            execute.variables = (variable.key === "" ? false : true);
            return (execute.variables === true) ? true : false;
        })
        reportdocument.tests.forEach((test: TestValues) => {
            // each variable one ach TEST needs a key
            test.values.every((test: TestIndividualValue) => {
                execute.tests = (test.key === "" ? false : true);
                return (execute.tests === true ?  true : false);
            })
        })

        // if any are false this will return false;
        return (execute.global && execute.variables && execute.tests);
    }

    /**
     * Takes a report documnet and converts all reports into readable progress reports.
     * @param reportDocument 
     * @returns 
     */
    generateBatchReports(reportDocument: ReportTemplate): ReportTemplate {
        // this is where the magic happens :-)
        let globalVariables: GlobalValues[] = reportDocument.globals;
        let variableVariables: VariableValues[] = reportDocument.variables;
        let testVariables: TestValues[] = reportDocument.tests;

        // ITERATE Over all reports...
        reportDocument.reports.forEach((individualReport: Report) => {
            // generate a report for this user...
            individualReport.report = this.generateIndividualReports(individualReport, globalVariables, variableVariables, testVariables);
        })

        // return the original modified reportdocument.
        return reportDocument;
    }



    /**
     * Takes a single report interface object and uses data from the template to generate a report...
     * gender defaults to they/them/their if no gender is submitted.
     * @param report 
     * @param reportDocument 
     * @returns 
     */
    generateIndividualReports(report: Report, globals: GlobalValues[], variables: VariableValues[], tests: TestValues[]): string {

        // get the gender if it exists...
        let genderIndex: number = variables.findIndex((test: TestIndividualValue) => test.identifier === "Gender");
        let gender: "m"|"f"|"p" = "p";
        // if it exists then reassign else leave it as p (plural!)
        if(genderIndex !== -1) {
            gender = report.user[variables[genderIndex].key];
        }

        // first we need a sentence structure generated for this template.
        let template: Template = report.template;
        let minCharacters: number = template.characters.min;
        let maxCharacters: number = template.characters.max;
        let sentenceOptionsTested: string[] = this.sentenceService.newTestSentenceOptionCreator(template.template, report.user, tests);

        // trim down to the sentences which match the character range...
        sentenceOptionsTested.filter((sentence: string) => sentence.length >= minCharacters && sentence.length <= maxCharacters);
        // select a random value to pick at random a sentence from the options avaikable
        let randomValueForSelect: number = Math.floor(Math.random() * sentenceOptionsTested.length);
        let reportUnSubstituted: string = sentenceOptionsTested[randomValueForSelect];

        // now sub in values
        globals.forEach((global: GlobalValues) => { reportUnSubstituted = this.valuesSubstitute(reportUnSubstituted, 'g\\|'+global.identifier, global.value); })
        variables.forEach((variable: VariableValues) => { reportUnSubstituted = this.valuesSubstitute(reportUnSubstituted, 'v\\|'+variable.identifier, report.user[variable.key]); })

        // return selected sentence
        return this.substitutions(reportUnSubstituted, gender);
    }

    /**
     * Runs the grammar check functions.
     * Sometimes this is not going to be super smart.
     * @param report 
     * @returns 
     */
    substitutions(report: string, gender: "m" | "f" | "p"): string {
        report = this.anOrA(report);
        report = this.sentenceCase(report);
        report = this.repeatCharacterRemoval(report);
        // gender transform...
        report = this.genderConversion(report, gender);
        // optional words - must come after grammar check as the style of writing i the same and pickaword will choos eat random
        report = this.pickAWord(report);
        // finally remove the whitespace;
        report = this.removeWhiteSpace(report);
        return report;
    }

    /**
     * Substitutes variables into the text...
     * @param report 
     * @param substitution 
     * @param value 
     * @returns 
     */
    valuesSubstitute(report: string, substitution: string, value: string): string {
        // first if there is a (notation) then escape it so it works properly...
        substitution = substitution.replace(/[()]/g, '\\$&');
        // then get to replacing text!
        let strReplace = new RegExp('\\$\\{('+substitution+')+(\\[.*?])?\\}\\$', 'gi');
        let regExData: string[];

        while((regExData = strReplace.exec(report)) !== null) {
            report = report.replace(regExData[0], value);
        }

        return report;
    }

    /**
     * Dea with gender values...
     * @param report 
     * @param gender 
     * @returns 
     */
    genderConversion(report: string, gender: "m"|"f"|"p"): string {
        let genderUnique: string = gender.toLowerCase();
        let genderIndex: number = (genderUnique === "m" ? 0 : genderUnique === "f" ? 1 : 2);
        let strReplace = new RegExp('\\$\\{(gn\\|(.*?)/(.*?)/(.*?))+(\\[.*?])?\\}\\$', 'gi');

        // wil;l this only work once??????? :S
        let regexData: string[];

        while((regexData = strReplace.exec(report)) !== null) {
            report = report.replace(regexData[0], regexData[2+genderIndex]);
        }

        // return
        return report;
    }

    /**
     * If multiple optionsal words exist in a bracket notation [this/that]
     * then this function will randomly select one of the words.
     * @param report 
     * @returns 
     */
    pickAWord(report: string): string {
        let strReplace = new RegExp('\\[(.*?)\\]', 'gi');
        let regExData: string[];

        while((regExData = strReplace.exec(report)) !== null) {
            let options: string[] = regExData[1].split('/');
            let randomValue: number = Math.floor(Math.random() * options.length);
            report = report.replace(regExData[0], options[randomValue]);
        }

        return report;
    }

    /**
     * Is it an AN or an A.
     * RULES: If the next word is a CONSONANT then its A, if its a VOWEL then its AN.
     * 90% of the time this will be followed by a grade!
     * @param report 
     * @returns 
     */
    anOrA(report: string): string {
        let strReplace = new RegExp('\\[AnOrA\\]+(.*)?', 'gi');
        let regExData: string[];        
        
        while((regExData = strReplace.exec(report)) !== null) {
            // not quite working yet
            let choice: string = (regExData[1].trimStart())[0].toLowerCase() === ("a"||"e"||"i"||"o"||"u") ? "an" : "a";
            let newStr: string = regExData[0].replace("[AnOrA]", choice);
            report = report.replace(regExData[0], newStr);
        }
        return report;
    }

    /**
     * Tidies up any sentence case issues.
     * - Put a . at the end if there isnt one. 
     * - Put a space after a . and capitalise the first letter
     * - Capitalise the first letter of the whoole thing.
     * 
     * @param report 
     * @returns 
     */
    sentenceCase(report: string): string {
        let uppered: string = report;
        let sentences: string[] = uppered.split('.');
        // each sentence should have a capital letter...
        sentences.forEach((sentence: string) => {
            sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
        })
        // make sure there is a . at the end
        uppered.charAt(report.length - 1) !== '.' ? uppered += '.' : null;
        // return
        return uppered;
    }

    /**
     * Removes whitespace at the start and end of the text
     * strips any double whitespaces
     * removes whitespace right before a , or a .
     * @param report 
     * @returns 
     */
    removeWhiteSpace(report: string): string {
        // get rid of multiple whitespaces...
        report = report.trim().replace(/\s\s+/g, '');
        // ensure there is also a whitespace after a fullstop or a comma...
        let sentences: string[] = report.split('.');

        // remove all whitespace within the sentences, at the start and end of the . and , structures...
        sentences.forEach((sentence: string) => {
            // then split into commas...
            let sections: string[] = sentence.split(',');
            
            sections.forEach((section: string, i: number) => {
                section.trim();
                // if its the end of the sentence use a full stop, optherwise use a comma and space...
            })
        })        // recombined.replace(' +/gi', ' ');

        return report;
    }

    repeatCharacterRemoval(report: string): string {
        let chars: string[] = [',','.',',.','.,'];
        
        chars.forEach((char: string) => {

            let regEx: RegExp = new RegExp('['+char+']{2,10}', 'gi');
            let regExString: string[];

            while((regExString = regEx.exec(report)) !== null) {
                report = report.replace(regExString[0], char[0]);
            }


        })
        
        return report;
    }
}