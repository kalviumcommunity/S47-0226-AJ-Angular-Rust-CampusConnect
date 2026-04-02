# Angular Router Implementation — CampusConnect

## Route Structure

| Path | Component | Guard | Description |
|------|-----------|-------|-------------|
| `/` | — | — | Redirects to `/home` |
| `/home` | `HomeComponent` | None | Public landing page with feature overview |
| `/login` | `LoginComponent` | None | Login form (reactive) |
| `/register` | `RegisterComponent` | None | Registration form |
| `/profile/:username` | `ProfileComponent` | `authGuard` | User profile — uses **route param** `:username` and **query param** `?tab=` |
| `/student` | `StudentDashboardComponent` | `authGuard` (role: student) | Student portal |
| `/teacher` | `TeacherDashboardComponent` | `authGuard` (role: teacher) | Teacher portal |
| `/hr` | `HrDashboardComponent` | `authGuard` (role: hr) | HR portal |
| `/librarian` | `LibrarianDashboardComponent` | `authGuard` (role: librarian) | Librarian portal |

## Navigation Implementation

### RouterOutlet
`AppComponent` renders `<router-outlet>` — all routed components are injected here.

### RouterLink (no plain href)
All internal navigation uses `routerLink`:
```html
<!-- Static link -->
<a routerLink="/home">Home</a>

<!-- Dynamic link with route param -->
<a [routerLink]="['/profile', user?.username]">My Profile</a>

<!-- With routerLinkActive -->
<a routerLink="/home" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Home</a>
```

### Programmatic Navigation (Router service)
Used in `ProfileComponent` and dashboard components:
```typescript
// Navigate to profile
this.router.navigate(['/profile', this.user?.username]);

// Navigate and update query params (tab switching)
this.router.navigate([], {
  relativeTo: this.route,
  queryParams: { tab },
  queryParamsHandling: 'merge'
});
```

## Route Parameters & Query Params

### Route Parameter — `/profile/:username`
`ProfileComponent` reads the `:username` param via `ActivatedRoute`:
```typescript
this.route.paramMap.subscribe(params => {
  this.routeUsername = params.get('username') || '';
});
```

### Query Parameter — `?tab=info|activity|settings`
The profile page uses query params to track the active tab:
```typescript
this.route.queryParamMap.subscribe(qp => {
  this.activeTab = qp.get('tab') || 'info';
});
```
Switching tabs updates the URL: `/profile/john?tab=activity`

## Service Integration with Routing

### NavigationService
`NavigationService` (singleton, `providedIn: 'root'`) maintains shared state across all route changes:

```typescript
// Persists across navigation
navService.setLastVisited('/student');
navService.addBreadcrumb('Student Dashboard');
navService.setActiveSection('fees');
```

- `StudentDashboardComponent` and `TeacherDashboardComponent` call `setLastVisited()` and `addBreadcrumb()` on init
- `ProfileComponent` reads `breadcrumbs` and `lastVisited` from the service — data persists from previous routes
- `HomeComponent` displays the last visited route from the service

### AuthService
`AuthService` uses a `BehaviorSubject<UserInfo>` to share the current user across all components. `NavbarComponent` subscribes to `currentUser$` reactively.

## Auth Guard
`authGuard` protects all dashboard and profile routes:
- Redirects unauthenticated users to `/login`
- Redirects users with wrong role to their correct dashboard

## Edge Cases Handled
- Navigating to `/profile/:username` for a different user shows an error message
- Unauthenticated access to any protected route redirects to `/login`
- Unknown routes (`**`) redirect to `/home`
- After login, users are sent directly to their role-based dashboard
