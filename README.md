

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

## 🎓 Learning Outcomes

This project demonstrates:

* Enterprise microservices architecture
* Rust-based backend engineering
* Angular enterprise frontend development
* JWT authentication & middleware implementation
* MongoDB document modeling
* RESTful inter-service communication
* Scalable system design principles

---

## 📄 License

This project was developed for academic and learning purposes as part of a structured 4-week sprint.

---

