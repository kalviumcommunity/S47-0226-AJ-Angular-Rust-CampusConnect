import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AcademicsService } from '../services/academics.service';
import { NavigationService } from '../services/navigation.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="app-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2><i class="fas fa-graduation-cap"></i> CampusConnect</h2>
          <span>Teacher Portal</span>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-item" [class.active]="activeSection === 'overview'" (click)="activeSection = 'overview'">
            <i class="fas fa-th-large"></i> Overview
          </div>
          <div class="nav-item" [class.active]="activeSection === 'batches'" (click)="activeSection = 'batches'">
            <i class="fas fa-users"></i> Batch Management
          </div>
          <div class="nav-item" [class.active]="activeSection === 'attendance'" (click)="activeSection = 'attendance'">
            <i class="fas fa-calendar-check"></i> Attendance
          </div>
          <div class="nav-item" [class.active]="activeSection === 'notes'" (click)="activeSection = 'notes'">
            <i class="fas fa-upload"></i> Upload Notes
          </div>
          <div class="nav-item" [class.active]="activeSection === 'student-notes'" (click)="activeSection = 'student-notes'">
            <i class="fas fa-file-alt"></i> Student Notes Review
          </div>
          <div class="nav-item" [class.active]="activeSection === 'results'" (click)="activeSection = 'results'">
            <i class="fas fa-trophy"></i> Manage Results
          </div>
          <div class="nav-divider"></div>
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
        <div class="topbar">
          <h2>{{ getSectionTitle() }}</h2>
          <div class="topbar-right">
            <span>{{ user?.full_name }}</span>
            <div class="user-avatar">{{ getInitials() }}</div>
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
            <p>Teacher Dashboard Overview</p>
          </div>

          <div class="dashboard-grid">
            <div class="card" (click)="activeSection = 'batches'" style="cursor: pointer;">
              <div class="card-header">
                <h3>Batches</h3>
                <div class="icon icon-blue"><i class="fas fa-users"></i></div>
              </div>
              <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 48px; font-weight: 700; color: #1976d2;">{{ batches.length }}</div>
                <p style="color: #666;">Total Batches</p>
              </div>
            </div>

            <div class="card" (click)="activeSection = 'notes'" style="cursor: pointer;">
              <div class="card-header">
                <h3>Notes Uploaded</h3>
                <div class="icon icon-green"><i class="fas fa-file-upload"></i></div>
              </div>
              <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 48px; font-weight: 700; color: #388e3c;">{{ uploadedNotes.length }}</div>
                <p style="color: #666;">Study Materials</p>
              </div>
            </div>

            <div class="card" (click)="activeSection = 'student-notes'" style="cursor: pointer;">
              <div class="card-header">
                <h3>Student Submissions</h3>
                <div class="icon icon-orange"><i class="fas fa-file-alt"></i></div>
              </div>
              <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 48px; font-weight: 700; color: #f57c00;">{{ studentSubmissions.length }}</div>
                <p style="color: #666;">Pending Review</p>
              </div>
            </div>

            <div class="card" (click)="activeSection = 'attendance'" style="cursor: pointer;">
              <div class="card-header">
                <h3>Attendance</h3>
                <div class="icon icon-purple"><i class="fas fa-clipboard-check"></i></div>
              </div>
              <div style="text-align: center; padding: 20px 0;">
                <div style="font-size: 48px; font-weight: 700; color: #7b1fa2;">
                  <i class="fas fa-calendar-check"></i>
                </div>
                <p style="color: #666;">Mark & View Attendance</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== BATCH MANAGEMENT ===== -->
        <div *ngIf="activeSection === 'batches'">
          <div class="dashboard-header">
            <h1>Batch Management</h1>
            <p>Organize students into batches</p>
          </div>

          <!-- Create Batch Form -->
          <div class="card" style="margin-bottom: 24px;">
            <div class="card-header">
              <h3>Create New Batch</h3>
              <div class="icon icon-blue"><i class="fas fa-plus"></i></div>
            </div>
            <form (ngSubmit)="createBatch()">
              <div style="display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 16px; align-items: end;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label>Batch Name</label>
                  <input type="text" [(ngModel)]="newBatch.batch_name" name="batchName" placeholder="e.g., Batch A" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label>Course Code</label>
                  <input type="text" [(ngModel)]="newBatch.course_code" name="courseCode" placeholder="e.g., CS101" required>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label>Student IDs (comma-separated)</label>
                  <input type="text" [(ngModel)]="newBatch.student_ids_str" name="studentIds" placeholder="e.g., student1, student2, student3">
                </div>
              </div>
              <button type="submit" class="btn btn-primary" style="margin-top: 16px;">
                <i class="fas fa-plus"></i> Create Batch
              </button>
            </form>
            <div *ngIf="batchMessage" style="margin-top: 12px; padding: 8px; background: #e8f5e9; color: #2e7d32; border-radius: 8px; font-size: 14px;">
              {{ batchMessage }}
            </div>
          </div>

          <!-- Existing Batches -->
          <div class="dashboard-grid">
            <div class="card" *ngFor="let batch of batches">
              <div class="card-header">
                <h3>{{ batch.batch_name }}</h3>
                <span class="status-badge badge-submitted">{{ batch.course_code }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Total Students</span>
                <span class="stat-value">{{ batch.student_ids?.length || 0 }}</span>
              </div>
              <div style="margin-top: 12px;">
                <label style="font-size: 12px; color: #888; text-transform: uppercase; font-weight: 600;">Students</label>
                <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
                  <span *ngFor="let sid of batch.student_ids"
                        style="background: #e3f2fd; color: #1565c0; padding: 4px 10px; border-radius: 16px; font-size: 12px;">
                    {{ sid }}
                  </span>
                </div>
              </div>

              <!-- Add students to existing batch -->
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #f0f0f0;">
                <div style="display: flex; gap: 8px;">
                  <input type="text" [(ngModel)]="addStudentInput[batch._id]" placeholder="Student IDs (comma-separated)"
                         style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 8px; font-size: 13px;">
                  <button class="btn btn-primary btn-sm" (click)="addStudentsToBatch(batch._id)">
                    <i class="fas fa-user-plus"></i> Add
                  </button>
                </div>
              </div>
            </div>

            <div *ngIf="!batches.length" class="card">
              <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>No batches created yet. Create your first batch above.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== ATTENDANCE MANAGEMENT ===== -->
        <div *ngIf="activeSection === 'attendance'">
          <div class="dashboard-header">
            <h1>Attendance Management</h1>
            <p>Mark and view student attendance</p>
          </div>

          <!-- Mark Attendance Form -->
          <div class="card" style="margin-bottom: 24px;">
            <div class="card-header">
              <h3>Mark Batch Attendance</h3>
              <div class="icon icon-blue"><i class="fas fa-clipboard-check"></i></div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label>Select Batch</label>
                <select [(ngModel)]="selectedBatchId" name="batchSelect" (change)="onBatchSelected()">
                  <option value="">-- Select Batch --</option>
                  <option *ngFor="let batch of batches" [value]="batch._id">
                    {{ batch.batch_name }} ({{ batch.course_code }})
                  </option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label>Course Code</label>
                <input type="text" [(ngModel)]="attendanceCourseCode" name="attCourse" readonly>
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label>Date</label>
                <input type="date" [(ngModel)]="attendanceDate" name="attDate">
              </div>
            </div>

            <!-- Student List for Attendance -->
            <div *ngIf="selectedBatchStudents.length">
              <div class="table-container">
                <table>
                  <thead>
                    <tr><th>#</th><th>Student ID</th><th>Present</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let student of selectedBatchStudents; let i = index">
                      <td>{{ i + 1 }}</td>
                      <td>{{ student.id }}</td>
                      <td>
                        <div class="attendance-checkbox">
                          <input type="checkbox" [(ngModel)]="student.present" [name]="'att_' + i">
                        </div>
                      </td>
                      <td>
                        <span class="status-badge" [class.badge-present]="student.present" [class.badge-absent]="!student.present">
                          {{ student.present ? 'Present' : 'Absent' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style="margin-top: 16px; display: flex; gap: 12px;">
                <button class="btn btn-success" (click)="submitBatchAttendance()">
                  <i class="fas fa-check"></i> Submit Attendance
                </button>
                <button class="btn btn-outline" (click)="markAllPresent()">Mark All Present</button>
                <button class="btn btn-outline" (click)="markAllAbsent()">Mark All Absent</button>
              </div>
              <div *ngIf="attendanceMessage" style="margin-top: 12px; padding: 8px; background: #e8f5e9; color: #2e7d32; border-radius: 8px; font-size: 14px;">
                {{ attendanceMessage }}
              </div>
            </div>
          </div>

          <!-- Attendance History -->
          <div class="card">
            <div class="card-header">
              <h3>Attendance History</h3>
              <div class="icon icon-purple"><i class="fas fa-history"></i></div>
            </div>
            <div *ngIf="attendanceHistory.length; else noHistory">
              <div class="table-container">
                <table>
                  <thead>
                    <tr><th>Student ID</th><th>Course</th><th>Date</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let record of attendanceHistory">
                      <td>{{ record.student_id }}</td>
                      <td>{{ record.course_code }}</td>
                      <td>{{ record.date }}</td>
                      <td>
                        <span class="status-badge"
                              [class.badge-present]="record.status === 'present'"
                              [class.badge-absent]="record.status === 'absent'"
                              [class.badge-late]="record.status === 'late'">
                          {{ record.status }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <ng-template #noHistory>
              <div class="empty-state">
                <i class="fas fa-calendar"></i>
                <p>No attendance records yet</p>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- ===== NOTES & LECTURE UPLOAD ===== -->
        <div *ngIf="activeSection === 'notes'">
          <div class="dashboard-header">
            <h1>Upload Notes & Lectures</h1>
            <p>Share study materials with students</p>
          </div>

          <!-- Upload Form -->
          <div class="card" style="margin-bottom: 24px;">
            <div class="card-header">
              <h3>Upload New Material</h3>
              <div class="icon icon-green"><i class="fas fa-cloud-upload-alt"></i></div>
            </div>
            <form (ngSubmit)="uploadNote()">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="form-group">
                  <label>Title</label>
                  <input type="text" [(ngModel)]="newNote.title" name="noteTitle" placeholder="Lecture title" required>
                </div>
                <div class="form-group">
                  <label>Course Code</label>
                  <input type="text" [(ngModel)]="newNote.course_code" name="noteCourse" placeholder="e.g., CS101" required>
                </div>
                <div class="form-group">
                  <label>File URL</label>
                  <input type="text" [(ngModel)]="newNote.file_url" name="noteUrl" placeholder="Link to file/video" required>
                </div>
                <div class="form-group">
                  <label>File Type</label>
                  <select [(ngModel)]="newNote.file_type" name="noteType" required>
                    <option value="pdf">PDF</option>
                    <option value="doc">Document</option>
                    <option value="ppt">Presentation</option>
                    <option value="video">Video Lecture</option>
                  </select>
                </div>
                <div class="form-group" style="grid-column: 1 / -1;">
                  <label>Description</label>
                  <textarea [(ngModel)]="newNote.description" name="noteDesc" rows="3" placeholder="Brief description..."></textarea>
                </div>
              </div>
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-upload"></i> Upload Material
              </button>
            </form>
            <div *ngIf="noteMessage" style="margin-top: 12px; padding: 8px; background: #e8f5e9; color: #2e7d32; border-radius: 8px; font-size: 14px;">
              {{ noteMessage }}
            </div>
          </div>

          <!-- Uploaded Materials -->
          <div class="card">
            <div class="card-header">
              <h3>Uploaded Materials</h3>
              <div class="icon icon-blue"><i class="fas fa-file-alt"></i></div>
            </div>
            <div *ngIf="uploadedNotes.length; else noUploadedNotes">
              <div class="table-container">
                <table>
                  <thead>
                    <tr><th>Title</th><th>Course</th><th>Type</th><th>Date</th><th>Preview</th></tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let note of uploadedNotes">
                      <td><strong>{{ note.title }}</strong><br><small style="color: #999;">{{ note.description }}</small></td>
                      <td>{{ note.course_code }}</td>
                      <td><span class="status-badge badge-submitted">{{ note.file_type | uppercase }}</span></td>
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
            <ng-template #noUploadedNotes>
              <div class="empty-state">
                <i class="fas fa-upload"></i>
                <p>No materials uploaded yet</p>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- ===== STUDENT NOTES REVIEW ===== -->
        <div *ngIf="activeSection === 'student-notes'">
          <div class="dashboard-header">
            <h1>Student Notes Review</h1>
            <p>Review and verify student-submitted notes</p>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Submitted Notes ({{ studentSubmissions.length }})</h3>
              <div class="icon icon-orange"><i class="fas fa-file-alt"></i></div>
            </div>
            <div *ngIf="studentSubmissions.length; else noSubmissions">
              <div class="table-container">
                <table>
                  <thead>
                    <tr><th>Student</th><th>Title</th><th>Course</th><th>Type</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let sub of studentSubmissions">
                      <td>{{ sub.student_id }}</td>
                      <td><strong>{{ sub.title }}</strong><br><small style="color: #999;">{{ sub.description }}</small></td>
                      <td>{{ sub.course_code }}</td>
                      <td><span class="status-badge badge-submitted">{{ sub.file_type | uppercase }}</span></td>
                      <td>
                        <span class="status-badge"
                              [class.badge-submitted]="sub.status === 'submitted'"
                              [class.badge-reviewed]="sub.status === 'reviewed'"
                              [class.badge-verified]="sub.status === 'verified'"
                              [class.badge-rejected]="sub.status === 'rejected'">
                          {{ sub.status }}
                        </span>
                      </td>
                      <td>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                          <a [href]="sub.file_url" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
                            <i class="fas fa-eye"></i>
                          </a>
                          <button class="btn btn-success btn-sm" (click)="reviewNote(sub._id, 'verified')" [disabled]="sub.status === 'verified'">
                            <i class="fas fa-check"></i>
                          </button>
                          <button class="btn btn-danger btn-sm" (click)="reviewNote(sub._id, 'rejected')" [disabled]="sub.status === 'rejected'">
                            <i class="fas fa-times"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <ng-template #noSubmissions>
              <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>No student submissions to review</p>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- ===== MANAGE RESULTS ===== -->
        <div *ngIf="activeSection === 'results'">
          <div class="dashboard-header">
            <h1>Manage Exam Results</h1>
            <p>Add and manage student exam results</p>
          </div>

          <div class="card" style="margin-bottom: 24px;">
            <div class="card-header">
              <h3>Add Exam Result</h3>
              <div class="icon icon-purple"><i class="fas fa-plus"></i></div>
            </div>
            <form (ngSubmit)="addResult()">
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                <div class="form-group">
                  <label>Student ID</label>
                  <input type="text" [(ngModel)]="newResult.student_id" name="resStudentId" placeholder="e.g., student1" required>
                </div>
                <div class="form-group">
                  <label>Course Code</label>
                  <input type="text" [(ngModel)]="newResult.course_code" name="resCourse" placeholder="e.g., CS101" required>
                </div>
                <div class="form-group">
                  <label>Exam Type</label>
                  <select [(ngModel)]="newResult.exam_type" name="resType" required>
                    <option value="midterm">Midterm</option>
                    <option value="final">Final</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Marks Obtained</label>
                  <input type="number" [(ngModel)]="newResult.marks_obtained" name="resMarks" placeholder="e.g., 85" required>
                </div>
                <div class="form-group">
                  <label>Total Marks</label>
                  <input type="number" [(ngModel)]="newResult.total_marks" name="resTotal" placeholder="e.g., 100" required>
                </div>
                <div class="form-group">
                  <label>Semester</label>
                  <input type="text" [(ngModel)]="newResult.semester" name="resSemester" placeholder="e.g., Fall 2025" required>
                </div>
              </div>
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-plus"></i> Add Result
              </button>
            </form>
            <div *ngIf="resultMessage" style="margin-top: 12px; padding: 8px; background: #e8f5e9; color: #2e7d32; border-radius: 8px; font-size: 14px;">
              {{ resultMessage }}
            </div>
          </div>
        </div>

        </div>
      </main>
    </div>
  `
})
export class TeacherDashboardComponent implements OnInit {
  activeSection = 'overview';
  user: any;

  // Batch Management
  batches: any[] = [];
  newBatch = { batch_name: '', course_code: '', student_ids_str: '' };
  batchMessage = '';
  addStudentInput: Record<string, string> = {};

  // Attendance
  selectedBatchId = '';
  attendanceCourseCode = '';
  attendanceDate = '';
  selectedBatchStudents: { id: string; present: boolean }[] = [];
  attendanceMessage = '';
  attendanceHistory: any[] = [];

  // Notes
  uploadedNotes: any[] = [];
  newNote = { title: '', description: '', course_code: '', file_url: '', file_type: 'pdf' };
  noteMessage = '';

  // Student Submissions
  studentSubmissions: any[] = [];

  // Results
  newResult = { student_id: '', course_code: '', exam_type: 'midterm', marks_obtained: 0, total_marks: 100, semester: '' };
  resultMessage = '';

  constructor(
    private authService: AuthService,
    private academicsService: AcademicsService,
    private router: Router,
    private navService: NavigationService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.loadAllData();
    this.navService.setLastVisited('/teacher');
    this.navService.addBreadcrumb('Teacher Dashboard');
  }

  /** Programmatic navigation to profile using Router service */
  goToProfile(): void {
    this.router.navigate(['/profile', this.user?.username]);
  }

  loadAllData(): void {
    this.academicsService.getBatches().subscribe({
      next: (data: any) => this.batches = data,
      error: () => this.batches = []
    });

    this.academicsService.getNotes().subscribe({
      next: (data: any) => this.uploadedNotes = data,
      error: () => this.uploadedNotes = []
    });

    this.academicsService.getStudentSubmissions().subscribe({
      next: (data: any) => this.studentSubmissions = data,
      error: () => this.studentSubmissions = []
    });

    this.academicsService.getAttendance().subscribe({
      next: (data: any) => this.attendanceHistory = data,
      error: () => this.attendanceHistory = []
    });
  }

  getSectionTitle(): string {
    const titles: Record<string, string> = {
      overview: 'Teacher Dashboard',
      batches: 'Batch Management',
      attendance: 'Attendance Management',
      notes: 'Notes & Lecture Upload',
      'student-notes': 'Student Notes Review',
      results: 'Manage Results'
    };
    return titles[this.activeSection] || 'Dashboard';
  }

  getInitials(): string {
    if (!this.user?.full_name) return '?';
    return this.user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
  }

  // --- Batch Management ---
  createBatch(): void {
    const studentIds = this.newBatch.student_ids_str
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    this.academicsService.createBatch({
      batch_name: this.newBatch.batch_name,
      course_code: this.newBatch.course_code,
      student_ids: studentIds
    }).subscribe({
      next: () => {
        this.batchMessage = 'Batch created successfully!';
        this.newBatch = { batch_name: '', course_code: '', student_ids_str: '' };
        this.loadAllData();
        setTimeout(() => this.batchMessage = '', 3000);
      },
      error: (err: any) => this.batchMessage = err.error?.error || 'Failed to create batch'
    });
  }

  addStudentsToBatch(batchId: string): void {
    const input = this.addStudentInput[batchId] || '';
    const studentIds = input.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (!studentIds.length) return;

    this.academicsService.addStudentsToBatch(batchId, studentIds).subscribe({
      next: () => {
        this.addStudentInput[batchId] = '';
        this.loadAllData();
      }
    });
  }

  // --- Attendance ---
  onBatchSelected(): void {
    const batch = this.batches.find(b => b._id === this.selectedBatchId);
    if (batch) {
      this.attendanceCourseCode = batch.course_code;
      this.selectedBatchStudents = batch.student_ids.map((id: string) => ({ id, present: true }));
    } else {
      this.selectedBatchStudents = [];
      this.attendanceCourseCode = '';
    }
  }

  markAllPresent(): void {
    this.selectedBatchStudents.forEach(s => s.present = true);
  }

  markAllAbsent(): void {
    this.selectedBatchStudents.forEach(s => s.present = false);
  }

  submitBatchAttendance(): void {
    if (!this.selectedBatchId || !this.attendanceDate) return;

    const records = this.selectedBatchStudents.map(s => ({
      student_id: s.id,
      status: s.present ? 'present' : 'absent'
    }));

    this.academicsService.markBatchAttendance({
      batch_id: this.selectedBatchId,
      course_code: this.attendanceCourseCode,
      date: this.attendanceDate,
      records
    }).subscribe({
      next: () => {
        this.attendanceMessage = `Attendance marked for ${records.length} students!`;
        this.loadAllData();
        setTimeout(() => this.attendanceMessage = '', 3000);
      },
      error: (err: any) => this.attendanceMessage = err.error?.error || 'Failed to mark attendance'
    });
  }

  // --- Notes Upload ---
  uploadNote(): void {
    this.academicsService.uploadNote(this.newNote).subscribe({
      next: () => {
        this.noteMessage = 'Material uploaded successfully!';
        this.newNote = { title: '', description: '', course_code: '', file_url: '', file_type: 'pdf' };
        this.loadAllData();
        setTimeout(() => this.noteMessage = '', 3000);
      },
      error: (err: any) => this.noteMessage = err.error?.error || 'Failed to upload'
    });
  }

  // --- Student Notes Review ---
  reviewNote(noteId: string, status: string): void {
    this.academicsService.reviewStudentNote(noteId, {
      status,
      review_comment: status === 'verified' ? 'Approved by teacher' : 'Needs improvement'
    }).subscribe({
      next: () => this.loadAllData()
    });
  }

  // --- Results ---
  addResult(): void {
    this.academicsService.createResult(this.newResult).subscribe({
      next: () => {
        this.resultMessage = 'Result added successfully!';
        this.newResult = { student_id: '', course_code: '', exam_type: 'midterm', marks_obtained: 0, total_marks: 100, semester: '' };
        setTimeout(() => this.resultMessage = '', 3000);
      },
      error: (err: any) => this.resultMessage = err.error?.error || 'Failed to add result'
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
