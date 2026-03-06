import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AcademicsService {
  private baseUrl = environment.academicsServiceUrl;

  constructor(private http: HttpClient) {}

  // Student endpoints
  getStudentAttendance(studentId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/student/attendance/${studentId}`);
  }

  getStudentEnrollments(studentId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/student/enrollments/${studentId}`);
  }

  getStudentResults(studentId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/student/results/${studentId}`);
  }

  getNotes(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/notes`);
  }

  getCourseNotes(courseCode: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/notes/course/${courseCode}`);
  }

  submitStudentNote(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/student/notes/submit`, data);
  }

  // Teacher endpoints
  getCourses(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/courses`);
  }

  createCourse(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/courses`, data);
  }

  getBatches(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/batches`);
  }

  createBatch(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/batches`, data);
  }

  getBatchStudents(batchId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/batches/${batchId}/students`);
  }

  addStudentsToBatch(batchId: string, studentIds: string[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/batches/${batchId}/students`, { student_ids: studentIds });
  }

  getAttendance(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/attendance`);
  }

  markAttendance(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/attendance`, data);
  }

  markBatchAttendance(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/attendance/batch`, data);
  }

  uploadNote(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/notes`, data);
  }

  getStudentSubmissions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/teacher/student-notes`);
  }

  reviewStudentNote(noteId: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/teacher/student-notes/${noteId}/review`, data);
  }

  createResult(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/results`, data);
  }

  createEnrollment(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/enrollments`, data);
  }
}
