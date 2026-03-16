import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { StudentDashboardComponent } from './student/student-dashboard.component';
import { TeacherDashboardComponent } from './teacher/teacher-dashboard.component';
import { HrDashboardComponent } from './hr/hr-dashboard.component';
import { LibrarianDashboardComponent } from './librarian/librarian-dashboard.component';
import { authGuard } from './guards/auth.guard';
import { BindingDemoComponent } from './binding-demo/binding-demo.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
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
  { path: 'binding-demo', component: BindingDemoComponent },
  { path: '**', redirectTo: '/login' }
];
