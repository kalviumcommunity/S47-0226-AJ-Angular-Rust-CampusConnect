import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FinanceService } from '../services/finance.service';

@Component({
  selector: 'app-hr-dashboard',
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

/* STATS GRID */

.stats-grid{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
gap:18px;
}

/* STAT CARD */

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
font-size:26px;
font-weight:bold;
margin-top:10px;
}

/* PROGRESS BAR */

.progress-bar{
width:100%;
height:8px;
background:#e5e7eb;
border-radius:6px;
margin-top:8px;
overflow:hidden;
}

.progress-fill{
height:100%;
border-radius:6px;
transition:width .4s ease;
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

.badge-default{
background:#e5e7eb;
color:#444;
}

/* BUTTONS */

.btn{
border:none;
padding:10px 16px;
border-radius:8px;
cursor:pointer;
font-size:14px;
transition:.2s;
}

.btn-primary{
background:#2563eb;
color:white;
}

.btn-primary:hover{
background:#1e4fd8;
}

.btn-secondary{
background:#475569;
color:white;
}

.btn-secondary:hover{
background:#334155;
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

.form-group input:focus,
.form-group select:focus{
outline:none;
border-color:#2563eb;
}

/* ERROR */

.error-message{
background:#ffebee;
color:#c62828;
padding:10px;
border-radius:8px;
margin-bottom:14px;
}

/* RESPONSIVE */

@media(max-width:900px){

.sidebar{
display:none;
}

.main-content{
padding:18px;
}

}
`],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h2>CampusConnect</h2>
          <p>HR Dashboard</p>
        </div>
        <nav class="sidebar-nav">
          <a (click)="activeSection = 'overview'" [class.active]="activeSection === 'overview'">
            <span>Overview</span>
          </a>
          <a (click)="activeSection = 'paid'" [class.active]="activeSection === 'paid'">
            <span>Paid Students</span>
          </a>
          <a (click)="activeSection = 'unpaid'" [class.active]="activeSection === 'unpaid'">
            <span>Unpaid Students</span>
          </a>
          <a (click)="activeSection = 'hostellers'" [class.active]="activeSection === 'hostellers'">
            <span>Hostellers</span>
          </a>
          <a (click)="activeSection = 'dayscholars'" [class.active]="activeSection === 'dayscholars'">
            <span>Day Scholars</span>
          </a>
          <a (click)="activeSection = 'addfee'" [class.active]="activeSection === 'addfee'">
            <span>Add Fee Record</span>
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
          <h1>Fee Management Overview</h1>
          <div class="stats-grid" *ngIf="summary">
            <div class="stat-card">
              <h3>Total Fees</h3>
              <p class="stat-number">\${{ summary.total_fees | number:'1.2-2' }}</p>
            </div>
            <div class="stat-card">
              <h3>Total Collected</h3>
              <p class="stat-number" style="color: #4caf50">\${{ summary.total_paid | number:'1.2-2' }}</p>
            </div>
            <div class="stat-card">
              <h3>Total Pending</h3>
              <p class="stat-number" style="color: #f44336">\${{ summary.total_pending | number:'1.2-2' }}</p>
            </div>
            <div class="stat-card">
              <h3>Collection Rate</h3>
              <p class="stat-number" style="color: #1976d2">{{ summary.collection_rate | number:'1.1-1' }}%</p>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="summary.collection_rate"
                     [style.backgroundColor]="summary.collection_rate >= 75 ? '#4caf50' : summary.collection_rate >= 50 ? '#ff9800' : '#f44336'"></div>
              </div>
            </div>
          </div>

          <!-- Category Breakdown -->
          <div class="card" *ngIf="summary" style="margin-top: 24px">
            <h2>Fee Category Breakdown</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <h3>Tuition Fees</h3>
                <p class="stat-number">\${{ summary.category_breakdown?.tuition | number:'1.2-2' }}</p>
              </div>
              <div class="stat-card">
                <h3>Hostel Fees</h3>
                <p class="stat-number">\${{ summary.category_breakdown?.hostel | number:'1.2-2' }}</p>
              </div>
              <div class="stat-card">
                <h3>Library Fees</h3>
                <p class="stat-number">\${{ summary.category_breakdown?.library | number:'1.2-2' }}</p>
              </div>
              <div class="stat-card">
                <h3>Miscellaneous</h3>
                <p class="stat-number">\${{ summary.category_breakdown?.misc | number:'1.2-2' }}</p>
              </div>
            </div>
          </div>

          <!-- Student Counts -->
          <div class="card" *ngIf="summary" style="margin-top: 24px">
            <h2>Student Statistics</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <h3>Total Students</h3>
                <p class="stat-number">{{ summary.student_counts?.total }}</p>
              </div>
              <div class="stat-card">
                <h3>Hostellers</h3>
                <p class="stat-number" style="color: #9c27b0">{{ summary.student_counts?.hostellers }}</p>
              </div>
              <div class="stat-card">
                <h3>Day Scholars</h3>
                <p class="stat-number" style="color: #00bcd4">{{ summary.student_counts?.day_scholars }}</p>
              </div>
              <div class="stat-card">
                <h3>Fully Paid</h3>
                <p class="stat-number" style="color: #4caf50">{{ summary.student_counts?.fully_paid }}</p>
              </div>
              <div class="stat-card">
                <h3>Partially Paid</h3>
                <p class="stat-number" style="color: #ff9800">{{ summary.student_counts?.partially_paid }}</p>
              </div>
              <div class="stat-card">
                <h3>Unpaid</h3>
                <p class="stat-number" style="color: #f44336">{{ summary.student_counts?.unpaid }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- PAID STUDENTS -->
        <section *ngIf="activeSection === 'paid'">
          <h1>Paid Students</h1>
          <p class="section-desc">Students who have fully paid all their fees</p>
          <div *ngIf="paidStudents.length === 0" class="card">
            <p style="color: #666; text-align: center; padding: 20px;">No fully paid students found.</p>
          </div>
          <div class="table-container" *ngIf="paidStudents.length > 0">
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Type</th>
                  <th>Total Fees</th>
                  <th>Total Paid</th>
                  <th>College Fees</th>
                  <th>Hostel Fees</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of paidStudents">
                  <td><strong>{{ s.student_id }}</strong></td>
                  <td><span class="badge" [class.badge-info]="s.is_hosteller" [class.badge-default]="!s.is_hosteller">
                    {{ s.is_hosteller ? 'Hosteller' : 'Day Scholar' }}
                  </span></td>
                  <td>\${{ s.total_fees | number:'1.2-2' }}</td>
                  <td>\${{ s.total_paid | number:'1.2-2' }}</td>
                  <td>\${{ s.college_fees?.total | number:'1.2-2' }}</td>
                  <td>\${{ s.hostel_fees?.total | number:'1.2-2' }}</td>
                  <td><span class="badge badge-success">Paid</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- UNPAID STUDENTS -->
        <section *ngIf="activeSection === 'unpaid'">
          <h1>Unpaid / Partially Paid Students</h1>
          <p class="section-desc">Students with outstanding fee balances</p>
          <div *ngIf="unpaidStudents.length === 0" class="card">
            <p style="color: #666; text-align: center; padding: 20px;">No unpaid students found.</p>
          </div>
          <div class="table-container" *ngIf="unpaidStudents.length > 0">
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Type</th>
                  <th>Total Fees</th>
                  <th>Paid</th>
                  <th>Pending</th>
                  <th>College Pending</th>
                  <th>Hostel Pending</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of unpaidStudents">
                  <td><strong>{{ s.student_id }}</strong></td>
                  <td><span class="badge" [class.badge-info]="s.is_hosteller" [class.badge-default]="!s.is_hosteller">
                    {{ s.is_hosteller ? 'Hosteller' : 'Day Scholar' }}
                  </span></td>
                  <td>\${{ s.total_fees | number:'1.2-2' }}</td>
                  <td>\${{ s.total_paid | number:'1.2-2' }}</td>
                  <td style="color: #f44336; font-weight: 600">\${{ s.total_pending | number:'1.2-2' }}</td>
                  <td>\${{ s.college_fees?.pending | number:'1.2-2' }}</td>
                  <td>\${{ s.hostel_fees?.pending | number:'1.2-2' }}</td>
                  <td>
                    <span class="badge" [class.badge-warning]="s.fee_status === 'partial'" [class.badge-danger]="s.fee_status === 'unpaid'">
                      {{ s.fee_status === 'partial' ? 'Partial' : 'Unpaid' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- HOSTELLERS -->
        <section *ngIf="activeSection === 'hostellers'">
          <h1>Hosteller Fee Records</h1>
          <p class="section-desc">Fee details for all hostel-residing students</p>
          <div *ngIf="hostellerStudents.length === 0" class="card">
            <p style="color: #666; text-align: center; padding: 20px;">No hosteller records found.</p>
          </div>
          <div class="table-container" *ngIf="hostellerStudents.length > 0">
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>College Fees</th>
                  <th>College Paid</th>
                  <th>Hostel Fees</th>
                  <th>Hostel Paid</th>
                  <th>Total Pending</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of hostellerStudents">
                  <td><strong>{{ s.student_id }}</strong></td>
                  <td>\${{ s.college_fees?.total | number:'1.2-2' }}</td>
                  <td>\${{ s.college_fees?.paid | number:'1.2-2' }}</td>
                  <td>\${{ s.hostel_fees?.total | number:'1.2-2' }}</td>
                  <td>\${{ s.hostel_fees?.paid | number:'1.2-2' }}</td>
                  <td style="color: #f44336; font-weight:600">\${{ s.total_pending | number:'1.2-2' }}</td>
                  <td>
                    <span class="badge" [class.badge-success]="s.fee_status === 'paid'"
                          [class.badge-warning]="s.fee_status === 'partial'"
                          [class.badge-danger]="s.fee_status === 'unpaid'">
                      {{ s.fee_status === 'paid' ? 'Paid' : s.fee_status === 'partial' ? 'Partial' : 'Unpaid' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- DAY SCHOLARS -->
        <section *ngIf="activeSection === 'dayscholars'">
          <h1>Day Scholar Fee Records</h1>
          <p class="section-desc">Fee details for all day scholar students</p>
          <div *ngIf="dayScholarStudents.length === 0" class="card">
            <p style="color: #666; text-align: center; padding: 20px;">No day scholar records found.</p>
          </div>
          <div class="table-container" *ngIf="dayScholarStudents.length > 0">
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Total Fees</th>
                  <th>Amount Paid</th>
                  <th>Pending</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of dayScholarStudents">
                  <td><strong>{{ s.student_id }}</strong></td>
                  <td>\${{ s.total_fees | number:'1.2-2' }}</td>
                  <td>\${{ s.total_paid | number:'1.2-2' }}</td>
                  <td style="color: #f44336; font-weight:600">\${{ s.total_pending | number:'1.2-2' }}</td>
                  <td>
                    <span class="badge" [class.badge-success]="s.fee_status === 'paid'"
                          [class.badge-warning]="s.fee_status === 'partial'"
                          [class.badge-danger]="s.fee_status === 'unpaid'">
                      {{ s.fee_status === 'paid' ? 'Paid' : s.fee_status === 'partial' ? 'Partial' : 'Unpaid' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ADD FEE RECORD -->
        <section *ngIf="activeSection === 'addfee'">
          <h1>Add Fee Record</h1>
          <div class="card" style="max-width: 600px">
            <div *ngIf="feeSuccess" style="background: #e8f5e9; color: #2e7d32; padding: 10px; border-radius: 8px; margin-bottom: 16px;">
              {{ feeSuccess }}
            </div>
            <div *ngIf="feeError" class="error-message">{{ feeError }}</div>
            <form (ngSubmit)="addFee()">
              <div class="form-group">
                <label>Student ID</label>
                <input type="text" [(ngModel)]="newFee.student_id" name="student_id" required placeholder="Enter student ID">
              </div>
              <div class="form-group">
                <label>Fee Type</label>
                <select [(ngModel)]="newFee.fee_type" name="fee_type" required>
                  <option value="tuition">Tuition</option>
                  <option value="hostel">Hostel</option>
                  <option value="library">Library</option>
                  <option value="misc">Miscellaneous</option>
                </select>
              </div>
              <div class="form-group">
                <label>Amount ($)</label>
                <input type="number" [(ngModel)]="newFee.amount" name="amount" required min="0" step="0.01">
              </div>
              <div class="form-group">
                <label>Due Date</label>
                <input type="date" [(ngModel)]="newFee.due_date" name="due_date" required>
              </div>
              <button type="submit" class="btn btn-primary">Add Fee</button>
            </form>
          </div>
        </section>
      </main>
    </div>
  `
})
export class HrDashboardComponent implements OnInit {
  activeSection = 'overview';
  summary: any = null;
  allStudents: any[] = [];
  paidStudents: any[] = [];
  unpaidStudents: any[] = [];
  hostellerStudents: any[] = [];
  dayScholarStudents: any[] = [];

  newFee = { student_id: '', fee_type: 'tuition', amount: 0, due_date: '' };
  feeSuccess = '';
  feeError = '';

  constructor(
    private authService: AuthService,
    private financeService: FinanceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSummary();
    this.loadStudentFees();
  }

  loadSummary(): void {
    this.financeService.getHrFeeSummary().subscribe({
      next: (data: any) => this.summary = data,
      error: () => {}
    });
  }

  loadStudentFees(): void {
    this.financeService.getHrStudentFees().subscribe({
      next: (data: any) => {
        this.allStudents = data.students || [];
        this.paidStudents = this.allStudents.filter((s: any) => s.fee_status === 'paid');
        this.unpaidStudents = this.allStudents.filter((s: any) => s.fee_status !== 'paid');
        this.hostellerStudents = this.allStudents.filter((s: any) => s.is_hosteller);
        this.dayScholarStudents = this.allStudents.filter((s: any) => !s.is_hosteller);
      },
      error: () => {}
    });
  }

  addFee(): void {
    this.feeSuccess = '';
    this.feeError = '';
    this.financeService.createFee(this.newFee).subscribe({
      next: () => {
        this.feeSuccess = 'Fee record added successfully!';
        this.newFee = { student_id: '', fee_type: 'tuition', amount: 0, due_date: '' };
        this.loadSummary();
        this.loadStudentFees();
      },
      error: (err: any) => {
        this.feeError = err.error?.error || 'Failed to add fee record.';
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
