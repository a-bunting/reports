import { Component, OnInit } from '@angular/core';
import { DatabaseService } from 'src/app/services/database.service';

@Component({
  selector: 'app-bugreport',
  templateUrl: './bugreport.component.html',
  styleUrls: ['./bugreport.component.scss']
})
export class BugreportComponent implements OnInit {

    reportActive: boolean = true;
    submitting: boolean = false;
    submitted: boolean = false;

    constructor(private db: DatabaseService) { }

    ngOnInit(): void {
    }

    submitReportToggle(state: boolean): void {
        this.reportActive = state;
    }

}
