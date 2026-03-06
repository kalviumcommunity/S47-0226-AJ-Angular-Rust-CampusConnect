import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div style="text-align: center; margin-bottom: 24px;">
          <i class="fas fa-graduation-cap" style="font-size: 48px; color: #1976d2;"></i>
        </div>
        <h1>CampusConnect</h1>
        <p>Sign in to your dashboard</p>

        <div *ngIf="error" class="error-message">{{ error }}</div>

        <form (ngSubmit)="onLogin()">
          <div class="form-group">
            <label for="username">Username</label>
            <input id="username" type="text" [(ngModel)]="credentials.username" name="username"
                   placeholder="Enter your username" required>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" [(ngModel)]="credentials.password" name="password"
                   placeholder="Enter your password" required>
          </div>

          <button type="submit" class="btn btn-primary" [disabled]="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <p style="text-align: center; margin-top: 20px; font-size: 14px; color: #666;">
          Don't have an account? <a routerLink="/register" style="color: #1976d2; font-weight: 500;">Register</a>
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  credentials = { username: '', password: '' };
  error = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(): void {
    this.loading = true;
    this.error = '';

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        this.loading = false;
        const role = response.user.role;
        if (role === 'student') {
          this.router.navigate(['/student']);
        } else if (role === 'teacher') {
          this.router.navigate(['/teacher']);
        } else if (role === 'hr') {
          this.router.navigate(['/hr']);
        } else if (role === 'librarian') {
          this.router.navigate(['/librarian']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Login failed. Please try again.';
      }
    });
  }
}
