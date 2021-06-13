import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { UserCredential, IdTokenResult } from '@firebase/auth-types';
import { AngularFirestore, DocumentSnapshot } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { catchError, mergeMap, take, tap, toArray } from 'rxjs/operators';
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

    constructor(private fAuth: AngularFireAuth, 
                private firestore: AngularFirestore,
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
                    
                    // authenticate the user in the code
                    // user is not an admin by default.
                    this.handleAuthentication(
                        result.user.email, 
                        result.user.uid,
                        name,
                        false,  
                        token.token 
                    );
                }).catch((error: any) => {
                    console.log(`Error: ${error.message}`);
                })
                    
            });
        });
    }

    login(email: string, password: string): Observable<any> {
        // this.slowLoginFunction(email, password);
        // return null;

        return this.login3(email, password);

        return from(this.fAuth.signInWithEmailAndPassword(email, password))
            .pipe(take(1), catchError(this.handleError), tap((result: any) => {
            
            // get the id token to authenticate and store...
            // return from(this.firestore.collection('users').doc(result.user.uid).get())
            //         .pipe(take(1), catchError(this.handleError), tap((doc: any) => {
                    
                    // get the token and handle authentication...
                    return from(result.user.getIdTokenResult(true)).pipe(take(1), catchError(this.handleError)).subscribe((token: any) => {
                        // authenticate the user in the code
                        this.handleAuthentication(
                            result.user.email, 
                            result.user.uid,
                            // doc.data().name,
                            "Alex Bunting",
                            token.claims.admin,
                            token.token 
                        );
                    });
            // }));
        }));
    }

    // login2(email: string, password: string): Observable<any> {
    //     const signInObs: Observable<UserCredential> = from(this.fAuth.signInWithEmailAndPassword(email, password));
        
    //     return signInObs.pipe(take(1), catchError(this.handleError), mergeMap((result: UserCredential) => {
    //         console.log(`done this ONE... ${result.user.uid}`);
            
    //         return this.firestore.collection('users').doc(result.user.uid).get().pipe(catchError(this.handleError), mergeMap((doc: DocumentSnapshot<any>) => {
    //             console.log(`done this two... ${doc.data().name}`);
                
    //             return result.user.getIdTokenResult(true).then((token: IdTokenResult) => {
    //                 // authenticate the user in the code
    //                 console.log(`done this three.. ${token.claims.admin}`);
                                        
    //                 this.handleAuthentication(
    //                     result.user.email, 
    //                     result.user.uid,
    //                     doc.data().name,
    //                     token.claims.admin,
    //                     token.token 
    //                 );
    //             }).catch(error => {
    //                 throw new Error(error);
    //             });
    //         })); 
    //     }));
    // }

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
            this.handleAuthentication(
                user.email, 
                user.uid,
                userDataSnapshot.get('name'),
                tokenData.claims.admin,
                tokenData.token 
            );
        })

        return from(signIn);
    }





    // slowLoginFunction(email: string, password: string): boolean {

    //     const signInObs: Observable<UserCredential> = from(this.fAuth.signInWithEmailAndPassword(email, password));

    //     signInObs.subscribe(result => {

    //         const docGet = this.firestore.collection('users').doc(result.user.uid).get();

    //         docGet.subscribe((doc: DocumentSnapshot<any>) => {

    //             const getToken = from(result.user.getIdTokenResult(true));

    //             getToken.subscribe(token => {

    //                 this.handleAuthentication(
    //                     result.user.email, 
    //                     result.user.uid,
    //                     doc.data().name,
    //                     token.claims.admin,
    //                     token.token 
    //                 );

    //                 return true;

    //             }, error => { console.log(`Error token: ${error.message}`); return false; })

    //         }, error => { console.log(`Error doc: ${error.message}: ${result.user.uid}`); return false; })

    //     }, error => { console.log(`Error login: ${error.message}`); return false; })

    //     return null;

    // }
    
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
            admin: boolean;
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

        const loadedUser = new User(userData.email, userData.id, userData.name, userData.admin, userData._token, new Date(userData._tokenExpirationDate));
        
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
    private handleAuthentication(email: string, userId: string, name: string, admin: boolean, token: string): void {
        const expirationDate = new Date(new Date().getTime() + (3600 * 1000));
        const user = new User(email, userId, name, admin, token, expirationDate);
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