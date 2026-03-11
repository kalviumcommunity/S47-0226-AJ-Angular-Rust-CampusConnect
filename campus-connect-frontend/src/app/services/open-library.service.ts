import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface OpenLibraryBook {
  title: string;
  authorName: string;
  isbn: string;
  subject: string;
  coverId: number | null;
  coverUrl: string | null;
  publishYear: number | null;
}

@Injectable({ providedIn: 'root' })
export class OpenLibraryService {
  private http: HttpClient;
  private readonly BASE_URL = 'https://openlibrary.org';
  private readonly COVER_URL = 'https://covers.openlibrary.org/b/id';

  constructor(handler: HttpBackend) {
    // Use HttpBackend directly to bypass auth interceptor - Open Library is a public API that does not require a JWT
    this.http = new HttpClient(handler);
  }

  searchBooks(query: string): Observable<OpenLibraryBook[]> {
    const url = `${this.BASE_URL}/search.json?q=${encodeURIComponent(query)}&limit=12&fields=title,author_name,isbn,subject,cover_i,first_publish_year`;
    return this.http.get<any>(url).pipe(
      map(res =>
        (res.docs || []).map((doc: any) => ({
          title: doc.title || '',
          authorName: (doc.author_name && doc.author_name.length > 0) ? doc.author_name[0] : 'Unknown',
          isbn: (doc.isbn && doc.isbn.length > 0) ? doc.isbn[0] : '',
          subject: (doc.subject && doc.subject.length > 0) ? doc.subject[0] : 'General',
          coverId: doc.cover_i || null,
          coverUrl: doc.cover_i ? `${this.COVER_URL}/${doc.cover_i}-M.jpg` : null,
          publishYear: doc.first_publish_year || null,
        }))
      )
    );
  }
}
