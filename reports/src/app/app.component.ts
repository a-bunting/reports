import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { AuthenticationService } from './utilities/authentication/authentication.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit, OnDestroy {

    isAuthenticated: boolean = false;
    isAdmin: boolean = true; // change to false once integrated fully.
    private userSub: Subscription;

    constructor(private authService: AuthenticationService) {}

    ngOnInit() {
        this.authService.autoLogin();
        
        this.userSub = this.authService.user.subscribe(user => {
            this.isAuthenticated = !!user;
        });
    }

    ngOnDestroy() {
        this.userSub.unsubscribe();
    }

    logout() {
        this.authService.logout().pipe(take(1)).subscribe(result => {
            console.log("logged out");
        });
    }
}
