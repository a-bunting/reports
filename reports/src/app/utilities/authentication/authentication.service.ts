import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, from, Observable, throwError } from 'rxjs';
import { catchError, take, tap } from 'rxjs/operators';
import { DatabaseService } from 'src/app/services/database.service';
import { User } from '../auth/user.model';

export interface AuthResponseData {
    kind: string, idToken: string, email: string, 
    refreshToken: string, expiresIn: string , localId: string, 
    registered?: boolean
}

@Injectable({
  providedIn: 'root'
})

export class AuthenticationService {

    user = new BehaviorSubject<User>(null);

    constructor(private fAuth: AngularFireAuth, private firebase: AngularFirestore, private router: Router, private db: DatabaseService) {
        
    }

    signup(email: string, password: string, name: string): Observable<any> {
        return from(this.fAuth.createUserWithEmailAndPassword(email, password).then())
        .pipe(catchError(this.handleError), tap(result => {
            result.user.getIdToken(true).then((token: string) => {
                this.handleAuthentication(
                    result.user.email, 
                    result.user.uid,
                    name,
                    token 
                );

                console.log(`${result.user.uid}`);

                // add the user to the users database:
                from(this.firebase.collection('users').doc(result.user.uid).set({
                    email: email,
                    name: name
                })
                .catch((error) => {
                    console.log(`Error: ${error.message}`);
                }))
                .pipe(take(1)).subscribe(response => {
                    // response from server
                    console.log("success");
                })
            })
        }));
    }

    login(email: string, password: string): Observable<any> {
        return from(this.fAuth.signInWithEmailAndPassword(email, password).then(result => {
            // get the id token to authenticate and store...
            console.log(result.user.uid);
            
            this.firebase.collection('users').doc(result.user.uid).get().pipe(take(1)).subscribe((doc: any) => {
                // get the token and handle authentication...
                result.user.getIdToken(true).then((token: string) => {
                    this.handleAuthentication(
                        result.user.email, 
                        result.user.uid,
                        doc.data().name,
                        token 
                    );
                }).catch(error => {
                    console.log(`Error: ${error.message}`);    
                });
            })
        }).catch(error => {
            console.log(`Error: ${error.message}`);    
        }));
    }
    
    logout(): Observable<any> {
        return from(this.fAuth.signOut().then((result) => {
            localStorage.removeItem('userData');
            this.user.next(null);
            this.router.navigate(['/auth']);
        }).catch(error => {
            console.log(`An error occurred during logout: ${error.message}`); 
      }))
    }

    autoLogin() {

        const userData: {
            email: string;
            id: string;
            name: string;
            _token: string;
            _tokenExpirationDate: string;
        } = JSON.parse(localStorage.getItem('userData'));

        if(!userData) {
            return;
        }

        // any buggey behaviours that might happen? Two ways of collecting the data...
        // this.fAuth.onAuthStateChanged(user => {
        //     if(user) {
        //         console.log(`user from db: ${user.email}`);
        //         console.log(`user from local: ${userData.email}`);
        //     }
        // })

        const loadedUser = new User(userData.email, userData.id, userData.name, userData._token, new Date(userData._tokenExpirationDate));
        
        if(loadedUser.token) {
            this.user.next(loadedUser);

            this.db.getUsers();

            // set the auto logout feature
            const expirationDuration = new Date(userData._tokenExpirationDate).getTime() - new Date().getTime();
            this.autoLogout(expirationDuration);
        }
    }

    /**
     * Auto logout feature
     * @param expirationDuration Auto logs out user after this time
     */
     private logoutTimer: number;

     autoLogout(expirationDuration: number) {
         this.logoutTimer = setTimeout(() => {
             this.logout();
         }, expirationDuration);
     }

    /**
     * Handles the authentication of the user and sets the user data
     * @param email 
     * @param userId 
     * @param token 
     * @param expiresIn 
     */
    private handleAuthentication(email: string, userId: string, name: string, token: string): void {
        const expirationDate = new Date(new Date().getTime() + (3600 * 1000));
        const user = new User(email, userId, name, token, expirationDate);
        this.autoLogout(3600 * 1000);
        this.user.next(user);

        // // get user data
        // this.db.getUsers();

        // persistence using local storage
        localStorage.setItem('userData', JSON.stringify(user));
        this.router.navigate(['/dashboard']);
    }

  /**
     * handles any errors output from the login or signup functions
     * @param errorResponse 
     * @returns 
     */
   private handleError(errorResponse: any) {

    let errorMessage = 'An Unknown Error Occurred!';

    if(!errorResponse.code) {
        return throwError(errorMessage);
    } else {
        
        switch(errorResponse.code) {
            case 'auth/weak-password':
                errorMessage = "The password you entered is too weak. Please make a stronger password by making it longer, using a mixture of capital and small letters, numbers and/or symbols.";
                break;
            case 'auth/email-already-exists':
                errorMessage = "This email address exists already.";
                break;
            case 'auth/too-many-requests':
                errorMessage = "You have attempted to signup too many times, please try again later.";
                break;
            case 'auth/user-not-found':
            case 'auth/invalid-password':
                errorMessage = "Either the username or password entered is invalid";
                break;
            case 'auth/user-disabled':
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