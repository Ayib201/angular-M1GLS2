export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'administrateur' | 'utilisateur';
    isActive: boolean;
    department?: string;
    createdAt?: string;
}
export interface DashboardStats {
    total: number;
    active: number;
    admins: number;
}
export interface PagedResult<T> {
    items: T[];
    totalCount: number;
}
export interface AuthResponse {
    token: string;
    user: User;
}
