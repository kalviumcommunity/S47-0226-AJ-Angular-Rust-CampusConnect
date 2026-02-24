import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LibraryService } from '../../services/library.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div>
      <nav>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h1 class="logo">🏫 CampusConnect</h1>
          <button (click)="logout()" style="background-color: #e74c3c;">Logout</button>
        </div>
        <ul>
          <li><a routerLink="/dashboard">Dashboard</a></li>
          <li><a routerLink="/academics">Academics</a></li>
          <li><a routerLink="/finance">Finance</a></li>
          <li><a routerLink="/hostel">Hostel</a></li>
          <li><a routerLink="/library" class="active">Library</a></li>
          <li><a routerLink="/hr">HR</a></li>
        </ul>
      </nav>

      <div class="container">
        <h1>📚 Library Module</h1>

        <div class="card">
          <div class="card-header">Add New Book</div>
          <form [formGroup]="bookForm" (ngSubmit)="addBook()">
            <div class="form-group">
              <label>ISBN</label>
              <input type="text" formControlName="isbn" placeholder="e.g., 978-0134685991" />
            </div>
            <div class="form-group">
              <label>Title</label>
              <input type="text" formControlName="title" placeholder="e.g., Effective Java" />
            </div>
            <div class="form-group">
              <label>Author</label>
              <input type="text" formControlName="author" placeholder="e.g., Joshua Bloch" />
            </div>
            <div class="form-group">
              <label>Category</label>
              <input type="text" formControlName="category" placeholder="e.g., Programming" />
            </div>
            <div class="form-group">
              <label>Total Copies</label>
              <input type="number" formControlName="total_copies" placeholder="e.g., 5" />
            </div>
            <button type="submit" [disabled]="bookForm.invalid">Add Book</button>
          </form>
        </div>

        <div class="card">
          <div class="card-header">All Books</div>
          <div *ngIf="loading" class="spinner"></div>
          <table *ngIf="!loading && books.length > 0">
            <thead>
              <tr>
                <th>ISBN</th>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th>Available / Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let book of books">
                <td>{{ book.isbn }}</td>
                <td>{{ book.title }}</td>
                <td>{{ book.author }}</td>
                <td>{{ book.category }}</td>
                <td>{{ book.available_copies }} / {{ book.total_copies }}</td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="!loading && books.length === 0">No books found.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .active {
      background-color: #34495e !important;
    }
  `]
})
export class LibraryComponent implements OnInit {
  books: any[] = [];
  bookForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private libraryService: LibraryService,
    private authService: AuthService
  ) {
    this.bookForm = this.fb.group({
      isbn: ['', Validators.required],
      title: ['', Validators.required],
      author: ['', Validators.required],
      category: ['', Validators.required],
      total_copies: [0, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadBooks();
  }

  loadBooks(): void {
    this.loading = true;
    this.libraryService.getBooks().subscribe({
      next: (data) => {
        this.books = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading books:', error);
        this.loading = false;
      }
    });
  }

  addBook(): void {
    if (this.bookForm.valid) {
      this.libraryService.addBook(this.bookForm.value).subscribe({
        next: () => {
          alert('Book added successfully!');
          this.bookForm.reset();
          this.loadBooks();
        },
        error: (error) => console.error('Error adding book:', error)
      });
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
