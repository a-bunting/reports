import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DocumentReference } from 'rxfire/firestore/interfaces';
import { Subscription, take, tap } from 'rxjs';
import { CustomService } from '../services/custom.service';
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
        private router: Router, 
        public customService: CustomService
    ) { }

    ngOnInit(): void {
        // load the reports into the menu
        this.reportsService.getReports().subscribe({
            next: (data: ReportTemplate[]) => {
                this.reports = data;
                this.isLoading = false;
        },  error: (error) => {
                this.isLoading = false;
                console.log(`Error: ${error}`);
        }})
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
        this.reportsService.deleteReport(this.reportId).subscribe({
            next: (result: boolean) => {
                this.reportId = undefined;
                this.router.navigate(['/reports']);
        }, error: (error) => {
                console.log(`Report not deleted: ${error}`);
        }})
    }

    duplicateReport(): void {

        let reportDuplicate: ReportTemplate;

        this.reportsService.getReport(this.reportId).pipe(take(1)).subscribe({
            next: (report: ReportTemplate) => {
                reportDuplicate = { ...report };

                // now add to the database...
                this.reportsService.duplicateReport(reportDuplicate).subscribe({
                    next: (newDoc: DocumentReference<any>) => {
                        this.loadReport(newDoc.id);
                    }
                })
            }
        })
    }

    /**
     * simply removes the reportid
     */
    generateNew(): void { this.reportId = undefined; }

}
