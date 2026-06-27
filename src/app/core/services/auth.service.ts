import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import {
  AuthenticatedUser,
  RegisterRequest,
  User,
} from '../../shared/models/user';
import { environment } from '../../environnements/environment';

interface KeycloakTokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

interface KeycloakTokenPayload {
  email?: string;
  family_name?: string;
  given_name?: string;
  name?: string;
  preferred_username?: string;
  realm_access?: {
    roles?: string[];
  };
  resource_access?: Record<string, { roles?: string[] }>;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly keycloak = environment.keycloak;
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

  login(): void {
    window.location.assign(this.buildAuthorizationUrl());
  }

  completeLoginRedirect(code: string): Observable<void> {
    const body = new URLSearchParams();
    body.set('client_id', this.keycloak.clientId);
    body.set('grant_type', 'authorization_code');
    body.set('code', code);
    body.set('redirect_uri', this.redirectUri);

    return this.http
      .post<KeycloakTokenResponse>(
        `${this.keycloak.url}/realms/${this.keycloak.realm}/protocol/openid-connect/token`,
        body.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        },
      )
      .pipe(
        tap((response) => this.storeKeycloakSession(response)),
        map(() => undefined),
      );
  }

  register(data: RegisterRequest) {
    return this.http.post<void>(
      `${this.keycloak.url}/realms/${this.keycloak.realm}/protocol/openid-connect/register`,
      data,
    );
  }

  logout(redirect = true): void {
    const idToken = localStorage.getItem('id_token');
    this.clearLocalSession();

    if (redirect) {
      window.location.assign(this.buildLogoutUrl(idToken));
    }
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

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

  private get redirectUri(): string {
    return `${window.location.origin}/auth/callback`;
  }

  private buildAuthorizationUrl(): string {
    const params = new URLSearchParams();
    params.set('client_id', this.keycloak.clientId);
    params.set('redirect_uri', this.redirectUri);
    params.set('response_type', 'code');
    params.set('scope', 'openid profile email');

    return `${this.keycloak.url}/realms/${this.keycloak.realm}/protocol/openid-connect/auth?${params.toString()}`;
  }

  private storeKeycloakSession(response: KeycloakTokenResponse): void {
    const payload = this.decodeToken(response.access_token);
    const username = payload.preferred_username ?? payload.email ?? '';
    const user: AuthenticatedUser = {
      email: payload.email ?? username,
      firstName: payload.given_name ?? payload.name ?? username,
      lastName: payload.family_name ?? '',
      role: this.resolveRole(payload),
      isActive: true,
      department: '',
    };

    localStorage.setItem('access_token', response.access_token);
    if (response.id_token) {
      localStorage.setItem('id_token', response.id_token);
    }
    localStorage.setItem('current_user', JSON.stringify(user));
    this.currentUserState.set(user);
  }

  private clearLocalSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('current_user');
    this.currentUserState.set(null);
  }

  private buildLogoutUrl(idToken: string | null): string {
    const params = new URLSearchParams();
    params.set('client_id', this.keycloak.clientId);
    params.set('post_logout_redirect_uri', `${window.location.origin}/auth/login`);

    if (idToken) {
      params.set('id_token_hint', idToken);
    }

    return `${this.keycloak.url}/realms/${this.keycloak.realm}/protocol/openid-connect/logout?${params.toString()}`;
  }

  private decodeToken(token: string): KeycloakTokenPayload {
    try {
      const [, payload] = token.split('.');
      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = normalizedPayload.padEnd(
        Math.ceil(normalizedPayload.length / 4) * 4,
        '=',
      );
      return JSON.parse(atob(paddedPayload)) as KeycloakTokenPayload;
    } catch {
      return {};
    }
  }

  private resolveRole(payload: KeycloakTokenPayload): AuthenticatedUser['role'] {
    const roles = [
      ...(payload.realm_access?.roles ?? []),
      ...(payload.resource_access?.[this.keycloak.clientId]?.roles ?? []),
    ];

    if (roles.includes('administrateur') || roles.includes('admin')) {
      return 'administrateur';
    }

    if (roles.includes('moderateur')) {
      return 'moderateur';
    }

    if (roles.includes('utilisateur') || roles.length > 0) {
      return 'utilisateur';
    }

    return null;
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
