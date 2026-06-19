import { Component, inject, signal } from '@angular/core'; 
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'; 
import { RouterLink, Router } from '@angular/router'; 
import { CommonModule } from '@angular/common'; 
import { AuthService } from '../../../core/services/auth.service'; 
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent { 
  private fb     = inject(FormBuilder); 
  private auth   = inject(AuthService); 
  private router = inject(Router); 
  
  loading = signal(false); 
  error   = signal(''); 
  showPwd = signal(false); 
  
  form = this.fb.group({ 
    email:    ['', [Validators.required, Validators.email]], 
    password: ['', [Validators.required, Validators.minLength(6)]] 
  }); 
  
  isInvalid(field: string) { 
    const c = this.form.get(field)!; 
    return c.invalid && (c.dirty || c.touched); 
  } 
  
  onSubmit() { 
    if (this.form.invalid) { this.form.markAllAsTouched(); return; } 
    this.loading.set(true); 
    this.error.set(''); 
    const { email, password } = this.form.value; 
    this.auth.login(email!, password!).subscribe({ 
      next: ()  => this.router.navigate(['/dashboard']), 
      error: (e) => { 
        this.error.set(e.error?.message ?? 'Erreur de connexion'); 
        this.loading.set(false); 
      } 
    }); 
  } 
} 