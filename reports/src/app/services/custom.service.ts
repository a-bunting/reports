import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthenticationService } from '../utilities/authentication/authentication.service';
import { User } from '../utilities/authentication/user.model';

@Injectable({
  providedIn: 'root'
})
export class CustomService {

    greaterTooltipsFlag: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    // counters for trials
    groupQuantity: number;
    templateQuantity: number;
    reportsQuantity: number;
    reportsGenerated: number = 0;

    // max values for trials
    groupMax: number = 200;
    templateMax: number = 300;
    reportsMax: number = 300;
    reportsGeneratedWithinTimeframe: number = 50000;
    reportsGeneratedTimeframeDays: number = 0.00001; // small so it repeatedly deletes all the old timestamps for now...

    //
    user: User;

    constructor(private userService: AuthenticationService) {
        this.userService.user.subscribe((user: User) => {
            this.user = user;
        })
    }

    public toggleGreaterTooltips(): void {
        let currentValue: boolean = this.greaterTooltipsFlag.value;
        this.greaterTooltipsFlag.next(!currentValue);
    }

    // set and get number of groups...
    setNumberOfGroups(val: number, inc?: number): void { this.groupQuantity = !inc ? val : val + inc; }
    getNumberOfGroups(): number { return this.groupQuantity; }
    public allowGroupCreation(): boolean { return this.groupQuantity < this.groupMax || this.user.member }
    // set and get number of templates...
    setNumberOfTemplates(val: number, inc?: number): void { this.templateQuantity = !inc ? val : val + inc; }
    getNumberOfTemplates(): number { return this.templateQuantity; }
    public allowTemplateCreation(): boolean { return this.templateQuantity < this.templateMax || this.user.member}
    // set and get number of reports...
    setNumberOfReports(val: number, inc?: number): void { this.reportsQuantity = !inc ? val : val + inc; }
    getNumberOfReports(): number { return this.reportsQuantity; }
    public allowReportCreation(): boolean { return this.reportsQuantity < this.reportsMax || this.user.member}
    // set and get number of reports generated...
    setNumberOfReportsGenerated(val: number, inc?: number): void { this.reportsGenerated = !inc ? val : val + inc; }
    incrementNumberOfReportsGenerated(inc: number): void { this.reportsGenerated++; }
    getNumberOfReportsGenerated(): number { return this.reportsGenerated; }
    getNumberOfReportsGeneratedTimeFrame(): number { return this.reportsGeneratedTimeframeDays; }

    // reports on whether within the timeframe more or less reports have been generated as is allowed...
    public allowReportGenerate(): boolean { return (this.reportsGenerated < this.reportsGeneratedWithinTimeframe) || this.user.member; }

}
