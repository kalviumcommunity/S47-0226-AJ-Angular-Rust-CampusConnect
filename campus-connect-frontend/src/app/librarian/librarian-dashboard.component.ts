import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LibraryService } from '../services/library.service';

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

  constructor(
    private authService: AuthService,
    private libraryService: LibraryService,
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
