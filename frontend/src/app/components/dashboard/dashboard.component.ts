import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div>
      <nav>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h1 class="logo">🏫 CampusConnect</h1>
          <div style="display: flex; align-items: center; gap: 2rem;">
            <span *ngIf="currentUser" style="color: white;">
              Welcome, {{ currentUser.full_name }} ({{ currentUser.role }})
            </span>
            <button (click)="logout()" style="background-color: #e74c3c;">
              Logout
            </button>
          </div>
        </div>
        <ul>
          <li><a routerLink="/dashboard" routerLinkActive="active">Dashboard</a></li>
          <li><a routerLink="/academics" routerLinkActive="active">Academics</a></li>
          <li><a routerLink="/finance" routerLinkActive="active">Finance</a></li>
          <li><a routerLink="/hostel" routerLinkActive="active">Hostel</a></li>
          <li><a routerLink="/library" routerLinkActive="active">Library</a></li>
          <li><a routerLink="/hr" routerLinkActive="active">HR</a></li>
        </ul>
      </nav>

      <div class="container">
        <h1>Dashboard</h1>
        <p *ngIf="currentUser" style="margin-bottom: 2rem;">
          Campus: <strong>{{ currentUser.campus_id }}</strong>
        </p>

        <div class="dashboard-grid">
          <div class="dashboard-card" routerLink="/academics" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <h3>📘 Academics</h3>
            <p>Manage courses, enrollments, and attendance</p>
          </div>

          <div class="dashboard-card" routerLink="/finance" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <h3>💰 Finance</h3>
            <p>Track fees, payments, and invoices</p>
          </div>

          <div class="dashboard-card" routerLink="/hostel" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <h3>🏠 Hostel</h3>
            <p>Manage rooms, allocations, and maintenance</p>
          </div>

          <div class="dashboard-card" routerLink="/library" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
            <h3>📚 Library</h3>
            <p>Books catalog, issue & return system</p>
          </div>

          <div class="dashboard-card" routerLink="/hr" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
            <h3>👥 HR</h3>
            <p>Faculty management, leaves, and payroll</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    nav ul {
      margin-top: 1rem;
    }
    .active {
      background-color: #34495e !important;
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
