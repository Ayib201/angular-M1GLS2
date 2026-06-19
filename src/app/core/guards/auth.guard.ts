// src/app/core/guards/auth.guard.ts 
import { inject } from '@angular/core'; 
import { CanActivateFn, Router } from '@angular/router'; 
import { AuthService } from '../services/auth.service'; 
  
// Protège les routes nécessitant une connexion 
export const authGuard: CanActivateFn = () => { 
  const auth   = inject(AuthService); 
  const router = inject(Router); 
  return auth.isLoggedIn() ? true : router.createUrlTree(['/auth/login']); 
}; 
  
// Empêche un utilisateur déjà connecté d'accéder à login/register 
export const guestGuard: CanActivateFn = () => { 
  const auth   = inject(AuthService); 
  const router = inject(Router); 
  return auth.isLoggedIn() ? router.createUrlTree(['/dashboard']) : true; 
}; 
  
// Réserve les routes aux Admins uniquement 
export const adminGuard: CanActivateFn = () => { 
  const auth   = inject(AuthService); 
  const router = inject(Router); 
  if (!auth.isLoggedIn()) return router.createUrlTree(['/auth/login']); 
  if (!auth.isAdmin())    return router.createUrlTree(['/dashboard']); 
  return true; 
}; 