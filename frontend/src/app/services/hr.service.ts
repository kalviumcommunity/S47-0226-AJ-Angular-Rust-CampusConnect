import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HrService {
  private apiUrl = 'http://localhost:8085/api';

  constructor(private http: HttpClient) {}

  // Faculty
  getFaculty(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/faculty`);
  }

  addFaculty(faculty: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/faculty`, faculty);
  }

  // Leave Requests
  getLeaveRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/leave`);
  }

  createLeaveRequest(request: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/leave`, request);
  }

  approveLeave(requestId: string, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/leave/approve`, { request_id: requestId, status });
  }

  // Payroll
  getPayroll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/payroll`);
  }

  createPayroll(payroll: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/payroll`, payroll);
  }
}
