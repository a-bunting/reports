import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '../../../services/authentication.service';

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.scss']
})
export class PasswordResetComponent implements OnInit {

    constructor(
        public auth: AuthenticationService,
        private activatedRoute: ActivatedRoute,
        private fAuth: AngularFireAuth,
        private router: Router
    ) { }

    oobCode: string;
    isLoading: boolean = false;

    ngOnInit(): void {
        this.oobCode = this.activatedRoute.snapshot.queryParams['oobCode'];
        console.log(this.oobCode);
    }

    newPassword: string;
    newPasswordRepeat: string;
    errorMessage: string;

    /**
     * Updates the password
     */
    updatePassword(): void {
        if(this.oobCode && (this.newPassword === this.newPasswordRepeat)) {
            // set isloading to true;
            this.isLoading = true;
            // and communicate with the server
            this.fAuth.confirmPasswordReset(this.oobCode, this.newPassword).then(() => {
                // success, navigate to the main page??
                this.isLoading = false;
                this.router.navigate(['']);
            }, error => {
                this.isLoading = false;
                this.errorMessage = error;
            })
        }
    }

    removeErrorMessage(): void {
        this.errorMessage = undefined;
    }

}
