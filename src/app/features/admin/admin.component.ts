import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User, DashboardStats } from '../../shared/models/user';
@Component({
  selector: 'app-admin',
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  auth = inject(AuthService);
  private userSvc = inject(UserService);

  stats = signal<DashboardStats | null>(null);
  recentUsers = signal<User[]>([]);
  exportMsg = signal('');

  ngOnInit() {
    this.refreshStats();
    // Charge les 5 derniers utilisateurs
    this.userSvc
      .getAll(1, 5)
      .subscribe((res) => this.recentUsers.set(res.items));
  }

  refreshStats() {
    this.userSvc.getStats().subscribe((s) => this.stats.set(s));
  }

  activePct() {
    const s = this.stats();
    return s && s.total > 0 ? Math.round((s.active / s.total) * 100) : 0;
  }
  adminPct() {
    const s = this.stats();
    return s && s.total > 0 ? Math.round((s.admins / s.total) * 100) : 0;
  }

  exportCsv() {
    this.userSvc.getAll(1, 1000).subscribe((res) => {
      const header = 'Prénom,Nom,Email,Rôle,Actif,Département,Créé le\n';
      const rows = res.items
        .map(
          (u) =>
            `${u.firstName},${u.lastName},${u.email},${u.role},${u.isActive},${
              u.department ?? ''
            },${u.createdAt}`,
        )
        .join('\n');
      const blob = new Blob([header + rows], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'utilisateurs.csv';
      a.click();
      URL.revokeObjectURL(url);
      this.exportMsg.set('✅ Export CSV terminé !');
      setTimeout(() => this.exportMsg.set(''), 3000);
    });
  }

  initials(u: User) {
    return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
  }
}
