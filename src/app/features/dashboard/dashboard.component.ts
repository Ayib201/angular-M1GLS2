// features/dashboard/dashboard.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats } from '../../shared/models/user';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private userSvc = inject(UserService);
  stats = signal<DashboardStats | null>(null);
  ngOnInit() {
    // Charge les stats uniquement si Admin
    if (this.auth.isAdmin()) {
      this.userSvc.getStats().subscribe((s) => this.stats.set(s));
    }
  }
}
