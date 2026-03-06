import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div style="text-align: center; margin-bottom: 24px;">
          <i class="fas fa-graduation-cap" style="font-size: 48px; color: #1976d2;"></i>
        </div>
        <h1>Create Account</h1>
        <p>Register for CampusConnect</p>

        <div *ngIf="error" class="error-message">{{ error }}</div>
        <div *ngIf="success" style="background: #e8f5e9; color: #2e7d32; padding: 10px; border-radius: 8px; font-size: 14px; margin-bottom: 16px;">
          {{ success }}
        </div>

        <form (ngSubmit)="onRegister()">
          <div class="form-group">
            <label for="fullName">Full Name</label>
            <input id="fullName" type="text" [(ngModel)]="data.full_name" name="full_name" placeholder="John Doe" required>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" [(ngModel)]="data.email" name="email" placeholder="john&#64;campus.edu" required>
          </div>

          <div class="form-group">
            <label for="username">Username</label>
            <input id="username" type="text" [(ngModel)]="data.username" name="username" placeholder="johndoe" required>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" [(ngModel)]="data.password" name="password" placeholder="Min 6 characters" required>
          </div>

          <div class="form-group">
            <label for="role">Role</label>
            <select id="role" [(ngModel)]="data.role" name="role" required>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="hr">HR</option>
              <option value="librarian">Librarian</option>
            </select>
          </div>

          <div class="form-group">
            <label for="campusId">Campus ID</label>
            <input id="campusId" type="text" [(ngModel)]="data.campus_id" name="campus_id" placeholder="CAMPUS001" required>
          </div>

          <button type="submit" class="btn btn-primary" [disabled]="loading">
            {{ loading ? 'Creating Account...' : 'Create Account' }}
          </button>
        </form>

        <p style="text-align: center; margin-top: 20px; font-size: 14px; color: #666;">
          Already have an account? <a routerLink="/login" style="color: #1976d2; font-weight: 500;">Sign In</a>
        </p>
      </div>
    </div>
  `
})
export class RegisterComponent {
  data = {
    username: '',
    password: '',
    role: 'student',
    campus_id: '',
    email: '',
    full_name: ''
  };
  error = '';
  success = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  onRegister(): void {
    this.loading = true;
    this.error = '';
    this.success = '';

    this.authService.register(this.data).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Account created! Redirecting to login...';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.error?.error || 'Registration failed.';
      }
    });
  }
}
