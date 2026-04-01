# Angular Forms — Assignment PR Documentation

## Routes

| URL | Component | Approach |
|-----|-----------|----------|
| `/forms/template` | `ProfileFormComponent` | Template-Driven |
| `/forms/reactive` | `EnrollmentFormComponent` | Reactive |

---

## 1. Which form approach and why?

Both approaches are demonstrated in separate components so the differences are clear side-by-side.

**Template-Driven** (`ProfileFormComponent`) — chosen for the profile update form because:
- The form is simple and the logic lives naturally in the template via `ngModel`.
- Angular's `NgForm` directive automatically tracks state (valid/invalid/dirty/pristine/touched) without any extra code.
- Good fit for forms where the structure is unlikely to change at runtime.

**Reactive** (`EnrollmentFormComponent`) — chosen for the enrollment form because:
- Form structure is defined explicitly in the component class (`FormGroup` / `FormControl`), making it easy to unit-test.
- Custom validators (e.g. `noWhitespaceOnlyValidator`) are plain functions — no template magic needed.
- `form.value`, `form.valid`, `form.markAllAsTouched()` are all directly accessible in the class.
- Better for complex, dynamic forms where fields may be added/removed at runtime.

---

## 2. How validation is implemented

### Template-Driven (`ProfileFormComponent`)
Validation is declared directly on the input elements using HTML5 attributes that Angular understands:

```html
<input name="email" type="email" [(ngModel)]="model.email" #email="ngModel"
       required email />
<div *ngIf="email.invalid && email.touched">
  <span *ngIf="email.errors?.['required']">Email is required.</span>
  <span *ngIf="email.errors?.['email']">Enter a valid email address.</span>
</div>
```

Validators used: `required`, `minlength`, `email`, `pattern` (regex for phone).

### Reactive (`EnrollmentFormComponent`)
Validators are passed as an array to `FormControl` in the component class:

```ts
studentEmail: new FormControl('', [Validators.required, Validators.email]),
reason: new FormControl('', [
  Validators.required,
  Validators.minLength(20),
  noWhitespaceOnlyValidator   // custom validator
])
```

A custom validator is a plain function:

```ts
function noWhitespaceOnlyValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value || '';
  return value.trim().length === 0 && value.length > 0
    ? { noWhitespaceOnly: true }
    : null;
}
```

Errors are surfaced in the template via `ctrl('reason').errors?.['noWhitespaceOnly']`.

---

## 3. How Angular tracks and updates form state

### Template-Driven
Angular wraps the `<form>` element with an `NgForm` directive automatically when `FormsModule` is imported. Each `ngModel` input registers itself as a child control. Angular then:
- Sets CSS classes (`ng-valid`, `ng-invalid`, `ng-dirty`, `ng-touched`) on every control and the form itself.
- Exposes the aggregate state via the `#profileForm="ngForm"` template reference variable.
- Re-evaluates validity on every `input` event (change detection cycle).

The live state badges in the UI read directly from `profileForm.valid`, `profileForm.dirty`, `profileForm.touched`.

### Reactive
The `FormGroup` holds references to all `FormControl` instances. Angular's `ReactiveFormsModule` directive `[formGroup]` binds the DOM to the model. State updates happen:
- Synchronously on every keystroke via the control's `valueChanges` observable.
- The `<details>` live preview block renders `form.value | json` on every change detection cycle, showing the current value in real time.
- `form.markAllAsTouched()` is called on a failed submit attempt so all error messages appear at once.

---

## Screenshots

> Run `ng serve` from `campus-connect-frontend/`, then visit:
> - http://localhost:4200/forms/template
> - http://localhost:4200/forms/reactive

### Template-Driven Form — invalid state
State badges show `✗ Invalid / Pristine / Untouched` on load. Errors appear per-field after the user touches and leaves each input.

### Reactive Form — live value preview
The collapsible `<details>` block updates `form.value` in real time as the user types, demonstrating reactive state tracking.
