import { Component, OnInit } from '@angular/core';
import { Observable, zip } from 'rxjs';
import { User } from '../authentication/user.model';
import { AuthenticationService } from '../authentication/authentication.service';
import { GroupsService, Group } from 'src/app/services/groups.service';
import { Template, TemplatesService } from 'src/app/services/templates.service';
import { sentence, SentencesService } from 'src/app/services/sentences.service';
import { map, take } from 'rxjs/operators';
import { Report, ReportsService, ReportTemplate } from 'src/app/services/reports.service';
import { DatabaseService } from 'src/app/services/database.service';

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
    reports: ReportTemplate[];

    constructor(
        private db: DatabaseService,
        private AuthService: AuthenticationService,
        private groupService: GroupsService,
        private templatesService: TemplatesService, 
        private sentenceService: SentencesService,
        private reportService: ReportsService, 
        private authService: AuthenticationService
    ) {}
    
    ngOnInit(): void {
        // get user data...
        this.AuthService.user.subscribe((user: User) => {
            if(user) {
                this.user = user;
                // set the username and establishment
                this.username = this.user.name;
                this.facility = this.user.establishment.name;
                this.autoUpdateDb = this.user.autoUpdateDb;

                if(user.autoUpdateDb) {
                    this.forceLoadDataClick();
                } else {
                    // reports are needed for a component so load them, but dont force it.
                    this.loadReports();
                }
            }
        })
    }

    databaseStatus: boolean = false;
    databaseStatusUpdating: boolean = false;

    forceLoadDataClick(): void {
        this.databaseStatusUpdating = true;
        this.reportsLoading = true;
        // force all databases to pull new data from the database.
        this.forceLoadData(true).subscribe((result: [boolean, boolean, boolean, ReportTemplate[]]) => {
            this.databaseStatus = result[0] && result[1] && result[2] && result[3] !== undefined;
            this.databaseStatusUpdating = false;
            this.reports = result[3].sort((a: ReportTemplate, b: ReportTemplate) => b.lastUpdated - a.lastUpdated).slice(0, 4);
            this.reportsLoading = false;
        }, error => {
            console.log("Database Status Update Failed: " + error);
            this.databaseStatus = false;
            this.databaseStatusUpdating = false;
        })

    }

    forceLoadData(forced: boolean): Observable<[boolean, boolean, boolean, ReportTemplate[]]> {
        // load groups and templates concurrently then act
        let loadGroups = this.groupService.getGroups(forced).pipe(take(1), map((result: Group[]) => { return true; }));
        let loadTemplate = this.templatesService.getTemplates(forced).pipe(take(1), map((result: Template[]) => { return true; }));
        let loadSentence = this.sentenceService.getSentencesDatabase(this.user.id, forced).pipe(take(1), map((result: sentence) => { return true; }));
        let loadReports = this.reportService.getReports(forced).pipe(take(1), map((result: ReportTemplate[]) => { return result; }));
        // and return them at the same time...
        return zip(loadGroups, loadTemplate, loadSentence, loadReports);
    }
    
    reportsLoading: boolean = false;

    loadReports(): void {
        this.reportsLoading = true;
        this.reportService.getReports().subscribe((result: ReportTemplate[]) => { 
            this.reports = result.sort((a: ReportTemplate, b: ReportTemplate) => b.lastUpdated - a.lastUpdated).slice(0, 4);
            this.reportsLoading = false;
        });
    }

    // unused anymore..
    reportCount(reportsId: number): number {
        let reportsWritten: number = 0;

        this.reports[reportsId].reports.forEach((report: Report) => {
            report.report !== "" ? reportsWritten++ : null;
        })

        return reportsWritten;
    }

    modifyUserData(fieldName: string, value: string | boolean): void {
        // set the user field in the database...
        this.db.modifyUserData(this.user.id, {[fieldName]: value}).subscribe(() => {
            // switch based upon the fields
            
            switch(fieldName) {
                case 'name': this.user.setUsername = ''+value; break;
                case 'autoUpdateDb': let v: boolean = value === true; this.user.setAutoUpdate = v; break;
            }

        }, error => {
            console.log(`Update failed: ${error}`);
        })

    }

    passwordResetLoading: boolean = false;
    passwordResetSentSuccessfully: boolean = false;
    passwordResetFail: number = 0;

    sendPasswordResetEmail(): void {
        this.passwordResetLoading = true;       
                
        this.authService.sendPasswordResetEmail(this.user.email).subscribe(() => {
            this.passwordResetLoading = false;        
            this.passwordResetSentSuccessfully = true;
        }, error => {
            this.passwordResetLoading = false;        
            this.passwordResetSentSuccessfully = false;
        });
    }

    refreshToken(): void {
        this.AuthService.manualTokenRefresh();
    }

}
