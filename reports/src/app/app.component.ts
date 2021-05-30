import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from './utilities/auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit, OnDestroy {

    isAuthenticated: boolean = false;
    private userSub: Subscription;

    constructor(private authService: AuthService) {}

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
        this.authService.logout();
    }
}
