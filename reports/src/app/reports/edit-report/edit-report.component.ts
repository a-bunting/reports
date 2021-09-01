import { Component, OnInit } from '@angular/core';
import { Group, Student } from 'src/app/classes/create-group/create-group.component';
import { GroupsService } from 'src/app/services/groups.service';
import { TemplatesService } from 'src/app/services/templates.service';
import { GlobalValues, Report, ReportsService, ReportTemplate } from 'src/app/services/reports.service';
import { Template } from 'src/app/templates/templates.component';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';
import { User } from 'src/app/utilities/authentication/user.model';
import { AuthenticationService } from 'src/app/utilities/authentication/authentication.service';
import { SentencesService } from 'src/app/services/sentences.service';

@Component({
  selector: 'app-edit-report',
  templateUrl: './edit-report.component.html',
  styleUrls: ['./edit-report.component.scss']
})
export class EditReportComponent implements OnInit {

    groups: Group[] = [];
    loadedGroup: Group;

    templates: Template[] = [];

    paramObservable: Subscription;

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

        this.loadGroups();
        this.loadTemplates();

        // get the user info...
        this.auth.user.subscribe((user: User) => {
            this.user = user;
        })

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
        }, error => {
            console.log(`Error: ${error}`);
        });

    }

    loadReport(id: string): void {
        this.report = this.reportsService.getReport(id);
    }

    newReport(): void {
        // need this?
        // look at the stream of coming into this app to make sure it all makes
        // sense asynchronously...
    }

    report: ReportTemplate;
    reportId: string;
    reportName: string = "";

    parseReport(group: Group, template: Template): void {
        let globals: GlobalValues[] = [];
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

        this.generateGlobals(template);

        let report: ReportTemplate;

    }

    generateGlobals(template: Template): GlobalValues[] {
        let globals: GlobalValues[] = [];
        let stringExample: string = "";
        let splitRegex: RegExp = new RegExp('\$\$(.*?)\$\$');

        // look through the template for any globals that might be needed...
        template.template.forEach((section: string[]) => {
            this.sentenceService.generateSentenceOptions(section).forEach((option: {sentence: string, depth: number, delete: boolean}) => {
                // need to generate UP TO THIS
                // POINT TO TEST SO CURRENT IS IT WORKING?
                // I DO NOT KNOW SO TEST IT
                let splits = option.sentence.split(splitRegex);
                console.log(splits);
            })
        })

        return globals;
    }


    // GROUPS FUNCTIONS
    loadGroups(): void {
        // get the groups database...
        this.groupService.getGroups().subscribe((result: Group[]) => {
            this.groups = result;

        })
    }

    loadGroup(groupId: string): void {
        // get the index
        let index: number = this.groups.findIndex((temp: Group) => temp.id === groupId);
        // and load...
        if(index !== -1) {
            this.loadedGroup = this.groups[index];
        }
    }

    loadTemplates(): void {
        // get the templates database...
        this.templatesService.getTemplates().subscribe((result: Template[]) => {
            this.templates = result;
        })
    }


}
