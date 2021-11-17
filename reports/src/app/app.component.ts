import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthenticationService } from './utilities/authentication/authentication.service';
import { User } from './utilities/authentication/user.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {

    isAuthenticated: boolean = false;
    isMember: boolean = false;
    isAdmin: boolean = false; // change to false once integrated fully.
    user: User;
    authForm: NgForm;
    forgotPassword: boolean = false;

    constructor(private authService: AuthenticationService) {}

    ngOnInit() {
        this.authService.autoLogin();

        this.authService.user.subscribe((user: User) => {
            this.isAuthenticated = !!user;
            if(user) {
                this.isMember = user.member;
                this.isAdmin = user.admin;
                this.user = user;
            } else {
                this.user = undefined;
                this.isAuthenticated = false;
                this.isAdmin = false;
            }
        });
    }

    logout() {
        this.authService.logout().pipe(take(1)).subscribe(result => {
            console.log("logged out");
        }, error => {
            console.log(`Error logging out: ${error.message}`);
        });
    }

    isLoading: boolean = false;
    errorMessage: string;

    onSubmit(form: NgForm) {

        if(!form.valid) {
            console.log("invalid form");
            return;
        }
        
        this.isLoading = true;
        const email = form.value.email;
        const password = form.value.password;
    
        let authObs: Observable<any> = this.authService.login3(email, password);
    
        authObs.subscribe((responseData: any) => {
            this.isLoading = false;
        }, 
        errorMessage => {
            console.log(`Error logging in: ${errorMessage}`);
            this.errorMessage = errorMessage;
            this.isLoading = false;
        })
    }

    removeErrorMessage(): void {
        this.errorMessage = undefined;
    }

    toggleForgot(): void {
        this.forgotPassword = !this.forgotPassword;
    }

    passwordResetSentSuccessfully: boolean = false

    // QUESTION: HOW TO DEAL WITH THIS? WHAT IF IT GOES WRONG?

    sendPasswordResetEmail(): void {
        this.isLoading = true;       
        
        let email: string = document.getElementById('email').innerText;
        
        this.authService.sendPasswordResetEmail(email).subscribe((result: boolean) => {
            this.isLoading = false;        
            this.passwordResetSentSuccessfully = true;
            // giv eit 5 seconds to display and then take it away
            setTimeout(() => {
                this.passwordResetSentSuccessfully = false;
            }, 5000);
        }, error => {
            this.isLoading = false;        
            this.errorMessage = `Error: ${error}`;
        });
    }
}
