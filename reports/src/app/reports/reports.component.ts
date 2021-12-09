import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ReportsService, ReportTemplate } from '../services/reports.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {

    reports: ReportTemplate[] = [];
    isLoading: boolean = true;
    reportId: string;

    // parameters and loading individual report sets
    paramObservable: Subscription;

    constructor(
        private reportsService: ReportsService, 
        private activeRouter: ActivatedRoute, 
        private router: Router 
    ) { }

    ngOnInit(): void {
        // load the reports into the menu
        this.reportsService.getReports().subscribe((data: ReportTemplate[]) => {
            this.reports = data;
            this.isLoading = false;
        }, error => {
            this.isLoading = false;
            console.log(`Error: ${error}`);
        })
        this.initiateParameterWatcher();
    }

    paramSubscription: Subscription;

    initiateParameterWatcher(): void {
        // wont work for a new report so fire whenever a new report is loaded.
        if(this.activeRouter.children.length > 0) {
            this.paramSubscription = this.activeRouter.firstChild.params.subscribe((param: Params) => { this.reportId = param.id;  })
        }
    }

    /**
     * Load an individual report navigating to the edit page.
     * @param id 
     */
    loadReport(id: string): void {
        if(id !== undefined) {
            this.reportId = id;
            this.router.navigate(['/reports/edit-report/' + id]);
            this.initiateParameterWatcher();
        }
    }
    /**
     * Deletes this report from the database...
     */
    deleteFromDatabase(): void {
        console.log("here");
        this.reportsService.deleteReport(this.reportId).subscribe({
            next: (result: boolean) => {
                console.log("report deleted");
                this.router.navigate(['/reports']);
        }, error: (error) => {
                console.log(`Report not deleted: ${error}`);
        }})
    }

    duplicateReport(): void {
        console.log("duplicating");
        this.reportsService.duplicateReport(this.reportId);
    }

    /**
     * simply removes the reportid
     */
    generateNew(): void { this.reportId = undefined; }

}
