# Angular Forms — Assignment PR Documentation

## Overview

This PR demonstrates validated Angular forms with user-friendly, field-level error handling across four components. Two approaches are used: **Reactive Forms** (primary) and **Template-Driven Forms** (secondary demo).

---

## Routes

| URL | Component | Approach |
|-----|-----------|----------|
| `/login` | `LoginComponent` | Reactive |
| `/register` | `RegisterComponent` | Reactive |
| `/forms/template` | `ProfileFormComponent` | Template-Driven |
| `/forms/reactive` | `EnrollmentFormComponent` | Reactive |

---

## 1. Which form approach and why?

### Reactive Forms — used in `LoginComponent`, `RegisterComponent`, `EnrollmentFormComponent`

Reactive Forms were chosen as the primary approach because:
- Validation logic lives in the component class, not scattered across the template — easier to read, test, and maintain.
- `FormGroup` / `FormControl` give direct, synchronous access to validity state (`form.valid`, `ctrl.errors`, `form.markAllAsTouched()`).
- Custom validators are plain functions with no template magic needed.
- `form.markAllAsTouched()` lets us surface all errors at once on a failed submit attempt with a single call.

### Template-Driven Forms — used in `ProfileFormComponent`

Template-Driven was used for the profile form to demonstrate the contrast:
- Validation attributes (`required`, `minlength`, `email`, `pattern`) are declared directly on inputs.
- Angular's `NgForm` directive auto-tracks state via `#profileForm="ngForm"` template reference.
- Simpler for small, static forms where runtime control isn't needed.

---

## 2. Validation rules per field

### `LoginComponent` (Reactive)

| Field | Rules |
|-------|-------|
| `username` | `required`, `minLength(3)` |
| `password` | `required`, `minLength(6)` |

### `RegisterComponent` (Reactive)

| Field | Rules |
|-------|-------|
| `full_name` | `required`, `minLength(3)` |
| `email` | `required`, `email` (format check) |
| `username` | `required`, `minLength(3)`, `pattern(/^\w+$/)` — letters/digits/underscores only |
| `password` | `required`, `minLength(6)`, custom `hasDigitValidator` — must contain at least one digit |
| `role` | `required` |
| `campus_id` | `required`, `pattern(/^[A-Za-z0-9]{4,20}$/)` — alphanumeric, 4–20 chars |

### `EnrollmentFormComponent` (Reactive)

| Field | Rules |
|-------|-------|
| `studentId` | `required`, `pattern(/^STU-\d{4}-\d{3}$/)` |
| `studentName` | `required`, `minLength(3)` |
| `studentEmail` | `required`, `email` |
| `course` | `required` |
| `semester` | `required`, `min(1)`, `max(8)` |
| `reason` | `required`, `minLength(20)`, custom `noWhitespaceOnlyValidator` |

### `ProfileFormComponent` (Template-Driven)

| Field | Rules |
|-------|-------|
| `fullName` | `required`, `minlength="3"` |
| `email` | `required`, `email` |
| `phone` | `required`, `pattern="^[0-9]{10,15}$"` |
| `bio` | `maxlength="200"` (optional) |

---

## 3. How Angular tracks form validity and state

### Reactive Forms

`FormGroup` holds a tree of `FormControl` instances. Angular's `ReactiveFormsModule` binds the DOM to the model via `[formGroup]` and `formControlName` directives. State updates happen synchronously on every keystroke:

```ts
// Define controls with validators in the class
form = new FormGroup({
  email: new FormControl('', [Validators.required, Validators.email]),
  password: new FormControl('', [Validators.required, Validators.minLength(6)])
});

// Helper used in the template
isInvalid(name: string): boolean {
  const c = this.form.get(name)!;
  return c.invalid && c.touched;  // only show errors after user interaction
}

// On submit: block invalid forms, surface all errors at once
onLogin(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }
  // proceed with submission...
}
```

In the template, errors are shown conditionally — only after the field has been touched:

```html
<input formControlName="email" [class.input-error]="isInvalid('email')" />
<div class="error-hints" *ngIf="isInvalid('email')">
  <span *ngIf="ctrl('email').errors?.['required']">Email is required.</span>
  <span *ngIf="ctrl('email').errors?.['email']">Enter a valid email address.</span>
</div>
```

Angular also applies CSS classes automatically: `ng-valid` / `ng-invalid`, `ng-touched` / `ng-untouched`, `ng-dirty` / `ng-pristine`.

### Template-Driven Forms

Angular wraps the `<form>` with `NgForm` automatically when `FormsModule` is imported. Each `[(ngModel)]` input registers itself as a child control. The template reference `#profileForm="ngForm"` exposes the aggregate state:

```html
<form #profileForm="ngForm" (ngSubmit)="onSubmit(profileForm)" novalidate>
  <input name="email" type="email" [(ngModel)]="model.email" #email="ngModel"
         required email [class.input-error]="email.invalid && email.touched" />
  <div *ngIf="email.invalid && email.touched">
    <span *ngIf="email.errors?.['required']">Email is required.</span>
    <span *ngIf="email.errors?.['email']">Enter a valid email address.</span>
  </div>
</form>
```

The live state badges in `ProfileFormComponent` read `profileForm.valid`, `profileForm.dirty`, and `profileForm.touched` directly.

---

## 4. Safe form submission

All forms follow the same pattern:

1. The submit button is **not** disabled by default (to allow `markAllAsTouched` to fire on click).
2. Inside `onSubmit()`, if `form.invalid`, call `form.markAllAsTouched()` and return early — this makes all error messages visible at once.
3. Only when `form.valid` does the HTTP call proceed.

```ts
onLogin(): void {
  if (this.form.invalid) {
    this.form.markAllAsTouched(); // surfaces all errors immediately
    return;
  }
  // safe to submit
}
```

> Exception: the demo form buttons in `ProfileFormComponent` and `EnrollmentFormComponent` use `[disabled]="form.invalid"` to visually reinforce the invalid state for demo purposes.

---

## 5. Custom Validators

### `hasDigitValidator` (RegisterComponent)
Ensures the password contains at least one numeric digit:

```ts
function hasDigitValidator(control: AbstractControl): ValidationErrors | null {
  return /\d/.test(control.value ?? '') ? null : { hasDigit: true };
}
```

### `noWhitespaceOnlyValidator` (EnrollmentFormComponent)
Rejects strings that are entirely whitespace:

```ts
function noWhitespaceOnlyValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value || '';
  return value.trim().length === 0 && value.length > 0
    ? { noWhitespaceOnly: true }
    : null;
}
```

---

## Screenshots

> Run `ng serve` from `campus-connect-frontend/`, then visit the routes listed above.

### Login — validation errors on empty submit
Clicking "Sign In" with empty fields calls `markAllAsTouched()`, revealing red-bordered inputs and inline error messages: "Username is required." and "Password is required."

### Register — all fields touched on failed submit
Clicking "Create Account" with an invalid form surfaces errors for every field simultaneously. The password field shows both the minlength error and the custom "must contain at least one number" message when applicable.

### Template-Driven Profile Form — per-field errors after blur
State badges update live (Valid/Invalid, Pristine/Dirty, Untouched/Touched). Errors appear field-by-field as the user tabs through inputs.

### Reactive Enrollment Form — live value preview
The collapsible `<details>` block shows `form.value | json` updating in real time. The "Enroll Now" button stays disabled until all validators pass.
