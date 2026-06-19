import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { LucideUserPlus } from '@lucide/angular';

// Validator personnalisé : vérifie que password === confirmPassword
function passwordMatch(control: AbstractControl) {
  const pw = control.get('password')?.value;
  const cpw = control.get('confirmPassword')?.value;
  return pw === cpw ? null : { mismatch: true };
}
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, CommonModule, LucideUserPlus],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal('');

  form = this.fb.group(
    {
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      department: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordMatch },
  ); // Validator au niveau du groupe

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
    const { firstName, lastName, email, department, password } =
      this.form.getRawValue();
    this.auth
      .register({
        firstName: firstName!,
        lastName: lastName!,
        email: email!,
        department: department!,
        password: password!,
      })
      .subscribe({
        next: () =>
          this.router.navigate(['/auth/login'], {
            state: { registered: true },
          }),
        error: (e) => {
          this.error.set(e.error?.message ?? "Erreur lors de l'inscription");
          this.loading.set(false);
        },
      });
  }
}
