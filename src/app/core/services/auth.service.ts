import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthResponse, User } from '../../shared/models/user';
import { environment } from '../../environnements/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _currentUser = signal<User | null>(this.loadUser());
  currentUser = this._currentUser.asReadonly();
  isLoggedIn = computed(() => !!this._currentUser());
  isAdmin = computed(() => this._currentUser()?.role === 'administrateur');

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${this.API}/login`, { email, password })
      .pipe(tap((res) => this.storeSession(res)));
  }
  register({
    firstName,
    lastName,
    email,
    password,
  }: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    return this.http
      .post<AuthResponse>(`${this.API}/register`, {
        firstName,
        lastName,
        email,
        password,
      })
      .pipe(tap((res) => this.storeSession(res)));
  }

  refresh() {
    const rt = localStorage.getItem('refresh_token');
    return this.http
      .post<AuthResponse>(`${this.API}/refresh`, { refreshToken: rt })
      .pipe(tap((res) => this.storeSession(res)));
  }

  logout() {
    this.clearSession();
    this.router.navigate(['/Auth/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }
  updateLocalUser(user: User) {
    localStorage.setItem('current_user', JSON.stringify(user));
    this._currentUser.set(user);
  }

  private storeSession(res: AuthResponse) {
    localStorage.setItem('access_token', res.token);
    localStorage.setItem('refresh_token', res.token);
    localStorage.setItem('current_user', JSON.stringify(res.user));
    this._currentUser.set(res.user);
  }
  private clearSession() {
    ['access_token', 'refresh_token', 'current_user'].forEach((k) =>
      localStorage.removeItem(k),
    );
    this._currentUser.set(null);
  }
  private loadUser(): User | null {
    const raw = localStorage.getItem('current_user');
    return raw ? JSON.parse(raw) : null;
  }
  private readonly API = `${environment.apiBaseUrl}/Auth`;
}
