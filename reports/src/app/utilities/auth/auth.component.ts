import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { from, Observable } from 'rxjs';
import { AuthenticationService } from '../authentication/authentication.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})

export class AuthComponent implements OnInit {

    constructor(private authService: AuthenticationService, private router: Router) { }

    ngOnInit(): void {

    }

    isLoading: boolean = false;
    error: string = null;

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
}
