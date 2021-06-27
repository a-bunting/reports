import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { UserCredential, IdTokenResult } from '@firebase/auth-types';
import { AngularFirestore, DocumentSnapshot } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { catchError, mergeMap, take, tap, toArray } from 'rxjs/operators';
import { User } from './user.model';

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

    constructor(public firestore: AngularFirestore,
                public fAuth: AngularFireAuth, 
                private router: Router) {
                }

    signup(email: string, password: string, name: string): Promise<any> {
        // start by attempting to sign up the user...
        return this.fAuth.createUserWithEmailAndPassword(email, password).then(result => {
            // then get the token and custom claims for this user
            return result.user.getIdTokenResult(true).then((token: any) => {
                // finally add the user to the users database:
                return this.firestore.collection('users').doc(result.user.uid).set({
                    email: email,
                    name: name
                })
                .then(() => {
                    // response from server
                    console.log(`Success: User ${name} (${email}) has been signed up.`);

                    // REMAKE SIGNUP PROPERLY...
                    this.handleAuthentication(
                        result.user.email,
                        result.user.uid,
                        name,
                        {id: "freeagent", name: "Free Agent"},
                        false,
                        false, 
                        false,
                        token.token 
                    );
                }).catch((error: any) => {
                    console.log(`Error: ${error.message}`);
                })
                    
            });
        });
    }

    login3(email: string, password: string): Observable<any> {
        const signIn = this.fAuth.signInWithEmailAndPassword(email, password).then((result) => {
            const userDocRef = this.firestore.collection('users').doc(result.user.uid);
            
            // promise all rejects if one fails or continues if all succeed
            return Promise.all([
                Promise.resolve(result.user), 
                result.user.getIdTokenResult(),
                userDocRef.ref.get()
            ]);
        }).then(([user, tokenData, userDataSnapshot]) => {

            const establishment = userDataSnapshot.get('establishment') ? userDataSnapshot.get('establishment') : {id: "freeagent", name: "Free Agent" };
            const admin = tokenData.claims.admin ? tokenData.claims.admin : false; 
            const manager = tokenData.claims.manager ? tokenData.claims.manager : false; 
            const member = tokenData.claims.member ? tokenData.claims.member : false;

            this.handleAuthentication(
                user.email, 
                user.uid,
                userDataSnapshot.get('name'),
                establishment,
                admin,
                manager, 
                member,
                tokenData.token 
            );
        })

        return from(signIn);
    }
    
    logout(): Observable<any> {
        return from(this.fAuth.signOut().then(() => {
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
            establishment: {id: string, name: string};
            admin: boolean;
            manager: boolean; 
            member: boolean;
            _token: string;
            _tokenExpirationDate: string;
        } = JSON.parse(localStorage.getItem('userData'));

        if(!userData) {
            return;
        }

        const loadedUser = new User(userData.email, userData.id, userData.name, userData.establishment, userData.admin, userData.manager, userData.member, userData._token, new Date(userData._tokenExpirationDate));
        
        if(loadedUser.token) {
            this.user.next(loadedUser);
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
    private handleAuthentication(email: string, userId: string, name: string, establishment: {id: string, name: string}, admin: boolean, manager: boolean, member: boolean, token: string): void {
        const expirationDate = new Date(new Date().getTime() + (3600 * 1000));
        const user = new User(email, userId, name, {id: establishment.id, name: establishment.name}, admin, manager, member, token, expirationDate);
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
     * @returns error message
     */
   private handleError(errorResponse: any): string {
        let errorMessage = 'An Unknown Error Occurred!';

        if(!errorResponse.code) {
            return errorMessage;
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
        
        return errorMessage;
    }


}