import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  const requiredRole = route.data['role'];
  const user = authService.getUser();

  if (requiredRole && user?.role !== requiredRole) {
    router.navigate([`/${user?.role}`]);
    return false;
  }

  return true;
};
