import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="form-container">
      <h2>🏫 CampusConnect Login</h2>
      
      <div *ngIf="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="username">Username</label>
          <input 
            type="text" 
            id="username" 
            formControlName="username"
            placeholder="Enter your username"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            formControlName="password"
            placeholder="Enter your password"
          />
        </div>

        <button type="submit" [disabled]="loginForm.invalid || loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>

      <p style="margin-top: 1rem; text-align: center;">
        Don't have an account? <a routerLink="/register">Register here</a>
      </p>
    </div>
  `,
  styles: [`
    .form-container {
      margin-top: 4rem;
    }
    h2 {
      text-align: center;
      margin-bottom: 2rem;
      color: #2c3e50;
    }
    a {
      color: #3498db;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const { username, password } = this.loginForm.value;

      this.authService.login(username, password).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = 'Invalid username or password';
          console.error('Login error:', error);
        }
      });
    }
  }
}
