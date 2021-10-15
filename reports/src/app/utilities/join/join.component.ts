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

}
