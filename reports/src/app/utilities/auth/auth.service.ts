import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { BehaviorSubject, Subject, throwError } from 'rxjs';
import { User } from './user.model';
import { Router } from '@angular/router';

export interface AuthResponseData {
    kind: string, idToken: string, email: string, 
    refreshToken: string, expiresIn: string , localId: string, 
    registered?: boolean
}

@Injectable({
  providedIn: 'root'
})

export class AuthService {

//     user = new BehaviorSubject<User>(null);

//     constructor(private http: HttpClient, private router: Router) { }

//     signup(email: string, password: string) {
//         return this.http
//         .post<AuthResponseData>
//             ('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyDXKjaAfbhqtBxU260olbM2shTrUYqBfYs', 
//             {   email: email, 
//                 password: password, 
//                 returnSecureToken: true
//             }
//             ).pipe(catchError(this.handleError), tap(responseData => {
//                 // in reality signup might be very different but this is the basic sign up data....
//                 this.handleAuthentication(responseData.email, responseData.localId, responseData.idToken, +responseData.expiresIn);
//             }));
//     }

//     login(email: string, password: string) {
//         return this.http
//             .post<AuthResponseData>
//             ('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDXKjaAfbhqtBxU260olbM2shTrUYqBfYs', 
//             {   email: email, 
//                 password: password, 
//                 returnSecureToken: true
//             }
//             ).pipe(catchError(this.handleError), tap(responseData => {
//                 this.handleAuthentication(responseData.email, responseData.localId, responseData.idToken, +responseData.expiresIn);
//             }));
//     }

//     autoLogin() {
//         const userData: {
//             email: string;
//             id: string;
//             name: string;
//             _token: string;
//             _tokenExpirationDate: string;
//         } = JSON.parse(localStorage.getItem('userData'));

//         if(!userData) {
//             return;
//         }

//         const loadedUser = new User(userData.email, userData.id, userData.name, userData._token, new Date(userData._tokenExpirationDate));

//         if(loadedUser.token) {
//             this.user.next(loadedUser);

//             // set the auto logout feature
//             const expirationDuration = new Date(userData._tokenExpirationDate).getTime() - new Date().getTime();
//             this.autoLogout(expirationDuration);
//         }
//     }

//     private logoutTimer: number;

//     autoLogout(expirationDuration: number) {
//         this.logoutTimer = setTimeout(() => {
//             this.logout();
//         }, expirationDuration);
//     }

//     /**
//      * Log the user out...
//      */
//     logout() {
//         this.user.next(null);
//         this.router.navigate(['/auth']); // redirect to login.
//         localStorage.removeItem('userData');
        
//         if(this.logoutTimer) {
//             clearTimeout(this.logoutTimer);
//         }

//         this.logoutTimer = null;
//     }

//     /**
//      * Handles the authentication of the user and sets the user data
//      * @param email 
//      * @param userId 
//      * @param token 
//      * @param expiresIn 
//      */
//     private handleAuthentication(email: string, userId: string, name: string, token: string, expiresIn: number) {
//         const expirationDate = new Date(new Date().getTime() + +expiresIn * 1000);
//         const user = new User(email, userId, name, token, expirationDate);
//         this.autoLogout(expiresIn * 1000);
//         this.user.next(user);

//         // persistence using local storage
//         localStorage.setItem('userData', JSON.stringify(user));
//     }

//     /**
//      * handles any errors output from the login or signup functions
//      * @param errorResponse 
//      * @returns 
//      */
//     private handleError(errorResponse: HttpErrorResponse) {

//         let errorMessage = 'An Unknown Error Occurred!';

//         if(!errorResponse.error || !errorResponse.error.error) {
//             return throwError(errorMessage);
//         } else {
            
//             switch(errorResponse.error.error.message) {
//                 case 'EMAIL_EXISTS':
//                     errorMessage = "This email address exists already.";
//                     break;
//                 case 'TOO_MANY_ATTEMPTS_TRY_LATER':
//                     errorMessage = "You have attempted to signup too many times, please try again later.";
//                     break;
//                 case 'EMAIL_NOT_FOUND':
//                 case 'INVALID_PASSWORD':
//                     errorMessage = "Either the username or password entered is invalid";
//                     break;
//                 case 'USER_DISABLED':
//                     errorMessage = "Your account has been locked. Please contact your school administrator.";
//                     break;
//                 default:
//                     errorMessage = "An error occurred, please try again later.";
//                     break;
//             }
//         }
//         return throwError(errorMessage);
//     }
}
