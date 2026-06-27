import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { LucideLogIn } from '@lucide/angular';

@Component({
  selector: 'app-login',
  imports: [CommonModule, LucideLogIn],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);

  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.login();
  }

  login() {
    this.error.set('');
    this.loading.set(true);
    this.auth.login();
  }
}
