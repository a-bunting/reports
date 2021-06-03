import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  constructor(private fAuth: AngularFireAuth) { }

  signup(email: string, password: string) {
      return  this.fAuth.createUserWithEmailAndPassword(email, password).then((result) => {
          console.log(result);
      });
  }

  login(email: string, password: string) {
      return this.fAuth.signInWithEmailAndPassword(email, password).then((result) => {
          console.log(result);
      }).catch((error) => { 
          console.log(typeof error);
          this.handleError(error); 
        })
    }
    
    logout() {
        return this.fAuth.signOut().then((result) => {
            console.log(result);
        }).catch(error => {
          console.log(typeof error); 
      });
  }

  /**
     * handles any errors output from the login or signup functions
     * @param errorResponse 
     * @returns 
     */
   private handleError(errorResponse: HttpErrorResponse) {

    let errorMessage = 'An Unknown Error Occurred!';

    if(!errorResponse.error || !errorResponse.error.error) {
        return throwError(errorMessage);
    } else {
        
        switch(errorResponse.error.error.message) {
            case 'EMAIL_EXISTS':
                errorMessage = "This email address exists already.";
                break;
            case 'TOO_MANY_ATTEMPTS_TRY_LATER':
                errorMessage = "You have attempted to signup too many times, please try again later.";
                break;
            case 'EMAIL_NOT_FOUND':
            case 'INVALID_PASSWORD':
                errorMessage = "Either the username or password entered is invalid";
                break;
            case 'USER_DISABLED':
                errorMessage = "Your account has been locked. Please contact your school administrator.";
                break;
            default:
                errorMessage = "An error occurred, please try again later.";
                break;
        }
    }
    return throwError(errorMessage);
}
}
