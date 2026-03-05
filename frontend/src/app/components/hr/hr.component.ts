import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HrService } from '../../services/hr.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-hr',
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
          <li><a routerLink="/library">Library</a></li>
          <li><a routerLink="/hr" class="active">HR</a></li>
        </ul>
      </nav>

      <div class="container">
        <h1>👥 HR Module</h1>

        <div class="card">
          <div class="card-header">Add Faculty</div>
          <form [formGroup]="facultyForm" (ngSubmit)="addFaculty()">
            <div class="form-group">
              <label>Employee ID</label>
              <input type="text" formControlName="employee_id" placeholder="e.g., EMP001" />
            </div>
            <div class="form-group">
              <label>Name</label>
              <input type="text" formControlName="name" placeholder="e.g., Dr. John Smith" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" formControlName="email" placeholder="e.g., john@campus.edu" />
            </div>
            <div class="form-group">
              <label>Department</label>
              <input type="text" formControlName="department" placeholder="e.g., Computer Science" />
            </div>
            <div class="form-group">
              <label>Designation</label>
              <input type="text" formControlName="designation" placeholder="e.g., Professor" />
            </div>
            <div class="form-group">
              <label>Joining Date</label>
              <input type="date" formControlName="joining_date" />
            </div>
            <div class="form-group">
              <label>Salary</label>
              <input type="number" formControlName="salary" placeholder="e.g., 75000" />
            </div>
            <button type="submit" [disabled]="facultyForm.invalid">Add Faculty</button>
          </form>
        </div>

        <div class="card">
          <div class="card-header">Faculty Members</div>
          <div *ngIf="loading" class="spinner"></div>
          <table *ngIf="!loading && faculty.length > 0">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let member of faculty">
                <td>{{ member.employee_id }}</td>
                <td>{{ member.name }}</td>
                <td>{{ member.department }}</td>
                <td>{{ member.designation }}</td>
                <td>{{ member.email }}</td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="!loading && faculty.length === 0">No faculty members found.</p>
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
export class HrComponent implements OnInit {
  faculty: any[] = [];
  facultyForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private hrService: HrService,
    private authService: AuthService
  ) {
    this.facultyForm = this.fb.group({
      employee_id: ['', Validators.required],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      department: ['', Validators.required],
      designation: ['', Validators.required],
      joining_date: ['', Validators.required],
      salary: [0, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadFaculty();
  }

  loadFaculty(): void {
    this.loading = true;
    this.hrService.getFaculty().subscribe({
      next: (data) => {
        this.faculty = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading faculty:', error);
        this.loading = false;
      }
    });
  }

  addFaculty(): void {
    if (this.facultyForm.valid) {
      this.hrService.addFaculty(this.facultyForm.value).subscribe({
        next: () => {
          alert('Faculty added successfully!');
          this.facultyForm.reset();
          this.loadFaculty();
        },
        error: (error) => console.error('Error adding faculty:', error)
      });
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
