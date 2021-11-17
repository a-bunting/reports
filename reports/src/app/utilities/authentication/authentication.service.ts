import { Injectable, OnInit } from '@angular/core';
import firebase from 'firebase/app';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { User } from './user.model';
import { sentence } from 'src/app/services/sentences.service';
import { async } from 'rxjs/internal/scheduler/async';

export interface AuthResponseData {
    kind: string, idToken: string, email: string, 
    refreshToken: string, expiresIn: string , localId: string, 
    registered?: boolean
}

@Injectable({
  providedIn: 'root'
})

/**
 * NOTE TO SELF
 * 
 * This works, but I am not happy with the flow, and needs to be more robust perhaps.
 */

export class AuthenticationService implements OnInit {

    user = new BehaviorSubject<User>(null);
    keepAlive: boolean = true; //for testing = true, but needs to persist somehow... localstorage settings?

    constructor(public firestore: AngularFirestore,
                public fAuth: AngularFireAuth, 
                private router: Router) {
                }

    ngOnInit(): void {


        this.fAuth.onAuthStateChanged((user) => {
            if(user) {
                console.log(user);
            } else {
                console.log(`Chnages detected but... no data!`);
            }
        });

    }

    /**
     * 
     * Sign up a new user to the system.
     * @param email 
     * @param password 
     * @param name 
     * @returns Observable
     */
    signup(email: string, password: string, name: string, stayLoggedIn: boolean = false): Observable<any> {

        this.keepAlive = stayLoggedIn;

        const signUp = this.fAuth.createUserWithEmailAndPassword(email, password).then((result) => {
            // get the sentences template to copy for this user
            const getTemplate: AngularFirestoreDocument<sentence> = this.firestore.collection('sentences').doc('template');
            // get the users id token
            const getIdTokenResult = result.user.getIdTokenResult(true);
            // sets the user in the users database.
            const setUser = this.firestore.collection('users').doc(result.user.uid).set({name: name, email: email});

            return Promise.all([
                result,
                getIdTokenResult,
                getTemplate.ref.get(), 
                setUser
            ]);
        }).then(([userCreation, token, sentencesTemplate, setUser]) => {
            const newUserEstablishmentProfile: { id: string, name: string } = {id: "freeagent", name: "Free Agent"};

            // when successful then authenticate
            const authenticate = this.handleAuthentication(
                email, userCreation.user.uid, name, newUserEstablishmentProfile, false, false, false, false, token.token 
            );

            // set the sentences template with the users userid - this will be their own copy of the database.
            this.firestore.collection('sentences').doc(userCreation.user.uid).set(sentencesTemplate.data()).then(() => {
                // set the data into local storage to make it quicker ot retrieve next time...
                let sentenceData: sentence[] = [];
                sentenceData[0] = sentencesTemplate.data();
                localStorage.setItem('sentences-data', JSON.stringify(sentenceData));
                // and authenticate
                authenticate;
            }, (error) => {
                console.log(`There was an error in the creation of a new sentences template: ${error.message}`);
                authenticate;
            })
        }, (error) => {
            console.log(`Some part of the user creation process failed: ${error.message}`);
        });

        return from(signUp);
    }

    login2(email: string, password: string, stayLoggedIn: boolean = false): Observable<any> {
        return from(this.fAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(() => {
            return this.login3(email, password, true);   
        }))
    }

    /**
     * Logs a user in.
     * @param email 
     * @param password 
     * @returns Observable
     */
    login3(email: string, password: string, stayLoggedIn: boolean = false): Observable<any> {

        this.keepAlive = stayLoggedIn;

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
            const autoUpdate: boolean = userDataSnapshot.get('autoUpdateDb') ? userDataSnapshot.get('autoUpdateDb') : false;

            this.handleAuthentication(
                user.email, 
                user.uid,
                userDataSnapshot.get('name'),
                establishment,
                admin,
                manager, 
                member,
                autoUpdate,
                tokenData.token 
            );
        })

        return from(signIn);
    }
    
    GoogleAuth(stayLoggedIn: boolean = true): any {
        this.keepAlive = stayLoggedIn;
        const googleAuth = new firebase.auth.GoogleAuthProvider();
        return this.AuthLogin(googleAuth);
    }

    /**
     * Login OR SIGN UP via an external provider
     * @param provider 
     * @returns 
     */
    AuthLogin(provider) {
        return this.fAuth.signInWithPopup(provider).then((result) => {

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
            const autoUpdate: boolean = userDataSnapshot.get('autoUpdateDb') ? userDataSnapshot.get('autoUpdateDb') : false;

            this.handleAuthentication(
                user.email, 
                user.uid,
                user.displayName,
                establishment,
                admin,
                manager, 
                member,
                autoUpdate,
                tokenData.token 
            );

        });
    }

    logout(): Observable<any> {
        return from(this.fAuth.signOut().then(() => {
            // localStorage.removeItem('userData');
            // localStorage.removeItem('sentences-data');
            localStorage.clear();
            this.user.next(null);
            this.router.navigate(['/']);
        }).catch(error => {
            console.log(`An error occurred during logout: ${error.message}`); 
      })) 
    }

    /**
     * Used to facilitate relogin after refresh.
     * @returns 
     */
    autoLogin() {

        const userData: {
            email: string;
            id: string;
            name: string;
            establishment: {id: string, name: string};
            admin: boolean;
            manager: boolean; 
            member: boolean;
            autoUpdateDb: boolean;
            _token: string;
            _tokenExpirationDate: string;
        } = JSON.parse(localStorage.getItem('userData'));

        if(!userData) {
            return;
        }

        const loadedUser = new User(userData.email, userData.id, userData.name, userData.establishment, userData.admin, userData.manager, userData.member, userData.autoUpdateDb, userData._token, new Date(userData._tokenExpirationDate));
        
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
         this.logoutTimer = setInterval(() => {
             if(this.keepAlive) {
                 // if keepalive is true then refresh the token and the userdata...
                 firebase.auth().currentUser.getIdToken(true).then((result: string) => {
                        const newUser: User = new User(
                            this.user.value.email,
                            this.user.value.id,
                            this.user.value.name,
                            this.user.value.establishment,
                            this.user.value.admin,
                            this.user.value.manager,
                            this.user.value.member,
                            this.user.value.autoUpdateDb,
                            result, 
                            new Date(new Date().getTime() + (3600 * 1000))
                        );

                        this.user.next(newUser);
                 });
             } else {
                 clearInterval(this.logoutTimer);
                 this.logout();
             }
         }, 36000000);//new Date(this.user.value.tokenExpiration).getTime() + 3600001);
     }

    /**
     * Handles the authentication of the user and sets the user data
     * @param email 
     * @param userId 
     * @param token 
     * @param expiresIn 
     */
    private handleAuthentication(email: string, userId: string, name: string, establishment: {id: string, name: string}, admin: boolean, manager: boolean, member: boolean, autoUpdateDb: boolean, token: string): void {
        const expirationDate = new Date(new Date().getTime() + (3600 * 1000));
        const user = new User(email, userId, name, {id: establishment.id, name: establishment.name}, admin, manager, member, autoUpdateDb, token, expirationDate);
        this.autoLogout(3600 * 1000);
        this.user.next(user);

        // // get user data
        // this.db.getUsers();

        // persistence using local storage
        localStorage.setItem('userData', JSON.stringify(user));
        this.router.navigate(['/dashboard']);
    }

    setKeepAlive(value: boolean): void {
        this.keepAlive = value;
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

    // password checking...

    strong = new RegExp('(?=.{8,})(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9])');
    medium = new RegExp('(?=.{7,})(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])');
    long = new RegExp('(?=.{10,})');
    acceptable = new RegExp('(?=.{6,})');
    
    /**
     * Checks if the password meets the bare minimum standards...
     * @returns 
     */
    testPassword(pass: string): boolean {
        return this.acceptable.test(pass) ? true : false;
    }

    getPasswordStrength(password: string): number {
        if(this.strong.test(password)) {
            return 1;
        } else if(this.medium.test(password) || this.long.test(password)) {
            return 2
        } else return 3;
    }

    checkPasswordMatch(newPass: string, newRepeat: string): boolean {
        return newPass === newRepeat ? true : false;
    }

    sendPasswordResetEmail(emailAddress: string): Observable<boolean> {
        
        return from(this.fAuth.sendPasswordResetEmail(emailAddress).then(() => {
            return true;
        }, error => {
            return false;
        }))
    }


}