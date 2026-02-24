import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AcademicsService {
  private apiUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) {}

  // Courses
  getCourses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/courses`);
  }

  createCourse(course: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses`, course);
  }

  // Enrollments
  getEnrollments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/enrollments`);
  }

  createEnrollment(enrollment: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/enrollments`, enrollment);
  }

  // Attendance
  getAttendance(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/attendance`);
  }

  markAttendance(attendance: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/attendance`, attendance);
  }
}
