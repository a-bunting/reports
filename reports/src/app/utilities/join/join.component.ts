import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-join',
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.scss']
})
export class JoinComponent implements OnInit {

    showPaymentPane: boolean = false;

    constructor() { }

    ngOnInit(): void {
    }

    togglePayment(): void {
        this.showPaymentPane = !this.showPaymentPane;
    }

    paymentOptions: { period: number, cost: number }[] = [
        { period: 6, cost: 9 },
        { period: 12, cost: 15 }
    ];
    paymentStage: number = 1;
    paymentSelected: { period: number, cost: number } = { period: 0, cost: 0 };

    selectPaymentPlan(months: number, cost: number): void {
        this.paymentSelected = { period: months, cost: cost };
        this.paymentStage = 2;
    }

}
