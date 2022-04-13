import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthenticationService } from '../../services/authentication.service';

@Injectable({
  providedIn: 'root'
})
export class DemoGuard implements CanActivate {

    constructor(private authService: AuthenticationService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

        return this.authService.user.pipe(take(1), map(user => {
            // if the user is a member, manager or admin this is allowed...
            const permission = user.member || user.manager || user.admin;
            if(permission) {
                return true;
            }
            // if the route is not allowed redirect to the dashboard page...
            return this.router.createUrlTree(['/dashboard']);
        }));
  }

}
