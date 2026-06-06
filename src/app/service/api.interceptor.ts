import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../config/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  // Si la requête commence par '/', ajouter la base_url depuis la configuration
  if (req.url.startsWith('/')) {
    const apiReq = req.clone({
      url: `${environment.apiBaseUrl}${req.url}`
    });
    return next(apiReq);
  }
  return next(req);
};
