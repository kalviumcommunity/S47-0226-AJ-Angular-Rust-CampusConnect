# CampusConnect - System Architecture

## Overview

CampusConnect is an enterprise-grade Campus ERP system built using microservices architecture. The system demonstrates modern software engineering practices including service isolation, JWT authentication, and role-based access control.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Angular Frontend                         │
│                    (Port 4200)                              │
│  - Standalone Components                                     │
│  - Reactive Forms                                           │
│  - HTTP Interceptors                                        │
│  - Route Guards                                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ HTTP/REST
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Authentication Service (Port 8080)              │
│  - JWT Token Generation                                      │
│  - User Registration                                         │
│  - Password Hashing (bcrypt)                                │
│  - Token Validation                                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                  │
┌─────────▼─────────┐            ┌──────────▼─────────┐
│  Microservices    │            │   MongoDB           │
│  Layer            │◄───────────┤   Database          │
└───────────────────┘            │   (Port 27017)      │
                                 └─────────────────────┘

Microservices (All with JWT Authentication):
├── Academics (8081)
├── Finance (8082)
├── Hostel (8083)
├── Library (8084)
└── HR (8085)
```

## Key Design Principles

### 1. Microservices Architecture

Each service is:
- **Independent**: Can be deployed, scaled, and maintained separately
- **Isolated**: Has its own business logic and data models
- **Stateless**: No session state stored on the server
- **RESTful**: Uses standard HTTP methods and status codes

### 2. Authentication & Authorization

#### JWT Token Flow

```
1. User Login
   ↓
2. Auth Service validates credentials
   ↓
3. Generate JWT with claims (username, role, campus_id)
   ↓
4. Frontend stores token in localStorage
   ↓
5. All API requests include: Authorization: Bearer <token>
   ↓
6. Each service validates token before processing
```

#### Token Structure

```json
{
  "sub": "username",
  "role": "admin",
  "campus_id": "CAMPUS_A",
  "exp": 1709241600
}
```

### 3. Multi-Campus Support

All data documents include a `campus_id` field:

```json
{
  "course_name": "Computer Science",
  "campus_id": "CAMPUS_A",
  "created_at": "2024-02-24T10:00:00Z"
}
```

MongoDB queries automatically filter by campus_id to ensure data isolation.

### 4. Database Design

#### Collections

1. **users** (Auth Service)
   - _id, username, password_hash, role, campus_id, email, full_name

2. **courses** (Academics)
   - _id, course_code, course_name, credits, department, campus_id

3. **enrollments** (Academics)
   - _id, student_id, course_code, semester, campus_id

4. **attendance** (Academics)
   - _id, student_id, course_code, date, status, campus_id

5. **fees** (Finance)
   - _id, student_id, fee_type, amount, due_date, status, campus_id

6. **payments** (Finance)
   - _id, student_id, fee_id, amount, payment_method, transaction_id

7. **invoices** (Finance)
   - _id, invoice_number, student_id, items, total_amount, campus_id

8. **rooms** (Hostel)
   - _id, room_number, hostel_name, capacity, occupied, room_type

9. **room_allocations** (Hostel)
   - _id, student_id, room_id, allocation_date, status, campus_id

10. **maintenance_requests** (Hostel)
    - _id, room_number, issue_type, description, status, campus_id

11. **books** (Library)
    - _id, isbn, title, author, category, total_copies, available_copies

12. **book_issues** (Library)
    - _id, book_id, student_id, issue_date, due_date, return_date, fine_amount

13. **faculty** (HR)
    - _id, employee_id, name, email, department, designation, salary

14. **leave_requests** (HR)
    - _id, employee_id, leave_type, from_date, to_date, reason, status

15. **payroll** (HR)
    - _id, employee_id, month, year, basic_salary, allowances, deductions

## Frontend Architecture

### Component Structure

```
app/
├── components/
│   ├── login/
│   ├── register/
│   ├── dashboard/
│   ├── academics/
│   ├── finance/
│   ├── hostel/
│   ├── library/
│   └── hr/
├── services/
│   ├── auth.service.ts
│   ├── academics.service.ts
│   ├── finance.service.ts
│   ├── hostel.service.ts
│   ├── library.service.ts
│   └── hr.service.ts
├── guards/
│   └── auth.guard.ts
└── interceptors/
    └── auth.interceptor.ts
```

### Key Features

1. **Standalone Components**: Modern Angular architecture
2. **Lazy Loading**: Components loaded on-demand
3. **Route Guards**: Protected routes requiring authentication
4. **HTTP Interceptors**: Automatic JWT token injection
5. **Reactive Forms**: Form validation and handling
6. **RxJS**: Reactive programming with Observables

## Backend Architecture

### Service Structure (each service follows this pattern)

```
service/
├── Cargo.toml          # Dependencies
├── .env                # Configuration
└── src/
    └── main.rs         # Main application code
```

### Common Patterns

1. **AppState**: Holds shared application state (DB connection, JWT secret)
2. **Claims**: JWT token payload structure
3. **Request/Response Models**: Serde serializable structs
4. **Middleware**: JWT validation on protected routes

### Technology Stack

#### Frontend
- **Angular 17**: Modern web framework
- **TypeScript**: Type-safe JavaScript
- **RxJS**: Reactive programming
- **HttpClient**: HTTP communication

#### Backend
- **Rust**: High-performance systems language
- **Actix-Web**: Fast async web framework
- **MongoDB Rust Driver**: Database connectivity
- **jsonwebtoken**: JWT handling
- **bcrypt**: Password hashing
- **serde**: Serialization/deserialization

#### Database
- **MongoDB**: NoSQL document database
- **Document-based**: Flexible schema design
- **Indexed queries**: Fast data retrieval

## Security Features

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Tokens**: Stateless authentication
3. **Token Expiration**: 24-hour validity
4. **CORS**: Configured for local development
5. **Role-Based Access**: Different permissions per role
6. **Campus Isolation**: Data segregation by campus_id

## Scalability Considerations

### Horizontal Scaling
- Each service can be scaled independently
- Stateless design allows multiple instances
- Load balancer can distribute traffic

### Vertical Scaling
- Rust's performance allows high throughput
- Async/await for efficient resource usage
- MongoDB sharding for large datasets

### Future Enhancements
- API Gateway for unified entry point
- Service discovery (Consul, etcd)
- Message queue (RabbitMQ, Kafka)
- Caching layer (Redis)
- Container orchestration (Kubernetes)
- Monitoring & logging (Prometheus, ELK)

## Development Workflow

1. **Service Development**
   - Write Rust code
   - Test with local MongoDB
   - Run with `cargo run`

2. **Frontend Development**
   - Create Angular components
   - Connect to backend APIs
   - Test with `ng serve`

3. **Integration Testing**
   - Start all services
   - Test end-to-end workflows
   - Verify JWT authentication

## Production Deployment

### Checklist
- [ ] Change JWT_SECRET in all services
- [ ] Use production MongoDB (Atlas)
- [ ] Enable HTTPS
- [ ] Configure proper CORS
- [ ] Set up reverse proxy (Nginx)
- [ ] Implement rate limiting
- [ ] Add monitoring and logging
- [ ] Set up CI/CD pipeline
- [ ] Configure backups
- [ ] Document disaster recovery

## Inter-Service Communication

Currently, services don't communicate directly with each other. Future enhancements could include:

1. **Service-to-Service Auth**: Dedicated service accounts
2. **Event-Driven**: Publish/subscribe patterns
3. **API Gateway**: Centralized routing and aggregation
4. **Circuit Breaker**: Fault tolerance patterns

## Conclusion

CampusConnect demonstrates enterprise-grade architecture suitable for real-world campus management systems. The microservices approach provides flexibility, scalability, and maintainability while following modern best practices.
