import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthService, AuthResponseData } from '../auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})

export class AuthComponent implements OnInit {

  constructor(private authService: AuthService) { }

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

    let authObs: Observable<AuthResponseData>;
    
    if(!this.isLoginMode) {
        // new user mode
        authObs = this.authService.signup(email, password);
    } else {
        // login mode...
        authObs = this.authService.login(email, password);
    }

    authObs.subscribe(responseData => {
        this.isLoading = false;
    }, 
    errorMessage => {
        this.error = errorMessage;
        this.isLoading = false;
    })
    
    form.reset();
}

}
