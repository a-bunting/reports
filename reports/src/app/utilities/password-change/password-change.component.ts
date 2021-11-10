import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../authentication/authentication.service';

@Component({
  selector: 'app-password-change',
  templateUrl: './password-change.component.html',
  styleUrls: ['./password-change.component.scss']
})
export class PasswordChangeComponent implements OnInit {

    constructor(
        public auth: AuthenticationService
    ) { }

    ngOnInit(): void {
    }
    
    currentPassword: string;
    newPassword: string = "";
    newPasswordRepeat: string;

}
