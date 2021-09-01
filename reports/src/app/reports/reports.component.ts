import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReportsService, ReportTemplate } from '../services/reports.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {

    reports: ReportTemplate[] = [];

    constructor(private reportsService: ReportsService, private router: Router) { }

    ngOnInit(): void {
        // load the reports into the menu
        this.reportsService.getReports().subscribe((data: ReportTemplate[]) => {
            this.reports = data;
        }, error => {
            console.log(`Error: ${error}`);
        })
    }

    /**
     * Load an individual report navigating to the edit page.
     * @param id 
     */
    loadReport(id: string): void {
        if(id !== undefined) {
            this.router.navigate(['/reports/edit-report/' + id]);
        }
    }


}
