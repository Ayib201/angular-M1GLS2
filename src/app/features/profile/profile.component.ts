import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import {
  ChangePasswordRequest,
  UpdateProfileRequest,
} from '../../shared/models/user';
import { LucideCircleCheck } from '@lucide/angular';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, CommonModule, LucideCircleCheck],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly savingInfo = signal(false);
  readonly savingPwd = signal(false);
  readonly infoSuccess = signal(false);
  readonly infoError = signal('');
  readonly pwdSuccess = signal(false);
  readonly pwdError = signal('');

  readonly infoForm = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    department: ['', Validators.required],
  });

  readonly pwdForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    {
      validators: (control) =>
        control.get('newPassword')?.value ===
        control.get('confirmPassword')?.value
          ? null
          : { mismatch: true },
    },
  );

  ngOnInit(): void {
    this.userService.getMe().subscribe({
      next: (user) => {
        this.infoForm.patchValue(user);
        this.auth.updateLocalUser(user);
        this.loading.set(false);
      },
      error: (error) => {
        this.infoError.set(this.errorMessage(error));
        this.loading.set(false);
      },
    });
  }

  saveInfo(): void {
    if (this.infoForm.invalid) {
      this.infoForm.markAllAsTouched();
      return;
    }

    this.savingInfo.set(true);
    this.infoError.set('');
    const data: UpdateProfileRequest = this.infoForm.getRawValue();

    this.userService.updateMe(data).subscribe({
      next: (user) => {
        this.auth.updateLocalUser(user);
        this.infoSuccess.set(true);
        this.savingInfo.set(false);
        setTimeout(() => this.infoSuccess.set(false), 3000);
      },
      error: (error) => {
        this.infoError.set(this.errorMessage(error));
        this.savingInfo.set(false);
      },
    });
  }

  savePassword(): void {
    if (this.pwdForm.invalid) {
      this.pwdForm.markAllAsTouched();
      return;
    }

    this.savingPwd.set(true);
    this.pwdError.set('');
    const formValue = this.pwdForm.getRawValue();
    const data: ChangePasswordRequest = {
      currentPassword: formValue.currentPassword,
      newPassword: formValue.newPassword,
    };

    this.userService.changePassword(data).subscribe({
      next: () => {
        this.pwdSuccess.set(true);
        this.pwdForm.reset();
        this.savingPwd.set(false);
        setTimeout(() => this.pwdSuccess.set(false), 3000);
      },
      error: (error) => {
        this.pwdError.set(this.errorMessage(error));
        this.savingPwd.set(false);
      },
    });
  }

  initials(): string {
    const user = this.auth.currentUser();
    return user
      ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
      : '?';
  }

  private errorMessage(error: {
    status?: number;
    error?: { message?: string };
  }): string {
    if (error.status === 409) {
      return 'Cette adresse email est déjà utilisée.';
    }
    return error.error?.message ?? 'Une erreur est survenue.';
  }
}
