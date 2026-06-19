import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  auth = inject(AuthService);
  private userSvc = inject(UserService);
  private fb = inject(FormBuilder);

  savingInfo = signal(false);
  savingPwd = signal(false);
  infoSuccess = signal(false);
  infoError = signal('');
  pwdSuccess = signal(false);
  pwdError = signal('');

  infoForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: [''],
    department: [''],
  });

  pwdForm = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    {
      validators: (c) =>
        c.get('newPassword')?.value === c.get('confirmPassword')?.value
          ? null
          : { mismatch: true },
    },
  );

  ngOnInit() {
    const u = this.auth.currentUser();
    if (u) this.infoForm.patchValue(u);
  }

  saveInfo() {
    if (this.infoForm.invalid) {
      this.infoForm.markAllAsTouched();
      return;
    }
    this.savingInfo.set(true);
    this.userSvc.updateMe(this.infoForm.value as any).subscribe({
      next: (user) => {
        this.auth.updateLocalUser(user); // met à jour le signal global
        this.infoSuccess.set(true);
        this.savingInfo.set(false);
        setTimeout(() => this.infoSuccess.set(false), 3000);
      },
      error: (e) => {
        this.infoError.set(e.error?.message ?? 'Erreur');
        this.savingInfo.set(false);
      },
    });
  }

  savePassword() {
    if (this.pwdForm.invalid) {
      this.pwdForm.markAllAsTouched();
      return;
    }
    this.savingPwd.set(true);
    const { currentPassword, newPassword } = this.pwdForm.value;
    this.userSvc.changePassword(currentPassword!, newPassword!).subscribe({
      next: () => {
        this.pwdSuccess.set(true);
        this.pwdForm.reset();
        this.savingPwd.set(false);
        setTimeout(() => this.pwdSuccess.set(false), 3000);
      },
      error: (e) => {
        this.pwdError.set(e.error?.message ?? 'Erreur');
        this.savingPwd.set(false);
      },
    });
  }
  initials() {
    const u = this.auth.currentUser();
    return u ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase() : '?';
  }
}
