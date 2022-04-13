import { Component, OnInit } from '@angular/core';
import { Observable, zip } from 'rxjs';
import { User } from '../authentication/user.model';
import { AuthenticationService, Transaction } from '../../services/authentication.service';
import { GroupsService, Group } from 'src/app/services/groups.service';
import { Template, TemplatesService } from 'src/app/services/templates.service';
import { sentence, SentencesService } from 'src/app/services/sentences.service';
import { map, take } from 'rxjs/operators';
import { Report, ReportsService, ReportTemplate } from 'src/app/services/reports.service';
import { DatabaseService } from 'src/app/services/database.service';
import { DocumentSnapshot, QuerySnapshot } from 'rxfire/firestore/interfaces';
import { CustomService } from 'src/app/services/custom.service';

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
    tooltipMode: boolean;

    constructor(
        private db: DatabaseService,
        private AuthService: AuthenticationService,
        private groupService: GroupsService,
        private templatesService: TemplatesService,
        private sentenceService: SentencesService,
        private reportService: ReportsService,
        private authService: AuthenticationService,
        public customService: CustomService
    ) {
        customService.greaterTooltipsFlag.subscribe((tooltipFlag: boolean) => {
            this.tooltipMode = tooltipFlag;
        })
    }

    ngOnInit(): void {
        // get user data...
        this.AuthService.user.subscribe((user: User) => {
            if(user) {
                this.user = user;
                // set the username and establishment
                this.username = this.user.name;
                this.facility = this.user.establishment.name;
                this.autoUpdateDb = this.user.autoUpdateDb;

                this.loadAppDataOnInitialisation();

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
        this.forceLoadData(true).subscribe({
                next: (result: [boolean, boolean, boolean, ReportTemplate[]]) => {
                    this.databaseStatus = result[0] && result[1] && result[2] && result[3] !== undefined;
                    this.databaseStatusUpdating = false;
                    this.reports = result[3].sort((a: ReportTemplate, b: ReportTemplate) => b.lastUpdated - a.lastUpdated).slice(0, 4);
                    this.reportsLoading = false;
        },      error: (error) => {
                    console.log("Database Status Update Failed: " + error);
                    this.databaseStatus = false;
                    this.databaseStatusUpdating = false;
        }})

    }

    loadAppDataOnInitialisation(): void {
        this.db.getAppData().subscribe((appdata: DocumentSnapshot<any>) => {
            let oldData: { sentenceDbUpdated: number } = JSON.parse(localStorage.getItem('appdata'));
            let data: { sentenceDbUpdated: number } = appdata.data();

            if(oldData) {
                // check new vs old data
                if(oldData.sentenceDbUpdated !== data.sentenceDbUpdated) {
                    // database mismatch, update...
                    this.sentenceService.getSentencesDatabase(this.user.id, true).pipe(take(1), map((result: sentence) => { return true; })).subscribe({});
                    localStorage.setItem('appdata', JSON.stringify(data));
                }
            } else {
                // no data so all needs updating!
                this.sentenceService.getSentencesDatabase(this.user.id, true).pipe(take(1), map((result: sentence) => { return true; })).subscribe({});
                localStorage.setItem('appdata', JSON.stringify(data));
            }

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
        this.db.modifyUserData(this.user.id, {[fieldName]: value}).subscribe({
            next: () => {
                // switch based upon the fields

                switch(fieldName) {
                    case 'name': this.user.setUsername = ''+value; break;
                    case 'establishment': this.user.establishment.name = ''+value; break;
                    case 'autoUpdateDb': let v: boolean = value === true; this.user.setAutoUpdate = v; break;
                }

        }, error: (error) => {
            console.log(`Update failed: ${error}`);
        }})

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

    /**
     * Returns an array for the number of icons on the trial box
     * @param numbers
     * @returns
     */
    generateIcons(numbers: number): number[] {
        return Array(numbers).fill(1);
    }

    getMembershipExpiryDate(): number {
        let expiryTime: number = this.user.getMembershipExpiryTime();
        return expiryTime;
    }

}
