import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LibraryService } from '../services/library.service';
import { OpenLibraryService, OpenLibraryBook } from '../services/open-library.service';

@Component({
  selector: 'app-librarian-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
.dashboard-layout{
display:flex;
height:100vh;
background:#f5f7fb;
font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;
}

/* SIDEBAR */

.sidebar{
width:260px;
background:#1e293b;
color:white;
display:flex;
flex-direction:column;
justify-content:space-between;
}

.sidebar-header{
padding:24px;
border-bottom:1px solid rgba(255,255,255,0.08);
}

.sidebar-header h2{
margin:0;
font-size:20px;
font-weight:700;
}

.sidebar-header p{
margin:4px 0 0;
font-size:13px;
color:#cbd5f5;
}

.sidebar-nav{
display:flex;
flex-direction:column;
}

.sidebar-nav a{
padding:14px 24px;
cursor:pointer;
color:#e2e8f0;
text-decoration:none;
transition:background 0.2s;
}

.sidebar-nav a:hover{
background:rgba(255,255,255,0.08);
}

.sidebar-nav a.active{
background:#2563eb;
color:white;
font-weight:600;
}

.sidebar-footer{
padding:20px;
}

/* MAIN CONTENT */

.main-content{
flex:1;
padding:30px;
overflow-y:auto;
}

.main-content h1{
margin-bottom:10px;
font-size:26px;
}

.section-desc{
color:#666;
margin-bottom:20px;
}

/* CARDS */

.card{
background:white;
border-radius:12px;
padding:22px;
box-shadow:0 3px 10px rgba(0,0,0,0.06);
}

.card h2,
.card h3{
margin-bottom:14px;
}

/* STATS */

.stats-grid{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
gap:18px;
}

.stat-card{
background:white;
border-radius:12px;
padding:20px;
text-align:center;
box-shadow:0 2px 10px rgba(0,0,0,0.06);
}

.stat-card h3{
margin:0;
font-size:15px;
color:#555;
}

.stat-number{
font-size:28px;
font-weight:bold;
margin-top:10px;
}

/* TABLE */

.table-container{
background:white;
border-radius:12px;
overflow-x:auto;
box-shadow:0 3px 10px rgba(0,0,0,0.05);
}

table{
width:100%;
border-collapse:collapse;
}

thead{
background:#f1f5f9;
}

thead th{
padding:14px;
text-align:left;
font-size:14px;
color:#444;
}

tbody td{
padding:14px;
border-top:1px solid #eee;
}

tbody tr:hover{
background:#f9fafb;
}

/* BADGES */

.badge{
padding:4px 10px;
border-radius:20px;
font-size:12px;
font-weight:600;
}

.badge-success{
background:#e8f5e9;
color:#2e7d32;
}

.badge-danger{
background:#ffebee;
color:#c62828;
}

.badge-warning{
background:#fff3e0;
color:#ef6c00;
}

.badge-info{
background:#e3f2fd;
color:#1565c0;
}

/* BUTTONS */

.btn{
border:none;
padding:10px 16px;
border-radius:8px;
cursor:pointer;
font-size:14px;
}

.btn-primary{
background:#2563eb;
color:white;
}

.btn-secondary{
background:#475569;
color:white;
}

.btn-sm{
padding:5px 12px;
font-size:12px;
}

/* FORMS */

.form-group{
margin-bottom:16px;
display:flex;
flex-direction:column;
}

.form-group label{
margin-bottom:6px;
font-weight:600;
}

.form-group input,
.form-group select{
padding:10px;
border-radius:8px;
border:1px solid #d1d5db;
font-size:14px;
}

/* ERROR */

.error-message{
background:#ffebee;
color:#c62828;
padding:10px;
border-radius:8px;
margin-bottom:14px;
}

/* OPEN LIBRARY SEARCH */

.ol-search-bar{
display:flex;
gap:10px;
margin-bottom:22px;
}

.ol-search-bar input{
flex:1;
padding:12px 16px;
border-radius:10px;
border:1.5px solid #d1d5db;
font-size:15px;
}

.ol-search-bar button{
padding:12px 24px;
background:#2563eb;
color:white;
border:none;
border-radius:10px;
font-size:15px;
cursor:pointer;
white-space:nowrap;
}

.ol-search-bar button:disabled{
background:#94a3b8;
cursor:not-allowed;
}

.ol-books-grid{
display:grid;
grid-template-columns:repeat(auto-fill,minmax(200px,1fr));
gap:18px;
margin-top:10px;
}

.ol-book-card{
background:white;
border-radius:14px;
overflow:hidden;
box-shadow:0 3px 12px rgba(0,0,0,0.08);
display:flex;
flex-direction:column;
transition:transform 0.15s,box-shadow 0.15s;
}

.ol-book-card:hover{
transform:translateY(-3px);
box-shadow:0 6px 20px rgba(0,0,0,0.12);
}

.ol-book-cover{
width:100%;
height:200px;
object-fit:cover;
background:#f1f5f9;
}

.ol-book-cover-placeholder{
width:100%;
height:200px;
background:linear-gradient(135deg,#e2e8f0,#cbd5e1);
display:flex;
align-items:center;
justify-content:center;
font-size:40px;
}

.ol-book-info{
padding:14px;
flex:1;
display:flex;
flex-direction:column;
}

.ol-book-title{
font-weight:700;
font-size:14px;
margin:0 0 4px;
color:#1e293b;
display:-webkit-box;
-webkit-line-clamp:2;
-webkit-box-orient:vertical;
overflow:hidden;
}

.ol-book-author{
font-size:12px;
color:#64748b;
margin:0 0 4px;
}

.ol-book-meta{
font-size:11px;
color:#94a3b8;
margin:0 0 10px;
}

.ol-book-actions{
display:flex;
flex-direction:column;
gap:6px;
margin-top:auto;
}

.ol-book-actions button{
padding:7px 10px;
border:none;
border-radius:7px;
cursor:pointer;
font-size:12px;
font-weight:600;
}

.btn-add-lib{
background:#2563eb;
color:white;
}

.btn-lend-ol{
background:#059669;
color:white;
}

.btn-waitlist-ol{
background:#7c3aed;
color:white;
}

.ol-no-results{
text-align:center;
color:#94a3b8;
padding:40px;
font-size:15px;
}

.ol-quick-actions{
background:white;
border-radius:12px;
padding:18px 22px;
box-shadow:0 2px 10px rgba(0,0,0,0.06);
margin-bottom:22px;
}

.ol-quick-actions h3{
margin:0 0 12px;
font-size:16px;
}

.ol-quick-chips{
display:flex;
flex-wrap:wrap;
gap:8px;
}

.ol-chip{
padding:6px 14px;
background:#eff6ff;
color:#2563eb;
border:1px solid #bfdbfe;
border-radius:20px;
cursor:pointer;
font-size:13px;
transition:background 0.15s;
}

.ol-chip:hover{
background:#dbeafe;
}

.ol-lend-modal-overlay{
position:fixed;
inset:0;
background:rgba(0,0,0,0.45);
z-index:1000;
display:flex;
align-items:center;
justify-content:center;
}

.ol-lend-modal{
background:white;
border-radius:16px;
padding:28px 32px;
width:400px;
max-width:95vw;
box-shadow:0 20px 60px rgba(0,0,0,0.2);
}

.ol-lend-modal h3{
margin:0 0 18px;
font-size:18px;
}
`],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>CampusConnect</h2>
          <p>Library Dashboard</p>
        </div>
        <nav class="sidebar-nav">
          <a (click)="activeSection = 'overview'" [class.active]="activeSection === 'overview'">
            <span>Overview</span>
          </a>
          <a (click)="activeSection = 'borrowed'" [class.active]="activeSection === 'borrowed'">
            <span>Borrowed Books</span>
          </a>
          <a (click)="activeSection = 'overdue'" [class.active]="activeSection === 'overdue'">
            <span>Overdue Books</span>
          </a>
          <a (click)="activeSection = 'returned'" [class.active]="activeSection === 'returned'">
            <span>Returned Books</span>
          </a>
          <a (click)="activeSection = 'waitlist'" [class.active]="activeSection === 'waitlist'">
            <span>Waiting List</span>
          </a>
          <a (click)="activeSection = 'issue'" [class.active]="activeSection === 'issue'">
            <span>Issue Book</span>
          </a>
          <a (click)="activeSection = 'return'" [class.active]="activeSection === 'return'">
            <span>Return Book</span>
          </a>
          <a (click)="activeSection = 'addbook'" [class.active]="activeSection === 'addbook'">
            <span>Add Book</span>
          </a>
          <a (click)="activeSection = 'openlibrary'" [class.active]="activeSection === 'openlibrary'"
             style="border-top: 1px solid rgba(255,255,255,0.12); margin-top: 4px; padding-top: 18px">
            <span> Search Open Library</span>
          </a>
        </nav>
        <div class="sidebar-footer">
          <button class="btn btn-secondary" (click)="logout()" style="width:100%">Logout</button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- OVERVIEW -->
        <section *ngIf="activeSection === 'overview'">
          <h1>Library Overview</h1>
          <div class="stats-grid" *ngIf="libSummary">
            <div class="stat-card">
              <h3>Total Books</h3>
              <p class="stat-number">{{ libSummary.total_books }}</p>
            </div>
            <div class="stat-card">
              <h3>Currently Borrowed</h3>
              <p class="stat-number" style="color: #1976d2">{{ libSummary.currently_borrowed }}</p>
            </div>
            <div class="stat-card">
              <h3>Overdue</h3>
              <p class="stat-number" style="color: #f44336">{{ libSummary.overdue }}</p>
            </div>
            <div class="stat-card">
              <h3>Due Soon (2 days)</h3>
              <p class="stat-number" style="color: #ff9800">{{ libSummary.due_soon }}</p>
            </div>
            <div class="stat-card">
              <h3>Returned</h3>
              <p class="stat-number" style="color: #4caf50">{{ libSummary.returned }}</p>
            </div>
            <div class="stat-card">
              <h3>Waiting List</h3>
              <p class="stat-number" style="color: #9c27b0">{{ libSummary.waiting_list }}</p>
            </div>
          </div>

          <!-- All Books Inventory -->
          <div class="card" style="margin-top: 24px">
            <h2>Book Inventory</h2>
            <div class="table-container" *ngIf="allBooks.length > 0">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Author</th>
                    <th>ISBN</th>
                    <th>Category</th>
                    <th>Total Copies</th>
                    <th>Available</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let book of allBooks">
                    <td><strong>{{ book.title }}</strong></td>
                    <td>{{ book.author }}</td>
                    <td>{{ book.isbn }}</td>
                    <td>{{ book.category }}</td>
                    <td>{{ book.total_copies }}</td>
                    <td>
                      <span class="badge" [class.badge-success]="book.available_copies > 0"
                            [class.badge-danger]="book.available_copies === 0">
                        {{ book.available_copies }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- BORROWED BOOKS -->
        <section *ngIf="activeSection === 'borrowed'">
          <h1>Currently Borrowed Books</h1>
          <p class="section-desc">All books currently checked out by students (auto-marks overdue after 7 days past due)</p>
          <div *ngIf="borrowedBooks.length === 0" class="card">
            <p style="color: #666; text-align: center; padding: 20px;">No currently borrowed books.</p>
          </div>
          <div class="table-container" *ngIf="borrowedBooks.length > 0">
            <table>
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Student ID</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Days Remaining</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let b of borrowedBooks" [style.backgroundColor]="b.status === 'overdue' ? '#fff3e0' : 'transparent'">
                  <td><strong>{{ b.book_title }}</strong></td>
                  <td>{{ b.student_id }}</td>
                  <td>{{ b.issue_date | date:'mediumDate' }}</td>
                  <td>{{ b.due_date | date:'mediumDate' }}</td>
                  <td>
                    <span *ngIf="b.days_remaining > 0" style="color: #4caf50">{{ b.days_remaining }} days</span>
                    <span *ngIf="b.days_overdue > 0" style="color: #f44336; font-weight: 600">{{ b.days_overdue }} days overdue</span>
                    <span *ngIf="b.days_remaining === 0 && b.days_overdue === 0" style="color: #ff9800">Due today</span>
                  </td>
                  <td>
                    <span class="badge" [class.badge-info]="b.status === 'issued'" [class.badge-danger]="b.status === 'overdue'">
                      {{ b.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- OVERDUE BOOKS -->
        <section *ngIf="activeSection === 'overdue'">
          <h1>Overdue Books</h1>
          <p class="section-desc">Books past their due date - automatically marked overdue</p>
          <div *ngIf="overdueBooks.length === 0" class="card">
            <p style="color: #666; text-align: center; padding: 20px;">No overdue books. Great!</p>
          </div>
          <div class="table-container" *ngIf="overdueBooks.length > 0">
            <table>
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Student ID</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Days Overdue</th>
                  <th>Estimated Fine</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let b of overdueBooks" style="background-color: #ffebee">
                  <td><strong>{{ b.book_title }}</strong></td>
                  <td>{{ b.student_id }}</td>
                  <td>{{ b.issue_date | date:'mediumDate' }}</td>
                  <td>{{ b.due_date | date:'mediumDate' }}</td>
                  <td style="color: #f44336; font-weight: 700">{{ b.days_overdue }} days</td>
                  <td style="color: #f44336; font-weight: 600">\${{ b.days_overdue * 5 | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- RETURNED BOOKS -->
        <section *ngIf="activeSection === 'returned'">
          <h1>Returned Books History</h1>
          <div class="stats-grid" *ngIf="returnedData" style="margin-bottom: 24px">
            <div class="stat-card">
              <h3>Total Returned</h3>
              <p class="stat-number">{{ returnedData.total_returned }}</p>
            </div>
            <div class="stat-card">
              <h3>Total Fines Collected</h3>
              <p class="stat-number" style="color: #f44336">\${{ returnedData.total_fines_collected | number:'1.2-2' }}</p>
            </div>
            <div class="stat-card">
              <h3>Returned With Fine</h3>
              <p class="stat-number" style="color: #ff9800">{{ returnedData.returned_with_fine }}</p>
            </div>
          </div>
          <div class="table-container" *ngIf="returnedBooks.length > 0">
            <table>
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Student ID</th>
                  <th>Issue Date</th>
                  <th>Return Date</th>
                  <th>Fine</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let b of returnedBooks">
                  <td><strong>{{ b.book_title }}</strong></td>
                  <td>{{ b.student_id }}</td>
                  <td>{{ b.issue_date | date:'mediumDate' }}</td>
                  <td>{{ b.return_date | date:'mediumDate' }}</td>
                  <td [style.color]="b.fine_amount > 0 ? '#f44336' : '#4caf50'">
                    {{ b.fine_amount > 0 ? '$' + (b.fine_amount | number:'1.2-2') : 'None' }}
                  </td>
                  <td>
                    <span class="badge" [class.badge-success]="b.status === 'returned'"
                          [class.badge-warning]="b.status === 'returned_with_fine'">
                      {{ b.status === 'returned_with_fine' ? 'With Fine' : 'Clean' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- WAITING LIST -->
        <section *ngIf="activeSection === 'waitlist'">
          <h1>Waiting List</h1>
          <p class="section-desc">Students waiting for books that are currently unavailable</p>
          <div *ngIf="waitlistEntries.length === 0" class="card">
            <p style="color: #666; text-align: center; padding: 20px;">No students on the waiting list.</p>
          </div>
          <div class="table-container" *ngIf="waitlistEntries.length > 0">
            <table>
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Student ID</th>
                  <th>Queued At</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let w of waitlistEntries">
                  <td><strong>{{ w.book_title }}</strong></td>
                  <td>{{ w.student_id }}</td>
                  <td>{{ w.queued_at | date:'medium' }}</td>
                  <td><span class="badge badge-info">{{ w.status }}</span></td>
                  <td>
                    <button class="btn btn-sm btn-primary" (click)="updateWaitlist(w._id, 'notified')"
                            style="margin-right: 4px; padding: 4px 10px; font-size: 12px">Notify</button>
                    <button class="btn btn-sm btn-success" (click)="updateWaitlist(w._id, 'fulfilled')"
                            style="margin-right: 4px; padding: 4px 10px; font-size: 12px; background: #4caf50; border-color: #4caf50">Fulfill</button>
                    <button class="btn btn-sm btn-danger" (click)="updateWaitlist(w._id, 'cancelled')"
                            style="padding: 4px 10px; font-size: 12px; background: #f44336; border-color: #f44336">Cancel</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Add to Waitlist -->
          <div class="card" style="margin-top: 24px; max-width: 500px">
            <h3>Add Student to Waiting List</h3>
            <div *ngIf="waitlistSuccess" style="background: #e8f5e9; color: #2e7d32; padding: 10px; border-radius: 8px; margin-bottom: 12px;">
              {{ waitlistSuccess }}
            </div>
            <div *ngIf="waitlistError" class="error-message">{{ waitlistError }}</div>
            <form (ngSubmit)="addWaitlist()">
              <div class="form-group">
                <label>Book</label>
                <select [(ngModel)]="newWaitlist.book_id" name="wl_book_id" required>
                  <option value="">Select a book</option>
                  <option *ngFor="let b of allBooks" [value]="b._id">{{ b.title }} (Available: {{ b.available_copies }})</option>
                </select>
              </div>
              <div class="form-group">
                <label>Student ID</label>
                <input type="text" [(ngModel)]="newWaitlist.student_id" name="wl_student_id" required placeholder="Enter student ID">
              </div>
              <button type="submit" class="btn btn-primary">Add to Waitlist</button>
            </form>
          </div>
        </section>

        <!-- ISSUE BOOK -->
        <section *ngIf="activeSection === 'issue'">
          <h1>Issue Book</h1>
          <div class="card" style="max-width: 600px">
            <div *ngIf="issueSuccess" style="background: #e8f5e9; color: #2e7d32; padding: 10px; border-radius: 8px; margin-bottom: 16px;">
              {{ issueSuccess }}
            </div>
            <div *ngIf="issueError" class="error-message">{{ issueError }}</div>
            <form (ngSubmit)="issueBook()">
              <div class="form-group">
                <label>Book</label>
                <select [(ngModel)]="newIssue.book_id" name="issue_book_id" required>
                  <option value="">Select a book</option>
                  <option *ngFor="let b of allBooks" [value]="b._id" [disabled]="b.available_copies === 0">
                    {{ b.title }} (Available: {{ b.available_copies }})
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Student ID</label>
                <input type="text" [(ngModel)]="newIssue.student_id" name="issue_student_id" required placeholder="Enter student ID">
              </div>
              <div class="form-group">
                <label>Loan Duration (days)</label>
                <input type="number" [(ngModel)]="newIssue.days" name="issue_days" required min="1" max="30" value="7">
                <small style="color: #666; font-size: 12px;">Default: 7 days. Book auto-marked overdue after due date.</small>
              </div>
              <button type="submit" class="btn btn-primary">Issue Book</button>
            </form>
          </div>
        </section>

        <!-- RETURN BOOK -->
        <section *ngIf="activeSection === 'return'">
          <h1>Return Book</h1>
          <div class="card" style="max-width: 600px">
            <div *ngIf="returnSuccess" style="background: #e8f5e9; color: #2e7d32; padding: 10px; border-radius: 8px; margin-bottom: 16px;">
              {{ returnSuccess }}
            </div>
            <div *ngIf="returnError" class="error-message">{{ returnError }}</div>
            <form (ngSubmit)="returnBook()">
              <div class="form-group">
                <label>Select Borrowed Book to Return</label>
                <select [(ngModel)]="returnIssueId" name="return_issue_id" required>
                  <option value="">Select a borrowed book</option>
                  <option *ngFor="let b of borrowedBooks" [value]="b._id">
                    {{ b.book_title }} - Student: {{ b.student_id }} (Due: {{ b.due_date | date:'mediumDate' }})
                  </option>
                </select>
              </div>
              <button type="submit" class="btn btn-primary">Process Return</button>
            </form>
          </div>
        </section>

        <!-- ADD BOOK -->
        <section *ngIf="activeSection === 'addbook'">
          <h1>Add New Book</h1>
          <div class="card" style="max-width: 600px">
            <div *ngIf="addBookSuccess" style="background: #e8f5e9; color: #2e7d32; padding: 10px; border-radius: 8px; margin-bottom: 16px;">
              {{ addBookSuccess }}
            </div>
            <div *ngIf="addBookError" class="error-message">{{ addBookError }}</div>
            <form (ngSubmit)="addBook()">
              <div class="form-group">
                <label>Title</label>
                <input type="text" [(ngModel)]="newBook.title" name="book_title" required placeholder="Book title">
              </div>
              <div class="form-group">
                <label>Author</label>
                <input type="text" [(ngModel)]="newBook.author" name="book_author" required placeholder="Author name">
              </div>
              <div class="form-group">
                <label>ISBN</label>
                <input type="text" [(ngModel)]="newBook.isbn" name="book_isbn" required placeholder="ISBN number">
              </div>
              <div class="form-group">
                <label>Category</label>
                <input type="text" [(ngModel)]="newBook.category" name="book_category" required placeholder="e.g., Science, Fiction">
              </div>
              <div class="form-group">
                <label>Total Copies</label>
                <input type="number" [(ngModel)]="newBook.total_copies" name="book_copies" required min="1">
              </div>
              <button type="submit" class="btn btn-primary">Add Book</button>
            </form>
          </div>
        </section>

        <!-- SEARCH OPEN LIBRARY -->
        <section *ngIf="activeSection === 'openlibrary'">
          <h1>Search Open Library</h1>
          <p class="section-desc">
            Powered by <strong>Open Library (openlibrary.org)</strong> — a free, open catalogue of millions of books.
            Search by title, author, or ISBN. Add books directly to your campus library, lend to a student, or add to waitlist.
          </p>

          <!-- Quick chips -->
          <div class="ol-quick-actions">
            <h3>Quick Searches</h3>
            <div class="ol-quick-chips">
              <span class="ol-chip" *ngFor="let chip of olQuickChips" (click)="olRunChip(chip)">{{ chip }}</span>
            </div>
          </div>

          <!-- Search bar -->
          <div class="ol-search-bar">
            <input
              type="text"
              [(ngModel)]="olQuery"
              name="ol_query"
              placeholder="Search by title, author, or ISBN…"
              (keyup.enter)="olSearch()"
            />
            <button (click)="olSearch()" [disabled]="olLoading">
              {{ olLoading ? 'Searching…' : 'Search' }}
            </button>
          </div>

          <div *ngIf="olError" class="error-message">{{ olError }}</div>

          <!-- Results -->
          <div *ngIf="olResults.length > 0">
            <p style="color:#64748b; font-size:13px; margin-bottom:12px">
              Showing {{ olResults.length }} result(s) for "<strong>{{ olLastQuery }}</strong>"
            </p>
            <div class="ol-books-grid">
              <div class="ol-book-card" *ngFor="let book of olResults">
                <img *ngIf="book.coverUrl" [src]="book.coverUrl" [alt]="book.title" class="ol-book-cover"
                     (error)="book.coverUrl = null" />
                <div *ngIf="!book.coverUrl" class="ol-book-cover-placeholder">📚</div>
                <div class="ol-book-info">
                  <p class="ol-book-title">{{ book.title }}</p>
                  <p class="ol-book-author">{{ book.authorName }}</p>
                  <p class="ol-book-meta">
                    {{ book.subject }}<span *ngIf="book.publishYear"> · {{ book.publishYear }}</span>
                    <span *ngIf="book.isbn"><br/>ISBN: {{ book.isbn }}</span>
                  </p>
                  <div class="ol-book-actions">
                    <button class="btn-add-lib" (click)="olAddToLibrary(book)" title="Add to campus library inventory">
                      ➕ Add to Library
                    </button>
                    <button class="btn-lend-ol" (click)="olOpenLend(book)" title="Add to library and lend to a student">
                      📖 Lend to Student
                    </button>
                    <button class="btn-waitlist-ol" (click)="olOpenWaitlist(book)" title="Add to library and put student on waitlist">
                      ⏳ Add to Waitlist
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="!olLoading && olResults.length === 0 && olLastQuery" class="ol-no-results">
            No results found for "{{ olLastQuery }}". Try a different search term.
          </div>
          <div *ngIf="!olLoading && !olLastQuery" class="ol-no-results">
            Enter a search term to discover books from the Open Library catalogue.
          </div>
        </section>

        <!-- OL LEND MODAL -->
        <div class="ol-lend-modal-overlay" *ngIf="olLendModal.visible" (click)="olLendModal.visible = false">
          <div class="ol-lend-modal" (click)="$event.stopPropagation()">
            <h3>Lend "{{ olLendModal.book?.title }}"</h3>
            <p style="font-size:13px;color:#64748b;margin-bottom:16px">
              This will add the book to your library (if not present) and issue it to the student.
            </p>
            <div *ngIf="olLendModal.success" style="background:#e8f5e9;color:#2e7d32;padding:10px;border-radius:8px;margin-bottom:12px">{{ olLendModal.success }}</div>
            <div *ngIf="olLendModal.error" class="error-message">{{ olLendModal.error }}</div>
            <div class="form-group">
              <label>Student ID</label>
              <input type="text" [(ngModel)]="olLendModal.studentId" name="ol_lend_sid" placeholder="Enter student ID" />
            </div>
            <div class="form-group">
              <label>Loan Duration (days)</label>
              <input type="number" [(ngModel)]="olLendModal.days" name="ol_lend_days" min="1" max="30" />
            </div>
            <div style="display:flex;gap:10px;margin-top:16px">
              <button class="btn btn-primary" (click)="olConfirmLend()" [disabled]="olLendModal.loading">
                {{ olLendModal.loading ? 'Processing…' : 'Confirm Lend' }}
              </button>
              <button class="btn btn-secondary" (click)="olLendModal.visible = false">Cancel</button>
            </div>
          </div>
        </div>

        <!-- OL WAITLIST MODAL -->
        <div class="ol-lend-modal-overlay" *ngIf="olWaitlistModal.visible" (click)="olWaitlistModal.visible = false">
          <div class="ol-lend-modal" (click)="$event.stopPropagation()">
            <h3>Waitlist for "{{ olWaitlistModal.book?.title }}"</h3>
            <p style="font-size:13px;color:#64748b;margin-bottom:16px">
              This will add the book to your library (if not present) and place the student in the waiting list.
            </p>
            <div *ngIf="olWaitlistModal.success" style="background:#e8f5e9;color:#2e7d32;padding:10px;border-radius:8px;margin-bottom:12px">{{ olWaitlistModal.success }}</div>
            <div *ngIf="olWaitlistModal.error" class="error-message">{{ olWaitlistModal.error }}</div>
            <div class="form-group">
              <label>Student ID</label>
              <input type="text" [(ngModel)]="olWaitlistModal.studentId" name="ol_wl_sid" placeholder="Enter student ID" />
            </div>
            <div style="display:flex;gap:10px;margin-top:16px">
              <button class="btn btn-primary" (click)="olConfirmWaitlist()" [disabled]="olWaitlistModal.loading">
                {{ olWaitlistModal.loading ? 'Processing…' : 'Add to Waitlist' }}
              </button>
              <button class="btn btn-secondary" (click)="olWaitlistModal.visible = false">Cancel</button>
            </div>
          </div>
        </div>

      </main>
    </div>
  `
})
export class LibrarianDashboardComponent implements OnInit {
  activeSection = 'overview';
  libSummary: any = null;
  allBooks: any[] = [];
  borrowedBooks: any[] = [];
  overdueBooks: any[] = [];
  returnedBooks: any[] = [];
  returnedData: any = null;
  waitlistEntries: any[] = [];

  // Issue form
  newIssue = { book_id: '', student_id: '', days: 7 };
  issueSuccess = '';
  issueError = '';

  // Return form
  returnIssueId = '';
  returnSuccess = '';
  returnError = '';

  // Add book form
  newBook = { title: '', author: '', isbn: '', category: '', total_copies: 1 };
  addBookSuccess = '';
  addBookError = '';

  // Waitlist form
  newWaitlist = { book_id: '', student_id: '' };
  waitlistSuccess = '';
  waitlistError = '';

  // Open Library search
  olQuery = '';
  olLastQuery = '';
  olResults: OpenLibraryBook[] = [];
  olLoading = false;
  olError = '';
  olQuickChips = ['Computer Science', 'Data Structures', 'Machine Learning', 'Physics', 'Chemistry', 'History', 'Mathematics', 'Economics', 'Literature'];

  olLendModal: {
    visible: boolean;
    book: OpenLibraryBook | null;
    bookId: string;
    studentId: string;
    days: number;
    loading: boolean;
    success: string;
    error: string;
  } = { visible: false, book: null, bookId: '', studentId: '', days: 7, loading: false, success: '', error: '' };

  olWaitlistModal: {
    visible: boolean;
    book: OpenLibraryBook | null;
    bookId: string;
    studentId: string;
    loading: boolean;
    success: string;
    error: string;
  } = { visible: false, book: null, bookId: '', studentId: '', loading: false, success: '', error: '' };

  constructor(
    private authService: AuthService,
    private libraryService: LibraryService,
    private openLibraryService: OpenLibraryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.libraryService.getLibrarianSummary().subscribe({
      next: (data: any) => this.libSummary = data,
      error: () => {}
    });

    this.libraryService.getBooks().subscribe({
      next: (data: any) => this.allBooks = data || [],
      error: () => {}
    });

    this.libraryService.getBorrowedBooks().subscribe({
      next: (data: any) => {
        this.borrowedBooks = data.books || [];
        this.overdueBooks = this.borrowedBooks.filter((b: any) => b.status === 'overdue');
      },
      error: () => {}
    });

    this.libraryService.getReturnedBooks().subscribe({
      next: (data: any) => {
        this.returnedData = data;
        this.returnedBooks = data.books || [];
      },
      error: () => {}
    });

    this.libraryService.getWaitlist().subscribe({
      next: (data: any) => this.waitlistEntries = data.entries || [],
      error: () => {}
    });
  }

  issueBook(): void {
    this.issueSuccess = '';
    this.issueError = '';
    this.libraryService.issueBook(this.newIssue).subscribe({
      next: (res: any) => {
        this.issueSuccess = `Book issued successfully! Due: ${new Date(res.due_date).toLocaleDateString()}`;
        this.newIssue = { book_id: '', student_id: '', days: 7 };
        this.loadAll();
      },
      error: (err: any) => {
        this.issueError = err.error?.error || 'Failed to issue book.';
      }
    });
  }

  returnBook(): void {
    this.returnSuccess = '';
    this.returnError = '';
    if (!this.returnIssueId) return;
    this.libraryService.returnBook({ issue_id: this.returnIssueId }).subscribe({
      next: (res: any) => {
        this.returnSuccess = res.fine_amount > 0
          ? `Book returned with fine: $${res.fine_amount.toFixed(2)}`
          : 'Book returned successfully! No fine.';
        this.returnIssueId = '';
        this.loadAll();
      },
      error: (err: any) => {
        this.returnError = err.error?.error || 'Failed to return book.';
      }
    });
  }

  addBook(): void {
    this.addBookSuccess = '';
    this.addBookError = '';
    this.libraryService.addBook(this.newBook).subscribe({
      next: () => {
        this.addBookSuccess = 'Book added successfully!';
        this.newBook = { title: '', author: '', isbn: '', category: '', total_copies: 1 };
        this.loadAll();
      },
      error: (err: any) => {
        this.addBookError = err.error?.error || 'Failed to add book.';
      }
    });
  }

  addWaitlist(): void {
    this.waitlistSuccess = '';
    this.waitlistError = '';
    this.libraryService.addToWaitlist(this.newWaitlist).subscribe({
      next: () => {
        this.waitlistSuccess = 'Student added to waiting list!';
        this.newWaitlist = { book_id: '', student_id: '' };
        this.loadAll();
      },
      error: (err: any) => {
        this.waitlistError = err.error?.error || 'Failed to add to waiting list.';
      }
    });
  }

  updateWaitlist(entryId: string, status: string): void {
    this.libraryService.updateWaitlistStatus(entryId, status).subscribe({
      next: () => this.loadAll(),
      error: () => {}
    });
  }

  // ===== Open Library =====

  olSearch(): void {
    const q = this.olQuery.trim();
    if (!q) return;
    this.olLoading = true;
    this.olError = '';
    this.olResults = [];
    this.olLastQuery = q;
    this.openLibraryService.searchBooks(q).subscribe({
      next: (books: OpenLibraryBook[]) => {
        this.olResults = books;
        this.olLoading = false;
      },
      error: () => {
        this.olError = 'Failed to reach Open Library. Check your internet connection and try again.';
        this.olLoading = false;
      }
    });
  }

  olRunChip(chip: string): void {
    this.olQuery = chip;
    this.olSearch();
  }

  /** Add a book from Open Library directly into the campus library with 1 copy */
  olAddToLibrary(book: OpenLibraryBook): void {
    const payload = {
      isbn: book.isbn || 'N/A',
      title: book.title,
      author: book.authorName,
      category: book.subject,
      total_copies: 1,
    };
    this.libraryService.addBook(payload).subscribe({
      next: () => {
        alert(`"${book.title}" added to library!`);
        this.loadAll();
      },
      error: (err: any) => alert(err.error?.error || 'Failed to add book.')
    });
  }

  /** Open the lend modal for an Open Library book */
  olOpenLend(book: OpenLibraryBook): void {
    this.olLendModal = { visible: true, book, bookId: '', studentId: '', days: 7, loading: false, success: '', error: '' };
  }

  /** Add book to library (if needed) then lend it */
  olConfirmLend(): void {
    if (!this.olLendModal.studentId.trim()) {
      this.olLendModal.error = 'Please enter a student ID.';
      return;
    }
    this.olLendModal.loading = true;
    this.olLendModal.error = '';

    const book = this.olLendModal.book!;

    // Step 1: Add book to library (ignore duplicate errors), Step 2: refresh books, Step 3: issue
    const payload = {
      isbn: book.isbn || 'N/A',
      title: book.title,
      author: book.authorName,
      category: book.subject,
      total_copies: 1,
    };

    this.libraryService.addBook(payload).subscribe({
      next: () => this._issueAfterAdd(),
      error: () => this._issueAfterAdd() // book may already exist, proceed anyway
    });
  }

  private _issueAfterAdd(): void {
    // Refresh book list to find the newly added book by title
    this.libraryService.getBooks().subscribe({
      next: (books: any[]) => {
        this.allBooks = books || [];
        const title = this.olLendModal.book?.title || '';
        const matched = this.allBooks.find((b: any) =>
          b.title?.toLowerCase() === title.toLowerCase() && b.available_copies > 0
        );
        if (!matched) {
          this.olLendModal.error = 'Book has no available copies. Try adding it to the waitlist instead.';
          this.olLendModal.loading = false;
          return;
        }
        this.libraryService.issueBook({
          book_id: matched._id,
          student_id: this.olLendModal.studentId,
          days: this.olLendModal.days,
        }).subscribe({
          next: (res: any) => {
            this.olLendModal.success = `Issued! Due: ${new Date(res.due_date).toLocaleDateString()}`;
            this.olLendModal.loading = false;
            this.loadAll();
          },
          error: (err: any) => {
            this.olLendModal.error = err.error?.error || 'Failed to issue book.';
            this.olLendModal.loading = false;
          }
        });
      },
      error: () => {
        this.olLendModal.error = 'Could not refresh book list.';
        this.olLendModal.loading = false;
      }
    });
  }

  /** Open the waitlist modal for an Open Library book */
  olOpenWaitlist(book: OpenLibraryBook): void {
    this.olWaitlistModal = { visible: true, book, bookId: '', studentId: '', loading: false, success: '', error: '' };
  }

  /** Add book to library (if needed) then add student to waitlist */
  olConfirmWaitlist(): void {
    if (!this.olWaitlistModal.studentId.trim()) {
      this.olWaitlistModal.error = 'Please enter a student ID.';
      return;
    }
    this.olWaitlistModal.loading = true;
    this.olWaitlistModal.error = '';

    const book = this.olWaitlistModal.book!;
    const payload = {
      isbn: book.isbn || 'N/A',
      title: book.title,
      author: book.authorName,
      category: book.subject,
      total_copies: 1,
    };

    this.libraryService.addBook(payload).subscribe({
      next: () => this._waitlistAfterAdd(),
      error: () => this._waitlistAfterAdd()
    });
  }

  private _waitlistAfterAdd(): void {
    this.libraryService.getBooks().subscribe({
      next: (books: any[]) => {
        this.allBooks = books || [];
        const title = this.olWaitlistModal.book?.title || '';
        const matched = this.allBooks.find((b: any) =>
          b.title?.toLowerCase() === title.toLowerCase()
        );
        if (!matched) {
          this.olWaitlistModal.error = 'Could not find book in library.';
          this.olWaitlistModal.loading = false;
          return;
        }
        this.libraryService.addToWaitlist({
          book_id: matched._id,
          student_id: this.olWaitlistModal.studentId,
        }).subscribe({
          next: () => {
            this.olWaitlistModal.success = 'Student added to waiting list!';
            this.olWaitlistModal.loading = false;
            this.loadAll();
          },
          error: (err: any) => {
            this.olWaitlistModal.error = err.error?.error || 'Failed to add to waitlist.';
            this.olWaitlistModal.loading = false;
          }
        });
      },
      error: () => {
        this.olWaitlistModal.error = 'Could not refresh book list.';
        this.olWaitlistModal.loading = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
