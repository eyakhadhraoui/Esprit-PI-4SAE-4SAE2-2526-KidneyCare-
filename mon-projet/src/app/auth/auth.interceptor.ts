import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Intercepteur HTTP : ajoute le token Keycloak (Bearer) aux requêtes sortantes
 * vers votre API (ex. localhost:8089).
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  if (!token) return next(req);

  const request = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
  return next(request);
};
