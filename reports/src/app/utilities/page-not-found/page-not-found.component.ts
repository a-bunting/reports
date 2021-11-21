import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../authentication/authentication.service';
import { User } from '../authentication/user.model';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss']
})
export class PageNotFoundComponent implements OnInit {

    user: User;

    constructor(private authService: AuthenticationService) { }

    ngOnInit(): void {
        this.authService.user.subscribe((user: User) => {
            this.user = user;
        })
    }

}
