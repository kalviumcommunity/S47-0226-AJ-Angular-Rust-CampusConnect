import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, UserInfo } from '../services/auth.service';
import { NavigationService } from '../services/navigation.service';

/**
 * ProfileComponent — displays user profile details.
 * Route: /profile/:username
 * Demonstrates:
 *  - Reading route parameters (ActivatedRoute.paramMap)
 *  - Reading query parameters (?tab=info)
 *  - Programmatic navigation via Router service
 *  - Service state persistence via NavigationService
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="profile-page">
      <!-- Navbar -->
      <header class="profile-header">
        <div class="header-inner">
          <a routerLink="/home" class="brand">
            <i class="fas fa-graduation-cap"></i> CampusConnect
          </a>
          <nav class="header-nav">
            <a routerLink="/home">Home</a>
            <a [routerLink]="dashboardRoute">Dashboard</a>
            <a routerLink="/profile/{{ profileUser?.username }}" class="active">Profile</a>
          </nav>
          <button class="btn btn-outline btn-sm" (click)="logout()">
            <i class="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </header>

      <div class="profile-container">
        <!-- Breadcrumbs -->
        <div class="breadcrumbs">
          <a routerLink="/home">Home</a>
          <span>/</span>
          <a [routerLink]="dashboardRoute">Dashboard</a>
          <span>/</span>
          <span>Profile</span>
        </div>

        <!-- Error state -->
        <div class="error-card" *ngIf="error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>{{ error }}</p>
          <button class="btn btn-primary" (click)="goBack()">Go Back</button>
        </div>

        <!-- Profile content -->
        <div class="profile-card" *ngIf="profileUser && !error">
          <!-- Avatar & Name -->
          <div class="profile-top">
            <div class="avatar">{{ getInitials() }}</div>
            <div class="profile-info">
              <h1>{{ profileUser.full_name }}</h1>
              <span class="role-badge role-{{ profileUser.role }}">{{ profileUser.role | titlecase }}</span>
              <p class="campus-id"><i class="fas fa-id-card"></i> {{ profileUser.campus_id }}</p>
            </div>
          </div>

          <!-- Tab Navigation using query params -->
          <div class="tab-nav">
            <button
              class="tab-btn"
              [class.active]="activeTab === 'info'"
              (click)="switchTab('info')">
              <i class="fas fa-user"></i> Info
            </button>
            <button
              class="tab-btn"
              [class.active]="activeTab === 'activity'"
              (click)="switchTab('activity')">
              <i class="fas fa-history"></i> Activity
            </button>
            <button
              class="tab-btn"
              [class.active]="activeTab === 'settings'"
              (click)="switchTab('settings')">
              <i class="fas fa-cog"></i> Settings
            </button>
          </div>

          <!-- Tab: Info -->
          <div class="tab-content" *ngIf="activeTab === 'info'">
            <div class="info-grid">
              <div class="info-item">
                <label>Username</label>
                <span>{{ profileUser.username }}</span>
              </div>
              <div class="info-item">
                <label>Full Name</label>
                <span>{{ profileUser.full_name }}</span>
              </div>
              <div class="info-item">
                <label>Email</label>
                <span>{{ profileUser.email }}</span>
              </div>
              <div class="info-item">
                <label>Campus ID</label>
                <span>{{ profileUser.campus_id }}</span>
              </div>
              <div class="info-item">
                <label>Role</label>
                <span class="role-badge role-{{ profileUser.role }}">{{ profileUser.role | titlecase }}</span>
              </div>
            </div>
          </div>

          <!-- Tab: Activity -->
          <div class="tab-content" *ngIf="activeTab === 'activity'">
            <div class="activity-list">
              <div class="activity-item" *ngFor="let crumb of breadcrumbs">
                <i class="fas fa-map-marker-alt"></i>
                <span>Visited: <strong>{{ crumb }}</strong></span>
              </div>
              <div class="activity-item">
                <i class="fas fa-clock"></i>
                <span>Last route: <strong>{{ lastVisited }}</strong></span>
              </div>
              <div class="empty-state" *ngIf="!breadcrumbs.length">
                <i class="fas fa-history"></i>
                <p>No activity recorded yet</p>
              </div>
            </div>
          </div>

          <!-- Tab: Settings -->
          <div class="tab-content" *ngIf="activeTab === 'settings'">
            <div class="settings-section">
              <h3>Account Actions</h3>
              <div class="settings-actions">
                <button class="btn btn-primary" (click)="navigateToDashboard()">
                  <i class="fas fa-tachometer-alt"></i> Go to Dashboard
                </button>
                <button class="btn btn-danger" (click)="logout()">
                  <i class="fas fa-sign-out-alt"></i> Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Route param info box -->
        <div class="param-info" *ngIf="routeUsername">
          <i class="fas fa-info-circle"></i>
          Route param: <code>/profile/<strong>{{ routeUsername }}</strong></code>
          &nbsp;|&nbsp; Query param: <code>?tab=<strong>{{ activeTab }}</strong></code>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-page { min-height: 100vh; background: #f5f7fa; font-family: 'Segoe UI', sans-serif; }

    .profile-header { background: #1976d2; color: white; padding: 0 32px; }
    .header-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; gap: 24px; height: 64px; }
    .brand { color: white; text-decoration: none; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; flex: 1; }
    .header-nav { display: flex; gap: 20px; }
    .header-nav a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 14px; font-weight: 500; }
    .header-nav a:hover, .header-nav a.active { color: white; }

    .profile-container { max-width: 800px; margin: 32px auto; padding: 0 24px; }

    .breadcrumbs { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #888; margin-bottom: 24px; }
    .breadcrumbs a { color: #1976d2; text-decoration: none; }
    .breadcrumbs a:hover { text-decoration: underline; }

    .profile-card { background: white; border-radius: 16px; box-shadow: 0 2px 16px rgba(0,0,0,0.08); overflow: hidden; }

    .profile-top { display: flex; align-items: center; gap: 24px; padding: 32px; background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; }
    .avatar { width: 80px; height: 80px; border-radius: 50%; background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; flex-shrink: 0; }
    .profile-info h1 { margin: 0 0 8px; font-size: 24px; }
    .campus-id { margin: 8px 0 0; font-size: 14px; opacity: 0.85; }

    .role-badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .role-student { background: #e3f2fd; color: #1565c0; }
    .role-teacher { background: #e8f5e9; color: #2e7d32; }
    .role-hr { background: #fff3e0; color: #e65100; }
    .role-librarian { background: #f3e5f5; color: #6a1b9a; }
    .profile-top .role-badge { background: rgba(255,255,255,0.25); color: white; }

    .tab-nav { display: flex; border-bottom: 1px solid #f0f0f0; padding: 0 24px; }
    .tab-btn { background: none; border: none; padding: 16px 20px; font-size: 14px; font-weight: 500; color: #888; cursor: pointer; border-bottom: 2px solid transparent; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
    .tab-btn:hover { color: #1976d2; }
    .tab-btn.active { color: #1976d2; border-bottom-color: #1976d2; }

    .tab-content { padding: 28px; }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-item label { display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #aaa; margin-bottom: 4px; }
    .info-item span { font-size: 15px; color: #1a1a2e; font-weight: 500; }

    .activity-list { display: flex; flex-direction: column; gap: 12px; }
    .activity-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #f8f9fa; border-radius: 8px; font-size: 14px; color: #555; }
    .activity-item i { color: #1976d2; width: 16px; }

    .settings-section h3 { font-size: 16px; font-weight: 600; color: #1a1a2e; margin: 0 0 16px; }
    .settings-actions { display: flex; gap: 12px; flex-wrap: wrap; }

    .param-info { margin-top: 16px; padding: 12px 16px; background: #e3f2fd; border-radius: 8px; font-size: 13px; color: #1565c0; }
    .param-info code { background: rgba(25,118,210,0.1); padding: 2px 6px; border-radius: 4px; }

    .error-card { background: white; border-radius: 12px; padding: 40px; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .error-card i { font-size: 40px; color: #e53935; margin-bottom: 16px; }

    .empty-state { text-align: center; padding: 32px; color: #aaa; }
    .empty-state i { font-size: 32px; margin-bottom: 12px; }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; text-decoration: none; transition: all 0.2s; }
    .btn-primary { background: #1976d2; color: white; }
    .btn-primary:hover { background: #1565c0; }
    .btn-outline { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.6); }
    .btn-outline:hover { background: rgba(255,255,255,0.1); }
    .btn-danger { background: #e53935; color: white; }
    .btn-danger:hover { background: #c62828; }
    .btn-sm { padding: 6px 14px; font-size: 13px; }
  `]
})
export class ProfileComponent implements OnInit {
  profileUser: UserInfo | null = null;
  routeUsername = '';
  activeTab = 'info';
  dashboardRoute = '/login';
  error = '';
  breadcrumbs: string[] = [];
  lastVisited = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private navService: NavigationService
  ) {}

  ngOnInit(): void {
    // Read route parameter: /profile/:username
    this.route.paramMap.subscribe(params => {
      this.routeUsername = params.get('username') || '';
      this.loadProfile();
    });

    // Read query parameter: ?tab=info
    this.route.queryParamMap.subscribe(qp => {
      this.activeTab = qp.get('tab') || 'info';
    });

    const state = this.navService.getState();
    this.breadcrumbs = state.breadcrumbs;
    this.lastVisited = state.lastVisitedRoute;

    this.navService.setLastVisited(`/profile/${this.routeUsername}`);
    this.navService.addBreadcrumb('Profile');
  }

  loadProfile(): void {
    const currentUser = this.authService.getUser();
    if (!currentUser) {
      this.error = 'You must be logged in to view profiles.';
      return;
    }

    // Only allow viewing own profile
    if (currentUser.username !== this.routeUsername) {
      this.error = `Profile for "${this.routeUsername}" is not accessible.`;
      return;
    }

    this.profileUser = currentUser;
    this.dashboardRoute = `/${currentUser.role}`;
  }

  getInitials(): string {
    if (!this.profileUser?.full_name) return '?';
    return this.profileUser.full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /** Programmatic navigation using Router service — switches tab and updates query params */
  switchTab(tab: string): void {
    this.activeTab = tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge'
    });
  }

  navigateToDashboard(): void {
    this.router.navigate([this.dashboardRoute]);
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  logout(): void {
    this.authService.logout();
  }
}
