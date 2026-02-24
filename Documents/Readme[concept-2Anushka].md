# Concept 2: Rust Backend API Architecture & Request Flow


## PART 1: API Explanation & Documentation

### 1. API Request Flow Explanation

#### How Rust Routes Map to Handlers

In a Rust backend using frameworks like Actix-web or Axum, routes are defined using decorators or router configurations that map HTTP endpoints to specific handler functions. For example:

```rust
// Route definition maps URL path to handler function
#[post("/api/products")]
async fn add_product(product: web::Json<ProductInput>) -> impl Responder {
    // Handler logic here
}
```

The routing system matches incoming HTTP requests based on:
- HTTP method (GET, POST, PUT, DELETE)
- URL path pattern
- Optional path parameters or query strings

When a request arrives at `/api/products` with POST method, the framework automatically invokes the `add_product` handler.

#### How Handlers Receive and Process Requests

Handlers in Rust receive requests through strongly-typed parameters. The framework automatically:

1. **Extracts data** from the HTTP request (body, headers, query params)
2. **Deserializes** JSON into Rust structs using Serde
3. **Validates** the data structure at compile-time
4. **Passes** the typed data to the handler function

```rust
#[derive(Deserialize)]
struct ProductInput {
    name: String,
    quantity: i32,
}

async fn add_product(product: web::Json<ProductInput>) -> Result<HttpResponse> {
    // product.name and product.quantity are guaranteed to exist
    // and have correct types
}
```

#### How Typed Structs Ensure Safe Input/Output

Rust's type system provides compile-time guarantees:

**Input Safety:**
- Structs define exactly what fields are expected
- Missing fields cause deserialization errors (not runtime crashes)
- Type mismatches are caught before the handler executes
- Optional fields use `Option<T>` for explicit null handling

**Output Safety:**
- Response structs ensure consistent API contracts
- Serialization is type-checked at compile time
- No risk of accidentally sending wrong data types
- API consumers can rely on predictable response formats

```rust
#[derive(Serialize)]
struct ProductResponse {
    id: i32,
    name: String,
    quantity: i32,
    created_at: DateTime<Utc>,
}
```

#### How APIs Return JSON Responses

Rust handlers return JSON responses through serialization:

1. Handler creates a response struct with data
2. Serde serializes the struct to JSON
3. Framework sets appropriate headers (`Content-Type: application/json`)
4. HTTP response is sent to the client

```rust
async fn add_product(product: web::Json<ProductInput>) -> Result<HttpResponse> {
    let new_product = ProductResponse {
        id: 1,
        name: product.name.clone(),
        quantity: product.quantity,
        created_at: Utc::now(),
    };
    
    Ok(HttpResponse::Ok().json(new_product))
}
```

#### Database Interaction with SQLx/SeaORM

**SQLx Approach (Compile-time SQL verification):**
```rust
let product = sqlx::query_as!(
    Product,
    "INSERT INTO products (name, quantity) VALUES ($1, $2) RETURNING *",
    product.name,
    product.quantity
)
.fetch_one(&pool)
.await?;
```

**SeaORM Approach (Type-safe ORM):**
```rust
let new_product = product::ActiveModel {
    name: Set(product.name.clone()),
    quantity: Set(product.quantity),
    ..Default::default()
};

let result = new_product.insert(&db).await?;
```

Both approaches provide:
- Type-safe database queries
- Automatic parameter binding (prevents SQL injection)
- Compile-time query validation (SQLx)
- Connection pooling for performance
- Async/await for non-blocking I/O

---

### 2. End-to-End API Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     ANGULAR FRONTEND                            │
│                                                                 │
│  User Action (Form Submit)                                      │
│         ↓                                                       │
│  Angular Service (HttpClient)                                   │
│  POST /api/products                                             │
│  Body: { "name": "Laptop", "quantity": 5 }                      │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP Request
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      RUST BACKEND                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. ROUTE MATCHING                                        │  │
│  │    POST /api/products → add_product handler              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 2. HANDLER (Validation + Deserialization)                │  │
│  │    - Parse JSON to ProductInput struct                   │  │
│  │    - Validate types (String, i32)                        │  │
│  │    - Check business rules (quantity > 0)                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 3. BUSINESS LOGIC                                        │  │
│  │    - Process validated data                              │  │
│  │    - Prepare database query                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         ↓                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │ SQL Query
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    POSTGRESQL DATABASE                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 4. DATABASE OPERATION                                    │  │
│  │    INSERT INTO products (name, quantity)                 │  │
│  │    VALUES ('Laptop', 5)                                  │  │
│  │    RETURNING id, name, quantity, created_at              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                         ↓                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 5. QUERY RESULT                                          │  │
│  │    Product { id: 1, name: "Laptop", quantity: 5, ... }   │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ Query Result
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      RUST BACKEND                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 6. RESPONSE SERIALIZATION                                │  │
│  │    - Map database result to ProductResponse struct       │  │
│  │    - Serialize to JSON                                   │  │
│  │    - Set HTTP status 200 OK                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP Response
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                     ANGULAR FRONTEND                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 7. UI UPDATE                                             │  │
│  │    - Receive JSON response                               │  │
│  │    - Update component state                              │  │
│  │    - Refresh product list in UI                          │  │
│  │    - Show success notification                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3. Reflection: Why Type-Safe Rust APIs Matter

Type-safe, strongly-validated Rust APIs are crucial in modern backend development for several compelling reasons:

**Reliability:** Rust's type system catches errors at compile-time rather than runtime. This means bugs related to incorrect data types, missing fields, or invalid state transitions are identified before the code ever runs in production. This dramatically reduces the likelihood of crashes and unexpected behavior in live systems.

**Safety:** Memory safety without garbage collection is Rust's hallmark. The compiler prevents null pointer dereferences, buffer overflows, and data races—common sources of security vulnerabilities in other languages. For APIs handling sensitive user data, this built-in safety is invaluable.

**Predictability:** Strong typing creates explicit contracts between frontend and backend. When an API endpoint expects a `ProductInput` struct with specific fields and types, both the API consumer and provider have clear expectations. This eliminates ambiguity and reduces integration issues.

**Compile-Time Guarantees:** Unlike dynamically-typed languages where type errors surface during testing or production, Rust's compiler acts as a first line of defense. If your code compiles, you have strong guarantees about type correctness, resource management, and thread safety. This shifts error detection left in the development cycle, saving time and reducing costs.

In an era where backend systems must handle millions of requests reliably and securely, Rust's approach to type safety provides the foundation for building robust, maintainable APIs that teams can trust.

---

### 4. AI Feedback & Improvements Applied

**Original Draft Issues Identified:**
- Needed more concrete code examples
- Flow diagram could be more detailed with specific data
- Reflection could emphasize production benefits more clearly

**Improvements Made:**
- Added inline Rust code snippets showing actual implementation patterns
- Enhanced diagram with specific data examples ("Laptop", quantity: 5)
- Expanded reflection to include security and cost-saving aspects
- Structured explanations with clear headers for better readability
- Added comparison between SQLx and SeaORM approaches

---

## PART 2: Video Demonstration Guide

### Video Structure (2-4 minutes)

#### Section 1: Architecture Diagram Walkthrough (60 seconds)
- Display the flow diagram
- Explain each component:
  - Angular service initiates HTTP POST request
  - Rust route matcher identifies correct handler
  - Handler deserializes and validates input
  - Database executes INSERT query
  - Rust serializes response back to JSON
  - Angular updates UI with new data

#### Section 2: Type-Safe Backend Concepts (60 seconds)
**Key Points to Cover:**
- Typed structs prevent invalid data from entering the system
- Compiler checks types before code runs (no runtime type errors)
- Error handling is explicit with `Result<T, E>` types
- Predictable behavior reduces debugging time

#### Section 3: Case Study Answer (90 seconds)

**Scenario:** User submits form to add product "Laptop" with quantity 5

**Complete Technical Flow:**

1. **Angular Service Sends POST Request**
   ```typescript
   this.http.post('/api/products', {
     name: 'Laptop',
     quantity: 5
   })
   ```

2. **Rust Route → Handler Receives Typed Data**
   - Router matches POST `/api/products` to `add_product` handler
   - Framework deserializes JSON into `ProductInput` struct
   - Type validation ensures `name` is String and `quantity` is i32

3. **Validation + Business Logic**
   - Check quantity > 0
   - Validate name is not empty
   - Sanitize input if needed
   - Prepare database operation

4. **SQLx/SeaORM Insert Query**
   ```rust
   INSERT INTO products (name, quantity) 
   VALUES ('Laptop', 5) 
   RETURNING id, name, quantity, created_at
   ```
   - Database creates new record
   - Returns complete product data with generated ID

5. **Rust Returns JSON Response**
   ```json
   {
     "id": 1,
     "name": "Laptop",
     "quantity": 5,
     "created_at": "2026-02-24T10:30:00Z"
   }
   ```
   - Handler serializes `ProductResponse` struct to JSON
   - Sets HTTP 200 OK status
   - Sends response to client

6. **Angular Updates UI**
   - Observable receives response
   - Component adds new product to local array
   - UI re-renders showing "Laptop" in product list
   - Success notification displays to user


**Document Version:** 1.0  
**Last Updated:** February 24, 2026  
**Author:** Anushka
