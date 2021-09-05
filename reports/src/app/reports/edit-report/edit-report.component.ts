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
import { sentence, SentencesService } from 'src/app/services/sentences.service';
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

    // design things
    sticky: IntersectionObserver;

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
            this.report = this.reportsService.parseReport(this.loadedGroup, this.loadedTemplate, this.reportName, this.reportId, this.user);
        }
    }

    //DEALING WITH VARIABLES
    assignVariableColumn(identifier: string) : void {
        console.log(identifier);
        let findIndex: number;

        // if it doesnt exist then create a column for it...
        while((findIndex = this.report.keys.findIndex((temp: string) => temp === identifier)) === -1) {
            this.report.reports.forEach((user: Report) => {
                user.user[identifier] = "";
            })
            this.report.keys.push(identifier);
        }

        // now assign tot he new column...
        let varIndex: number = this.report.variables.findIndex((temp: VariableValues) => temp.identifier.toLowerCase() === identifier.toLowerCase());
        // if found assign it...
        if(varIndex !== -1) {
            this.report.variables[varIndex].key = identifier;
        } else {
            // it went wrong, who knows what to do?
            // I SHOULD ALEX, SO PUT SOMETHING HERE ONE DAY??
            console.log("Failed to assign to variable");
        }

        console.log(this.report);
    }


}
