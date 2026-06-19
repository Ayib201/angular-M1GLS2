import { Component, inject, OnInit, signal } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../shared/models/user';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
})
export class UsersComponent implements OnInit {
 private userSvc = inject(UserService);
  private fb = inject(FormBuilder);

  // ── State ──────────────────────────────────────────────
  users      = signal<User[]>([]);
  loading    = signal(true);
  saving     = signal(false);
  formError  = signal('');
  page       = signal(1);
  totalCount = signal(0);
  search     = signal('');
  roleFilter = signal('');
  activeFilter = signal<boolean | undefined>(undefined);
  readonly pageSize = 10;

  modalMode   = signal<'create' | 'edit' | null>(null);
  editTarget  = signal<User | null>(null);
  deleteTarget = signal<User | null>(null);

  // ── Formulaire ────────────────────────────────────────
  form = this.fb.group({
    firstName:  ['', Validators.required],
    lastName:   ['', Validators.required],
    email:      ['', [Validators.required, Validators.email]],
    password:   [''],
    role:       ['User'],
    phone:      [''],
    department: ['']
  });

  // ── Lifecycle ─────────────────────────────────────────
  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.userSvc
      .getAll(this.page(), this.pageSize, this.search(), this.roleFilter(), this.activeFilter())
      .subscribe(res => {
        this.users.set(res.items);
        this.totalCount.set(res.totalCount);
        this.loading.set(false);
      });
  }

  // ── Filtres ───────────────────────────────────────────
  onSearch(e: Event) {
    this.search.set((e.target as HTMLInputElement).value);
    this.page.set(1);
    this.load();
  }

  onRoleFilter(e: Event) {
    this.roleFilter.set((e.target as HTMLSelectElement).value);
    this.page.set(1);
    this.load();
  }

  onActiveFilter(e: Event) {
    const v = (e.target as HTMLSelectElement).value;
    this.activeFilter.set(v === '' ? undefined : v === 'true');
    this.page.set(1);
    this.load();
  }

  // ── Modal ─────────────────────────────────────────────
  openModal(mode: 'create' | 'edit', user?: User) {
    this.modalMode.set(mode);
    this.editTarget.set(user ?? null);
    this.formError.set('');

    if (mode === 'edit' && user) {
      this.form.patchValue(user);
      this.form.get('password')?.clearValidators();
    } else {
      this.form.reset({ role: 'User' });
      this.form.get('password')?.setValidators([
        Validators.required,
        Validators.minLength(8)
      ]);
    }
    this.form.get('password')?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);

    const action = this.modalMode() === 'create'
      ? this.userSvc.create(this.form.value)
      : this.userSvc.update(this.editTarget()!.id, this.form.value);

    action.subscribe({
      next: () => {
        this.modalMode.set(null);
        this.saving.set(false);
        this.load();
      },
      error: (e) => {
        this.formError.set(e.error?.message ?? 'Erreur');
        this.saving.set(false);
      }
    });
  }

  // ── Actions table ─────────────────────────────────────
  toggleActive(user: User) {
    this.userSvc.toggleActive(user.id).subscribe(() => this.load());
  }

  deleteUser() {
    this.userSvc.delete(this.deleteTarget()!.id).subscribe(() => {
      this.deleteTarget.set(null);
      this.load();
    });
  }

  // ── Pagination ────────────────────────────────────────
  goPage(p: number) {
    this.page.set(p);
    this.load();
  }

  pageNumbers(): number[] {
    const total = Math.ceil(this.totalCount() / this.pageSize);
    const cur   = this.page();
    const pages: number[] = [];
    for (let i = Math.max(1, cur - 2); i <= Math.min(total, cur + 2); i++) {
      pages.push(i);
    }
    return pages;
  }

  // ── Helpers ───────────────────────────────────────────
  initials(u: User) {
    return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
  }
}
