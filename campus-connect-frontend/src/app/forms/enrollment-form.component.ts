import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';

/**
 * Reactive Form Demo
 * Uses FormGroup / FormControl / Validators for explicit, testable form logic.
 * Form state is observed via valueChanges and statusChanges observables.
 */
@Component({
  selector: 'app-enrollment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="form-demo-container">
      <div class="form-demo-card">
        <div class="form-demo-header">
          <i class="fas fa-book-open" style="font-size:36px; color:#7b1fa2;"></i>
          <h2>Reactive Form</h2>
          <p class="subtitle">Course Enrollment — uses <code>FormGroup</code> &amp; <code>Validators</code></p>
        </div>

        <!-- Live form state badges -->
        <div class="state-badges">
          <span class="badge" [class.badge-valid]="form.valid" [class.badge-invalid]="form.invalid">
            {{ form.valid ? '✓ Valid' : '✗ Invalid' }}
          </span>
          <span class="badge" [class.badge-dirty]="form.dirty" [class.badge-pristine]="form.pristine">
            {{ form.dirty ? 'Dirty' : 'Pristine' }}
          </span>
          <span class="badge" [class.badge-touched]="form.touched" [class.badge-untouched]="!form.touched">
            {{ form.touched ? 'Touched' : 'Untouched' }}
          </span>
        </div>

        <!-- Live value preview -->
        <details class="live-preview">
          <summary>Live form.value (updates as you type)</summary>
          <pre>{{ form.value | json }}</pre>
        </details>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

          <!-- Student ID -->
          <div class="form-group">
            <label for="studentId">Student ID <span class="required">*</span></label>
            <input
              id="studentId"
              type="text"
              formControlName="studentId"
              placeholder="e.g. STU-2024-001"
              [class.input-error]="isInvalid('studentId')"
            />
            <div class="error-hints" *ngIf="isInvalid('studentId')">
              <span *ngIf="ctrl('studentId').errors?.['required']">Student ID is required.</span>
              <span *ngIf="ctrl('studentId').errors?.['pattern']">Format: STU-YYYY-NNN (e.g. STU-2024-001).</span>
            </div>
          </div>

          <!-- Full Name -->
          <div class="form-group">
            <label for="studentName">Full Name <span class="required">*</span></label>
            <input
              id="studentName"
              type="text"
              formControlName="studentName"
              placeholder="e.g. Jane Doe"
              [class.input-error]="isInvalid('studentName')"
            />
            <div class="error-hints" *ngIf="isInvalid('studentName')">
              <span *ngIf="ctrl('studentName').errors?.['required']">Name is required.</span>
              <span *ngIf="ctrl('studentName').errors?.['minlength']">
                Minimum {{ ctrl('studentName').errors?.['minlength'].requiredLength }} characters.
              </span>
            </div>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="studentEmail">Email <span class="required">*</span></label>
            <input
              id="studentEmail"
              type="email"
              formControlName="studentEmail"
              placeholder="jane@campus.edu"
              [class.input-error]="isInvalid('studentEmail')"
            />
            <div class="error-hints" *ngIf="isInvalid('studentEmail')">
              <span *ngIf="ctrl('studentEmail').errors?.['required']">Email is required.</span>
              <span *ngIf="ctrl('studentEmail').errors?.['email']">Enter a valid email address.</span>
            </div>
          </div>

          <!-- Course -->
          <div class="form-group">
            <label for="course">Course <span class="required">*</span></label>
            <select id="course" formControlName="course" [class.input-error]="isInvalid('course')">
              <option value="">-- Select a course --</option>
              <option value="CS101">CS101 – Intro to Computer Science</option>
              <option value="MATH201">MATH201 – Calculus II</option>
              <option value="ENG301">ENG301 – Technical Writing</option>
              <option value="PHY101">PHY101 – Physics I</option>
            </select>
            <div class="error-hints" *ngIf="isInvalid('course')">
              <span *ngIf="ctrl('course').errors?.['required']">Please select a course.</span>
            </div>
          </div>

          <!-- Semester -->
          <div class="form-group">
            <label for="semester">Semester <span class="required">*</span></label>
            <input
              id="semester"
              type="number"
              formControlName="semester"
              placeholder="1–8"
              [class.input-error]="isInvalid('semester')"
            />
            <div class="error-hints" *ngIf="isInvalid('semester')">
              <span *ngIf="ctrl('semester').errors?.['required']">Semester is required.</span>
              <span *ngIf="ctrl('semester').errors?.['min'] || ctrl('semester').errors?.['max']">Must be between 1 and 8.</span>
            </div>
          </div>

          <!-- Reason (custom validator) -->
          <div class="form-group">
            <label for="reason">Reason for Enrollment <span class="required">*</span></label>
            <textarea
              id="reason"
              formControlName="reason"
              rows="3"
              placeholder="Min 20 characters"
              [class.input-error]="isInvalid('reason')"
            ></textarea>
            <small class="char-count">{{ ctrl('reason').value?.length || 0 }} chars (min 20)</small>
            <div class="error-hints" *ngIf="isInvalid('reason')">
              <span *ngIf="ctrl('reason').errors?.['required']">Reason is required.</span>
              <span *ngIf="ctrl('reason').errors?.['minlength']">At least 20 characters required.</span>
              <span *ngIf="ctrl('reason').errors?.['noWhitespaceOnly']">Cannot be whitespace only.</span>
            </div>
          </div>

          <button type="submit" class="btn-primary" [disabled]="form.invalid">
            Enroll Now
          </button>
          <button type="button" class="btn-secondary" (click)="resetForm()">
            Reset
          </button>
        </form>

        <!-- Submitted snapshot -->
        <div class="submitted-data" *ngIf="submitted">
          <h4>Submitted form.value snapshot:</h4>
          <pre>{{ submittedValue | json }}</pre>
        </div>

        <p class="nav-link"><a routerLink="/forms/template">← See Template-Driven Form demo</a></p>
      </div>
    </div>
  `,
  styles: [`
    .form-demo-container { min-height: 100vh; background: #f3e5f5; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .form-demo-card { background: #fff; border-radius: 12px; padding: 36px; width: 100%; max-width: 480px; box-shadow: 0 4px 20px rgba(0,0,0,.1); }
    .form-demo-header { text-align: center; margin-bottom: 20px; }
    .form-demo-header h2 { margin: 8px 0 4px; color: #4a148c; }
    .subtitle { color: #666; font-size: 13px; }
    .state-badges { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: #e0e0e0; color: #555; }
    .badge-valid { background: #e8f5e9; color: #2e7d32; }
    .badge-invalid { background: #ffebee; color: #c62828; }
    .badge-dirty { background: #fff3e0; color: #e65100; }
    .badge-pristine { background: #e3f2fd; color: #1565c0; }
    .badge-touched { background: #fce4ec; color: #880e4f; }
    .badge-untouched { background: #f3e5f5; color: #6a1b9a; }
    .live-preview { margin-bottom: 16px; font-size: 12px; background: #fafafa; border-radius: 8px; padding: 8px 12px; border: 1px solid #e0e0e0; }
    .live-preview summary { cursor: pointer; color: #7b1fa2; font-weight: 600; }
    pre { font-size: 12px; color: #333; white-space: pre-wrap; margin: 6px 0 0; }
    .form-group { margin-bottom: 18px; }
    label { display: block; font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px; }
    .required { color: #e53935; }
    input, select, textarea { width: 100%; padding: 10px 12px; border: 1.5px solid #ccc; border-radius: 8px; font-size: 14px; box-sizing: border-box; transition: border-color .2s; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: #7b1fa2; }
    .input-error { border-color: #e53935 !important; }
    .error-hints { margin-top: 4px; font-size: 12px; color: #e53935; }
    .char-count { font-size: 12px; color: #888; }
    .btn-primary { width: 100%; padding: 12px; background: #7b1fa2; color: #fff; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 8px; }
    .btn-primary:disabled { background: #ce93d8; cursor: not-allowed; }
    .btn-secondary { width: 100%; padding: 10px; background: transparent; color: #7b1fa2; border: 1.5px solid #7b1fa2; border-radius: 8px; font-size: 14px; cursor: pointer; margin-top: 8px; }
    .submitted-data { margin-top: 20px; background: #f5f5f5; border-radius: 8px; padding: 14px; }
    .submitted-data h4 { margin: 0 0 8px; font-size: 13px; color: #555; }
    .nav-link { text-align: center; margin-top: 16px; font-size: 13px; }
    .nav-link a { color: #7b1fa2; text-decoration: none; font-weight: 500; }
  `]
})
export class EnrollmentFormComponent implements OnInit {

  form!: FormGroup;
  submitted = false;
  submittedValue: any = null;

  ngOnInit(): void {
    this.form = new FormGroup({
      studentId: new FormControl('', [
        Validators.required,
        Validators.pattern(/^STU-\d{4}-\d{3}$/)
      ]),
      studentName: new FormControl('', [
        Validators.required,
        Validators.minLength(3)
      ]),
      studentEmail: new FormControl('', [
        Validators.required,
        Validators.email
      ]),
      course: new FormControl('', Validators.required),
      semester: new FormControl('', [
        Validators.required,
        Validators.min(1),
        Validators.max(8)
      ]),
      reason: new FormControl('', [
        Validators.required,
        Validators.minLength(20),
        noWhitespaceOnlyValidator
      ])
    });
  }

  /** Helper: returns the AbstractControl for a given field name */
  ctrl(name: string): AbstractControl {
    return this.form.get(name)!;
  }

  /** Helper: true when a field is invalid AND has been touched */
  isInvalid(name: string): boolean {
    const c = this.ctrl(name);
    return c.invalid && c.touched;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitted = true;
    this.submittedValue = { ...this.form.value };
    console.log('Reactive form.value:', this.form.value);
  }

  resetForm(): void {
    this.form.reset();
    this.submitted = false;
    this.submittedValue = null;
  }
}

/** Custom validator: rejects strings that are whitespace only */
function noWhitespaceOnlyValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value || '';
  return value.trim().length === 0 && value.length > 0
    ? { noWhitespaceOnly: true }
    : null;
}
