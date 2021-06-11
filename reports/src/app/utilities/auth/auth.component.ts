import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { from, Observable } from 'rxjs';
import { AuthenticationService } from '../authentication/authentication.service';
import { AuthService, AuthResponseData } from './auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})

export class AuthComponent implements OnInit {


    
  constructor(private authService: AuthenticationService, private router: Router) { }

  ngOnInit(): void {
  }

  isLoginMode: boolean = true;
  isLoading: boolean = false;
  error: string = null;

  onSwitchMode() { this.isLoginMode = !this.isLoginMode; }

  clearError() {
      this.error = null;
  }

  onSubmit(form: NgForm) {

    if(!form.valid) {
        console.log("invalid form");
        return;
    }
    
    this.isLoading = true;
    const email = form.value.email;
    const password = form.value.password;
    const name = form.value.name;

    let authObs: Observable<any>;
    
    if(!this.isLoginMode) {
        // new user mode
        authObs = from(this.authService.signup(email, password, name));
    } else {
        // login mode...
        authObs = this.authService.login2(email, password);
    }

    authObs.subscribe((responseData: any) => {
        console.log("here");
        this.isLoading = false;
    }, 
    errorMessage => {
        console.log("no here");
        this.error = errorMessage;
        this.isLoading = false;
    })
    
    form.reset();
}

}
