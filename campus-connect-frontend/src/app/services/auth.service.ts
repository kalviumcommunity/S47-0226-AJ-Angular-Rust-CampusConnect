import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role: string;
  campus_id: string;
  email: string;
  full_name: string;
}

export interface UserInfo {
  username: string;
  role: string;
  campus_id: string;
  email: string;
  full_name: string;
}

export interface AuthResponse {
  token: string;
  user: UserInfo;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.authServiceUrl;
  private currentUserSubject = new BehaviorSubject<UserInfo | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const stored = localStorage.getItem('user');
    if (stored) {
      this.currentUserSubject.next(JSON.parse(stored));
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/api/auth/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/register`, data);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): UserInfo | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Demo helper — simulates login/logout without a real backend.
   * Useful for demoing route guard behaviour.
   */
  demoLogin(role: 'student' | 'teacher' | 'hr' | 'librarian' = 'student'): void {
    const demoUser: UserInfo = {
      username: `demo_${role}`,
      role,
      campus_id: 'DEMO001',
      email: `demo_${role}@campus.edu`,
      full_name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`
    };
    localStorage.setItem('token', 'demo-token');
    localStorage.setItem('user', JSON.stringify(demoUser));
    this.currentUserSubject.next(demoUser);
    this.router.navigate([`/${role}`]);
  }
}
