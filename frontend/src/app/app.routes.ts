import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'academics',
    loadComponent: () => import('./components/academics/academics.component').then(m => m.AcademicsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'finance',
    loadComponent: () => import('./components/finance/finance.component').then(m => m.FinanceComponent),
    canActivate: [authGuard]
  },
  {
    path: 'hostel',
    loadComponent: () => import('./components/hostel/hostel.component').then(m => m.HostelComponent),
    canActivate: [authGuard]
  },
  {
    path: 'library',
    loadComponent: () => import('./components/library/library.component').then(m => m.LibraryComponent),
    canActivate: [authGuard]
  },
  {
    path: 'hr',
    loadComponent: () => import('./components/hr/hr.component').then(m => m.HrComponent),
    canActivate: [authGuard]
  }
];
