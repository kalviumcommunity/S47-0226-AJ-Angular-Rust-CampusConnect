import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NavigationService } from '../services/navigation.service';

/**
 * HomeComponent — public landing page.
 * Route: /home
 * Uses routerLink for internal navigation (no plain href).
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home-page">
      <header class="home-header">
        <div class="home-header-inner">
          <div class="brand">
            <i class="fas fa-graduation-cap"></i>
            <span>CampusConnect</span>
          </div>
          <nav class="home-nav">
            <a routerLink="/home" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Home</a>
            <a routerLink="/login" *ngIf="!isLoggedIn">Login</a>
            <a routerLink="/register" *ngIf="!isLoggedIn">Register</a>
            <a [routerLink]="dashboardRoute" *ngIf="isLoggedIn">Dashboard</a>
            <a routerLink="/profile/{{ currentUser?.username }}" *ngIf="isLoggedIn">Profile</a>
          </nav>
        </div>
      </header>

      <section class="hero">
        <h1>Welcome to CampusConnect</h1>
        <p>Your all-in-one campus management platform for students, teachers, HR, and librarians.</p>
        <div class="hero-actions">
          <a routerLink="/login" class="btn btn-primary" *ngIf="!isLoggedIn">Get Started</a>
          <a [routerLink]="dashboardRoute" class="btn btn-primary" *ngIf="isLoggedIn">Go to Dashboard</a>
          <a routerLink="/register" class="btn btn-outline" *ngIf="!isLoggedIn">Create Account</a>
        </div>
      </section>

      <section class="features">
        <div class="feature-card">
          <i class="fas fa-user-graduate"></i>
          <h3>Students</h3>
          <p>Track fees, attendance, results, and library books in one place.</p>
          <a routerLink="/login" class="btn btn-outline btn-sm">Student Login</a>
        </div>
        <div class="feature-card">
          <i class="fas fa-chalkboard-teacher"></i>
          <h3>Teachers</h3>
          <p>Manage batches, mark attendance, upload notes, and review submissions.</p>
          <a routerLink="/login" class="btn btn-outline btn-sm">Teacher Login</a>
        </div>
        <div class="feature-card">
          <i class="fas fa-book"></i>
          <h3>Library</h3>
          <p>Issue and return books, manage waitlists, and track borrowing history.</p>
          <a routerLink="/login" class="btn btn-outline btn-sm">Librarian Login</a>
        </div>
        <div class="feature-card">
          <i class="fas fa-users-cog"></i>
          <h3>HR</h3>
          <p>Manage staff records, payroll, and campus administration.</p>
          <a routerLink="/login" class="btn btn-outline btn-sm">HR Login</a>
        </div>
      </section>

      <div class="nav-state-info" *ngIf="lastVisited">
        <i class="fas fa-history"></i>
        Last visited: <strong>{{ lastVisited }}</strong>
      </div>
    </div>
  `,
  styles: [`
    .home-page { min-height: 100vh; background: #f5f7fa; font-family: 'Segoe UI', sans-serif; }

    .home-header { background: #1976d2; color: white; padding: 0 32px; }
    .home-header-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 64px; }
    .brand { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 700; }
    .brand i { font-size: 24px; }
    .home-nav { display: flex; gap: 24px; }
    .home-nav a { color: rgba(255,255,255,0.85); text-decoration: none; font-size: 15px; font-weight: 500; transition: color 0.2s; }
    .home-nav a:hover, .home-nav a.active { color: white; }

    .hero { text-align: center; padding: 80px 32px 60px; background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); color: white; }
    .hero h1 { font-size: 42px; font-weight: 700; margin: 0 0 16px; }
    .hero p { font-size: 18px; opacity: 0.9; margin: 0 0 32px; }
    .hero-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }

    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; max-width: 1100px; margin: 48px auto; padding: 0 32px; }
    .feature-card { background: white; border-radius: 12px; padding: 32px 24px; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .feature-card i { font-size: 40px; color: #1976d2; margin-bottom: 16px; }
    .feature-card h3 { font-size: 18px; font-weight: 600; margin: 0 0 10px; color: #1a1a2e; }
    .feature-card p { font-size: 14px; color: #666; margin: 0 0 20px; line-height: 1.6; }

    .nav-state-info { text-align: center; padding: 16px; color: #888; font-size: 13px; }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; border-radius: 8px; font-size: 15px; font-weight: 500; text-decoration: none; cursor: pointer; border: none; transition: all 0.2s; }
    .btn-primary { background: white; color: #1976d2; }
    .btn-primary:hover { background: #e3f2fd; }
    .btn-outline { background: transparent; color: white; border: 2px solid rgba(255,255,255,0.7); }
    .btn-outline:hover { background: rgba(255,255,255,0.1); }
    .feature-card .btn-outline { color: #1976d2; border-color: #1976d2; }
    .feature-card .btn-outline:hover { background: #e3f2fd; }
    .btn-sm { padding: 6px 16px; font-size: 13px; }
  `]
})
export class HomeComponent implements OnInit {
  isLoggedIn = false;
  currentUser: any = null;
  dashboardRoute = '/login';
  lastVisited = '';

  constructor(
    private authService: AuthService,
    private navService: NavigationService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.currentUser = this.authService.getUser();
    if (this.currentUser) {
      this.dashboardRoute = `/${this.currentUser.role}`;
    }
    this.navService.setLastVisited('/home');
    this.navService.addBreadcrumb('Home');
    const state = this.navService.getState();
    this.lastVisited = state.lastVisitedRoute !== '/home' ? state.lastVisitedRoute : '';
  }
}
