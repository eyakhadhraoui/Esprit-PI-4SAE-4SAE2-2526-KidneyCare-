import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

/**
 * Ajoute le jeton Bearer (Keycloak / formulaire via AuthService) à toutes les requêtes HTTP.
 * Équivalent async à keycloak-js / Keycloak getToken() : {@link AuthService#getTokenForRequest}.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (req.headers.has('Authorization')) {
    return next(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          auth.clearStoredToken();
          router.navigate(['/login'], { queryParams: { expired: '1' } });
        }
        return throwError(() => err);
      }),
    );
  }

  const url = req.url;
  if (url.includes('/api/auth/login') || url.includes('/api/auth/register')) {
    return next(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          auth.clearStoredToken();
          router.navigate(['/login'], { queryParams: { expired: '1' } });
        }
        return throwError(() => err);
      }),
    );
  }

  return from(auth.getTokenForRequest()).pipe(
    switchMap((token) => {
      const bearer = token ?? auth.getToken();
      const request = bearer
        ? req.clone({ setHeaders: { Authorization: `Bearer ${bearer}` } })
        : req;
      return next(request).pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 401) {
            auth.clearStoredToken();
            router.navigate(['/login'], { queryParams: { expired: '1' } });
          }
          return throwError(() => err);
        }),
      );
    }),
  );
};
