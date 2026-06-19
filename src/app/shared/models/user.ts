export const USER_ROLES = [
  'administrateur',
  'utilisateur',
  'moderateur',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  department: string;
}

export interface AuthenticatedUser {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole | null;
  isActive: boolean;
  department: string;
}

export interface AuthResponse {
  token: string;
  user: AuthenticatedUser;
}

export interface User extends AuthenticatedUser {
  id: string;
  createdAt: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateUserRequest extends UpdateProfileRequest {
  password: string;
  role: UserRole;
  isActive: boolean;
}

export interface UpdateUserRequest extends UpdateProfileRequest {
  role: UserRole;
  isActive: boolean;
}

export interface UserFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  admins: number;
  newToday: number;
}


export type DashboardStats = UserStats;
export type PagedResult<T> = PaginatedResponse<T>;
