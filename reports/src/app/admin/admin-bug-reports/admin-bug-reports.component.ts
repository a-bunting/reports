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
                    // see if the user already exists in the downloaded database (download is on demand but persists)
                    let userIndex: number = this.downloadedUsers.findIndex((temp: User) => temp.id === newReport.userid );

                    /// create the newbug section
                    let newBug: BugData = { 
                        uniqueId: document.id,
                        user: userIndex === -1 ? newReport.userid : this.downloadedUsers[userIndex], 
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

    /**
     * Flag a bug in the database as either true or false - alternates the value.
     * Then sets the look on the page.
     * @param user 
     * @param date 
     */
    completeAction(user: string, date: number): void {
        let reports: BugData[] = this.getReportsToDisplay();
        let index: number = reports.findIndex((temp: BugData) => temp.date === date && temp.user === user);

        if(index !== -1) {
            // modify the array and the database...
            this.db.updateBugReport(reports[index].uniqueId, !reports[index].addressed).subscribe(() => {
                reports[index].addressed = !reports[index].addressed;
            }, error => {
                console.log(`Error whilst changing status: ${error}`);
            })
        }
    }

    downloadedUsers: User[] = [];

    /**
     * Gets the user details from the database and applies it to all bugs submitted by that person.
     * @param userid 
     * @param id 
     */
    getUserDetails(userid: string, id: string): void {
        // query the db for the user details...
        this.db.getUserName(userid).subscribe((result: DocumentSnapshot<User>) => {
            let user: User = result.data();
            // update all reportd with the user id...
            this.bugs.forEach((reportSet: { category: string, report: BugData[] }) => {
                reportSet.report.forEach((rep: BugData) => {
                    if(rep.user === userid) {
                        rep.user = user;
                        rep.user['id'] = result.id;
                    }
                })
            });
            // and update the downloadedUsers with this user if they dont already exist (which they shouldn't but in case...)
            let found: User = this.downloadedUsers.find((temp: User) => temp.id === userid);

            if(!found) {
                this.downloadedUsers.push(user);
            }
        })
    }

}
