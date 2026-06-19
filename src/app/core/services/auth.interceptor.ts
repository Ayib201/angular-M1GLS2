import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  const authenticatedRequest = token
    ? request.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthRequest =
        request.url.endsWith('/Auth/login') ||
        request.url.endsWith('/Auth/register');

      if (error.status === 401 && token && !isAuthRequest) {
        auth.logout();
      }

      return throwError(() => error);
    }),
  );
};
