import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {

    constructor(
        private activatedRoute: ActivatedRoute, 
        private fAuth: AngularFireAuth, 
    ) { }

    oobCode: string;
    state: boolean;
    isLoading: boolean = false;    

    ngOnInit(): void {
        this.verifyEmailAddress(this.activatedRoute.snapshot.queryParams['oobCode']);
    }

    verifyEmailAddress(code: string): void {
        this.isLoading = true;
        this.fAuth.applyActionCode(code).then(() => {
            // success
            this.state = true;
            this.isLoading = false;
        }, error => {
            // failure
            this.state = false;
            this.isLoading = false;
        })   
    }

}
