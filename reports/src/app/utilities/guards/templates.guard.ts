import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CustomService } from 'src/app/services/custom.service';

@Injectable({
  providedIn: 'root'
})
export class TemplatesGuard implements CanActivate {

    constructor(private customService: CustomService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
        const permission: boolean = this.customService.allowTemplateCreation();

        if(permission) {
            return true;
        }
        
        return this.router.createUrlTree(['/templates']);
  }
  
}
