import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NavigationService, NavState } from '../services/navigation.service';

/**
 * NavbarComponent — shared navigation bar used across routed pages.
 * Uses routerLink (no plain href) and reads shared state from NavigationService.
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar" *ngIf="isLoggedIn">
      <div class="navbar-inner">
        <a routerLink="/home" class="navbar-brand">
          <i class="fas fa-graduation-cap"></i> CampusConnect
        </a>

        <div class="navbar-links">
          <a routerLink="/home" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <i class="fas fa-home"></i> Home
          </a>
          <a [routerLink]="dashboardRoute" routerLinkActive="active">
            <i class="fas fa-tachometer-alt"></i> Dashboard
          </a>
          <a [routerLink]="profileRoute" routerLinkActive="active">
            <i class="fas fa-user"></i> Profile
          </a>
        </div>

        <div class="navbar-right">
          <span class="user-chip">
            <span class="user-avatar-sm">{{ initials }}</span>
            {{ userName }}
          </span>
          <button class="btn-logout" (click)="logout()">
            <i class="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar { background: #1976d2; color: white; padding: 0 24px; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
    .navbar-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; height: 60px; gap: 24px; }
    .navbar-brand { color: white; text-decoration: none; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .navbar-links { display: flex; gap: 4px; flex: 1; }
    .navbar-links a { color: rgba(255,255,255,0.8); text-decoration: none; padding: 6px 14px; border-radius: 6px; font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
    .navbar-links a:hover { background: rgba(255,255,255,0.12); color: white; }
    .navbar-links a.active { background: rgba(255,255,255,0.2); color: white; }
    .navbar-right { display: flex; align-items: center; gap: 12px; margin-left: auto; }
    .user-chip { display: flex; align-items: center; gap: 8px; font-size: 14px; color: rgba(255,255,255,0.9); }
    .user-avatar-sm { width: 30px; height: 30px; border-radius: 50%; background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
    .btn-logout { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px 14px; border-radius: 6px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; }
    .btn-logout:hover { background: rgba(255,255,255,0.25); }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  isLoggedIn = false;
  userName = '';
  initials = '';
  dashboardRoute = '/login';
  profileRoute = '/login';

  private sub!: Subscription;

  constructor(
    private authService: AuthService,
    private navService: NavigationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sub = this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      if (user) {
        this.userName = user.full_name;
        this.initials = user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        this.dashboardRoute = `/${user.role}`;
        this.profileRoute = `/profile/${user.username}`;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  logout(): void {
    this.authService.logout();
  }
}
