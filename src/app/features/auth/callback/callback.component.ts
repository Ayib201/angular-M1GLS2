import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-callback',
  imports: [CommonModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Connexion</h1>
          <p>{{ message() }}</p>
        </div>
      </div>
    </div>
  `,
})
export class CallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly message = signal('Validation de la connexion...');

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');

    if (!code) {
      this.message.set('Code de connexion absent.');
      void this.router.navigate(['/auth/login']);
      return;
    }

    this.auth.completeLoginRedirect(code).subscribe({
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
      error: () => {
        this.message.set('Connexion impossible.');
        void this.router.navigate(['/auth/login']);
      },
    });
  }
}
