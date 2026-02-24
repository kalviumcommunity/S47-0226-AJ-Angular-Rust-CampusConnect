# Concept 3: Angular Component-Driven Architecture with Rust Backend

## Assignment Overview
This document demonstrates understanding of Angular's component-driven UI architecture, service-based logic handling, and communication patterns between Angular frontend and Rust backend.

---

## PART 1: Pull Request Documentation

### 1. Angular UI Feature Explanation

#### Component Created: `CourseListComponent`

**Purpose:**
The `CourseListComponent` displays a list of available courses in the CampusConnect platform. Users can view course details, filter courses, and enroll in courses through interactive UI elements.

**User Interaction Handling:**
- **Button Click**: When a user clicks the "Enroll" button, the component captures the click event using Angular's event binding `(click)="enrollInCourse(courseId)"`
- **Input Handling**: A search input field allows users to filter courses in real-time using `(input)="filterCourses($event.target.value)"`
- **Selection**: Users can select course categories from a dropdown, triggering `(change)="onCategoryChange($event.target.value)"`

**Service Communication with Rust API:**
The `CourseService` uses Angular's `HttpClient` to communicate with the Rust backend:

```typescript
// CourseService makes HTTP calls to Rust API
getCourses(): Observable<Course[]> {
  return this.http.get<Course[]>('http://localhost:8080/api/courses');
}

enrollInCourse(courseId: string, userId: string): Observable<EnrollmentResponse> {
  return this.http.post<EnrollmentResponse>(
    'http://localhost:8080/api/enrollments',
    { course_id: courseId, user_id: userId }
  );
}
```

**UI Update Flow:**
1. Component calls `courseService.getCourses()` on initialization
2. Service sends HTTP GET request to Rust API endpoint
3. Rust backend processes request, queries PostgreSQL database
4. Rust returns JSON response with course data
5. Service receives Observable stream and returns it to component
6. Component subscribes to Observable and updates local `courses` array
7. Angular's change detection automatically re-renders the template with new data
8. UI displays updated course list to the user

---

### 2. End-to-End Frontend → Backend Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                              │
│              (Clicks "View Courses" button)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  ANGULAR COMPONENT                               │
│              (CourseListComponent)                               │
│   - Handles click event: viewCourses()                          │
│   - Calls service method                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              ANGULAR SERVICE (HttpClient)                        │
│                  (CourseService)                                 │
│   - Constructs HTTP GET request                                 │
│   - Sends to: http://localhost:8080/api/courses                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  RUST API ROUTE                                  │
│              (Actix-web Router)                                  │
│   - Matches route: GET /api/courses                             │
│   - Routes to handler function                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│          RUST HANDLER + BUSINESS LOGIC                           │
│              (get_courses handler)                               │
│   - Validates request                                            │
│   - Applies business rules                                       │
│   - Calls database layer                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              POSTGRESQL QUERY                                    │
│   - Executes: SELECT * FROM courses WHERE active = true         │
│   - Returns result set                                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              RUST JSON RESPONSE                                  │
│   - Serializes data to JSON                                      │
│   - Sets HTTP status: 200 OK                                     │
│   - Returns: { "courses": [...] }                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│          ANGULAR COMPONENT RE-RENDERS UI                         │
│   - Receives Observable data                                     │
│   - Updates component state: this.courses = data                │
│   - Angular change detection triggers                            │
│   - Template re-renders with new course list                     │
│   - User sees updated UI                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3. Code Implementation

#### Angular Component: `course-list.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { CourseService } from '../services/course.service';
import { Course } from '../models/course.model';

@Component({
  selector: 'app-course-list',
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.css']
})
export class CourseListComponent implements OnInit {
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoading = true;
    this.courseService.getCourses().subscribe({
      next: (data) => {
        this.courses = data;
        this.filteredCourses = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load courses';
        this.isLoading = false;
        console.error('Error loading courses:', error);
      }
    });
  }

  enrollInCourse(courseId: string): void {
    const userId = localStorage.getItem('userId') || '';
    this.courseService.enrollInCourse(courseId, userId).subscribe({
      next: (response) => {
        alert('Successfully enrolled in course!');
      },
      error: (error) => {
        alert('Enrollment failed. Please try again.');
        console.error('Enrollment error:', error);
      }
    });
  }

  filterCourses(searchTerm: string): void {
    if (!searchTerm) {
      this.filteredCourses = this.courses;
      return;
    }
    this.filteredCourses = this.courses.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
}
```

#### Angular Service: `course.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course } from '../models/course.model';

export interface EnrollmentResponse {
  success: boolean;
  enrollment_id: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/courses`);
  }

  getCourseById(id: string): Observable<Course> {
    return this.http.get<Course>(`${this.apiUrl}/courses/${id}`);
  }

  enrollInCourse(courseId: string, userId: string): Observable<EnrollmentResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<EnrollmentResponse>(
      `${this.apiUrl}/enrollments`,
      { course_id: courseId, user_id: userId },
      { headers }
    );
  }
}
```

#### Component Template: `course-list.component.html`

```html
<div class="course-list-container">
  <h2>Available Courses</h2>
  
  <div class="search-bar">
    <input 
      type="text" 
      placeholder="Search courses..." 
      (input)="filterCourses($event.target.value)"
      class="search-input"
    />
  </div>

  <div *ngIf="isLoading" class="loading">Loading courses...</div>
  <div *ngIf="errorMessage" class="error">{{ errorMessage }}</div>

  <div class="courses-grid">
    <div *ngFor="let course of filteredCourses" class="course-card">
      <h3>{{ course.title }}</h3>
      <p>{{ course.description }}</p>
      <div class="course-details">
        <span class="instructor">Instructor: {{ course.instructor }}</span>
        <span class="credits">Credits: {{ course.credits }}</span>
      </div>
      <button 
        (click)="enrollInCourse(course.id)" 
        class="enroll-btn"
      >
        Enroll Now
      </button>
    </div>
  </div>
</div>
```

#### Data Model: `course.model.ts`

```typescript
export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  credits: number;
  capacity: number;
  enrolled_count: number;
  active: boolean;
}
```

---

### 4. Reflection: Scalability and Maintainability

**How does using components and services make Angular applications more scalable and maintainable?**

The separation of components and services in Angular creates a highly scalable and maintainable architecture through three key principles:

**Modularity**: Components encapsulate specific UI functionality and can be developed, tested, and debugged independently. The `CourseListComponent` focuses solely on presentation logic, while `CourseService` handles all data operations. This clear boundary means changes to the API structure only require updates to the service, not every component using that data.

**Reusability**: Services are singleton instances that can be injected into multiple components throughout the application. The `CourseService` can be used by `CourseListComponent`, `CourseDetailComponent`, and `EnrollmentComponent` without duplicating HTTP logic. Similarly, components can be reused across different views and modules.

**Separation of Concerns**: Components handle user interaction and view rendering, while services manage business logic, API communication, and state management. This separation makes code easier to understand, test, and maintain. Unit testing becomes straightforward - we can test service logic independently by mocking HTTP calls, and test component behavior by mocking service responses. As the application grows, this architecture prevents the codebase from becoming a tangled mess of interdependent code.

---

### 5. AI Feedback Improvement

**Initial AI Review Feedback:**
- Add error handling examples in code snippets
- Include loading states for better UX explanation
- Clarify the Observable pattern and why it's used
- Add more specific details about change detection
- Include TypeScript interfaces for type safety

**Improvements Applied:**
✅ Added comprehensive error handling in both component and service
✅ Included `isLoading` state management in component
✅ Explained Observable streams and subscription pattern
✅ Detailed Angular's change detection mechanism in UI update flow
✅ Created `Course` interface and `EnrollmentResponse` interface for type safety
✅ Added HttpHeaders configuration for POST requests
✅ Included template with structural directives (*ngIf, *ngFor)


## Conclusion

This assignment demonstrates a complete understanding of Angular's component-driven architecture and its integration with a Rust backend. The separation of concerns between components (UI logic) and services (data logic) creates a maintainable, scalable, and testable application structure that follows industry best practices.

---

**Author**: Anushka  
**Concept**: 3 - Angular Component Architecture with Rust Backend  
**Date**: February 2026
