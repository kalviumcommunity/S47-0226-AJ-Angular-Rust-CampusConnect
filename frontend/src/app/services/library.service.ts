import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private apiUrl = 'http://localhost:8084/api';

  constructor(private http: HttpClient) {}

  // Books
  getBooks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/books`);
  }

  addBook(book: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/books`, book);
  }

  // Book Issues
  getIssues(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/issues`);
  }

  issueBook(issue: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/issue`, issue);
  }

  returnBook(issueId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/return`, { issue_id: issueId });
  }
}
