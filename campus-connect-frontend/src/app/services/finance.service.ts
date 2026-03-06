import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private baseUrl = environment.financeServiceUrl;

  constructor(private http: HttpClient) {}

  getStudentFees(studentId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/student/fees/${studentId}`);
  }

  createFee(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/fees`, data);
  }

  getFees(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/fees`);
  }

  createPayment(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/payments`, data);
  }

  // HR Dashboard endpoints
  getHrFeeSummary(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/hr/fees/summary`);
  }

  getHrStudentFees(filters?: { status?: string; type?: string }): Observable<any> {
    let params = '';
    if (filters) {
      const parts: string[] = [];
      if (filters.status) parts.push(`status=${filters.status}`);
      if (filters.type) parts.push(`type=${filters.type}`);
      if (parts.length) params = '?' + parts.join('&');
    }
    return this.http.get(`${this.baseUrl}/api/hr/fees/students${params}`);
  }
}
