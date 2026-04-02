import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Login form — Reactive Form approach.
 * Validates username (required, minLength 3) and password (required, minLength 6).
 * Errors are shown only after the user has touched a field.
 * Submission is blocked when the form is invalid; all fields are marked touched on failed attempt.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div style="text-align:center; margin-bottom:24px;">
          <i class="fas fa-graduation-cap" style="font-size:48px; color:#1976d2;"></i>
        </div>
        <h1>CampusConnect</h1>
        <p>Sign in to your dashboard</p>

        <!-- Server-side error -->
        <div *ngIf="serverError" class="error-message">{{ serverError }}</div>

        <form [formGroup]="form" (ngSubmit)="onLogin()" novalidate>

          <!-- Username -->
          <div class="form-group">
            <label for="username">Username</label>
            <input
              id="username"
              type="text"
              formControlName="username"
              placeholder="Enter your username"
              [class.input-error]="isInvalid('username')"
            />
            <div class="error-hints" *ngIf="isInvalid('username')">
              <span *ngIf="ctrl('username').errors?.['required']">Username is required.</span>
              <span *ngIf="ctrl('username').errors?.['minlength']">
                At least {{ ctrl('username').errors?.['minlength'].requiredLength }} characters required.
              </span>
            </div>
          </div>

          <!-- Password -->
          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="Enter your password"
              [class.input-error]="isInvalid('password')"
            />
            <div class="error-hints" *ngIf="isInvalid('password')">
              <span *ngIf="ctrl('password').errors?.['required']">Password is required.</span>
              <span *ngIf="ctrl('password').errors?.['minlength']">
                Password must be at least {{ ctrl('password').errors?.['minlength'].requiredLength }} characters.
              </span>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" [disabled]="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <p style="text-align:center; margin-top:20px; font-size:14px; color:#666;">
          Don't have an account?
          <a routerLink="/register" style="color:#1976d2; font-weight:500;">Register</a>
          &nbsp;|&nbsp;
          <a routerLink="/home" style="color:#1976d2; font-weight:500;">Home</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .input-error { border-color: #e53935 !important; }
    .error-hints { margin-top: 4px; font-size: 12px; color: #e53935; }
  `]
})
export class LoginComponent {
  form = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.minLength(3)]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  serverError = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  ctrl(name: string): AbstractControl {
    return this.form.get(name)!;
  }

  isInvalid(name: string): boolean {
    const c = this.ctrl(name);
    return c.invalid && c.touched;
  }

  onLogin(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.serverError = '';

    const { username, password } = this.form.value;
    this.authService.login({ username: username!, password: password! }).subscribe({
      next: (response) => {
        this.loading = false;
        const role = response.user.role;
        if (role === 'student') this.router.navigate(['/student']);
        else if (role === 'teacher') this.router.navigate(['/teacher']);
        else if (role === 'hr') this.router.navigate(['/hr']);
        else if (role === 'librarian') this.router.navigate(['/librarian']);
      },
      error: (err) => {
        this.loading = false;
        this.serverError = err.error?.error || 'Login failed. Please try again.';
      }
    });
  }
}
