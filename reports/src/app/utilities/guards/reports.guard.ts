import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CustomService } from 'src/app/services/custom.service';

@Injectable({
  providedIn: 'root'
})
export class ReportsGuard implements CanActivate {

    constructor(private customService: CustomService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
        const permission: boolean = this.customService.allowReportCreation();

        if(permission) {
            return true;
        }
        
        return this.router.createUrlTree(['/reports']);
  }
  
}
