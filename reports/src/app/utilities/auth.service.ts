import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { Subject, throwError } from 'rxjs';
import { User } from './auth/user.model';

export interface AuthResponseData {
    kind: string, idToken: string, email: string, 
    refreshToken: string, expiresIn: string , localId: string, 
    registered?: boolean
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

    user = new Subject<User>();

  constructor(private http: HttpClient) { }

  signup(email: string, password: string) {
      return this.http
      .post<AuthResponseData>
        ('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyDXKjaAfbhqtBxU260olbM2shTrUYqBfYs', 
        {   email: email, 
            password: password, 
            returnSecureToken: true
        }
        ).pipe(catchError(this.handleError), tap(responseData => {
            // in reality signup might be very different but this is the basic sign up data....
            this.handleAuthentication(responseData.email, responseData.localId, responseData.idToken, +responseData.expiresIn);
        }));
  }

  login(email: string, password: string) {
    return this.http
        .post<AuthResponseData>
        ('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDXKjaAfbhqtBxU260olbM2shTrUYqBfYs', 
        {   email: email, 
            password: password, 
            returnSecureToken: true
        }
        ).pipe(catchError(this.handleError), tap(responseData => {
            this.handleAuthentication(responseData.email, responseData.localId, responseData.idToken, +responseData.expiresIn);
        }));
  }

  private handleAuthentication(email: string, userId: string, token: string, expiresIn: number) {
    const expirationDate = new Date(new Date().getTime() + +expiresIn * 1000);
    const user = new User(email, userId, token, expirationDate);
    this.user.next(user);
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
