import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserRole,
  USER_ROLES,
} from '../../shared/models/user';
import {
  LucideLock,
  LucideLockOpen,
  LucidePencil,
  LucideTrash2,
} from '@lucide/angular';

@Component({
  selector: 'app-users',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideLock,
    LucideLockOpen,
    LucidePencil,
    LucideTrash2,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly roles = USER_ROLES;
  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly pageError = signal('');
  readonly formError = signal('');
  readonly page = signal(1);
  readonly totalItems = signal(0);
  readonly totalPages = signal(0);
  readonly search = signal('');
  readonly roleFilter = signal<UserRole | undefined>(undefined);
  readonly activeFilter = signal<boolean | undefined>(undefined);
  readonly pageSize = 10;

  readonly modalMode = signal<'create' | 'edit' | null>(null);
  readonly editTarget = signal<User | null>(null);
  readonly deleteTarget = signal<User | null>(null);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    department: ['', Validators.required],
    password: [''],
    role: ['utilisateur' as UserRole, Validators.required],
    isActive: [true],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.pageError.set('');

    this.userService
      .getAll({
        page: this.page(),
        pageSize: this.pageSize,
        search: this.search() || undefined,
        role: this.roleFilter(),
        isActive: this.activeFilter(),
      })
      .subscribe({
        next: (response) => {
          this.users.set(response.items);
          this.totalItems.set(response.totalItems);
          this.totalPages.set(response.totalPages);
          this.loading.set(false);
        },
        error: (error) => {
          this.handleError(error, this.pageError);
          this.loading.set(false);
        },
      });
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value.trim());
    this.page.set(1);
    this.load();
  }

  onRoleFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.roleFilter.set(value ? (value as UserRole) : undefined);
    this.page.set(1);
    this.load();
  }

  onActiveFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.activeFilter.set(value === '' ? undefined : value === 'true');
    this.page.set(1);
    this.load();
  }

  openModal(mode: 'create' | 'edit', user?: User): void {
    this.modalMode.set(mode);
    this.editTarget.set(user ?? null);
    this.formError.set('');

    if (mode === 'edit' && user) {
      this.form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        department: user.department,
        password: '',
        role: user.role ?? 'utilisateur',
        isActive: user.isActive,
      });
      this.form.controls.password.clearValidators();
    } else {
      this.form.reset({
        firstName: '',
        lastName: '',
        email: '',
        department: '',
        password: '',
        role: 'utilisateur',
        isActive: true,
      });
      this.form.controls.password.setValidators([
        Validators.required,
        Validators.minLength(8),
      ]);
    }

    this.form.controls.password.updateValueAndValidity();
  }

  closeModal(): void {
    this.modalMode.set(null);
    this.editTarget.set(null);
    this.formError.set('');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.formError.set('');
    const value = this.form.getRawValue();
    const commonData = {
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      department: value.department,
      role: value.role,
      isActive: value.isActive,
    };

    const request =
      this.modalMode() === 'create'
        ? this.userService.create({
            ...commonData,
            password: value.password,
          } satisfies CreateUserRequest)
        : this.userService.update(
            this.editTarget()!.id,
            commonData satisfies UpdateUserRequest,
          );

    request.subscribe({
      next: () => {
        this.closeModal();
        this.saving.set(false);
        this.load();
      },
      error: (error) => {
        this.handleError(error, this.formError);
        this.saving.set(false);
      },
    });
  }

  toggleActive(user: User): void {
    this.pageError.set('');
    this.userService.toggleActive(user.id).subscribe({
      next: () => this.load(),
      error: (error) => this.handleError(error, this.pageError),
    });
  }

  deleteUser(): void {
    const user = this.deleteTarget();
    if (!user) {
      return;
    }

    this.deleting.set(true);
    this.pageError.set('');
    this.userService.delete(user.id).subscribe({
      next: () => {
        this.deleteTarget.set(null);
        this.deleting.set(false);
        if (this.users().length === 1 && this.page() > 1) {
          this.page.update((page) => page - 1);
        }
        this.load();
      },
      error: (error) => {
        this.handleError(error, this.pageError);
        this.deleteTarget.set(null);
        this.deleting.set(false);
      },
    });
  }

  goPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  pageNumbers(): number[] {
    const pages: number[] = [];
    for (
      let page = Math.max(1, this.page() - 2);
      page <= Math.min(this.totalPages(), this.page() + 2);
      page++
    ) {
      pages.push(page);
    }
    return pages;
  }

  initials(user: User): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  roleLabel(role: UserRole | null): string {
    const labels: Record<UserRole, string> = {
      administrateur: 'Administrateur',
      utilisateur: 'Utilisateur',
      moderateur: 'Modérateur',
    };
    return role ? labels[role] : 'Non défini';
  }

  private handleError(
    error: { status?: number; error?: { message?: string } },
    target: { set(value: string): void },
  ): void {
    if (error.status === 401) {
      this.auth.logout(false);
      void this.router.navigate(['/auth/login']);
      return;
    }
    if (error.status === 403) {
      target.set('Accès réservé aux administrateurs.');
      return;
    }
    if (error.status === 409) {
      target.set('Cette adresse email est déjà utilisée.');
      return;
    }
    target.set(error.error?.message ?? 'Une erreur est survenue.');
  }
}
