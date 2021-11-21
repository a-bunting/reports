import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, RouteConfigLoadEnd, RouteConfigLoadStart, Router, RouterEvent } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthenticationService } from './utilities/authentication/authentication.service';
import { User } from './utilities/authentication/user.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {

    isAuthenticated: boolean = false;
    isMember: boolean = false;
    isAdmin: boolean = false; // change to false once integrated fully.
    user: User;
    authForm: NgForm;
    forgotPassword: boolean = false;

    loadingMessage: boolean;
    loaded: boolean;
    loadingTimer: number;

    constructor(
        private authService: AuthenticationService, 
        private router: Router, 
        private activatedRoute: ActivatedRoute,
        private titleService: Title
    ) {
        this.loadingMessage = false;
        this.loaded = true;
        
        // for lazy loaded routes display a loading menu whilst loading...
        router.events.subscribe((event: RouterEvent) => {
            if(event instanceof RouteConfigLoadStart) {
                let delay: number = 200;
                this.loaded = false;
                // if things load super fast, make sure the message doesnt fly up and flash at the user...
                this.loadingTimer = setTimeout(() => {
                    !this.loaded ? this.loadingMessage = true : this.loadingMessage = false;
                }, delay);
            } else if (event instanceof RouteConfigLoadEnd) {
                // stop any loading messages
                this.loadingMessage = false;
                this.loaded = true;
            } else if(event instanceof NavigationEnd) {
                // reload the title...
                let route: ActivatedRoute = this.getChild(this.activatedRoute);
                // subscribe tot he observable and update the title...
                route.data.subscribe((data: any) => {
                    this.setPageTitle(data.title);
                })
            }
        })
    }

    /**
     * Recursive function tof ind the most child component open.
     * @param activatedRoute 
     * @returns 
     */
    getChild(activatedRoute: ActivatedRoute): ActivatedRoute {
        if(activatedRoute.firstChild) {
            return this.getChild(activatedRoute.firstChild);
        } else {
            return activatedRoute;
        }
    }

    setPageTitle(titleString: string): void {
        this.titleService.setTitle(titleString);
    }

    ngOnInit() {
        this.authService.autoLogin();

        this.authService.user.subscribe((user: User) => {
            this.isAuthenticated = !!user;
            if(user) {
                this.isMember = user.member;
                this.isAdmin = user.admin;
                this.user = user;
            } else {
                this.user = undefined;
                this.isAuthenticated = false;
                this.isAdmin = false;
            }
        });
    }

    logout() {
        this.authService.logout().pipe(take(1)).subscribe(() => {
            console.log("logged out");
        }, error => {
            console.log(`Error logging out: ${error.message}`);
        });
    }

    isLoading: boolean = false;
    errorMessage: string;

    onSubmit(form: NgForm) {

        if(!form.valid) {
            console.log("invalid form");
            return;
        }
        
        this.isLoading = true;
        const email = form.value.email;
        const password = form.value.password;
    
        let authObs: Observable<any> = this.authService.login3(email, password);
    
        authObs.subscribe((responseData: any) => {
            this.isLoading = false;
        }, 
        errorMessage => {
            console.log(`Error logging in: ${errorMessage}`);
            this.errorMessage = errorMessage;
            this.isLoading = false;
        })
    }

    removeErrorMessage(): void {
        this.errorMessage = undefined;
    }

    toggleForgot(): void {
        this.forgotPassword = !this.forgotPassword;
    }

    passwordResetSentSuccessfully: boolean = false
    emailAddress: string;

    sendPasswordResetEmail(): void {
        this.isLoading = true;       
                
        this.authService.sendPasswordResetEmail(this.emailAddress).subscribe((result: boolean) => {
            this.isLoading = false;        
            this.passwordResetSentSuccessfully = true;
            // giv eit 5 seconds to display and then take it away
            setTimeout(() => {
                this.passwordResetSentSuccessfully = false;
            }, 5000);
        }, error => {
            this.isLoading = false;        
            this.errorMessage = `Error: ${error}`;
        });
    }
}
