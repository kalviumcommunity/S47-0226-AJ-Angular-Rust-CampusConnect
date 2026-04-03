# CampusConnect - API Documentation

## Base URLs

- Auth Service: `http://localhost:8080`
- Academics Service: `http://localhost:8081`
- Finance Service: `http://localhost:8082`
- Hostel Service: `http://localhost:8083`
- Library Service: `http://localhost:8084`
- HR Service: `http://localhost:8085`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Auth Service (Port 8080)

### Register User

**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepass123",
  "full_name": "John Doe",
  "email": "john@campus.edu",
  "role": "student",
  "campus_id": "CAMPUS_A"
}
```

**Response:**
```json
{
  "message": "User registered successfully"
}
```

### Login

**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "john_doe",
    "role": "student",
    "campus_id": "CAMPUS_A",
    "email": "john@campus.edu",
    "full_name": "John Doe"
  }
}
```

### Validate Token

**GET** `/api/auth/validate`

Verify if a token is valid.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "valid": true,
  "claims": {
    "sub": "john_doe",
    "role": "student",
    "campus_id": "CAMPUS_A",
    "exp": 1709241600
  }
}
```

---

## Academics Service (Port 8081)

### Courses

#### Create Course

**POST** `/api/courses`

**Headers:** Authorization required

**Request Body:**
```json
{
  "course_code": "CS101",
  "course_name": "Introduction to Programming",
  "credits": 3,
  "department": "Computer Science"
}
```

**Response:**
```json
{
  "message": "Course created successfully"
}
```

#### Get All Courses

**GET** `/api/courses`

**Headers:** Authorization required

**Query Parameters (all optional):**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Page number (1-indexed) |
| `limit` | integer | `20` | Records per page (max 100) |
| `department` | string | — | Filter by department name |

**Example Requests:**
```bash
# Page 1, default limit
curl -X GET "http://localhost:8081/api/courses?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Filter by department
curl -X GET "http://localhost:8081/api/courses?department=Computer%20Science&page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "data": [
    {
      "course_code": "CS101",
      "course_name": "Introduction to Programming",
      "credits": 3,
      "department": "Computer Science",
      "campus_id": "CAMPUS_A",
      "created_at": "2024-02-24T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "total_pages": 5
  }
}

### Enrollments

#### Create Enrollment

**POST** `/api/enrollments`

**Headers:** Authorization required

**Request Body:**
```json
{
  "student_id": "STU001",
  "course_code": "CS101",
  "semester": "Fall 2024"
}
```

#### Get All Enrollments

**GET** `/api/enrollments`

**Headers:** Authorization required

**Query Parameters (all optional):**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Page number (1-indexed) |
| `limit` | integer | `20` | Records per page (max 100) |
| `semester` | string | — | Filter by semester, e.g. `Fall 2024` |
| `course_code` | string | — | Filter by course code |

**Example Requests:**
```bash
# Get page 2 with 10 per page
curl -X GET "http://localhost:8081/api/enrollments?page=2&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Filter by semester and course
curl -X GET "http://localhost:8081/api/enrollments?semester=Fall%202024&course_code=CS101" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "data": [
    {
      "student_id": "STU001",
      "course_code": "CS101",
      "semester": "Fall 2024",
      "campus_id": "CAMPUS_A",
      "enrolled_at": "2024-02-24T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}

### Attendance

#### Mark Attendance

**POST** `/api/attendance`

**Headers:** Authorization required

**Request Body:**
```json
{
  "student_id": "STU001",
  "course_code": "CS101",
  "date": "2024-02-24",
  "status": "present"
}
```

**Status values:** `present`, `absent`, `late`

#### Get All Attendance

**GET** `/api/attendance`

**Headers:** Authorization required

**Query Parameters (all optional):**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Page number (1-indexed) |
| `limit` | integer | `20` | Records per page (max 100) |
| `status` | string | — | Filter by status: `present`, `absent`, `late` |
| `course_code` | string | — | Filter by course code |
| `student_id` | string | — | Filter by student ID |

**Example Requests:**
```bash
# Get all absent records, page 1
curl -X GET "http://localhost:8081/api/attendance?status=absent&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# Filter by course and status
curl -X GET "http://localhost:8081/api/attendance?course_code=CS101&status=present&limit=50" \
  -H "Authorization: Bearer $TOKEN"

# Filter by student
curl -X GET "http://localhost:8081/api/attendance?student_id=STU001&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "data": [
    {
      "student_id": "STU001",
      "course_code": "CS101",
      "date": "2024-02-24",
      "status": "present",
      "campus_id": "CAMPUS_A",
      "created_at": "2024-02-24T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "total_pages": 25
  }
}

---

## Finance Service (Port 8082)

### Fees

#### Create Fee

**POST** `/api/fees`

**Headers:** Authorization required

**Request Body:**
```json
{
  "student_id": "STU001",
  "fee_type": "tuition",
  "amount": 5000.00,
  "due_date": "2024-03-31"
}
```

**Fee Types:** `tuition`, `hostel`, `library`, `misc`

#### Get All Fees

**GET** `/api/fees`

**Headers:** Authorization required

### Payments

#### Create Payment

**POST** `/api/payments`

**Headers:** Authorization required

**Request Body:**
```json
{
  "student_id": "STU001",
  "fee_id": "fee_object_id",
  "amount": 5000.00,
  "payment_method": "card",
  "transaction_id": "TXN123456"
}
```

**Payment Methods:** `cash`, `card`, `upi`, `bank_transfer`

#### Get All Payments

**GET** `/api/payments`

**Headers:** Authorization required

### Invoices

#### Create Invoice

**POST** `/api/invoices`

**Headers:** Authorization required

**Request Body:**
```json
{
  "student_id": "STU001",
  "items": [
    {
      "description": "Tuition Fee",
      "amount": 5000.00
    },
    {
      "description": "Lab Fee",
      "amount": 500.00
    }
  ]
}
```

#### Get All Invoices

**GET** `/api/invoices`

**Headers:** Authorization required

---

## Hostel Service (Port 8083)

### Rooms

#### Create Room

**POST** `/api/rooms`

**Headers:** Authorization required

**Request Body:**
```json
{
  "room_number": "101",
  "hostel_name": "Sunrise Hostel",
  "capacity": 3,
  "room_type": "triple",
  "floor": 1
}
```

**Room Types:** `single`, `double`, `triple`

#### Get All Rooms

**GET** `/api/rooms`

**Headers:** Authorization required

### Room Allocations

#### Allocate Room

**POST** `/api/allocations`

**Headers:** Authorization required

**Request Body:**
```json
{
  "student_id": "STU001",
  "room_id": "room_object_id"
}
```

#### Get All Allocations

**GET** `/api/allocations`

**Headers:** Authorization required

### Maintenance

#### Create Maintenance Request

**POST** `/api/maintenance`

**Headers:** Authorization required

**Request Body:**
```json
{
  "room_number": "101",
  "hostel_name": "Sunrise Hostel",
  "issue_type": "plumbing",
  "description": "Leaking faucet in bathroom"
}
```

#### Get All Maintenance Requests

**GET** `/api/maintenance`

**Headers:** Authorization required

---

## Library Service (Port 8084)

### Books

#### Add Book

**POST** `/api/books`

**Headers:** Authorization required

**Request Body:**
```json
{
  "isbn": "978-0134685991",
  "title": "Effective Java",
  "author": "Joshua Bloch",
  "category": "Programming",
  "total_copies": 5
}
```

#### Get All Books

**GET** `/api/books`

**Headers:** Authorization required

### Book Issues

#### Issue Book

**POST** `/api/issue`

**Headers:** Authorization required

**Request Body:**
```json
{
  "book_id": "book_object_id",
  "student_id": "STU001",
  "days": 14
}
```

**Response:**
```json
{
  "message": "Book issued successfully",
  "due_date": "2024-03-09T10:00:00Z"
}
```

#### Return Book

**POST** `/api/return`

**Headers:** Authorization required

**Request Body:**
```json
{
  "issue_id": "issue_object_id"
}
```

**Response:**
```json
{
  "message": "Book returned successfully",
  "fine_amount": 15.00
}
```

**Note:** Fine is calculated at $5 per day for overdue books.

#### Get All Issues

**GET** `/api/issues`

**Headers:** Authorization required

---

## HR Service (Port 8085)

### Faculty

#### Add Faculty

**POST** `/api/faculty`

**Headers:** Authorization required

**Request Body:**
```json
{
  "employee_id": "EMP001",
  "name": "Dr. John Smith",
  "email": "john.smith@campus.edu",
  "department": "Computer Science",
  "designation": "Professor",
  "joining_date": "2020-01-15",
  "salary": 75000.00
}
```

#### Get All Faculty

**GET** `/api/faculty`

**Headers:** Authorization required

### Leave Requests

#### Create Leave Request

**POST** `/api/leave`

**Headers:** Authorization required

**Request Body:**
```json
{
  "employee_id": "EMP001",
  "leave_type": "sick",
  "from_date": "2024-03-01",
  "to_date": "2024-03-03",
  "reason": "Medical treatment"
}
```

**Leave Types:** `sick`, `casual`, `vacation`

#### Get All Leave Requests

**GET** `/api/leave`

**Headers:** Authorization required

#### Approve/Reject Leave

**PUT** `/api/leave/approve`

**Headers:** Authorization required

**Request Body:**
```json
{
  "request_id": "leave_object_id",
  "status": "approved"
}
```

**Status values:** `approved`, `rejected`

### Payroll

#### Create Payroll

**POST** `/api/payroll`

**Headers:** Authorization required

**Request Body:**
```json
{
  "employee_id": "EMP001",
  "month": "February",
  "year": 2024,
  "allowances": 5000.00,
  "deductions": 2000.00
}
```

**Response:**
```json
{
  "message": "Payroll created successfully",
  "net_salary": 78000.00
}
```

**Note:** Net salary = basic_salary + allowances - deductions

#### Get All Payroll

**GET** `/api/payroll`

**Headers:** Authorization required

---

## Health Check Endpoints

All services provide a health check endpoint:

**GET** `/health`

**Response:**
```json
{
  "status": "ok",
  "service": "service-name"
}
```

---

## Error Responses

All services return consistent error responses:

**400 Bad Request:**
```json
{
  "error": "Invalid request data"
}
```

**401 Unauthorized:**
```json
{
  "error": "Invalid token"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. For production:
- Implement rate limiting per IP
- Use API Gateway with rate limits
- Consider Redis for distributed rate limiting

## Testing with cURL

### Example: Register and Login

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123",
    "full_name": "Test User",
    "email": "test@campus.edu",
    "role": "admin",
    "campus_id": "CAMPUS_A"
  }'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123"
  }'

# Use the token from login response
TOKEN="your_jwt_token_here"

# Get courses
curl -X GET http://localhost:8081/api/courses \
  -H "Authorization: Bearer $TOKEN"
```

## Testing with Tools

- **Postman**: Import API collection
- **Insomnia**: REST client
- **Thunder Client**: VS Code extension
- **HTTPie**: Command-line HTTP client

---

For more details, see ARCHITECTURE.md and SETUP.md
