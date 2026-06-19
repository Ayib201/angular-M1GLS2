import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { LucideEye, LucideEyeOff, LucideLogIn } from '@lucide/angular';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CommonModule,
    LucideEye,
    LucideEyeOff,
    LucideLogIn,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router); 

  loading = signal(false);
  error = signal('');
  showPwd = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  isInvalid(field: string) {
    const c = this.form.get(field)!;
    return c.invalid && (c.dirty || c.touched); 
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();

    this.auth
      .login({ email: email!, password: password! })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          void this.router
            .navigateByUrl('/dashboard', { replaceUrl: true })
            .then((navigated) => {
              if (!navigated) {
                window.location.assign('/dashboard');
              }
            })
            .catch(() => {
              window.location.assign('/dashboard');
            });
        },
        error: (error) => {
          this.error.set(
            error.error?.message ??
              'Identifiants incorrects ou compte désactivé.',
          );
        },
      });
  }
}
