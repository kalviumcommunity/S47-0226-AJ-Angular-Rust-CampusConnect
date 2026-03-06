import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private baseUrl = environment.libraryServiceUrl;

  constructor(private http: HttpClient) {}

  getStudentBooks(studentId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/student/books/${studentId}`);
  }

  getBooks(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/books`);
  }

  addBook(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/books`, data);
  }

  issueBook(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/issue`, data);
  }

  returnBook(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/return`, data);
  }

  // Librarian Dashboard endpoints
  getLibrarianSummary(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/librarian/summary`);
  }

  getBorrowedBooks(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/librarian/borrowed`);
  }

  getReturnedBooks(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/librarian/returned`);
  }

  getWaitlist(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/librarian/waitlist`);
  }

  addToWaitlist(data: { book_id: string; student_id: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/waitlist`, data);
  }

  updateWaitlistStatus(entryId: string, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/librarian/waitlist/${entryId}/${status}`, {});
  }
}
