import { Component, OnInit } from '@angular/core';
import { Group, Student } from 'src/app/classes/create-group/create-group.component';
import { GroupsService } from 'src/app/services/groups.service';
import { TemplatesService } from 'src/app/services/templates.service';
import { GlobalValues, Report, ReportsService, ReportTemplate, VariableValues } from 'src/app/services/reports.service';
import { Template } from 'src/app/templates/templates.component';
import { observable, Observable, Subject, Subscription, zip } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';
import { User } from 'src/app/utilities/authentication/user.model';
import { AuthenticationService } from 'src/app/utilities/authentication/authentication.service';
import { SentencesService } from 'src/app/services/sentences.service';
import { map, take } from 'rxjs/operators';
import { Variable } from '@angular/compiler/src/render3/r3_ast';

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

    constructor(
        private auth: AuthenticationService, 
        private router: ActivatedRoute, 
        private reportsService: ReportsService, 
        private groupService: GroupsService, 
        private templatesService: TemplatesService, 
        private sentenceService: SentencesService
    ) { }

    ngOnInit(): void {
        // get the user info...
        this.auth.user.subscribe((user: User) => {
            // set the user id
            this.user = user;

            // load all data first - this is important to be done first so when the parameters fire
            // the data is all there and able to be accessed.
            this.loadData().subscribe(([groups, templates]) => {
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

        // watch the template and group data...

    }

    /**
     * Load all required data, including groups and templates data...
     * @returns 
     */
    loadData(): Observable<[Group[], Template[]]> {
        // load groups and templates concurrently then act
        let loadGroups = this.groupService.getGroups().pipe(take(1), map((result: Group[]) => { return result; }));
        let loadTemplate = this.templatesService.getTemplates().pipe(take(1), map((result: Template[]) => { return result; }));
        // and return them at the same time...
        return zip(loadGroups, loadTemplate);
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

    loadTemplate(templateId: string): void {
        // get the index
        let index: number = this.templates.findIndex((temp: Template) => temp.id === templateId);
        // and load
        if(index !== -1) {
            this.loadedTemplate = this.templates[index];
            this.parseCheck();
        }
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
            this.report = this.parseReport(this.loadedGroup, this.loadedTemplate);
        }
    }

    /**
     * Takes a group and a template and parses it into a reports template.
     * @param group 
     * @param template 
     * @returns ReportTemplate
     */
    parseReport(group: Group, template: Template): ReportTemplate {
        // set the individual components - not needed verbose but for clarity in design phase
        let variables: [GlobalValues[], VariableValues[]] = this.generateVariables(template);
        let individualReports: Report[] = [];
        let reportsName: string = this.reportName;
        let manager: string = this.user.id;
        let reportId: string = this.reportId;

        // parse each of the users into a new report for themselves - this lets us individualise each student
        group.students.forEach((student: Student) => {
            let newReport: Report = {
                user: student, 
                template: template,
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
                                newVariable = { identifier: identifier, key: "",options: options};
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
