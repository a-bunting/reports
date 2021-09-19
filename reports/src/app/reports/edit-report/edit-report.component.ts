import { Component, OnInit } from '@angular/core';
import { Group, Student } from 'src/app/classes/create-group/create-group.component';
import { GroupsService } from 'src/app/services/groups.service';
import { TemplatesService, Template } from 'src/app/services/templates.service';
import { GlobalValues, Report, ReportsService, ReportTemplate, TestIndividualValue, TestValues, VariableValues } from 'src/app/services/reports.service';
import { from, observable, Observable, Subject, Subscription, zip } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';
import { User } from 'src/app/utilities/authentication/user.model';
import { AuthenticationService } from 'src/app/utilities/authentication/authentication.service';
import { sentence, SentencesService } from 'src/app/services/sentences.service';
import { map, take } from 'rxjs/operators';
import { Variable } from '@angular/compiler/src/render3/r3_ast';
import { TemplateTest, Test, TestsService } from 'src/app/services/tests.service';

@Component({
  selector: 'app-edit-report',
  templateUrl: './edit-report.component.html',
  styleUrls: ['./edit-report.component.scss']
})
export class EditReportComponent implements OnInit {

    // group data
    groups: Group[] = [];
    loadedGroup: Group;

    // templates data
    templates: Template[] = [];

    // parameters and loading individual report sets
    paramObservable: Subscription;

    // user object
    user: User;

    // design things
    sticky: IntersectionObserver;

    constructor(
        private auth: AuthenticationService, 
        private router: ActivatedRoute, 
        private reportsService: ReportsService, 
        private groupService: GroupsService, 
        private templatesService: TemplatesService, 
        private sentenceService: SentencesService, 
        private testsService: TestsService
    ) { }

    ngOnInit(): void {
        // get the user info...
        this.auth.user.subscribe((user: User) => {
            // set the user id
            this.user = user;

            // load all data first - this is important to be done first so when the parameters fire
            // the data is all there and able to be accessed.
            this.loadData().subscribe(([groups, templates, sentences]) => {
                this.groups = groups;
                this.templates = templates;
                
                // monitor the parameter id in the URL and if it changes reload the data...
                this.paramObservable = this.router.params.subscribe((params: Params) => {
                    // set the id and load the template
                    this.reportId = params.id;
                    // and load as appropriate...
                    if(this.reportId !== undefined) {
                        this.loadReport(this.reportId);
                    } else {
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

    /**
     * Load an individual groups data
     * @param groupId 
     */
    loadGroup(groupId: string): void {
        // get the index
        let index: number = this.groups.findIndex((temp: Group) => temp.id === groupId);
        // and load...
        if(index !== -1) {
            this.loadedGroup = this.groups[index];
            this.parseCheck();
        }
    }

    loadedTemplate: Template;
    relatedTests: TemplateTest[] = [];

    // not quite working yet, doesnt seem to push onto the array
    loadTemplate(templateId: string): void {
        // get the index
        let index: number = this.templates.findIndex((temp: Template) => temp.id === templateId);
        // and load
        if(index !== -1) {
            this.loadedTemplate = this.templates[index];


            // Get all related tests from the sentence service
            // this.loadedTemplate.template.forEach((template: string[]) => {
            //     // get the sentence data
            //     let testData: [sentence[]][] = this.sentenceService.getCompoundSentenceData(template, true, ['tests']);
            //     // let testData: [sentence[]] = this.sentenceService.getSentenceData(template, true, ['tests']);

            //     testData.forEach((individualOption: [sentence[]]) => {
            //         // anditerate
            //         individualOption.forEach((temp: sentence[]) => {
            //             // iterate over the results...                
            //             temp.forEach((templateInfo: sentence) => {
            //                 // if tests exist...
            //                 if(templateInfo.tests) {
    
            //                     templateInfo.tests.forEach((test: TemplateTest) => {
            //                         // check if this test is already added
            //                         const testIndex = this.relatedTests.findIndex((t: TemplateTest) => test.name === t.name);
            //                         // if not there, add it...
            //                         if(testIndex === -1) {
            //                             this.relatedTests.push(test);
            //                             this.addTestVariables(test.name);
            //                         } // else already added
            //                     })
            //                 }
            //             })
            //         })
            //     })
            // })

            // check if we can make the report yet...
            this.parseCheck();
        }
    }

    /**
     * Gets all relevant tests and produces a list of required variables...
     * @returns 
     */
     addTestVariables(testName: string): void {
        // get the related variables and add them to the testvariables
        let test: Test = this.testsService.getTest(testName);

        test.variables.forEach((varName: string) => {

            let newVariable: VariableValues = {
                identifier: test.name,
                key: varName + "",
                value: "",
                options: []
            }

            console.log(newVariable);

            this.report.variables.push(newVariable);
        })
    }

    /**
     * Load an individual report.
     * @param id 
     */
    loadReport(id: string): void {
        this.reportsService.getReport(id).subscribe((report: ReportTemplate) => {
            this.report = report;
            // set the name etc...
            this.reportName = this.report.name;
        });
    }

    /**
     * A new report is being created...
     */
    newReport(): void {
        this.report = undefined;
        this.reportName = "";
        this.reportId = undefined;
        this.loadedGroup = undefined;
    }

    report: ReportTemplate;
    reportId: string;
    reportName: string = "";

    /**
     * Check if all data is available to parse the group into a report
     */
    parseCheck(): void {
        if((this.loadedGroup !== undefined) && (this.loadedTemplate !== undefined)) {
            this.report = this.reportsService.parseReport(this.loadedGroup, this.loadedTemplate, this.reportName, this.reportId, this.user);
        }
    }

    //DEALING WITH VARIABLES

    assignGlobalValue(identifier: string, value: string): void {
        console.log(identifier, value);
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
            console.log(this.report);
        }
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

    }

    /**
     * Assings a variable to a column of data...
     * @param toIdentifier 
     * @param assignIdentifier 
     */
    assignVariableColumn(toIdentifier: string, assignIdentifier: string) : void {
        // toIdentifier is the column to assign this to...
        // assighnIdentifier is the variable to assign
        let findIndex: number;

        console.log(toIdentifier, assignIdentifier);

        // if it doesnt exist then create a column for it...
        while((findIndex = this.report.keys.findIndex((temp: string) => temp === toIdentifier)) === -1) {
            this.report.reports.forEach((user: Report) => {
                user.user[toIdentifier] = "";
            })
            this.report.keys.push(toIdentifier);
            this.addedColumns.push(toIdentifier);
        }

        // now assign tot he new column...
        let varIndex: number = this.report.variables.findIndex((temp: VariableValues) => temp.identifier.toLowerCase() === assignIdentifier.toLowerCase());
        // if found assign it...
        if(varIndex !== -1) {
            this.report.variables[varIndex].key = toIdentifier;
        } else {
            // it went wrong, who knows what to do?
            // I SHOULD ALEX, SO PUT SOMETHING HERE ONE DAY??
            console.log("Failed to assign to variable");
        }

        console.log(this.report);
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

        console.log("1", toIdentifier, "2", assignIdentifier, "3", testName);

        // if it doesnt exist then create a column for it...
        while((findIndex = this.report.keys.findIndex((temp: string) => temp === toIdentifier)) === -1) {
            this.report.reports.forEach((user: Report) => {
                user.user[toIdentifier] = "";
            })
            this.report.keys.push(toIdentifier);
            this.addedColumns.push(toIdentifier);
        }

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
    }

    checkVariableAssignment(identifier: string): boolean {
        // find the variable index...
        const index = this.report.variables.findIndex((temp: VariableValues) => temp.identifier === identifier);
        // if it exists...
        if(index !== -1) {
            this.report.variables[index].key === "" ? false : true;
        }
        return false;
    }

    checkTestVariableAssignment(identifier: string, testName: string): boolean {
        // find the variable index...
        const index = this.report.tests.findIndex((temp: TestValues) => temp.identifier === testName);
        // if it exists...
        if(index !== -1) {
            const valIndex = this.report.tests[index].values.findIndex((temp: TestIndividualValue) => temp.identifier.toLowerCase() === identifier.toLowerCase());
            return this.report.tests[index].values[valIndex].key === "" ? false : true;
        }
        return false;
    }

    /**
     * Set a value on the data table...
     * Adds it to the report array...
     * This does NOT change the class list...
     * @param reportId 
     * @param key 
     * @param input 
     */
    valueChange(reportId: number, key: string, input: FocusEvent | KeyboardEvent): void {
        const reference: HTMLElement = <HTMLElement>input.target;
        const newValue = reference.innerText.split("\n");
        input.preventDefault();

        this.report.reports[reportId].user[key] = newValue[0];
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
     * @param colName 
     * @returns 
     */
    wasColumnAdded(colName: string): boolean {
        return this.addedColumns.findIndex((str: string) => str === colName) === -1 ? false : true;
    }

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
                delete user.user[key];
            })
            // AND remove any variables which are added to it...
            this.report.variables.every((temp: VariableValues) => {
                if(temp.key === key) {
                    temp.key = "";
                    return false;
                }
                return true;
            })
        }
        console.log(this.report);
    }

}
