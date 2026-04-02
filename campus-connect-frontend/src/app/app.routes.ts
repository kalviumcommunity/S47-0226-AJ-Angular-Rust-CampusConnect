import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { StudentDashboardComponent } from './student/student-dashboard.component';
import { TeacherDashboardComponent } from './teacher/teacher-dashboard.component';
import { HrDashboardComponent } from './hr/hr-dashboard.component';
import { LibrarianDashboardComponent } from './librarian/librarian-dashboard.component';
import { authGuard } from './guards/auth.guard';
import { BindingDemoComponent } from './binding-demo/binding-demo.component';
import { ProfileFormComponent } from './forms/profile-form.component';
import { EnrollmentFormComponent } from './forms/enrollment-form.component';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';

export const routes: Routes = [
  // Default redirect to home
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // Public routes
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Profile route — uses route parameter :username
  // Supports query param ?tab=info|activity|settings
  {
    path: 'profile/:username',
    component: ProfileComponent,
    canActivate: [authGuard]
  },

  // Role-based dashboard routes (protected)
  {
    path: 'student',
    component: StudentDashboardComponent,
    canActivate: [authGuard],
    data: { role: 'student' }
  },
  {
    path: 'teacher',
    component: TeacherDashboardComponent,
    canActivate: [authGuard],
    data: { role: 'teacher' }
  },
  {
    path: 'hr',
    component: HrDashboardComponent,
    canActivate: [authGuard],
    data: { role: 'hr' }
  },
  {
    path: 'librarian',
    component: LibrarianDashboardComponent,
    canActivate: [authGuard],
    data: { role: 'librarian' }
  },

  // Demo routes
  { path: 'binding-demo', component: BindingDemoComponent },
  { path: 'forms/template', component: ProfileFormComponent },
  { path: 'forms/reactive', component: EnrollmentFormComponent },

  // Fallback
  { path: '**', redirectTo: '/home' }
];
