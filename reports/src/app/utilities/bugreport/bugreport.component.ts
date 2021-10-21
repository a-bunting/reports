import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatabaseService } from 'src/app/services/database.service';
import { AuthenticationService } from '../authentication/authentication.service';
import { User } from '../authentication/user.model';
import { DocumentReference } from '@angular/fire/firestore';
import { ThrowStmt } from '@angular/compiler';

export interface BugReport {
    category: string;
    comment: string;
    page: string;
    timestamp: number;
    userid: string;
}

@Component({
  selector: 'app-bugreport',
  templateUrl: './bugreport.component.html',
  styleUrls: ['./bugreport.component.scss']
})
export class BugreportComponent implements OnInit {

    reportActive: boolean = true;
    submitting: boolean = false;
    submitted: boolean = false;

    reportText: string = "";
    problemRegarding:string = "current";

    user: User;

    constructor(private auth: AuthenticationService, private db: DatabaseService, private  router: ActivatedRoute) { 
        this.auth.user.subscribe((user: User) => {
            // set the user id
            this.user = user;
        });
    }

    ngOnInit(): void {
    }

    submitReportToggle(state: boolean): void {
        this.reportActive = state;
    }

    submitBugReport(): void {

        let report: BugReport = {
            category: this.problemRegarding,
            comment: this.reportText,
            page: window.location.pathname,
            timestamp: Date.now(),
            userid: this.user.id
        } 

        this.submitting = true;

        this.db.addBugReport(report).subscribe((result: DocumentReference) => {
            if(result.id) {
                this.submitting = false;
                this.submitted = true;
                this.reportActive = false;
                this.reportText = "";
                this.problemRegarding = "current";
            }
        }, error => {
            console.log(`Error submitting Bug Report: ${error}`);
            this.submitting = false;
        })

    }

}
