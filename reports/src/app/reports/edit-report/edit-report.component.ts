import { Component, HostListener, OnInit } from '@angular/core';
import { GroupsService, Group, Student } from 'src/app/services/groups.service';
import { TemplatesService, Template } from 'src/app/services/templates.service';
import { GlobalValues, Report, ReportsService, ReportTemplate, TestIndividualValue, TestValues, VariableValues } from 'src/app/services/reports.service';
import { Observable, Subscription, zip } from 'rxjs';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { User } from 'src/app/utilities/authentication/user.model';
import { AuthenticationService } from 'src/app/utilities/authentication/authentication.service';
import { sentence, SentencesService } from 'src/app/services/sentences.service';
import { map, take } from 'rxjs/operators';
import { TemplateTest, Test, TestOptions, TestsService, TestVariable } from 'src/app/services/tests.service';
import { DocumentReference } from '@angular/fire/firestore';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-edit-report',
  templateUrl: './edit-report.component.html',
  styleUrls: ['./edit-report.component.scss']
})
export class EditReportComponent implements OnInit {

    // group data
    groups: Group[] = [];
    loadedGroup: string;

    // templates data
    templates: Template[] = [];

    // parameters and loading individual report sets
    paramObservable: Subscription;

    // user object
    user: User;

    // design things
    sticky: IntersectionObserver;

    // view booleans
    isLoading: boolean = false;

    constructor(
        private auth: AuthenticationService, 
        private activeRouter: ActivatedRoute, 
        private router: Router, 
        private reportsService: ReportsService, 
        private groupService: GroupsService, 
        private templatesService: TemplatesService, 
        private sentenceService: SentencesService, 
        private testsService: TestsService, 
        private titleService: Title
    ) { }

    ngOnInit(): void {
        this.isLoading = true;
        // get the user info...
        this.auth.user.subscribe((user: User) => {
            // set the user id
            this.isLoading = false;
            this.user = user;

            // load all data first - this is important to be done first so when the parameters fire
            // the data is all there and able to be accessed.
            this.loadData().subscribe(([groups, templates, sentences]) => {
                this.groups = groups;
                this.templates = templates;
                
                // monitor the parameter id in the URL and if it changes reload the data...
                this.paramObservable = this.activeRouter.params.subscribe((params: Params) => {
                    let reportId: string = params.id;
                    // set the id and load the template
                    this.isLoading = true;
                    // and load as appropriate...
                    if(reportId !== undefined) {
                        this.reportSaved = true;
                        this.loadReport(reportId);
                    } else {
                        this.reportSaved = false;
                        this.newReport();
                    }
                }, error => { console.log(`Error: ${error}`); });
            }, error => { console.log(`Error: ${error}`); })
        })

        // toggle different styloes for when things get stuck.
        this.sticky = new IntersectionObserver(([e]) => {
            e.target.toggleAttribute('stuck', e.intersectionRatio < 1)
        }, { threshold: [1] });
        this.sticky.observe(document.getElementsByClassName('sticky').item(0));

        
    }

    setTitle(newTitle: string): void {
        this.titleService.setTitle(newTitle);
    }

    /**
     * listen for the escape key press to make any tempory changes go away!
     * @param event 
     */
    @HostListener('document:keydown.escape', ['$event']) onEscapeKeyPress(event: KeyboardEvent) {
        this.dragging = false;
    }

    isUpdating: boolean = false;
    isSaving: boolean = false;
    errorMessage: string;

    /**
     * Updates a current report in the database...
     */
    updateReport(): void {
        this.isUpdating = true;
        // call the update function in the report service.
        this.reportsService.updateReport(this.report, this.report.id).subscribe((result: boolean) => {
            if(result === true) {
                // success!
                this.isUpdating = false;
                this.reportSaved = true;
                this.unsavedChanges = false;
            }
            this.isUpdating = false;
        }, error => {
            this.errorMessage = "Update failed: " + error;
            this.isUpdating = false;
        })
    }

    /**
     * Saves a new report to the database.
     */
    saveToDatabase(): void {
        this.isSaving = true;
        // call the save function in the report service...
        this.reportsService.createReport(this.report).subscribe((result: DocumentReference) => {
            // success, set the new id...
            this.report.id = result.id;
            // set the flags to control button visibility.
            this.unsavedChanges = false;
            this.reportSaved = true;
            this.isSaving = false;
            this.router.navigate(['/reports/edit-report/', this.report.id]);
        }, error => {
            console.log(`Unable to save: ${error}`);
            this.reportSaved = false;
            this.isSaving = false;
        })
    }

    /**
     * Load all required data, including groups and templates data...
     * @returns 
     */
    loadData(): Observable<[Group[], Template[], sentence]> {
        // load groups and templates concurrently then act
        let loadGroups = this.groupService.getGroups().pipe(take(1), map((result: Group[]) => { return result; }));
        let loadTemplate = this.templatesService.getTemplates().pipe(take(1), map((result: Template[]) => { return result; }));
        let loadSentence = this.sentenceService.getSentencesDatabase().pipe(take(1), map((result: sentence) => { return result; }));
        // and return them at the same time...
        return zip(loadGroups, loadTemplate, loadSentence);
    }


    groupsSelected: string[] = [];

    selectGroup(id: string, value: boolean): void {
        // find if this is selected or not...
        const groupIndex: number = this.groupsSelected.findIndex((temp: string) => temp === id);
        // then do something appropriate with the data
        if(groupIndex !== -1) {
            if(value === false) { this.groupsSelected.splice(groupIndex, 1); }
        } else {
            if(value === true) { this.groupsSelected.push(id); }
        }
    }

    // need works on keys
    loadGroupsFromSelection(): void {
        // start by getting the groups from the database, as we need to do keys first then users...
        // get the keys already in the db...
        let keys: string[] = [...this.report.keys];
        let students: Student[] = [];

        // prepopulate with the current students...
        this.report.reports.forEach((repo: Report) => {
            students = [...students, repo.user];
        })

        // for each group in the selected array import those students into the system.
        this.groupsSelected.forEach((groupId: string) => {
            // get the group from the database....
            this.groupService.getGroup(groupId).subscribe((data: Group) => {
                // get the students
                students = [...students, ...data.students];
                // get the keys and remove duplicated
                keys = [...keys, ...data.keys].filter((value: string, index: number, restOfArray: string[]) => restOfArray.indexOf(value) === index);
            });
        }); 

        // add any new keys... assume keys with the same value are the same thing
        keys.forEach((key: string) => {
            if(!this.report.keys.includes(key)) {
                this.report.keys.push(key);
            }
        })

        // create a constant with the template, ready to input to new user reports...
        const repoTemplate: Template = this.report.templateId ? this.templatesService.getTemplate(this.report.templateId) : undefined;

        // and add the students
        students.forEach((student: Student) => {
            // find if the student already existsw...
            const studentIndex: number = this.report.reports.findIndex((report: Report) => report.user.id === student.id);
            
            // if not add them...
            if(studentIndex === -1) {
                // not found this student yet so its a new addition...
                const newReport: Report = {
                    userId: student.id, 
                    user: student, 
                    templateId: repoTemplate.id, 
                    report: "", 
                    generated: undefined
                }
                // checka all the keys have a value for this user and if not set it as blank...
                this.report.keys.forEach((key: string) => {
                    if(!(key in newReport.user.data)) {
                        newReport.user.data[key] = "";
                    }
                })
                // and add to the array....
                this.report.reports.push(newReport);
            } else {
                // select the report from the database...
                let report: Report = this.report.reports[studentIndex];

                keys.forEach((key: string) => {
                    // check to see if the key already exists ont he user data object
                    if(key in report.user.data) {
                        // the key exists, check if its been defined...
                        if(student.data[key] !== undefined) {
                            // if it has a value check if its a different value, and if it is put both in divided by a /
                            report.user.data[key] = (report.user.data[key] === student.data[key] ? report.user.data[key] : report.user.data[key] += '/' + student.data[key]);
                        }
                    } else {
                        // its not got this key and so create it and make it blank...
                        report.user.data[key] = "";
                    }
                })
            }
        })  

        // and clear the textbox, and close the rmenu...
        document.getElementsByName("selectGroups").forEach((checkBox: HTMLInputElement) => {
            checkBox.checked = false;
        })
        // clear the array, students can be added again!!!
        this.groupsSelected = [];
    }

    loadedTemplate: string;
    relatedTests: TemplateTest[] = [];

    loadTemplate(templateId: string): void {
        // get the index
        let index: number = this.templates.findIndex((temp: Template) => temp.id === templateId);
        // and if it exists then load...
        if(index !== -1) {
            // set the report id
            this.report.templateId = templateId;
            this.loadedTemplate = templateId;
            // set the template id on each of the users (in the future potentially each student may have different template ids)
            this.report.reports.forEach((repo: Report) => {
                repo.templateId = templateId;
            })
            // get the template and proces the variables required...
            const template: Template = this.templatesService.getTemplate(templateId);
            this.processTemplate(template);
        } else {
            // the template may have been deleted, what now?
            this.report.templateId = "";
            this.loadedTemplate = "";
            // set the template id on each of the users (in the future potentially each student may have different template ids)
            this.report.reports.forEach((repo: Report) => {
                repo.templateId = "";
            })
            // and reset the variables, which dont exist iof there is no template...
            this.report.globals = [];
            this.report.variables = [];
            this.report.tests = [];
        }
        this.checkForChanges();
    }

    loadedReport: ReportTemplate; // the saved version of the report to check for changes against

    /**
     * Load an report set.
     * @param id 
     */
    loadReport(id: string): void {
        // get the report.
        this.reportsService.getReport(id).subscribe((report: ReportTemplate) => {
            this.report = report;
            // set to not loading...
            this.isLoading = false;
            // check if we can make the report yet...
            this.loadedGroup = this.report.groupId;
            this.loadedTemplate = this.report.templateId;
            this.setTitle(`Reports - ${this.report.name}`);
            this.loadTemplate(this.loadedTemplate);
        }, error => {
            this.isLoading = false;
            console.log(`Error loading report with ID ${id}: ${error}`);
        });
    }

    /**
     * A new report is being created...
     */
    newReport(): void {
        this.isLoading = false;
        this.report = {id: "", groupId: "", templateId: "", name: "", lastUpdated: Date.now(), manager: this.user.id, variables: [], globals: [], tests: [], keys: [], reports: []};
        this.loadedGroup = undefined;
    }

    report: ReportTemplate = <ReportTemplate>{};
    reportId: string;

    /**
     * Check if all data is available to parse the group into a report
     */
    processTemplate(template: Template): void {
        // get the variables...
        let variables: [GlobalValues[], VariableValues[]] = this.reportsService.generateVariables(template);
        let tests: TestValues[] = this.reportsService.generateTests(template);
        
        // if the variables are already defined we dont want to overwrite them.
        // globals
        let newGlobals: GlobalValues[] = [];
        let newVariables: VariableValues[] = [];
        let newTests: TestValues[] = [];

        variables[0].forEach((variable: GlobalValues) => {
            let variableIndex: number = this.report.globals.findIndex((temp: GlobalValues) => temp.identifier === variable.identifier);
            // if the index isnt found on the already loaded global variables then add it, it isnt already there.
            variableIndex === -1 ? newGlobals.push(variable) : newGlobals.push(this.report.globals[variableIndex]);
        })
        // variables
        variables[1].forEach((variable: VariableValues) => {
            let variableIndex: number = this.report.variables.findIndex((temp: GlobalValues) => temp.identifier === variable.identifier);
            // if the index isnt found on the already loaded variable variables then add it, it isnt already there.
            variableIndex === -1 ? newVariables.push(variable) : newVariables.push(this.report.variables[variableIndex]);
        })
        // tests
        tests.forEach((test: TestValues) => {
            let testIndex: number = this.report.tests.findIndex((temp: TestValues) => test.identifier === temp.identifier);
            // if the index isnt found on the already loaded global variables then add it, it isnt already there.
            testIndex === -1 ? newTests.push(test) : newTests.push(this.report.tests[testIndex]);
        })

        this.report.globals = newGlobals;
        this.report.variables = newVariables;
        this.report.tests = newTests;

    }

    //DEALING WITH VARIABLES
    /**
     * Assigns a value toa global variable - i.e. something that is the same for each student.
     * @param identifier 
     * @param value 
     */
    assignGlobalValue(identifier: string, value: string): void {
        // find the global int he report structure.
        const gloIndex = this.report.globals.findIndex((temp: GlobalValues) => temp.identifier === identifier);
        // when found set the value of the variable
        if(gloIndex !== -1) {
            if (value === "newOption") {
                // force the text box to appear back for this variable...
                this.report.globals[gloIndex].options.push("");
            } else {
                // default behaviour is to select the option
                this.report.globals[gloIndex].value = value;
            }
        }
        this.checkForChanges();
    }

    /**
     * Add an option to a predefined list of options...
     * @param identifier 
     * @param value 
     */
    addGlobalOption(identifier: string, value: string): void {
        // find the global int he report structure.
        const gloIndex = this.report.globals.findIndex((temp: GlobalValues) => temp.identifier === identifier);
        // set the last option as equal to the value...
        // this is the only instance in which this function should fire...
        if(gloIndex !== -1) {
            const optionLength = this.report.globals[gloIndex].options.length;
            const optionValue = this.report.globals[gloIndex].options[optionLength - 1];

            if(optionValue === "") {
                this.report.globals[gloIndex].options[optionLength - 1] = value;
                this.assignGlobalValue(identifier, value);
            } else {
                // something set up wrong...
            }
        }
        this.checkForChanges();
    }

    // need works on keys
    /**
     * Assings a variable to a column of data...
     * @param toIdentifier 
     * @param assignIdentifier 
     */
    assignVariableColumn(toIdentifier: string, assignIdentifier: string) : void {
        // toIdentifier is the column to assign this to...
        // assighnIdentifier is the variable to assign
        let findIndex: number;

        // if it doesnt exist then create a column for it...
        while((findIndex = this.report.keys.findIndex((temp: string) => temp === toIdentifier)) === -1) {
            this.report.keys.push(toIdentifier);
            this.addedColumns.push(toIdentifier);
        }

        // asign to students...
        this.report.reports.forEach((user: Report) => {
            user.user.data[assignIdentifier] = user.user.data[toIdentifier] ? user.user.data[toIdentifier] : "";
        })

        // now assign tot he new column...
        let varIndex: number = this.report.variables.findIndex((temp: VariableValues) => temp.identifier.toLowerCase() === assignIdentifier.toLowerCase());
        // if found assign it...
        if(varIndex !== -1) {
            this.report.variables[varIndex].key = toIdentifier;
        } else {
            // it went wrong, who knows what to do?
            // I SHOULD ALEX, SO PUT SOMETHING HERE ONE DAY??
            console.log("Failed to assign to variable");
            
            // why is this randomyl here??? :S
            let newVar: VariableValues = { identifier: assignIdentifier, key: toIdentifier, value: "", options: ['m','f','p'] };
            this.report.variables.push(newVar);
        }
        this.checkForChanges();
    }

     /**
     * Assings a variable to a column of data for a test variable
     * SAME AS ABOVE FUNCTION BUT FOR TESTS...
     * @param toIdentifier 
     * @param assignIdentifier 
     */
    assignTestVariableColumn(toIdentifier: string, assignIdentifier: string, testName: string) : void {
        // toIdentifier is the column to assign this to...
        // assighnIdentifier is the variable to assign
        let findIndex: number;

        // if it doesnt exist then create a column for it...
        while((findIndex = this.report.keys.findIndex((temp: string) => temp === toIdentifier)) === -1) {
            this.report.keys.push(toIdentifier);
            this.addedColumns.push(toIdentifier);
        }

        // asign to students...
        this.report.reports.forEach((user: Report) => {
            user.user.data[assignIdentifier] = user.user.data[toIdentifier] ? user.user.data[toIdentifier] : "";
        })

        // now assign tot he new column...
        let varIndex: number = this.report.tests.findIndex((temp: TestValues) => temp.identifier.toLowerCase() === testName.toLowerCase());
        // if found assign it...
        if(varIndex !== -1) {
            let valIndex: number = this.report.tests[varIndex].values.findIndex((temp: TestIndividualValue) => temp.identifier.toLowerCase() === assignIdentifier.toLowerCase());
            this.report.tests[varIndex].values[valIndex].key = toIdentifier;
        } else {
            // it went wrong, who knows what to do?
            // I SHOULD ALEX, SO PUT SOMETHING HERE ONE DAY??
            console.log("Failed to assign to variable");
        }
        console.log(this.report);

        this.checkForChanges();        
    }

    /**
     * Remove the assignment of a variable
     * @param varIdentifier 
     */
    removeVariableAssignment(varIdentifier: string): void {
        // get the index
        const varIndex: number = this.report.variables.findIndex((temp: VariableValues) => temp.identifier.toLowerCase() === varIdentifier.toLowerCase());
        // and remove the key from it...
        if(varIndex !== -1) {
            this.report.variables[varIndex].key = "";
        }
        this.checkForChanges();
    }

    /**
     * Remove the assignment of a test variable
     * @param varIdentifier 
     */
    removeTestVariableAssignment(varIdentifier: string, testName: string): void {
        // get the index
        const varIndex: number = this.report.tests.findIndex((temp: TestValues) => temp.identifier.toLowerCase() === testName.toLowerCase());
        // and remove the key from it...
        if(varIndex !== -1) {
            const valueIndex: number = this.report.tests[varIndex].values.findIndex((temp: TestIndividualValue) => temp.identifier.toLowerCase() === varIdentifier.toLowerCase());
            // and set the value back to ""
            if(valueIndex !== -1) {
                this.report.tests[varIndex].values[valueIndex].key = "";
            }
        }
        this.checkForChanges();
    }

    /**
     * Checks to see if a variable has been assigned to a column yet.
     * @param identifier 
     * @returns 
     */
    checkVariableAssignment(identifier: string): boolean {
        // find the variable index...
        const index = this.report.variables.findIndex((temp: VariableValues) => temp.identifier.toLowerCase() === identifier.toLowerCase());
        // if it exists...
        if(index !== -1) {
            return this.report.variables[index].key === "" ? false : true;
        }
        return false;
    }

    /**
     * Checks to see if a test variable has been assigned to a column yet.
     * @param identifier 
     * @param testName 
     * @returns 
     */
    checkTestVariableAssignment(identifier: string, testName: string): boolean {
        // find the variable index...
        const index = this.report.tests.findIndex((temp: TestValues) => temp.identifier.toLowerCase() === testName.toLowerCase());
        // if it exists...
        if(index !== -1) {
            const valIndex = this.report.tests[index].values.findIndex((temp: TestIndividualValue) => temp.identifier.toLowerCase() === identifier.toLowerCase());
            return this.report.tests[index].values[valIndex].key === "" ? false : true;
        }
        return false;
    }




    


    // need works on keys
    /**
     * Set a value on the data table...
     * Adds it to the report array...
     * This does NOT change the class list...
     * @param reportId 
     * @param key 
     * @param input 
     */
    valueChange2(reportId: number, name: string, input: string): void {

        let keys: string[] = this.getKeyFromName(name);

        for(let i = 0 ; i < keys.length ; i++) {
            this.report.reports[reportId].user.data[keys[i]] = input;
        }

        this.report.reports[reportId].user.data[name] = input;

        console.log(this.report.reports[reportId].user.data);
        this.checkForChanges();
    }













    hiddenColumns: string[] = [];
    addedColumns: string[] = [];

    /**
     * Hides a column with the given key name...
     * @param key 
     */
    hideColumn(key: string): void {
        this.hiddenColumns.push(key);
    }

    /**
     * Hides all the columns at once
     */
    hideAllColumns(): void {
        this.hiddenColumns = this.report.keys;
    }

    /**
     * Shows all the columns...
     */
    showAllColumns(): void {
        this.hiddenColumns = [];
    }

    /**
     * Shows a hidden column
     * @param key 
     */
    showColumn(key: string): void {
        let index: number = this.hiddenColumns.findIndex((str: string) => str === key);
        // if it was found in the array, then remove it.
        if(index !== -1) {
            this.hiddenColumns.splice(index, 1);
        }
    }

    // checks if a column is hidden or not. Is this the most efficient way given its called on every cell multiple times?
    isColumnHidden(key: string): boolean {
        return this.hiddenColumns.findIndex((str: string) => str === key) === -1 ? false : true;
    }

    /**
     * Tests if a column was added, or whether it was part of the class data.
     * Kind of deprecated as persistence is hard and maybe not all class data is relevant.
     * Maybe an option to add data back in?
     * 
     * @param colName 
     * @returns 
     */
    wasColumnAdded(colName: string): boolean {
        return this.addedColumns.findIndex((str: string) => str === colName) === -1 ? false : true;
    }




    



    


    // need works on keys
    /**
     * Deletes a column that has been created in the reports section.
     * Cannot delete columns of data which ahs been pre entered.
     * 
     * @param key 
     */
    deleteColumn(key: string): void {
        let findIndex: number = this.report.keys.findIndex((keys: string) => keys === key);
        // and if found, remove it...
        if(findIndex !== -1) {
            this.report.keys.splice(findIndex, 1);
            // remove from the users as well...
            this.report.reports.forEach((user: Report) => {
                delete user.user.data[key];
            })
            // AND remove any variables which are added to it...
            this.report.variables.every((temp: VariableValues) => {
                if(temp.key === key) {
                    temp.key = "";
                    return false;
                }
                return true;
            })
            // and same for tests ?(easier way for this?)
            this.report.tests.forEach((temp: TestValues) => {
                temp.values.every((tmpVal: TestIndividualValue) => {
                    if(tmpVal.key === key) {
                        tmpVal.key = "";
                        return false;
                    }
                    return true;
                })
            })
        }
        this.checkForChanges();
    }

    deleteUserReport(reportId: number): void {
        this.report.reports.splice(reportId, 1);
    }

    /**
     * 
     * If you change the settings on a test variable this function will modify all relevant values...
     * This will need a warning as it will delete data...
     * 
     * @param testName 
     * @param value 
     */
    testSettingsChange(testName: string, value: string): void {
        let test: Test = this.testsService.getTest(testName);
        let testIndex: number = this.report.tests.findIndex((temp: TestValues) => temp.identifier === testName);
        let optionIndex: number = test.settings.options.findIndex((temp: TestOptions) => temp.name === value)
        let options: { [key: number]: string } = test.settings.options[optionIndex].options;

        // set all the options...
        this.report.tests[testIndex].values.forEach((val: TestIndividualValue) => {
            val.options = Object.values(options);
        })

        this.report.tests[testIndex].settings.value.name = value;

        // test all the values that were set for this, and if they are not in the new scheme, remove them...
        // this should come with a varning :D
        this.report.reports.forEach((report: Report) => {
            this.report.tests[testIndex].values.forEach((temp: TestIndividualValue) => {
                // change to blank...
                report['user'].data[temp.identifier] = "";
            })
        })
    }

    /**
     * Checks whether a column has specific values it can take...
     * @param key 
     * @returns 
     */
    testOptionsExist(key: string): boolean {
        let returnValue: boolean = false; // return -1 if there is no set of test options associated with this.
        // iterate over the tests
        this.report.tests.forEach((test: TestValues, testIndex: number) => {
            // iterate over the values and find the key associated with it if applicable
            test.values.forEach((temp: TestIndividualValue, valueIndex: number) => {
                // if the key is identical to the column key then return the index.
                if(temp.key === key) { 
                    returnValue = true; 
                }
            })
        })
        return returnValue;
    }

    /**
     * Returns the options for a particular test...
     * @param key 
     * @returns 
     */
    getTestOptions(key: string): string[] {
        let returnValue: string[] = []; // return -1 if there is no set of test options associated with this.
        // iterate over the tests
        this.report.tests.forEach((test: TestValues, testIndex: number) => {
            // iterate over the values and find the key associated with it if applicable
            test.values.forEach((temp: TestIndividualValue, valueIndex: number) => {
                // if the key is identical to the column key then return the index.
                if(temp.key === key) { 
                    returnValue = temp.options.slice().reverse(); 
                }
            })
        })
        return returnValue;
    }

    unsavedChanges: boolean = false; // are there changes made to the report that have not been comitted to the persistent report?
    reportSaved: boolean = false; // has the report ever been comitted tot he database? false if it hasnt...
    reportGenerationReady: boolean = false; // is there suffient data to generate reports?

    checkForChanges(): void {
        this.unsavedChanges = JSON.stringify(this.loadedReport) !== JSON.stringify(this.report) ? true : false;
        this.reportGenerationReady = this.reportsService.testExecutability(this.report);
    }

    generateReports(): void {
        this.report = this.reportsService.generateBatchReports(this.report);
    }

    // functions to show the various sections or not...
    showTests(): boolean { return this.report ? this.report.tests ? this.report.tests.length > 0 ? true : false : false : false; }
    showVariables(): boolean { return this.report ? this.report.variables ? this.report.variables.length > 0 ? true : false : false : false; }
    showGlobals(): boolean { return this.report ? this.report.globals ? this.report.globals.length > 0 ? true : false : false : false; }

    populateIndex: string; // index of the column to populate with data
    groupKeys: string[] = [];

    /**
     * toggle populate index...
     * @param key 
     */
    populateSelect(key: string): void {
        this.populateIndex ? (this.populateIndex === key ? this.populateIndex = undefined : this.populateIndex = key) : this.populateIndex = key;
        // load the group data for this bunch...
        this.getGroupData();
    }

    getGroupData(): void {
        // get the columns/ data fields for this group...
        this.groupService.getGroup(this.report.groupId).subscribe((grp: Group) => {
            console.log(this.report);
            let groupData: Group = grp;
            this.groupKeys = groupData.keys;
        })
    }

    /**
     * deprecated
     * No longer needed since how groups got added changed.
     * @param toCol 
     * @param fromCol 
     */
    // populateDataFromKey(colName: string, key: string): void {
    //     // get the columns/ data fields for this group...
    //     this.groupService.getGroup(this.report.groupId).subscribe((grp: Group) => {
    //         let groupData: Group = grp;
    //         // set the values in the report
    //         // need unique id on students else reordering will break this
    //         // poor man solution for now.
    //         this.report.reports.forEach((student: Report, index: number) => {
    //             student['user'].data[colName] = groupData.students[index].data[key]; 
    //         })
    //         // add the key back into the keys database...
    //     })
    // }

    populateDataFromColumn(toCol: string, fromCol: string): void {
        this.report.reports.forEach((student: Report, index: number) => {
            student['user'].data[toCol] = student['user'].data[fromCol];
        })
    }

    populateDataFromTextOrOption(key: string, value: string): void {
        this.report.reports.forEach((student: Report, index: number) => {
            student['user'].data[key] = value;
        })
    }

    /**
     * Copies the report text into the clipboard
     * @param reportId 
     */
    copyReportText(reportId: number): void {
        let text: string = this.report.reports[reportId].report;
        navigator.clipboard.writeText(text);
    }

    // drag and drop functionality to reorder the table...
    drop(): void {
        this.dragging = false;
    }

    allowDrop(event): void {
        event.preventDefault();
        // if the current target has been moved, then auto move it.
        let targetKey: string = event.target.value;

        if(targetKey !== this.dragKey && !this.dragTimeout) {
            let moveIndex: number = this.report.keys.findIndex((temp: string) => temp === this.dragKey);
            let toIndex: number = this.report.keys.findIndex((temp: string) => temp === targetKey);

            if(toIndex !== -1 && moveIndex !== -1) {
                // reorder keys
                this.reOrderKeys(moveIndex, toIndex, this.dragKey);
                this.dragKey = targetKey;
                // set a timeout before a reorder can happen again
                setTimeout(() => {
                    this.dragTimeout = false;
                }, 250);
            }
        }
    }

    dragging: boolean = false;
    dragKey: string;
    dragTimeout: boolean = false;

    drag(ev: string): void {
        this.dragKey = ev;
        this.dragging = true;
    }

    reOrderKeys(from: number, to: number, key: string): void {
        // stop further drags happen buggily
        this.dragTimeout = true;
        // modify the array
        this.report.keys.splice(from, 1);
        this.report.keys.splice(to, 0, key);
    }

    // REPORT TOOLS

    /**
     * Removes a report from the user.
     * @param reportId 
     */
    deleteIndividualReport(reportId: number): void {
        this.report.reports[reportId].report = "";
    }

    /**
     * Creates a new version of the report for this user.
     * @param reportId 
     */
    regenerateIndividualReport(reportId: number): void {
        this.report.reports[reportId].report = this.reportsService.generateIndividualReports(this.report.reports[reportId], this.report.globals, this.report.variables, this.report.tests);
    }

    saveIndividualReport(reportId: number): void {
        // see if any reports have already been saved...
        let reportFound: boolean = this.report.keys.includes("Saved Report");
    
        if(reportFound) {
            this.report.reports[reportId].user.data['Saved Report'] = this.report.reports[reportId].report;
        } else {
            // add the column and the key for each user.
            this.report.reports.forEach((user: Report) => {
                user.user.data['Saved Report'] = "";
            })
            this.report.keys.push('Saved Report');
            this.addedColumns.push('Saved Report');
            // then add to it for this user.
            this.report.reports[reportId].user.data['Saved Report'] = this.report.reports[reportId].report;
        }
    }

    reportIdToEdit: number = -1;

    /**
     * Allows this report to be individually edited.
     * @param reportId 
     */
    editIndividualReport(reportId: number): void {
        this.reportIdToEdit === reportId ? this.reportIdToEdit = -1 :  this.reportIdToEdit = reportId;
    }

    /**
     * Edits the text of a report...
     * @param reportId 
     * @param newText 
     */
    editReportText(reportId: number, newText: string): void {
        this.report.reports[reportId].report = newText;
        this.editIndividualReport(reportId);
    }

    sortDirection: number = 1;

    /**
     * Sorts a column by key.
     * @param key 
     */
    sortColumn(key: string): void {
        this.report.reports.sort((a: Report, b: Report) => {
            let keyA: string = a.user.data[key];
            let keyB: string = b.user.data[key];
            return keyA > keyB ? 1 * this.sortDirection : keyA === keyB ? 0 : -1 * this.sortDirection;
        });
        // reverse the sort for the next iteration.
        // basic method but effective.
        this.sortDirection *= -1;
    }



    getKeyFromName(name: string): string[] {
        let keys: string[] = [];
        // test the variables first to see if its a variable...
        
        for(let i = 0 ; i < this.report.variables.length ; i++) {
            this.report.variables[i].key === name ? keys.push(this.report.variables[i].identifier) : null;
        }

        // check the tests...
        for(let i = 0 ; i < this.report.tests.length ; i++) {
            // now the values in the tests...
            for(let o = 0 ; o < this.report.tests[i].values.length ; o++) {
                this.report.tests[i].values[o].key === name ? keys.push(this.report.tests[i].values[o].identifier) : null;
            }
        }

        return keys.filter((value: string, index: number, restOfArray: string[]) => restOfArray.indexOf(value) === index);


        // if(varIndex !== -1) {
        //     // add it to the array.
        //     keys.push(this.report.variables[varIndex].identifier);
        // } else {
        //     // see if its a test variables...
        //     let testVarResult: number[] = [-1, -1];

        //     testVarResult[0] = this.report.tests.findIndex((test: TestValues) => {
        //         testVarResult[1] = test.values.findIndex((testValues: TestIndividualValue) => testValues.key === name );
        //         return testVarResult[1] > -1;
        //     })

        //     if(testVarResult[0] !== -1) {
        //         console.log(name, this.report.tests[testVarResult[0]].values[testVarResult[1]].identifier);
        //         return this.report.tests[testVarResult[0]].values[testVarResult[1]].identifier;
        //     } else {
        //         // not found!
        //         return undefined;
        //     }
        // }
    } 

    addIndividualStudent(): void {
        // get a new id for this unknown student
        let newUserId: string = this.groupService.generateRandomId();
        // create a report object
        let newReport: Report = {
            userId: newUserId, 
            templateId: this.report.templateId ? this.report.templateId : "",
            user: {
                id: newUserId, 
                data: {}
            },
            report: "",
            generated: null
        }
        // add data fields onto the user from another previous user - this means where data is stored but not displayed this user has access
        for(const [key] of Object.entries(this.report.reports[this.report.reports.length - 1].user.data)) {
            newReport.user.data[key] = "";
        }
        // and then push into the reports...
        this.report.reports.push(newReport);
    }

    /**
     * NOTE: This function does nothing yet, but will be implemented if a sentenceservice overhaul takes place.
     * In the databace g| and v| will select which variable set to come from, and irrespective of what is sent as userdata there
     * is no link between the report setup and the sentence service.
     * 
     * @param globalIndex 
     */
    // convertToVariable(globalIndex: number) : void {
    //     let global: GlobalValues = this.report.globals[globalIndex];
    //     // create a new variale object
    //     let newVariable: VariableValues = {
    //         identifier: global.identifier, 
    //         key: "", 
    //         value: global.value, 
    //         options: global.options
    //     }
    //     // push onto the variables array and pop from the globals.
    //     this.report.variables.push(newVariable);
    //     this.report.globals.splice(globalIndex, 1);
    // }

    printReportObject(): void {
        console.log(this.report);
    }

}