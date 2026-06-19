import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import {
  AuthenticatedUser,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '../../shared/models/user';
import { environment } from '../../environnements/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = `${environment.apiUrl}/Auth`;
  private readonly currentUserState = signal<AuthenticatedUser | null>(
    this.loadUser(),
  );

  readonly currentUser = this.currentUserState.asReadonly();
  readonly isLoggedIn = computed(
    () => !!this.getToken() && !!this.currentUserState(),
  );
  readonly isAdmin = computed(
    () => this.currentUserState()?.role === 'administrateur',
  );

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  login(data: LoginRequest) {
    return this.http
      .post<AuthResponse>(`${this.api}/login`, data)
      .pipe(tap((response) => this.storeSession(response)));
  }

  register(data: RegisterRequest) {
    return this.http.post<void>(`${this.api}/register`, data);
  }

  logout(redirect = true): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    this.currentUserState.set(null);

    if (redirect) {
      void this.router.navigate(['/auth/login']);
    }
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Compatibilité avec les consommateurs existants.
  getAccessToken(): string | null {
    return this.getToken();
  }

  getCurrentUser(): AuthenticatedUser | null {
    return this.currentUserState();
  }

  updateLocalUser(user: User): void {
    const currentUser: AuthenticatedUser = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      department: user.department,
    };

    localStorage.setItem('current_user', JSON.stringify(currentUser));
    this.currentUserState.set(currentUser);
  }

  private storeSession(response: AuthResponse): void {
    localStorage.setItem('access_token', response.token);
    localStorage.setItem('current_user', JSON.stringify(response.user));
    this.currentUserState.set(response.user);
  }

  private loadUser(): AuthenticatedUser | null {
    const raw = localStorage.getItem('current_user');

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthenticatedUser;
    } catch {
      localStorage.removeItem('current_user');
      return null;
    }
  }
}
