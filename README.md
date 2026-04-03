

# 🏫 CampusConnect

### Enterprise Microservices-Based Campus ERP

Built with **Angular + Rust + MongoDB**

---

![Angular](https://img.shields.io/badge/Frontend-Angular-red?style=for-the-badge\&logo=angular)
![Rust](https://img.shields.io/badge/Backend-Rust-orange?style=for-the-badge\&logo=rust)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green?style=for-the-badge\&logo=mongodb)
![Architecture](https://img.shields.io/badge/Architecture-Microservices-blue?style=for-the-badge)
![Auth](https://img.shields.io/badge/Auth-JWT-black?style=for-the-badge)
![License](https://img.shields.io/badge/License-Academic-lightgrey?style=for-the-badge)

---

## 📌 Overview

**CampusConnect** is a modular, microservices-based Campus ERP platform designed using modern enterprise architecture principles.

The system separates responsibilities across independent Rust services and integrates them through a unified Angular frontend. MongoDB powers the data layer with multi-campus support.

This project demonstrates:

* Production-style microservices architecture
* Secure JWT-based centralized authentication
* Role-based access control (RBAC)
* RESTful inter-service communication
* Multi-campus data segregation
* Enterprise-grade frontend architecture

---

## 🏗 System Architecture

```
Angular Frontend
        ↓
Authentication Service (Rust)
        ↓
-------------------------------------------------
| Academics | Finance | Hostel | Library | HR  |
-------------------------------------------------
        ↓
MongoDB (Independent Collections)
```

### Architectural Highlights

* Independent Rust services
* Stateless backend design
* JWT middleware validation
* Role-based authorization
* Multi-campus filtering using `campus_id`
* REST-based service-to-service communication

---

## 🧩 Core Microservices

### 🔐 Authentication Service

* Secure login system
* JWT token issuance
* Password hashing
* Role-based access validation
* Middleware-based token verification

### 📘 Academics Service

* Course management
* Student enrollment
* Attendance and results tracking

### 💰 Finance Service

* Fee generation
* Payment tracking
* Invoice history

### 🏠 Hostel Service

* Room allocation
* Hostel fee management
* Maintenance records

### 📚 Library Service

* Book catalog
* Issue & return system
* Fine calculation

### 👥 HR Service

* Faculty management
* Leave requests
* Payroll tracking

Each service:

* Runs independently
* Connects directly to MongoDB
* Exposes RESTful APIs
* Validates JWT tokens via middleware

---

## 🛠 Technology Stack

### Frontend

* Angular
* TypeScript
* Angular Router
* Reactive Forms
* HTTPClient
* Route Guards

### Backend

* Rust
* Actix Web / Axum
* JWT Authentication
* REST APIs
* Middleware-based authorization

### Database

* MongoDB
* Document-based schema
* Multi-campus filtering via `campus_id`

---

## 📂 Project Structure

```
campusconnect/
│
├── frontend/                  # Angular Application
│
├── auth-service/              # JWT Authentication
├── academics-service/
├── finance-service/
├── hostel-service/
├── library-service/
├── hr-service/
│
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

* Node.js (v18+)
* Angular CLI
* Rust
* Cargo
* MongoDB (local instance)

---

### Clone Repository

```
git clone https://github.com/your-username/campusconnect.git
cd campusconnect
```

---

### Start MongoDB

```
mongod
```

---

### Run Backend Services

For each service:

```
cd auth-service
cargo run
```

Repeat for:

* academics-service
* finance-service
* hostel-service
* library-service
* hr-service

Each service runs on a different port.

---

### Run Frontend

```
cd frontend
npm install
ng serve
```

Access application at:

```
http://localhost:4200
```

---

## 🔐 Authentication Flow

1. User logs in via Angular.
2. Auth Service verifies credentials.
3. JWT token is generated.
4. Token is stored in the browser.
5. All API requests include:

```
Authorization: Bearer <token>
```

6. Backend services validate token using middleware.

---

## 🏫 Multi-Campus Support

All documents include a `campus_id` field:

```json
{
  "name": "Mechanical Engineering",
  "campus_id": "CAMPUS_A"
}
```

Queries filter by `campus_id` to ensure proper data isolation per campus.

---

## 📡 Inter-Service Communication

Services communicate via REST APIs.

Example flows:

* Finance verifies student enrollment from Academics.
* Hostel checks payment confirmation from Finance.
* Library adds fine notification through Finance.

---

## 🎯 Key Design Decisions

* Stateless architecture for scalability
* Independent service logic
* Separation of concerns
* Clean RESTful APIs
* Centralized authentication
* Simplified local service discovery (via ports/config)
* Modular Angular structure

---

## 📊 Success Criteria

✔ All microservices run independently
✔ JWT authentication works across services
✔ Role-based authorization enforced
✔ CRUD operations functional for all modules
✔ MongoDB stores and retrieves data correctly
✔ Multi-campus filtering implemented
✔ System runs without major runtime failures

---

## 📈 Future Enhancements

* API Gateway layer
* Automated service discovery
* Redis caching
* Logging & monitoring
* Swagger API documentation
* Cloud deployment
* Performance benchmarking
* CI/CD pipeline integration

---

## 🦀 Rust Memory Model Documentation

This project includes comprehensive documentation on Rust's ownership, borrowing, and lifetimes:

### 📚 Documentation Files

* **[RUST_MEMORY_MODEL.md](RUST_MEMORY_MODEL.md)** - Complete guide to ownership, borrowing, and lifetimes
* **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick reference for common patterns
* **[examples/](examples/)** - Runnable code examples demonstrating each concept
* **[VIDEO_DEMO_GUIDE.md](VIDEO_DEMO_GUIDE.md)** - Guide for creating video demonstrations
* **[PR_CHECKLIST.md](PR_CHECKLIST.md)** - Assignment completion checklist

### 🚀 Quick Start

```bash
cd examples
rustc ownership_example.rs && ./ownership_example
rustc borrowing_example.rs && ./borrowing_example
rustc lifetime_example.rs && ./lifetime_example
rustc backend_example.rs && ./backend_example
```

### 🎯 Key Concepts Covered

* **Ownership**: One owner per value, automatic cleanup, move semantics
* **Borrowing**: Immutable and mutable references, borrowing rules
* **Lifetimes**: Reference validity, lifetime annotations, preventing dangling pointers
* **Backend Applications**: How these concepts prevent bugs in Actix/Axum services

### 💡 Why This Matters

Rust's memory model prevents entire categories of bugs:
- No null pointer exceptions
- No memory leaks
- No data races
- No use-after-free vulnerabilities
- No dangling references

These guarantees make Rust ideal for building reliable, high-performance backend services.

---

## 🎓 Learning Outcomes

This project demonstrates:

* Enterprise microservices architecture
* Rust-based backend engineering
* Rust's ownership, borrowing, and lifetime system
* Memory-safe backend development
* Angular enterprise frontend development
* JWT authentication & middleware implementation
* MongoDB document modeling
* RESTful inter-service communication
* Scalable system design principles

---

## 📄 License

This project was developed for academic and learning purposes as part of a structured 4-week sprint.

---


---

## 🛡 Error Handling — PR Documentation

This section documents the robust error handling implementation added to `auth-service` and `academics-service` as part of the backend error handling assignment.

---

### Where Errors Are Handled

**auth-service/src/main.rs**

- `register` — validates all required fields, checks for duplicate usernames, hashes passwords
- `login` — validates credentials, returns 401 on wrong password or unknown user
- `create_profile` — rejects missing or blank fields with descriptive 400 errors
- `validate_token` — returns 401 with a clear message for missing/invalid/expired tokens
- `extract_claims` (inline) — parses the Authorization header safely, no panics

**academics-service/src/main.rs**

- Every handler validates required fields before touching the database
- `create_result` — validates marks range and exam type enum
- `mark_attendance` / `mark_batch_attendance` — validates status enum (present/absent/late)
- `review_student_note` — validates review status enum
- `get_batch_students` — returns 404 when batch is not found
- `create_enrollment` — returns 400 if student is already enrolled

---

### Why Result and Option Were Used

`Result<T, AppError>` is the return type for every handler. This forces all error paths to be handled explicitly — there are no unchecked `unwrap()` calls anywhere in the handlers.

`Option<T>` is used for:
- All request struct fields (e.g. `username: Option<String>`) so missing JSON fields become `None` instead of causing a deserialization panic
- MongoDB `find_one` results — `None` means "not found" and is handled with `.ok_or_else(|| AppError::NotFound(...))`
- `course.map(|c| c.course_name).unwrap_or_default()` in `get_student_enrollments` — safely extracts an optional course name

---

### Where anyhow Is Applied and Why

`anyhow` is used in the service-layer helper functions that perform database operations:

- `find_user_by_username` (auth-service) — wraps the MongoDB call with `.context("Database error while looking up user")` so if the DB fails, the error message is meaningful
- `hash_password` — wraps bcrypt with `.context("Failed to hash password")`
- `generate_token` — wraps JWT encoding with `.context("Failed to generate JWT token")`
- `find_batch_by_id` (academics-service) — wraps ObjectId parsing and DB lookup with context strings

All handler functions accept `anyhow::Result` from these helpers and convert them to `AppError::Internal` via the `From<anyhow::Error>` impl. This means the `?` operator works cleanly throughout.

---

### How API Errors Are Returned to the Frontend

A custom `AppError` enum implements actix-web's `ResponseError` trait. Each variant maps to an HTTP status code and serializes to a consistent JSON shape:

```json
{ "error": "descriptive message here" }
```

| Variant | HTTP Status |
|---|---|
| `AppError::Unauthorized` | 401 |
| `AppError::Forbidden` | 403 |
| `AppError::BadRequest` | 400 |
| `AppError::NotFound` | 404 |
| `AppError::Internal` | 500 |

A custom `JsonConfig` error handler is also registered so malformed request bodies (invalid JSON syntax) return a 400 JSON response instead of actix's default plain-text error.

---

### Example Requests That Trigger Errors

**Missing required field — POST /api/auth/register**
```json
{ "username": "alice", "password": "secret123" }
```
Response (400):
```json
{ "error": "'role' is required" }
```

**Invalid role value — POST /api/auth/register**
```json
{ "username": "alice", "password": "secret123", "role": "superuser", "campus_id": "A", "email": "a@b.com", "full_name": "Alice" }
```
Response (400):
```json
{ "error": "Invalid role 'superuser'. Must be one of: student, teacher, hr, librarian, admin" }
```

**Wrong password — POST /api/auth/login**
```json
{ "username": "alice", "password": "wrongpass" }
```
Response (401):
```json
{ "error": "Invalid credentials" }
```

**No Authorization header — GET /api/courses**

Response (401):
```json
{ "error": "No token provided" }
```

**Invalid attendance status — POST /api/attendance**
```json
{ "student_id": "s1", "course_code": "CS101", "date": "2026-04-03", "status": "maybe" }
```
Response (400):
```json
{ "error": "Invalid status 'maybe'. Must be: present, absent, or late" }
```

**marks_obtained exceeds total_marks — POST /api/results**
```json
{ "student_id": "s1", "course_code": "CS101", "exam_type": "final", "marks_obtained": 110, "total_marks": 100, "semester": "S1" }
```
Response (400):
```json
{ "error": "marks_obtained must be between 0 and total_marks" }
```

**Batch not found — GET /api/batches/000000000000000000000000/students**

Response (404):
```json
{ "error": "Batch not found" }
```

**Student already enrolled — POST /api/enrollments**
```json
{ "student_id": "s1", "course_code": "CS101", "semester": "S1" }
```
Response (400):
```json
{ "error": "Student already enrolled in this course" }
```
