import { Component, OnInit } from '@angular/core';
import { IPayPalConfig, ICreateOrderRequest } from 'ngx-paypal';

@Component({
  selector: 'app-join',
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.scss']
})
export class JoinComponent implements OnInit {

    public payPalConfig?: IPayPalConfig;
    showPaymentPane: boolean = false;

    constructor() { 
    }

    ngOnInit(): void {
    }

    showSuccess: boolean = false;

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
        this.initConfig(cost, months);
        this.paymentStage = 2;
    }

    /**
     * PAY PAL STUFF
     * 
     * @param cost 
     * @param duration 
     */
    //AU156owG9pH3HWD6OQbRgk_KhVs0Ne5Mh3kknwJYYjcIFeZ8sswDvhgA_WqDgAxDYDW8bbcp_IWQVCZ8
    // https://www.npmjs.com/package/ngx-paypal
    // https://developer.paypal.com/docs/checkout/integration-features/customize-button/

    private initConfig(cost: number, duration: number, subscription: boolean = false): void {
        this.payPalConfig = {
            currency: 'USD', 
            clientId: 'sb', 
            createOrderOnClient: (data) => <ICreateOrderRequest>{
                intent: 'CAPTURE', 
                purchase_units: [
                    {
                        amount: {
                            currency_code: 'USD', 
                            value: ''+cost, 
                            breakdown: {
                                item_total: {
                                    currency_code: 'USD', 
                                    value: ''+cost
                                }
                            }
                        },
                        items: [
                            {
                                name: duration + ' month pro access.', 
                                quantity: '1', 
                                category: 'DIGITAL_GOODS',
                                unit_amount: {
                                    currency_code: 'USD', 
                                    value: ''+cost
                                }
                            }
                        ]
                    }
                ]
            }, 
            advanced: {
                commit: 'true'
            },
            style: {
                label: 'paypal', 
                layout: 'horizontal',
                shape: 'pill', 
                tagline: false
                
            }, 
            onApprove: (data, actions) => {
                console.log('onApprove - transaction was approved, but not authorized', data, actions);
                actions.order.get().then(details => {
                  console.log('onApprove - you can get full order details inside onApprove: ', details);
                });
              },
              onClientAuthorization: (data) => {
                console.log('onClientAuthorization - you should probably inform your server about completed transaction at this point', data);
                this.showSuccess = true;
              },
              onCancel: (data, actions) => {
                console.log('OnCancel', data, actions);
              },
              onError: err => {
                console.log('OnError', err);
              },
              onClick: (data, actions) => {
                console.log('onClick', data, actions);
              }, 
              createSubscription: (data) => {

              }
        }
    }


}
