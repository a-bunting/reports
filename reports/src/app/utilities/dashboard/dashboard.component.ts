import { Component, Input, OnInit } from '@angular/core';
import { from } from 'rxjs';
import { User } from '../authentication/user.model';
import { AuthenticationService } from '../authentication/authentication.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

    user: User;
    username: string;
    facility: string;

    constructor(private AuthService: AuthenticationService) {}
    
    ngOnInit(): void {
        this.AuthService.user.subscribe((user: User) => {
            if(user) {
                this.user = user;
                // set the username and establishment
                this.username = this.user.name;
                this.facility = this.user.establishment.name;
            }
        })
    }

    onUsernameChange(): void {
        this.user.setUsername = this.username;
    }

    onEstablishmentChange(): void {
        // nothing yet, free agents only to start
    }

}
