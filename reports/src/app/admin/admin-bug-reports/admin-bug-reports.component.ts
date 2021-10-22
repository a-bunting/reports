import { Component, OnInit } from '@angular/core';
import { DocumentSnapshot, QuerySnapshot } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/services/database.service';
import { User } from 'src/app/utilities/authentication/user.model';
import { BugReport } from 'src/app/utilities/bugreport/bugreport.component';

interface BugData {
    uniqueId: string, user: string | User, date: number, page: string, report: string, addressed: boolean
}

@Component({
  selector: 'app-admin-bug-reports',
  templateUrl: './admin-bug-reports.component.html',
  styleUrls: ['./admin-bug-reports.component.scss']
})
export class AdminBugReportsComponent implements OnInit {

    bugs: { category: string, report: BugData[] }[] = [];

    constructor(private db: DatabaseService) { }

    ngOnInit(): void {
        this.getBugReports();
    }

    loadingData: boolean = false;

    getBugReports(getAll: boolean = false) : void {

        let dbQuery: Observable<any> = getAll ? this.db.getAllBugReports() : this.db.getIncompletedBugReports();
        this.bugs = [];
        this.loadingData = true;
        this.viewCategory = -1;

        // get the bugs from the databse and sort them into their categories to display...
        dbQuery.subscribe((data: QuerySnapshot<BugReport>) => {
            // check if there is anything at all
            if(data.docs.length > 0) {
                data.docs.forEach((document: DocumentSnapshot<BugReport>) => {
                    // NB: https://stackoverflow.com/questions/5416920/timestamp-to-human-readable-format
                    let newReport: BugReport = document.data();
                    /// create the newbug section
                    let newBug: BugData = { 
                        uniqueId: document.id,
                        user: newReport.userid, 
                        date: newReport.timestamp, 
                        page: newReport.page, 
                        report: newReport.comment,
                        addressed: newReport.addressed ? newReport.addressed : false
                    }
                    // find out where it should be placed in the array..
                    let bugIndex: number = this.bugs.findIndex((temp: { category: string, report: BugData[] }) => temp.category === newReport.category);
    
                    if(bugIndex !== -1) {
                        // already a bug of that type.
                        this.bugs[bugIndex].report.push(newBug);
                    } else {
                        // first bug of this type...
                        this.bugs.push({ category: newReport.category, report: []});
                        this.bugs[this.bugs.length - 1].report.push(newBug);
                    }  
                })    
            } 
            // set loading data to false.
            this.loadingData = false;

        }, error => {
            console.log(`Error retrieving data: ${error}`);
            this.loadingData = false;
        })
    }

    allReports: boolean = false;
    viewCategory: number = -1;

    getAllReports(): void { this.getBugReports(true); this.allReports = true; }
    getIncompleteReports(): void { this.getBugReports(false); this.allReports = false; }

    setCategory(bugIndex: number): void {
        this.viewCategory = bugIndex;
    }

    /**
     * Returns a date sorted array of reports based pon either the selected category or the whoe lots of them...
     * @returns 
     */
    getReportsToDisplay(): BugData[] {
        let bugReports: BugData[] = [];
        
        if(this.viewCategory !== -1) {
            bugReports = this.bugs[this.viewCategory].report;
        } else {
            // join all the categories
            this.bugs.forEach((reportSet: { category: string, report: BugData[] }) => {
                bugReports = [...bugReports, ...reportSet.report].flat();
            });
            // return
        }
        
        return bugReports.sort((a: BugData, b: BugData) => b.date - a.date);
    }

    completeAction(user: string, date: number): void {
        let reports: BugData[] = this.getReportsToDisplay();
        let index: number = reports.findIndex((temp: BugData) => temp.date === date && temp.user === user);

        if(index !== -1) {
            // modify the array and the database...
            this.setCompletionStatus(reports[index].uniqueId, reports[index].addressed).subscribe((result: boolean) => {              
                if(result) {
                    reports[index].addressed = !reports[index].addressed;
                }
            })
        }
    }

    /**
     * Set the completion status of a bug in the databse
     * not working with observables right now.
     * @param id 
     * @param status 
     */
    setCompletionStatus(id: string, status: boolean): Observable<boolean> {
        return this.db.updateBugReport(id, status).pipe(take(1), tap(() => {
            // worked
            return true;
        }, error => {
            console.log(`Error updating status of report: ${error}`);
            return false;
        }))
    }

    getUserDetails(userid: string, id: string): void {


        this.db.getUserName(userid).subscribe((result: DocumentSnapshot<User>) => {
            let user: User = result.data();
            // update all reportd with the user id...
            this.bugs.forEach((reportSet: { category: string, report: BugData[] }) => {
                reportSet.report.forEach((rep: BugData) => {
                    if(rep.user === userid) {
                        rep.user = user;
                    }
                })
            });
        })

    }

}
