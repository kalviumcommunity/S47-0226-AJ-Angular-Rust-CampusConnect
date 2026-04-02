import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AcademicsService } from '../services/academics.service';
import { FinanceService } from '../services/finance.service';
import { LibraryService } from '../services/library.service';
import { HostelService } from '../services/hostel.service';
import { NavigationService } from '../services/navigation.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="app-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2><i class="fas fa-graduation-cap"></i> CampusConnect</h2>
          <span>Student Portal</span>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-item" [class.active]="activeSection === 'overview'" (click)="setSection('overview')">
            <i class="fas fa-th-large"></i> Overview
          </div>
          <div class="nav-item" [class.active]="activeSection === 'fees'" (click)="setSection('fees')">
            <i class="fas fa-money-bill-wave"></i> Fees
          </div>
          <div class="nav-item" [class.active]="activeSection === 'library'" (click)="setSection('library')">
            <i class="fas fa-book"></i> Library
          </div>
          <div class="nav-item" [class.active]="activeSection === 'attendance'" (click)="setSection('attendance')">
            <i class="fas fa-calendar-check"></i> Attendance
          </div>
          <div class="nav-item" [class.active]="activeSection === 'notes'" (click)="setSection('notes')">
            <i class="fas fa-sticky-note"></i> Notes & Materials
          </div>
          <div class="nav-item" [class.active]="activeSection === 'results'" (click)="setSection('results')">
            <i class="fas fa-trophy"></i> Results
          </div>
          <div class="nav-item" [class.active]="activeSection === 'classes'" (click)="setSection('classes')">
            <i class="fas fa-chalkboard"></i> Classes
          </div>
          <div class="nav-divider"></div>
          <!-- routerLink navigation — no plain href -->
          <a class="nav-item" routerLink="/home">
            <i class="fas fa-home"></i> Home
          </a>
          <a class="nav-item" [routerLink]="['/profile', user?.username]">
            <i class="fas fa-user"></i> My Profile
          </a>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Top Bar -->
        <div class="topbar">
          <h2>{{ getSectionTitle() }}</h2>
          <div class="topbar-right">
            <span>{{ user?.full_name }}</span>
            <div class="user-avatar">{{ getInitials() }}</div>
            <!-- Programmatic navigation to profile using Router service -->
            <button class="btn btn-outline btn-sm" (click)="goToProfile()">
              <i class="fas fa-user"></i> Profile
            </button>
            <button class="btn btn-outline btn-sm" (click)="logout()">
              <i class="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>

        <div class="dashboard-container">

        <!-- ===== OVERVIEW ===== -->
        <div *ngIf="activeSection === 'overview'">
          <div class="dashboard-header">
            <h1>Welcome, {{ user?.full_name }}!</h1>
            <p>Here's your academic summary</p>
          </div>

          <div class="dashboard-grid">
            <!-- Fees Summary Card -->
            <div class="card" (click)="setSection('fees')" style="cursor: pointer;">
              <div class="card-header">
                <h3>Fees Status</h3>
                <div class="icon icon-green"><i class="fas fa-money-bill-wave"></i></div>
              </div>
              <div class="stat-row">
                <span class="stat-label">Total Fees</span>
                <span class="stat-value">₹{{ feesData?.total_fees || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Paid</span>
                <span class="stat-value" style="color: #4caf50;">₹{{ feesData?.total_paid || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Pending</span>
                <span class="stat-value" style="color: #f44336;">₹{{ feesData?.total_pending || 0 }}</span>
              </div>
            </div>

            <!-- Attendance Summary Card -->
            <div class="card" (click)="setSection('attendance')" style="cursor: pointer;">
              <div class="card-header">
                <h3>Attendance</h3>
                <div class="icon icon-blue"><i class="fas fa-calendar-check"></i></div>
              </div>
              <div class="stat-row">
                <span class="stat-label">Overall Percentage</span>
                <span class="stat-value">{{ attendanceData?.overall_attendance_percentage || '0' }}%</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Classes Attended</span>
                <span class="stat-value">{{ attendanceData?.total_classes_attended || 0 }} / {{ attendanceData?.total_classes || 0 }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" [class.green]="getAttendancePercent() >= 75"
                     [class.orange]="getAttendancePercent() >= 50 && getAttendancePercent() < 75"
                     [class.red]="getAttendancePercent() < 50"
                     [style.width.%]="getAttendancePercent()"></div>
              </div>
            </div>

            <!-- Library Summary Card -->
            <div class="card" (click)="setSection('library')" style="cursor: pointer;">
              <div class="card-header">
                <h3>Library</h3>
                <div class="icon icon-orange"><i class="fas fa-book"></i></div>
              </div>
              <div class="stat-row">
                <span class="stat-label">Books Borrowed</span>
                <span class="stat-value">{{ libraryData?.total_borrowed || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Books Returned</span>
                <span class="stat-value">{{ libraryData?.total_returned || 0 }}</span>
              </div>
            </div>

            <!-- Results Summary Card -->
            <div class="card" (click)="setSection('results')" style="cursor: pointer;">
              <div class="card-header">
                <h3>Academic Results</h3>
                <div class="icon icon-purple"><i class="fas fa-trophy"></i></div>
              </div>
              <div class="stat-row">
                <span class="stat-label">Overall Percentage</span>
                <span class="stat-value">{{ resultsData?.overall_percentage || '0' }}%</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Overall Grade</span>
                <span class="stat-value">{{ resultsData?.overall_grade || 'N/A' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== FEES SECTION ===== -->
        <div *ngIf="activeSection === 'fees'">
          <div class="dashboard-header">
            <h1>Fees Details</h1>
            <p>Your complete fee breakdown</p>
          </div>

          <div class="dashboard-grid">
            <!-- College Fees -->
            <div class="card">
              <div class="card-header">
                <h3>College Fees</h3>
                <span class="status-badge" [class.badge-paid]="feesData?.college_fees?.status === 'paid'"
                      [class.badge-pending]="feesData?.college_fees?.status === 'pending'">
                  {{ feesData?.college_fees?.status | uppercase }}
                </span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Total Amount</span>
                <span class="stat-value">₹{{ feesData?.college_fees?.total_amount || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Amount Paid</span>
                <span class="stat-value" style="color: #4caf50;">₹{{ feesData?.college_fees?.amount_paid || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Amount Pending</span>
                <span class="stat-value" style="color: #f44336;">₹{{ feesData?.college_fees?.amount_pending || 0 }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill green" [style.width.%]="getCollegeFeePaidPercent()"></div>
              </div>

              <!-- Fee Breakdown Table -->
              <div class="table-container" style="margin-top: 16px;" *ngIf="feesData?.college_fees?.breakdown?.length">
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let fee of feesData?.college_fees?.breakdown">
                      <td>{{ fee.fee_type }}</td>
                      <td>₹{{ fee.amount }}</td>
                      <td>{{ fee.due_date }}</td>
                      <td><span class="status-badge" [class.badge-paid]="fee.status === 'paid'"
                                [class.badge-pending]="fee.status === 'pending'">{{ fee.status }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Hostel Fees -->
            <div class="card" *ngIf="feesData?.is_hosteller">
              <div class="card-header">
                <h3>Hostel Fees</h3>
                <span class="status-badge" [class.badge-paid]="feesData?.hostel_fees?.status === 'paid'"
                      [class.badge-pending]="feesData?.hostel_fees?.status === 'pending'">
                  {{ feesData?.hostel_fees?.status | uppercase }}
                </span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Total Amount</span>
                <span class="stat-value">₹{{ feesData?.hostel_fees?.total_amount || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Amount Paid</span>
                <span class="stat-value" style="color: #4caf50;">₹{{ feesData?.hostel_fees?.amount_paid || 0 }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Amount Pending</span>
                <span class="stat-value" style="color: #f44336;">₹{{ feesData?.hostel_fees?.amount_pending || 0 }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill blue" [style.width.%]="getHostelFeePaidPercent()"></div>
              </div>

              <div class="table-container" style="margin-top: 16px;" *ngIf="feesData?.hostel_fees?.breakdown?.length">
                <table>
                  <thead>
                    <tr><th>Type</th><th>Amount</th><th>Due Date</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let fee of feesData?.hostel_fees?.breakdown">
                      <td>{{ fee.fee_type }}</td>
                      <td>₹{{ fee.amount }}</td>
                      <td>{{ fee.due_date }}</td>
                      <td><span class="status-badge" [class.badge-paid]="fee.status === 'paid'"
                                [class.badge-pending]="fee.status === 'pending'">{{ fee.status }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="card" *ngIf="!feesData?.is_hosteller">
              <div class="card-header">
                <h3>Hostel Fees</h3>
                <div class="icon icon-teal"><i class="fas fa-home"></i></div>
              </div>
              <div class="empty-state">
                <i class="fas fa-home"></i>
                <p>You are not registered as a hosteller.<br>No hostel fees applicable.</p>
              </div>
            </div>

            <!-- Payment History -->
            <div class="card" style="grid-column: 1 / -1;" *ngIf="feesData?.payments?.length">
              <div class="card-header">
                <h3>Payment History</h3>
                <div class="icon icon-green"><i class="fas fa-receipt"></i></div>
              </div>
              <div class="table-container">
                <table>
                  <thead>
                    <tr><th>Date</th><th>Amount</th><th>Method</th><th>Transaction ID</th></tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let payment of feesData?.payments">
                      <td>{{ payment.payment_date | date:'mediumDate' }}</td>
                      <td>₹{{ payment.amount }}</td>
                      <td>{{ payment.payment_method }}</td>
                      <td>{{ payment.transaction_id }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== LIBRARY SECTION ===== -->
        <div *ngIf="activeSection === 'library'">
          <div class="dashboard-header">
            <h1>Library</h1>
            <p>Your borrowed books and reading history</p>
          </div>

          <div class="dashboard-grid">
            <!-- Currently Borrowed -->
            <div class="card" style="grid-column: 1 / -1;">
              <div class="card-header">
                <h3>Currently Borrowed ({{ libraryData?.total_borrowed || 0 }})</h3>
                <div class="icon icon-orange"><i class="fas fa-book-open"></i></div>
              </div>
              <div *ngIf="libraryData?.currently_borrowed?.length; else noBorrowed">
                <div class="table-container">
                  <table>
                    <thead>
                      <tr><th>Book Title</th><th>Borrow Date</th><th>Due Date</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let book of libraryData?.currently_borrowed">
                        <td><strong>{{ book.book_title }}</strong></td>
                        <td>{{ book.issue_date | date:'mediumDate' }}</td>
                        <td>{{ book.due_date | date:'mediumDate' }}</td>
                        <td>
                          <span class="status-badge badge-issued">Borrowed</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <ng-template #noBorrowed>
                <div class="empty-state">
                  <i class="fas fa-book"></i>
                  <p>No books currently borrowed</p>
                </div>
              </ng-template>
            </div>

            <!-- Return History -->
            <div class="card" style="grid-column: 1 / -1;">
              <div class="card-header">
                <h3>Return History ({{ libraryData?.total_returned || 0 }})</h3>
                <div class="icon icon-green"><i class="fas fa-book-reader"></i></div>
              </div>
              <div *ngIf="libraryData?.returned_books?.length; else noReturned">
                <div class="table-container">
                  <table>
                    <thead>
                      <tr><th>Book Title</th><th>Borrow Date</th><th>Return Date</th><th>Fine</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let book of libraryData?.returned_books">
                        <td><strong>{{ book.book_title }}</strong></td>
                        <td>{{ book.issue_date | date:'mediumDate' }}</td>
                        <td>{{ book.return_date | date:'mediumDate' }}</td>
                        <td>{{ book.fine_amount > 0 ? '₹' + book.fine_amount : '-' }}</td>
                        <td>
                          <span class="status-badge badge-returned">Returned</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <ng-template #noReturned>
                <div class="empty-state">
                  <i class="fas fa-history"></i>
                  <p>No return history yet</p>
                </div>
              </ng-template>
            </div>
          </div>
        </div>

        <!-- ===== ATTENDANCE SECTION ===== -->
        <div *ngIf="activeSection === 'attendance'">
          <div class="dashboard-header">
            <h1>Attendance</h1>
            <p>Your class attendance details</p>
          </div>

          <div class="dashboard-grid">
            <!-- Overall Attendance -->
            <div class="card">
              <div class="card-header">
                <h3>Overall Attendance</h3>
                <div class="icon icon-blue"><i class="fas fa-chart-pie"></i></div>
              </div>
              <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 48px; font-weight: 700; color: #1976d2;">
                  {{ attendanceData?.overall_attendance_percentage || '0' }}%
                </div>
                <p style="color: #666; margin-top: 8px;">
                  {{ attendanceData?.total_classes_attended || 0 }} out of {{ attendanceData?.total_classes || 0 }} classes
                </p>
                <div class="progress-bar" style="margin-top: 12px;">
                  <div class="progress-fill" [class.green]="getAttendancePercent() >= 75"
                       [class.orange]="getAttendancePercent() >= 50 && getAttendancePercent() < 75"
                       [class.red]="getAttendancePercent() < 50"
                       [style.width.%]="getAttendancePercent()"></div>
                </div>
              </div>
            </div>

            <!-- Subject-wise Attendance -->
            <div class="card">
              <div class="card-header">
                <h3>Subject-wise Attendance</h3>
                <div class="icon icon-purple"><i class="fas fa-list"></i></div>
              </div>
              <div *ngIf="attendanceData?.subject_wise_attendance?.length; else noSubjects">
                <div *ngFor="let subject of attendanceData?.subject_wise_attendance" style="margin-bottom: 16px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="font-size: 14px; font-weight: 500;">{{ subject.course_code }}</span>
                    <span style="font-size: 14px; color: #666;">
                      {{ subject.classes_attended }}/{{ subject.total_classes }} ({{ subject.attendance_percentage }}%)
                    </span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill"
                         [class.green]="subject.attendance_percentage >= 75"
                         [class.orange]="subject.attendance_percentage >= 50 && subject.attendance_percentage < 75"
                         [class.red]="subject.attendance_percentage < 50"
                         [style.width.%]="subject.attendance_percentage"></div>
                  </div>
                </div>
              </div>
              <ng-template #noSubjects>
                <div class="empty-state">
                  <i class="fas fa-calendar"></i>
                  <p>No attendance records available</p>
                </div>
              </ng-template>
            </div>
          </div>
        </div>

        <!-- ===== NOTES & STUDY MATERIALS ===== -->
        <div *ngIf="activeSection === 'notes'">
          <div class="dashboard-header">
            <h1>Notes & Study Materials</h1>
            <p>Access teacher-uploaded notes and submit your own</p>
          </div>

          <div class="dashboard-grid">
            <!-- Teacher Notes -->
            <div class="card" style="grid-column: 1 / -1;">
              <div class="card-header">
                <h3>Study Materials from Teachers</h3>
                <div class="icon icon-blue"><i class="fas fa-file-alt"></i></div>
              </div>
              <div *ngIf="notesData?.length; else noNotes">
                <div class="table-container">
                  <table>
                    <thead>
                      <tr><th>Title</th><th>Course</th><th>Type</th><th>Uploaded By</th><th>Date</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let note of notesData">
                        <td><strong>{{ note.title }}</strong><br><small style="color: #999;">{{ note.description }}</small></td>
                        <td>{{ note.course_code }}</td>
                        <td><span class="status-badge badge-submitted">{{ note.file_type | uppercase }}</span></td>
                        <td>{{ note.uploaded_by }}</td>
                        <td>{{ note.created_at | date:'mediumDate' }}</td>
                        <td>
                          <a [href]="note.file_url" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
                            <i class="fas fa-eye"></i> Preview
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <ng-template #noNotes>
                <div class="empty-state">
                  <i class="fas fa-file-alt"></i>
                  <p>No study materials uploaded yet</p>
                </div>
              </ng-template>
            </div>
          </div>
        </div>

        <!-- ===== RESULTS SECTION ===== -->
        <div *ngIf="activeSection === 'results'">
          <div class="dashboard-header">
            <h1>Academic Results</h1>
            <p>Your exam performance and grades</p>
          </div>

          <div class="dashboard-grid">
            <!-- Overall Performance -->
            <div class="card">
              <div class="card-header">
                <h3>Overall Performance</h3>
                <div class="icon icon-purple"><i class="fas fa-award"></i></div>
              </div>
              <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 48px; font-weight: 700; color: #7b1fa2;">
                  {{ resultsData?.overall_grade || 'N/A' }}
                </div>
                <p style="color: #666; margin-top: 8px;">
                  {{ resultsData?.overall_percentage || '0' }}% overall
                </p>
                <div style="margin-top: 8px; font-size: 14px; color: #888;">
                  {{ resultsData?.overall_marks_obtained || 0 }} / {{ resultsData?.overall_total_marks || 0 }} marks
                </div>
              </div>
            </div>

            <!-- Subject-wise Results -->
            <div class="card" style="grid-column: 1 / -1;">
              <div class="card-header">
                <h3>Subject-wise Results</h3>
                <div class="icon icon-teal"><i class="fas fa-clipboard-list"></i></div>
              </div>
              <div *ngIf="resultsData?.results?.length; else noResults">
                <div class="table-container">
                  <table>
                    <thead>
                      <tr><th>Subject</th><th>Exam Type</th><th>Marks</th><th>Percentage</th><th>Grade</th><th>Semester</th></tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let result of resultsData?.results">
                        <td><strong>{{ result.course_code }}</strong></td>
                        <td>{{ result.exam_type }}</td>
                        <td>{{ result.marks_obtained }} / {{ result.total_marks }}</td>
                        <td>{{ ((result.marks_obtained / result.total_marks) * 100).toFixed(1) }}%</td>
                        <td><span class="status-badge" [class.badge-paid]="result.grade === 'A+' || result.grade === 'A'"
                                  [class.badge-submitted]="result.grade === 'B+' || result.grade === 'B'"
                                  [class.badge-pending]="result.grade === 'C' || result.grade === 'D'"
                                  [class.badge-absent]="result.grade === 'F'">{{ result.grade }}</span></td>
                        <td>{{ result.semester }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <ng-template #noResults>
                <div class="empty-state">
                  <i class="fas fa-trophy"></i>
                  <p>No exam results available yet</p>
                </div>
              </ng-template>
            </div>
          </div>
        </div>

        <!-- ===== CLASSES SECTION ===== -->
        <div *ngIf="activeSection === 'classes'">
          <div class="dashboard-header">
            <h1>My Classes</h1>
            <p>Your enrolled courses and attendance</p>
          </div>

          <div class="dashboard-grid">
            <div class="card" style="grid-column: 1 / -1;">
              <div class="card-header">
                <h3>Enrolled Classes</h3>
                <div class="icon icon-blue"><i class="fas fa-chalkboard-teacher"></i></div>
              </div>
              <div *ngIf="classesData?.enrollments?.length; else noClasses">
                <div class="table-container">
                  <table>
                    <thead>
                      <tr><th>Course Code</th><th>Course Name</th><th>Semester</th><th>Classes Attended</th><th>Classes Missed</th><th>Total</th></tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let cls of classesData?.enrollments">
                        <td><strong>{{ cls.course_code }}</strong></td>
                        <td>{{ cls.course_name }}</td>
                        <td>{{ cls.semester }}</td>
                        <td style="color: #4caf50; font-weight: 600;">{{ cls.classes_attended }}</td>
                        <td style="color: #f44336; font-weight: 600;">{{ cls.classes_missed }}</td>
                        <td>{{ cls.total_classes }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <ng-template #noClasses>
                <div class="empty-state">
                  <i class="fas fa-chalkboard"></i>
                  <p>No enrolled classes found</p>
                </div>
              </ng-template>
            </div>
          </div>
        </div>

        </div>
      </main>
    </div>
  `
})
export class StudentDashboardComponent implements OnInit {
  activeSection = 'overview';
  user: any;
  feesData: any;
  libraryData: any;
  attendanceData: any;
  classesData: any;
  resultsData: any;
  notesData: any[] = [];

  constructor(
    private authService: AuthService,
    private academicsService: AcademicsService,
    private financeService: FinanceService,
    private libraryService: LibraryService,
    private hostelService: HostelService,
    private router: Router,
    private navService: NavigationService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    if (this.user) {
      this.loadAllData();
    }
    this.navService.setLastVisited('/student');
    this.navService.addBreadcrumb('Student Dashboard');
  }

  /** Updates active section and persists it in NavigationService */
  setSection(section: string): void {
    this.activeSection = section;
    this.navService.setActiveSection(section);
  }

  /** Programmatic navigation to profile page using Router service */
  goToProfile(): void {
    this.router.navigate(['/profile', this.user?.username]);
  }

  loadAllData(): void {
    const username = this.user.username;

    this.financeService.getStudentFees(username).subscribe({
      next: (data: any) => this.feesData = data,
      error: () => this.feesData = null
    });

    this.libraryService.getStudentBooks(username).subscribe({
      next: (data: any) => this.libraryData = data,
      error: () => this.libraryData = null
    });

    this.academicsService.getStudentAttendance(username).subscribe({
      next: (data: any) => this.attendanceData = data,
      error: () => this.attendanceData = null
    });

    this.academicsService.getStudentEnrollments(username).subscribe({
      next: (data: any) => this.classesData = data,
      error: () => this.classesData = null
    });

    this.academicsService.getStudentResults(username).subscribe({
      next: (data: any) => this.resultsData = data,
      error: () => this.resultsData = null
    });

    this.academicsService.getNotes().subscribe({
      next: (data: any) => this.notesData = data,
      error: () => this.notesData = []
    });
  }

  getSectionTitle(): string {
    const titles: Record<string, string> = {
      overview: 'Dashboard Overview',
      fees: 'Fees Management',
      library: 'Library',
      attendance: 'Attendance',
      notes: 'Notes & Study Materials',
      results: 'Academic Results',
      classes: 'My Classes'
    };
    return titles[this.activeSection] || 'Dashboard';
  }

  getInitials(): string {
    if (!this.user?.full_name) return '?';
    return this.user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getAttendancePercent(): number {
    return parseFloat(this.attendanceData?.overall_attendance_percentage || '0');
  }

  getCollegeFeePaidPercent(): number {
    const total = this.feesData?.college_fees?.total_amount || 0;
    const paid = this.feesData?.college_fees?.amount_paid || 0;
    return total > 0 ? (paid / total) * 100 : 0;
  }

  getHostelFeePaidPercent(): number {
    const total = this.feesData?.hostel_fees?.total_amount || 0;
    const paid = this.feesData?.hostel_fees?.amount_paid || 0;
    return total > 0 ? (paid / total) * 100 : 0;
  }

  logout(): void {
    this.authService.logout();
  }
}
