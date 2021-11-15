import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { from, Observable } from 'rxjs';
import { AuthenticationService } from '../authentication/authentication.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})

export class AuthComponent implements OnInit {

    constructor(public authService: AuthenticationService, private router: Router, private titleService: Title) { }

    ngOnInit(): void {
        this.titleService.setTitle(`Reports - Register`);
    }

    isLoading: boolean = false;
    error: string = null;
    termsSelected: boolean = false;
    privacySelected: boolean = false;
    authForm: NgForm;

    clearError() {
        this.error = undefined;
    }

    onSubmit(form: NgForm) {

        if(!form.valid) {
            console.log("invalid form");
            return;
        }
        
        this.isLoading = true;
        const email = form.value.registerEmail;
        const password = form.value.registerPassword;
        const name = form.value.registerName;

        let authObs: Observable<any>  = from(this.authService.signup(email, password, name));

        authObs.subscribe((responseData: any) => {
            this.isLoading = false;
        }, 
        errorMessage => {
            this.error = errorMessage;
            this.isLoading = false;
        })
        
        form.reset();
    }

    GoogleAuth(): void {
        this.authService.GoogleAuth();
    }

    showTerms: boolean = false;
    showPrivacy: boolean = false;

    toggleText(terms: boolean, privacy: boolean): void { 
        this.showTerms = terms ? this.showTerms ? false : true : false;
        this.showPrivacy = privacy ? this.showPrivacy ? false : true : false; 
    }
}
