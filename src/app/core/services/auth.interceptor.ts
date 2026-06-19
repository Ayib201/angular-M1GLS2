// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();

  // Injecte le Bearer token sur toutes les requêtes
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Si 401, tente un refresh automatique
      if (err.status === 401 && !req.url.includes('/auth/')) {
        return auth.refresh().pipe(
          switchMap(() => {
            const newToken = auth.getAccessToken();
            const retried = req.clone({
              setHeaders: {
                Authorization: `Bearer 
${newToken}`,
              },
            });
            return next(retried);
          }),
          catchError(() => {
            auth.logout(); // Refresh expiré → déconnexion
            return throwError(() => err);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};
