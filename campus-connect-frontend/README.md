# CampusConnect — Angular Frontend

Angular 17 standalone-component SPA for the CampusConnect campus management platform.

---

## Route Guard Implementation

### Public vs Protected Routes

| Path | Protected | Guard | Notes |
|------|-----------|-------|-------|
| `/` | No | — | Redirects to `/home` |
| `/home` | No | — | Public landing page |
| `/login` | No | — | Login form |
| `/register` | No | — | Registration form |
| `/student` | Yes | `authGuard` (role: student) | Student dashboard |
| `/teacher` | Yes | `authGuard` (role: teacher) | Teacher dashboard |
| `/hr` | Yes | `authGuard` (role: hr) | HR dashboard |
| `/librarian` | Yes | `authGuard` (role: librarian) | Librarian dashboard |
| `/profile/:username` | Yes | `authGuard` | User profile |
| `**` | No | — | Redirects to `/home` |

---

### Authentication Service (`src/app/services/auth.service.ts`)

`AuthService` is the single source of truth for auth state:

- Stores the JWT token and user object in `localStorage` on login
- Exposes `isLoggedIn()` — returns `true` when a token is present
- Exposes `getUser()` — returns the current `UserInfo` from a `BehaviorSubject`
- `logout()` clears storage, resets the subject, and navigates to `/login`
- `demoLogin(role)` — **demo helper** that sets a fake token and user without a real backend, useful for demonstrating guard behaviour during a video demo

```typescript
// Check auth state
authService.isLoggedIn(); // true | false

// Demo login (no backend needed)
authService.demoLogin('student'); // navigates to /student
authService.demoLogin('teacher'); // navigates to /teacher
```

---

### Route Guard (`src/app/guards/auth.guard.ts`)

`authGuard` is a functional `CanActivateFn` guard:

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Step 1 — block unauthenticated users
  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // Step 2 — enforce role-based access
  const requiredRole = route.data['role'];
  const user = authService.getUser();

  if (requiredRole && user?.role !== requiredRole) {
    router.navigate([`/${user?.role}`]); // redirect to own dashboard
    return false;
  }

  return true;
};
```

**What it does:**
1. Calls `authService.isLoggedIn()` — if no token, redirects to `/login` and returns `false`
2. Reads `route.data['role']` — if a role is required and the user's role doesn't match, redirects them to their own dashboard
3. Returns `true` only when both checks pass

No full page reload occurs — Angular's router handles all navigation client-side.

---

### Applying the Guard in Routes (`src/app/app.routes.ts`)

```typescript
{
  path: 'student',
  component: StudentDashboardComponent,
  canActivate: [authGuard],
  data: { role: 'student' }
},
{
  path: 'profile/:username',
  component: ProfileComponent,
  canActivate: [authGuard]   // authenticated, any role
}
```

---

### Unauthorized Navigation Behaviour

| Scenario | Result |
|----------|--------|
| Unauthenticated user visits `/student` | Redirected to `/login` |
| Student visits `/teacher` | Redirected to `/student` |
| Authenticated user visits `/login` | Proceeds normally (no redirect) |
| Unknown path | Redirected to `/home` |

---

## Demo Login (No Backend Required)

The login page includes demo buttons that call `authService.demoLogin(role)` directly, bypassing the Rust backend. This lets you demonstrate guard behaviour without running any microservices.

1. Run `ng serve` in `campus-connect-frontend/`
2. Navigate to `http://localhost:4200/login`
3. Click one of the demo role buttons (Student / Teacher / HR / Librarian)
4. You will be navigated to the corresponding protected dashboard
5. Try navigating to a different role's dashboard — the guard will redirect you back
6. Click Logout — you will be sent to `/login`; trying to access any dashboard will redirect back to `/login`

---

## Running the App

```bash
cd campus-connect-frontend
npm install
ng serve
```

App runs at `http://localhost:4200`.

To also run the Rust backend services, see `ARCHITECTURE.md`.
