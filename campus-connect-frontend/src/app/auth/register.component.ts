import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Custom validator: password must contain at least one digit */
function hasDigitValidator(control: AbstractControl): ValidationErrors | null {
  return /\d/.test(control.value ?? '') ? null : { hasDigit: true };
}

/**
 * Register form — Reactive Form approach.
 * Fields: full_name, email, username, password, role, campus_id.
 * Validation: required on all fields, email format, minLength on name/password,
 *             pattern on campus_id, custom hasDigit on password.
 * Errors shown only after the user touches a field.
 * markAllAsTouched() called on failed submit so all errors surface at once.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div style="text-align:center; margin-bottom:24px;">
          <i class="fas fa-graduation-cap" style="font-size:48px; color:#1976d2;"></i>
        </div>
        <h1>Create Account</h1>
        <p>Register for CampusConnect</p>

        <div *ngIf="serverError" class="error-message">{{ serverError }}</div>
        <div *ngIf="successMsg" class="success-message">{{ successMsg }}</div>

        <form [formGroup]="form" (ngSubmit)="onRegister()" novalidate>

          <!-- Full Name -->
          <div class="form-group">
            <label for="fullName">Full Name</label>
            <input id="fullName" type="text" formControlName="full_name"
                   placeholder="Jane Doe" [class.input-error]="isInvalid('full_name')" />
            <div class="error-hints" *ngIf="isInvalid('full_name')">
              <span *ngIf="ctrl('full_name').errors?.['required']">Full name is required.</span>
              <span *ngIf="ctrl('full_name').errors?.['minlength']">
                At least {{ ctrl('full_name').errors?.['minlength'].requiredLength }} characters required.
              </span>
            </div>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" type="email" formControlName="email"
                   placeholder="jane@campus.edu" [class.input-error]="isInvalid('email')" />
            <div class="error-hints" *ngIf="isInvalid('email')">
              <span *ngIf="ctrl('email').errors?.['required']">Email is required.</span>
              <span *ngIf="ctrl('email').errors?.['email']">Enter a valid email address.</span>
            </div>
          </div>

          <!-- Username -->
          <div class="form-group">
            <label for="username">Username</label>
            <input id="username" type="text" formControlName="username"
                   placeholder="johndoe" [class.input-error]="isInvalid('username')" />
            <div class="error-hints" *ngIf="isInvalid('username')">
              <span *ngIf="ctrl('username').errors?.['required']">Username is required.</span>
              <span *ngIf="ctrl('username').errors?.['minlength']">
                At least {{ ctrl('username').errors?.['minlength'].requiredLength }} characters required.
              </span>
              <span *ngIf="ctrl('username').errors?.['pattern']">Only letters, numbers, and underscores allowed.</span>
            </div>
          </div>

          <!-- Password -->
          <div class="form-group">
            <label for="password">Password</label>
            <input id="password" type="password" formControlName="password"
                   placeholder="Min 6 chars, at least one digit" [class.input-error]="isInvalid('password')" />
            <div class="error-hints" *ngIf="isInvalid('password')">
              <span *ngIf="ctrl('password').errors?.['required']">Password is required.</span>
              <span *ngIf="ctrl('password').errors?.['minlength']">
                Password must be at least {{ ctrl('password').errors?.['minlength'].requiredLength }} characters.
              </span>
              <span *ngIf="ctrl('password').errors?.['hasDigit']">Password must contain at least one number.</span>
            </div>
          </div>

          <!-- Role -->
          <div class="form-group">
            <label for="role">Role</label>
            <select id="role" formControlName="role" [class.input-error]="isInvalid('role')">
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="hr">HR</option>
              <option value="librarian">Librarian</option>
            </select>
            <div class="error-hints" *ngIf="isInvalid('role')">
              <span *ngIf="ctrl('role').errors?.['required']">Please select a role.</span>
            </div>
          </div>

          <!-- Campus ID -->
          <div class="form-group">
            <label for="campusId">Campus ID</label>
            <input id="campusId" type="text" formControlName="campus_id"
                   placeholder="CAMPUS001" [class.input-error]="isInvalid('campus_id')" />
            <div class="error-hints" *ngIf="isInvalid('campus_id')">
              <span *ngIf="ctrl('campus_id').errors?.['required']">Campus ID is required.</span>
              <span *ngIf="ctrl('campus_id').errors?.['pattern']">Format: letters and digits only, 4–20 characters.</span>
            </div>
          </div>

          <button type="submit" class="btn btn-primary" [disabled]="loading">
            {{ loading ? 'Creating Account...' : 'Create Account' }}
          </button>
        </form>

        <p style="text-align:center; margin-top:20px; font-size:14px; color:#666;">
          Already have an account?
          <a routerLink="/login" style="color:#1976d2; font-weight:500;">Sign In</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .input-error { border-color: #e53935 !important; }
    .error-hints { margin-top: 4px; font-size: 12px; color: #e53935; }
    .success-message { background: #e8f5e9; color: #2e7d32; padding: 10px; border-radius: 8px; font-size: 14px; margin-bottom: 16px; }
  `]
})
export class RegisterComponent {
  form = new FormGroup({
    full_name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email:     new FormControl('', [Validators.required, Validators.email]),
    username:  new FormControl('', [Validators.required, Validators.minLength(3), Validators.pattern(/^\w+$/)]),
    password:  new FormControl('', [Validators.required, Validators.minLength(6), hasDigitValidator]),
    role:      new FormControl('student', Validators.required),
    campus_id: new FormControl('', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{4,20}$/)])
  });

  serverError = '';
  successMsg = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  ctrl(name: string): AbstractControl {
    return this.form.get(name)!;
  }

  isInvalid(name: string): boolean {
    const c = this.ctrl(name);
    return c.invalid && c.touched;
  }

  onRegister(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.serverError = '';
    this.successMsg = '';

    this.authService.register(this.form.value as any).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg = 'Account created! Redirecting to login...';
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err: any) => {
        this.loading = false;
        this.serverError = err.error?.error || 'Registration failed.';
      }
    });
  }
}
