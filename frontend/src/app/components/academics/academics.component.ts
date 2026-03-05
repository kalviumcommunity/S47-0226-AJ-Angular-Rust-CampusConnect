import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AcademicsService } from '../../services/academics.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-academics',
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
          <li><a routerLink="/academics" class="active">Academics</a></li>
          <li><a routerLink="/finance">Finance</a></li>
          <li><a routerLink="/hostel">Hostel</a></li>
          <li><a routerLink="/library">Library</a></li>
          <li><a routerLink="/hr">HR</a></li>
        </ul>
      </nav>

      <div class="container">
        <h1>📘 Academics Module</h1>

        <div class="card">
          <div class="card-header">Create New Course</div>
          <form [formGroup]="courseForm" (ngSubmit)="createCourse()">
            <div class="form-group">
              <label>Course Code</label>
              <input type="text" formControlName="course_code" placeholder="e.g., CS101" />
            </div>
            <div class="form-group">
              <label>Course Name</label>
              <input type="text" formControlName="course_name" placeholder="e.g., Introduction to Programming" />
            </div>
            <div class="form-group">
              <label>Credits</label>
              <input type="number" formControlName="credits" placeholder="e.g., 3" />
            </div>
            <div class="form-group">
              <label>Department</label>
              <input type="text" formControlName="department" placeholder="e.g., Computer Science" />
            </div>
            <button type="submit" [disabled]="courseForm.invalid">Add Course</button>
          </form>
        </div>

        <div class="card">
          <div class="card-header">All Courses</div>
          <div *ngIf="loading" class="spinner"></div>
          <table *ngIf="!loading && courses.length > 0">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Credits</th>
                <th>Department</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let course of courses">
                <td>{{ course.course_code }}</td>
                <td>{{ course.course_name }}</td>
                <td>{{ course.credits }}</td>
                <td>{{ course.department }}</td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="!loading && courses.length === 0">No courses found.</p>
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
export class AcademicsComponent implements OnInit {
  courses: any[] = [];
  courseForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private academicsService: AcademicsService,
    private authService: AuthService
  ) {
    this.courseForm = this.fb.group({
      course_code: ['', Validators.required],
      course_name: ['', Validators.required],
      credits: [0, [Validators.required, Validators.min(1)]],
      department: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.loading = true;
    this.academicsService.getCourses().subscribe({
      next: (data) => {
        this.courses = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.loading = false;
      }
    });
  }

  createCourse(): void {
    if (this.courseForm.valid) {
      this.academicsService.createCourse(this.courseForm.value).subscribe({
        next: () => {
          alert('Course created successfully!');
          this.courseForm.reset();
          this.loadCourses();
        },
        error: (error) => console.error('Error creating course:', error)
      });
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
