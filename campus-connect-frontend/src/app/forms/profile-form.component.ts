import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';

/**
 * Template-Driven Form Demo
 * Uses ngModel for two-way binding and built-in HTML5 validation attributes.
 * Angular tracks form state via NgForm directive automatically.
 */
@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="form-demo-container">
      <div class="form-demo-card">
        <div class="form-demo-header">
          <i class="fas fa-user-edit" style="font-size:36px; color:#1976d2;"></i>
          <h2>Template-Driven Form</h2>
          <p class="subtitle">Profile Update — uses <code>ngModel</code> &amp; built-in validators</p>
        </div>

        <!-- Form state badge -->
        <div class="state-badges">
          <span class="badge" [class.badge-valid]="profileForm.valid" [class.badge-invalid]="profileForm.invalid">
            {{ profileForm.valid ? '✓ Valid' : '✗ Invalid' }}
          </span>
          <span class="badge" [class.badge-dirty]="profileForm.dirty" [class.badge-pristine]="profileForm.pristine">
            {{ profileForm.dirty ? 'Dirty' : 'Pristine' }}
          </span>
          <span class="badge" [class.badge-touched]="profileForm.touched" [class.badge-untouched]="!profileForm.touched">
            {{ profileForm.touched ? 'Touched' : 'Untouched' }}
          </span>
        </div>

        <form #profileForm="ngForm" (ngSubmit)="onSubmit(profileForm)" novalidate>

          <!-- Full Name -->
          <div class="form-group">
            <label for="fullName">Full Name <span class="required">*</span></label>
            <input
              id="fullName"
              type="text"
              name="fullName"
              [(ngModel)]="model.fullName"
              #fullName="ngModel"
              required
              minlength="3"
              placeholder="e.g. Jane Doe"
              [class.input-error]="fullName.invalid && fullName.touched"
            />
            <div class="error-hints" *ngIf="fullName.invalid && fullName.touched">
              <span *ngIf="fullName.errors?.['required']">Full name is required.</span>
              <span *ngIf="fullName.errors?.['minlength']">
                Minimum {{ fullName.errors?.['minlength'].requiredLength }} characters
                ({{ fullName.errors?.['minlength'].actualLength }} entered).
              </span>
            </div>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="email">Email <span class="required">*</span></label>
            <input
              id="email"
              type="email"
              name="email"
              [(ngModel)]="model.email"
              #email="ngModel"
              required
              email
              placeholder="jane@campus.edu"
              [class.input-error]="email.invalid && email.touched"
            />
            <div class="error-hints" *ngIf="email.invalid && email.touched">
              <span *ngIf="email.errors?.['required']">Email is required.</span>
              <span *ngIf="email.errors?.['email']">Enter a valid email address.</span>
            </div>
          </div>

          <!-- Phone -->
          <div class="form-group">
            <label for="phone">Phone <span class="required">*</span></label>
            <input
              id="phone"
              type="tel"
              name="phone"
              [(ngModel)]="model.phone"
              #phone="ngModel"
              required
              pattern="^[0-9]{10,15}$"
              placeholder="10–15 digit number"
              [class.input-error]="phone.invalid && phone.touched"
            />
            <div class="error-hints" *ngIf="phone.invalid && phone.touched">
              <span *ngIf="phone.errors?.['required']">Phone is required.</span>
              <span *ngIf="phone.errors?.['pattern']">Enter 10–15 digits only.</span>
            </div>
          </div>

          <!-- Bio -->
          <div class="form-group">
            <label for="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              [(ngModel)]="model.bio"
              #bio="ngModel"
              maxlength="200"
              rows="3"
              placeholder="Tell us about yourself (max 200 chars)"
            ></textarea>
            <small class="char-count">{{ model.bio.length }} / 200</small>
          </div>

          <button type="submit" class="btn-primary" [disabled]="profileForm.invalid">
            Save Profile
          </button>
          <button type="button" class="btn-secondary" (click)="resetForm(profileForm)">
            Reset
          </button>
        </form>

        <!-- Submitted snapshot -->
        <div class="submitted-data" *ngIf="submitted">
          <h4>Submitted form.value snapshot:</h4>
          <pre>{{ submittedValue | json }}</pre>
        </div>

        <p class="nav-link"><a routerLink="/forms/reactive">→ See Reactive Form demo</a></p>
      </div>
    </div>
  `,
  styles: [`
    .form-demo-container { min-height: 100vh; background: #f0f4f8; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .form-demo-card { background: #fff; border-radius: 12px; padding: 36px; width: 100%; max-width: 480px; box-shadow: 0 4px 20px rgba(0,0,0,.1); }
    .form-demo-header { text-align: center; margin-bottom: 20px; }
    .form-demo-header h2 { margin: 8px 0 4px; color: #1a237e; }
    .subtitle { color: #666; font-size: 13px; }
    .state-badges { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
    .badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: #e0e0e0; color: #555; }
    .badge-valid { background: #e8f5e9; color: #2e7d32; }
    .badge-invalid { background: #ffebee; color: #c62828; }
    .badge-dirty { background: #fff3e0; color: #e65100; }
    .badge-pristine { background: #e3f2fd; color: #1565c0; }
    .badge-touched { background: #fce4ec; color: #880e4f; }
    .badge-untouched { background: #f3e5f5; color: #6a1b9a; }
    .form-group { margin-bottom: 18px; }
    label { display: block; font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px; }
    .required { color: #e53935; }
    input, textarea { width: 100%; padding: 10px 12px; border: 1.5px solid #ccc; border-radius: 8px; font-size: 14px; box-sizing: border-box; transition: border-color .2s; }
    input:focus, textarea:focus { outline: none; border-color: #1976d2; }
    .input-error { border-color: #e53935 !important; }
    .error-hints { margin-top: 4px; font-size: 12px; color: #e53935; }
    .char-count { font-size: 12px; color: #888; }
    .btn-primary { width: 100%; padding: 12px; background: #1976d2; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 8px; }
    .btn-primary:disabled { background: #90caf9; cursor: not-allowed; }
    .btn-secondary { width: 100%; padding: 10px; background: transparent; color: #1976d2; border: 1.5px solid #1976d2; border-radius: 8px; font-size: 14px; cursor: pointer; margin-top: 8px; }
    .submitted-data { margin-top: 20px; background: #f5f5f5; border-radius: 8px; padding: 14px; }
    .submitted-data h4 { margin: 0 0 8px; font-size: 13px; color: #555; }
    pre { font-size: 12px; color: #333; white-space: pre-wrap; margin: 0; }
    .nav-link { text-align: center; margin-top: 16px; font-size: 13px; }
    .nav-link a { color: #1976d2; text-decoration: none; font-weight: 500; }
  `]
})
export class ProfileFormComponent {
  @ViewChild('profileForm') profileForm!: NgForm;

  model = { fullName: '', email: '', phone: '', bio: '' };
  submitted = false;
  submittedValue: any = null;

  onSubmit(form: NgForm): void {
    if (form.invalid) return;
    this.submitted = true;
    this.submittedValue = { ...form.value };
    console.log('Template-Driven form.value:', form.value);
  }

  resetForm(form: NgForm): void {
    form.resetForm();
    this.model = { fullName: '', email: '', phone: '', bio: '' };
    this.submitted = false;
    this.submittedValue = null;
  }
}
