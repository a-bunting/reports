import { Component, OnInit } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { IPayPalConfig, ICreateOrderRequest } from 'ngx-paypal';
import { mergeMap, Observable, take } from 'rxjs';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { User } from '../authentication/user.model';

@Component({
  selector: 'app-join',
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.scss']
})
export class JoinComponent implements OnInit {

    public payPalConfig?: IPayPalConfig;
    showPaymentPane: boolean = false;

    user: User;

    constructor(
      private fFunctions: AngularFireFunctions,
      private authService: AuthenticationService
      ) {
        // subscribe to the user..
        this.authService.user.subscribe((user: User) => this.user = user );
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

    testfunction(): void {
      const headers: Headers = new Headers();
      headers.append('Authorization', 'Basic AU156owG9pH3HWD6OQbRgk_KhVs0Ne5Mh3kknwJYYjcIFeZ8sswDvhgA_WqDgAxDYDW8bbcp_IWQVCZ8:EL2PnzL0Oe1gvPKwgmsMz2t0J8T1672TlLIo2JYMNUBVsfq4m3Qgc-0deoATB6FGGVOhKpCIW_vowGRi');
      headers.append('Content-Type', 'application/json');

      fetch(`https://api.sandbox.paypal.com/v2/checkout/orders/06V622347U0470228`, { method: 'GET', headers: { Content: 'application/json', Authorization: 'Basic AU156owG9pH3HWD6OQbRgk_KhVs0Ne5Mh3kknwJYYjcIFeZ8sswDvhgA_WqDgAxDYDW8bbcp_IWQVCZ8:EL2PnzL0Oe1gvPKwgmsMz2t0J8T1672TlLIo2JYMNUBVsfq4m3Qgc-0deoATB6FGGVOhKpCIW_vowGRi'} })
      // fetch(`https://api.sandbox.paypal.com/v2/checkout/orders/06V622347U0470228`, { method: 'GET', headers: { Content: 'application/json', Authorization: 'Bearer A21AAL7FxZQgbzP4bQCJe8yjBS6nkqEbF7gpDCcrbWjGMBixrSLCZRFSllSlg0diJKR65So03oSlYy9ziRgPri5ibELfFKzKw'} })
      .then((response) => {
        // check if the payment is actual and the same as the user details, and if so then this is a proper
        // transaction and the user can be credited with time on their account.
        console.log(response);
        return response;
      })
      .catch((error) => {
        console.log(error);
        return `Nope:` + error.message;
      });
    }

    /**
     * PAY PAL STUFF
     *
     * @param cost
     * @param duration
     */
    // AU156owG9pH3HWD6OQbRgk_KhVs0Ne5Mh3kknwJYYjcIFeZ8sswDvhgA_WqDgAxDYDW8bbcp_IWQVCZ8
    // https://www.npmjs.com/package/ngx-paypal
    // https://developer.paypal.com/docs/checkout/integration-features/customize-button/

    private initConfig(cost: number, duration: number, subscription: boolean = false): void {
        this.payPalConfig = {
            currency: 'USD',
            clientId: 'AU156owG9pH3HWD6OQbRgk_KhVs0Ne5Mh3kknwJYYjcIFeZ8sswDvhgA_WqDgAxDYDW8bbcp_IWQVCZ8',
            createOrderOnClient: (data) => <ICreateOrderRequest>{
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: 'USD',
                        value: ''+cost,
                        breakdown: { item_total: { currency_code: 'USD', value: ''+cost } }
                    },
                    items: [{
                        name: duration + ' month pro access.',
                        quantity: '1',
                        category: 'DIGITAL_GOODS',
                        unit_amount: { currency_code: 'USD', value: ''+cost }
                    }]
                }]
            },
            advanced: { commit: 'true' },
            style: { label: 'paypal', layout: 'horizontal', shape: 'pill', tagline: false },
            onApprove: (data, actions) => {
                console.log('onApprove - transaction was approved, but not authorized', data, actions);

                actions.order.get().then(details => {

                  console.log('onApprove - you can get full order details inside onApprove: ', data, actions, details);
                  // trigger the server function which will add the duration to the users transaction list.
                  // const userJoinSuccess = this.fFunctions.httpsCallable('userJoinSuccess');

                  // return userJoinSuccess({ uid: this.user.id, plan: duration }).pipe(take(1), mergeMap(() => {
                  //   return null;
                  // }));
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
              }
        }
    }


}

// response
// onApprove - transaction was approved, but not authorized
// {
//   "orderID": "9CS6989657546415E",
//   "payerID": "J4URAT5XNAQVQ",
//   "paymentID": null,
//   "billingToken": null,
//   "facilitatorAccessToken": "A21AAL7FxZQgbzP4bQCJe8yjBS6nkqEbF7gpDCcrbWjGMBixrSLCZRFSllSlg0diJKR65So03oSlYy9ziRgPri5ibELfFKzKw",
//   "paymentSource": "paypal"
// }

// onApprove - you can get full order details inside onApprove:
// {
//   "orderID": "9CS6989657546415E",
//   "payerID": "J4URAT5XNAQVQ",
//   "paymentID": null,
//   "billingToken": null,
//   "facilitatorAccessToken": "A21AAL7FxZQgbzP4bQCJe8yjBS6nkqEbF7gpDCcrbWjGMBixrSLCZRFSllSlg0diJKR65So03oSlYy9ziRgPri5ibELfFKzKw",
//   "paymentSource": "paypal"
// }

// {
//   "order": {},
//   "payment": null
// }

// {
//   "id": "9CS6989657546415E",
//   "intent": "CAPTURE",
//   "status": "APPROVED",
//   "purchase_units": [
//     {
//       "reference_id": "default",
//       "amount": {
//         "currency_code": "USD",
//         "value": "9.00",
//         "breakdown": {
//           "item_total": {
//             "currency_code": "USD",
//             "value": "9.00"
//           }
//         }
//       },
//       "payee": {
//         "email_address": "sb-bzgwu8279087@business.example.com",
//         "merchant_id": "V38HV6B7VT242"
//       },
//       "items": [
//         {
//           "name": "6 month pro access.",
//           "unit_amount": {
//             "currency_code": "USD",
//             "value": "9.00"
//           },
//           "quantity": "1",
//           "category": "DIGITAL_GOODS"
//         }
//       ],
//       "shipping": {
//         "name": {
//           "full_name": "John Doe"
//         },
//         "address": {
//           "address_line_1": "Whittaker House",
//           "address_line_2": "2 Whittaker Avenue",
//           "admin_area_2": "Richmond",
//           "admin_area_1": "Surrey",
//           "postal_code": "TW9 1EH",
//           "country_code": "GB"
//         }
//       }
//     }
//   ],
//   "payer": {
//     "name": {
//       "given_name": "John",
//       "surname": "Doe"
//     },
//     "email_address": "sb-ac7ti8277600@personal.example.com",
//     "payer_id": "J4URAT5XNAQVQ",
//     "address": {
//       "country_code": "GB"
//     }
//   },
//   "create_time": "2022-04-26T09:38:26Z",
//   "links": [
//     {
//       "href": "https://api.sandbox.paypal.com/v2/checkout/orders/9CS6989657546415E",
//       "rel": "self",
//       "method": "GET"
//     },
//     {
//       "href": "https://api.sandbox.paypal.com/v2/checkout/orders/9CS6989657546415E",
//       "rel": "update",
//       "method": "PATCH"
//     },
//     {
//       "href": "https://api.sandbox.paypal.com/v2/checkout/orders/9CS6989657546415E/capture",
//       "rel": "capture",
//       "method": "POST"
//     }
//   ]
// }

// onClientAuthorization - you should probably inform your server about completed transaction at this point

// {
//   "id": "9CS6989657546415E",
//   "intent": "CAPTURE",
//   "status": "COMPLETED",
//   "purchase_units": [
//     {
//       "reference_id": "default",
//       "amount": {
//         "currency_code": "USD",
//         "value": "9.00",
//         "breakdown": {
//           "item_total": {
//             "currency_code": "USD",
//             "value": "9.00"
//           },
//           "shipping": {
//             "currency_code": "USD",
//             "value": "0.00"
//           },
//           "handling": {
//             "currency_code": "USD",
//             "value": "0.00"
//           },
//           "insurance": {
//             "currency_code": "USD",
//             "value": "0.00"
//           },
//           "shipping_discount": {
//             "currency_code": "USD",
//             "value": "0.00"
//           }
//         }
//       },
//       "payee": {
//         "email_address": "sb-bzgwu8279087@business.example.com",
//         "merchant_id": "V38HV6B7VT242"
//       },
//       "description": "6 month pro access.",
//       "soft_descriptor": "PAYPAL *TEST STORE",
//       "items": [
//         {
//           "name": "6 month pro access.",
//           "unit_amount": {
//             "currency_code": "USD",
//             "value": "9.00"
//           },
//           "tax": {
//             "currency_code": "USD",
//             "value": "0.00"
//           },
//           "quantity": "1"
//         }
//       ],
//       "shipping": {
//         "name": {
//           "full_name": "John Doe"
//         },
//         "address": {
//           "address_line_1": "Whittaker House",
//           "address_line_2": "2 Whittaker Avenue",
//           "admin_area_2": "Richmond",
//           "admin_area_1": "Surrey",
//           "postal_code": "TW9 1EH",
//           "country_code": "GB"
//         }
//       },
//       "payments": {
//         "captures": [
//           {
//             "id": "1EA32385CT184531L",
//             "status": "COMPLETED",
//             "amount": {
//               "currency_code": "USD",
//               "value": "9.00"
//             },
//             "final_capture": true,
//             "seller_protection": {
//               "status": "ELIGIBLE",
//               "dispute_categories": [
//                 "ITEM_NOT_RECEIVED",
//                 "UNAUTHORIZED_TRANSACTION"
//               ]
//             },
//             "create_time": "2022-04-26T09:39:50Z",
//             "update_time": "2022-04-26T09:39:50Z"
//           }
//         ]
//       }
//     }
//   ],
//   "payer": {
//     "name": {
//       "given_name": "John",
//       "surname": "Doe"
//     },
//     "email_address": "sb-ac7ti8277600@personal.example.com",
//     "payer_id": "J4URAT5XNAQVQ",
//     "address": {
//       "country_code": "GB"
//     }
//   },
//   "create_time": "2022-04-26T09:38:26Z",
//   "update_time": "2022-04-26T09:39:50Z",
//   "links": [
//     {
//       "href": "https://api.sandbox.paypal.com/v2/checkout/orders/9CS6989657546415E",
//       "rel": "self",
//       "method": "GET"
//     }
//   ]
// }

