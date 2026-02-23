# Campus ERP System - Microservices Architecture
## Concept Documentation by Anushka

---

## PART 1: Architecture Documentation

### 1. Architecture Explanation: Angular → Rust → PostgreSQL

#### How Angular Components Handle User Interactions

Angular components serve as the presentation layer of our Campus ERP system. When a user interacts with the UI (clicking buttons, filling forms, navigating pages), the component's TypeScript class captures these events through event bindings like `(click)`, `(submit)`, or `(change)`. 

For example, in our Academics module, when a student clicks "View Grades", the component method is triggered:
- The component maintains the UI state and user input data
- It uses two-way data binding `[(ngModel)]` to capture form inputs
- Event handlers process user actions and delegate business logic to services
- Components focus purely on presentation logic, keeping them lightweight and testable

#### How Services Use HttpClient to Call APIs

Angular services act as the communication bridge between components and the backend. They inject the `HttpClient` module to make RESTful API calls:

```typescript
// Example: Student Service
constructor(private http: HttpClient) {}

getStudentGrades(studentId: string): Observable<Grade[]> {
  return this.http.get<Grade[]>(`${API_URL}/api/academics/students/${studentId}/grades`);
}
```

Key responsibilities:
- Centralize all HTTP communication logic
- Handle request/response transformations
- Manage authentication tokens in headers
- Implement error handling and retry logic
- Return Observables for reactive data streams
- Cache frequently accessed data to reduce server load

#### How Rust (Actix/Axum) Receives and Processes Requests


Our Rust backend uses Actix-web framework to handle incoming HTTP requests with exceptional performance:

**Request Flow in Rust:**
1. **Routing Layer**: Actix router matches the incoming request path to registered handlers
2. **Middleware Chain**: Authentication, logging, and CORS middleware process the request
3. **Handler Function**: Extracts path parameters, query strings, and request body
4. **Validation**: Uses serde for JSON deserialization and validates input data
5. **Business Logic**: Processes the request, applies business rules
6. **Database Interaction**: Calls database layer functions with connection pooling
7. **Response Formation**: Serializes data to JSON and returns appropriate HTTP status

```rust
// Example: Get student grades endpoint
#[get("/api/academics/students/{id}/grades")]
async fn get_student_grades(
    student_id: web::Path<String>,
    pool: web::Data<PgPool>
) -> Result<HttpResponse, Error> {
    let grades = db::fetch_grades(&pool, &student_id).await?;
    Ok(HttpResponse::Ok().json(grades))
}
```

Rust's ownership model ensures memory safety without garbage collection, making it ideal for high-concurrency scenarios with thousands of simultaneous users.

#### How PostgreSQL Stores and Retrieves Data Through Rust

PostgreSQL serves as our persistent data store, accessed through Rust using the `sqlx` or `diesel` crate:

**Data Flow:**
1. **Connection Pooling**: Rust maintains a pool of database connections for efficient resource usage
2. **Query Execution**: Parameterized queries prevent SQL injection attacks
3. **Type Safety**: Rust's type system ensures query results match expected data structures
4. **Transaction Management**: ACID properties guarantee data consistency across microservices
5. **Indexing Strategy**: Optimized indexes on frequently queried columns (student_id, course_id)

```rust
// Example: Database query function
pub async fn fetch_grades(pool: &PgPool, student_id: &str) -> Result<Vec<Grade>, sqlx::Error> {
    sqlx::query_as!(
        Grade,
        "SELECT id, student_id, course_id, grade, semester FROM grades WHERE student_id = $1",
        student_id
    )
    .fetch_all(pool)
    .await
}
```

Each microservice (Academics, Finance, Hostel, Library, HR) has its own database schema, following the database-per-service pattern for true service independence.

---

### 2. End-to-End Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CAMPUS ERP SYSTEM FLOW                      │
└─────────────────────────────────────────────────────────────────┘

    USER INTERACTION
         │
         │ (Click "View Grades" button)
         ▼
    ┌─────────────────────┐
    │ Angular Component   │
    │ (grades.component)  │
    │ - Captures event    │
    │ - Calls service     │
    └──────────┬──────────┘
               │
               │ viewGrades()
               ▼
    ┌─────────────────────┐
    │ Angular Service     │
    │ (student.service)   │
    │ - HttpClient.get()  │
    │ - Adds auth token   │
    └──────────┬──────────┘
               │
               │ HTTP GET /api/academics/students/123/grades
               ▼
    ┌─────────────────────┐
    │ API Gateway         │
    │ - Service Discovery │
    │ - Load Balancing    │
    └──────────┬──────────┘
               │
               │ Routes to Academics Service
               ▼
    ┌─────────────────────┐
    │ Rust API Endpoint   │
    │ (Actix-web)         │
    │ - Route handler     │
    │ - Auth middleware   │
    └──────────┬──────────┘
               │
               │ Extract student_id
               ▼
    ┌─────────────────────┐
    │ Business Logic      │
    │ - Validate request  │
    │ - Check permissions │
    │ - Process data      │
    └──────────┬──────────┘
               │
               │ Call database layer
               ▼
    ┌─────────────────────┐
    │ PostgreSQL Query    │
    │ - Connection pool   │
    │ - Execute SELECT    │
    │ - Fetch results     │
    └──────────┬──────────┘
               │
               │ Return Grade[] data
               ▼
    ┌─────────────────────┐
    │ Rust Response       │
    │ - Serialize to JSON │
    │ - HTTP 200 OK       │
    │ - Send response     │
    └──────────┬──────────┘
               │
               │ JSON response
               ▼
    ┌─────────────────────┐
    │ Angular Service     │
    │ - Receive Observable│
    │ - Transform data    │
    └──────────┬──────────┘
               │
               │ Return Observable<Grade[]>
               ▼
    ┌─────────────────────┐
    │ Angular Component   │
    │ - Subscribe to data │
    │ - Update view model │
    └──────────┬──────────┘
               │
               │ Data binding updates
               ▼
    ┌─────────────────────┐
    │ Angular UI Update   │
    │ - Render grades     │
    │ - Display to user   │
    └─────────────────────┘
               │
               ▼
         USER SEES GRADES
```

---

### 3. Reflection: Why Frontend-Backend Separation Matters

The separation of frontend (Angular) and backend (Rust) is fundamental to modern web architecture for several critical reasons:

**Performance & Scalability:**
- Frontend and backend can scale independently based on demand
- Static Angular assets can be served via CDN, reducing server load
- Rust backend handles compute-intensive operations efficiently
- Multiple frontend clients (web, mobile) can consume the same API
- Horizontal scaling: Add more Rust service instances during peak loads

**Maintainability & Development Velocity:**
- Teams can work independently on frontend and backend
- Technology stack can evolve separately (upgrade Angular without touching Rust)
- Clear API contracts (OpenAPI/Swagger) define boundaries
- Easier debugging: Issues are isolated to specific layers
- Code reusability: Same backend serves multiple clients

**Type Safety & Reliability:**
- TypeScript in Angular catches errors at compile-time
- Rust's ownership model prevents memory bugs and race conditions
- Strong typing on both ends reduces runtime errors
- API contracts ensure data consistency
- Reduced production bugs = better user experience

**Security:**
- Backend enforces authentication and authorization
- Sensitive business logic stays server-side
- Database credentials never exposed to client
- API rate limiting and validation protect against attacks
- Clear security boundaries between layers

This architectural pattern enables our Campus ERP to serve thousands of concurrent users across multiple campuses while maintaining code quality, system reliability, and development agility.

---

### 4. AI Feedback Improvement

**Initial Draft Review:** The documentation was reviewed using AI assistance to enhance clarity, technical depth, and structure.

**Improvements Applied:**
1. Added concrete code examples for each layer
2. Expanded explanation of connection pooling and transaction management
3. Included specific framework details (Actix-web, sqlx)
4. Enhanced the diagram with more detailed step descriptions
5. Strengthened the reflection section with security considerations
6. Added microservices-specific patterns (database-per-service)
7. Improved formatting and readability with clear sections

---


#### Section 3: Case Study Answer (90 seconds)

**Scenario:** User updates profile (name, email, phone) and clicks "Save Changes"

**Complete Technical Flow:**

1. **Angular Form Capture:**
   ```typescript
   // profile.component.ts
   onSaveProfile() {
     const profileData = {
       name: this.profileForm.value.name,
       email: this.profileForm.value.email,
       phone: this.profileForm.value.phone
     };
     this.profileService.updateProfile(this.userId, profileData)
       .subscribe(response => this.handleSuccess(response));
   }
   ```

2. **Angular Service HTTP Request:**
   ```typescript
   // profile.service.ts
   updateProfile(userId: string, data: ProfileUpdate): Observable<Profile> {
     return this.http.put<Profile>(
       `${API_URL}/api/users/${userId}/profile`,
       data,
       { headers: { 'Authorization': `Bearer ${this.authToken}` }}
     );
   }
   ```

3. **HTTP PUT Request:**
   - Method: PUT
   - URL: `/api/users/123/profile`
   - Headers: Authorization token, Content-Type: application/json
   - Body: `{ "name": "New Name", "email": "new@email.com", "phone": "1234567890" }`

4. **Rust Handler Receives Request:**
   ```rust
   #[put("/api/users/{id}/profile")]
   async fn update_profile(
       user_id: web::Path<String>,
       profile: web::Json<ProfileUpdate>,
       pool: web::Data<PgPool>
   ) -> Result<HttpResponse, Error> {
       // Validation
       validate_email(&profile.email)?;
       validate_phone(&profile.phone)?;
       
       // Database update
       let updated = db::update_user_profile(&pool, &user_id, profile.into_inner()).await?;
       
       Ok(HttpResponse::Ok().json(updated))
   }
   ```

5. **Validation Layer:**
   - Email format validation (regex check)
   - Phone number format validation
   - Name length constraints
   - Check for duplicate email in database
   - Authorization: Verify user can only update their own profile

6. **PostgreSQL Update Query:**
   ```rust
   pub async fn update_user_profile(
       pool: &PgPool,
       user_id: &str,
       profile: ProfileUpdate
   ) -> Result<Profile, sqlx::Error> {
       sqlx::query_as!(
           Profile,
           "UPDATE users 
            SET name = $1, email = $2, phone = $3, updated_at = NOW()
            WHERE id = $4
            RETURNING id, name, email, phone, created_at, updated_at",
           profile.name,
           profile.email,
           profile.phone,
           user_id
       )
       .fetch_one(pool)
       .await
   }
   ```

7. **Database Transaction:**
   - BEGIN transaction
   - Execute UPDATE statement
   - Validate constraints (unique email)
   - COMMIT if successful, ROLLBACK if error
   - Return updated row with new timestamp

8. **Rust Response Formation:**
   - Serialize Profile struct to JSON
   - Set HTTP status 200 OK
   - Add response headers
   - Send response back through API Gateway

9. **Angular Service Receives Response:**
   - Observable emits the updated Profile object
   - Service can cache the new data
   - Error handling for network failures

10. **Angular Component Updates UI:**
    ```typescript
    handleSuccess(updatedProfile: Profile) {
      this.profile = updatedProfile;
      this.showSuccessMessage('Profile updated successfully!');
      this.profileForm.markAsPristine();
    }
    ```

11. **UI Reflects Changes:**
    - Data binding automatically updates displayed name, email, phone
    - Success notification appears
    - Form is marked as saved (no unsaved changes)
    - User sees their updated information immediately

**Key Points to Emphasize in Video:**
- The entire flow maintains type safety at every layer
- Validation happens both client-side (UX) and server-side (security)
- Database transaction ensures data consistency
- Asynchronous operations don't block the UI
- Error handling at each layer provides graceful degradation

---

### Service Independence

Each module operates as an independent microservice:

**Academics Service:**
- Manages courses, grades, attendance, timetables
- Database: academics_db
- Port: 8001

**Finance Service:**
- Handles fee payments, invoices, financial reports
- Database: finance_db
- Port: 8002

**Hostel Service:**
- Room allocation, maintenance requests, visitor logs
- Database: hostel_db
- Port: 8003

**Library Service:**
- Book catalog, issue/return, fines
- Database: library_db
- Port: 8004

**HR Service:**
- Employee records, payroll, leave management
- Database: hr_db
- Port: 8005

### Service Discovery & Communication

- **Service Registry:** Consul or Eureka for dynamic service discovery
- **API Gateway:** Routes external requests to appropriate services
- **Inter-Service Communication:** gRPC for high-performance internal calls
- **Message Queue:** RabbitMQ/Kafka for asynchronous event-driven communication

### Centralized Authentication

- **Auth Service:** JWT-based authentication
- **Token Validation:** Each service validates tokens independently
- **Role-Based Access Control (RBAC):** Permissions enforced at service level
- **Single Sign-On (SSO):** Users authenticate once, access all modules

### Scalability Features

- **Horizontal Scaling:** Add service instances based on load
- **Load Balancing:** Nginx or HAProxy distributes traffic
- **Database Replication:** Read replicas for query-heavy operations
- **Caching Layer:** Redis for frequently accessed data
- **CDN Integration:** Static assets served globally

---

## Technology Stack Summary

**Frontend:**
- Angular 17+ with TypeScript
- RxJS for reactive programming
- Angular Material for UI components
- NgRx for state management (optional)

**Backend:**
- Rust with Actix-web framework
- sqlx for database operations
- serde for JSON serialization
- tokio for async runtime

**Database:**
- PostgreSQL 15+ for relational data
- Redis for caching and sessions

**DevOps:**
- Docker for containerization
- Kubernetes for orchestration
- GitHub Actions for CI/CD
- Prometheus + Grafana for monitoring

---

## Conclusion

This Campus ERP system demonstrates modern software architecture principles: separation of concerns, type safety, scalability, and maintainability. The combination of Angular's reactive frontend and Rust's high-performance backend creates a robust platform capable of serving multiple campuses with thousands of concurrent users while maintaining code quality and system reliability.

---

*Document prepared by: Anushka*  
*Date: February 23, 2026*  
*Assignment: S47-0226-AJ-Angular-Rust-CampusConnect*
