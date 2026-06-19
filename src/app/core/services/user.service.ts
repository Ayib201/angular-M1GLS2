import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  ChangePasswordRequest,
  CreateUserRequest,
  PaginatedResponse,
  UpdateProfileRequest,
  UpdateUserRequest,
  User,
  UserFilters,
  UserStats,
} from '../../shared/models/user';
import { environment } from '../../environnements/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly usersUrl = `${environment.apiUrl}/users`;
  private readonly profileUrl = `${environment.apiUrl}/me`;

  constructor(private readonly http: HttpClient) {}

  getMe() {
    return this.http.get<User>(this.profileUrl);
  }

  updateMe(data: UpdateProfileRequest) {
    return this.http.put<User>(this.profileUrl, data);
  }

  changePassword(data: ChangePasswordRequest) {
    return this.http.put<void>(`${this.profileUrl}/password`, data);
  }

  getAll(filters: UserFilters = {}) {
    let params = new HttpParams();

    if (filters.page !== undefined) {
      params = params.set('page', filters.page);
    }
    if (filters.pageSize !== undefined) {
      params = params.set('pageSize', filters.pageSize);
    }
    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.role) {
      params = params.set('role', filters.role);
    }
    if (filters.isActive !== undefined) {
      params = params.set('isActive', filters.isActive);
    }

    return this.http.get<PaginatedResponse<User>>(this.usersUrl, { params });
  }

  create(data: CreateUserRequest) {
    return this.http.post<User>(this.usersUrl, data);
  }

  update(id: string, data: UpdateUserRequest) {
    return this.http.put<User>(`${this.usersUrl}/${id}`, data);
  }

  toggleActive(id: string) {
    return this.http.patch<User>(`${this.usersUrl}/${id}/toggle-active`, {});
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.usersUrl}/${id}`);
  }

  getStats() {
    return this.http.get<UserStats>(`${this.usersUrl}/stats`);
  }
}
