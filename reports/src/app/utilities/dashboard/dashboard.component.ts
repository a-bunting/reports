import { Component, Input, OnInit } from '@angular/core';
import { from, Observable, zip } from 'rxjs';
import { User } from '../authentication/user.model';
import { AuthenticationService } from '../authentication/authentication.service';
import { Group } from 'src/app/classes/create-group/create-group.component';
import { Template, TemplatesService } from 'src/app/services/templates.service';
import { sentence, SentencesService } from 'src/app/services/sentences.service';
import { GroupsService } from 'src/app/services/groups.service';
import { map, take } from 'rxjs/operators';
import { ReportsService, ReportTemplate } from 'src/app/services/reports.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

    user: User;
    username: string;
    facility: string;
    autoUpdateDb: boolean;

    constructor(
        private AuthService: AuthenticationService,
        private groupService: GroupsService,
        private templatesService: TemplatesService, 
        private sentenceService: SentencesService,
        private reportService: ReportsService
    ) {}
    
    ngOnInit(): void {
        this.AuthService.user.subscribe((user: User) => {
            if(user) {
                this.user = user;
                // set the username and establishment
                this.username = this.user.name;
                this.facility = this.user.establishment.name;
                this.autoUpdateDb = this.user.autoUpdateDb;

                if(user.autoUpdateDb) {
                    this.forceLoadDataClick();
                }
            }
        })
    }

    onUsernameChange(): void {
        this.user.setUsername = this.username;
    }

    onEstablishmentChange(): void {
        // nothing yet, free agents only to start
    }

    databaseStatus: boolean = false;
    databaseStatusUpdating: boolean = false;

    forceLoadDataClick(): void {
        this.databaseStatusUpdating = true;
        // force all databases to pull new data from the database.
        this.forceLoadData(true).subscribe((result: [boolean, boolean, boolean, boolean]) => {
            this.databaseStatus = result[0] && result[1] && result[2];
            this.databaseStatusUpdating = false;
        }, error => {
            console.log("Database Status Update Failed...");
            this.databaseStatus = false;
            this.databaseStatusUpdating = false;
        })

    }

    forceLoadData(forced: boolean): Observable<[boolean, boolean, boolean, boolean]> {
        // load groups and templates concurrently then act
        let loadGroups = this.groupService.getGroups(forced).pipe(take(1), map((result: Group[]) => { return true; }));
        let loadTemplate = this.templatesService.getTemplates(forced).pipe(take(1), map((result: Template[]) => { return true; }));
        let loadSentence = this.sentenceService.getSentencesDatabase(this.user.id, forced).pipe(take(1), map((result: sentence) => { return true; }));
        let loadReports = this.reportService.getReports(forced).pipe(take(1), map((result: ReportTemplate[]) => { return true; }));
        // and return them at the same time...
        return zip(loadGroups, loadTemplate, loadSentence, loadReports);
    }

}
