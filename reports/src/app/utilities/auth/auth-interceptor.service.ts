import { Injectable } from '@angular/core';
import { HttpHandler, HttpInterceptor, HttpParams, HttpRequest } from '@angular/common/http';
import { exhaustMap, take } from 'rxjs/operators';
import { AuthenticationService } from '../authentication/authentication.service';

@Injectable()

export class AuthInterceptorService implements HttpInterceptor {

    constructor(private authService: AuthenticationService) {

    }

    intercept(req: HttpRequest<any>, next: HttpHandler) {
        return this.authService.user.pipe(take(1), exhaustMap(user => {

            // disable this for now whilst building they new authentication modules.
            return next.handle(req);

            if(!user) {
                // if there is no user do not add the token...
                return next.handle(req);
            }

            const modifiedRequest = req.clone({
                params: new HttpParams().set('auth', user.token)
            });

            return next.handle(modifiedRequest);
        }));
        
    }
}
