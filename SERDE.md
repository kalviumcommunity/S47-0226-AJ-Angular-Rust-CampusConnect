# Serde in CampusConnect — Auth Service

## What is Serde?

Serde is Rust's de-facto serialization/deserialization framework. It converts Rust
structs to and from external formats (JSON, TOML, BSON, etc.) at compile time with
zero runtime overhead. The two core traits are:

- `Serialize` — converts a Rust value **into** a format (e.g. struct → JSON string)
- `Deserialize` — converts a format **into** a Rust value (e.g. JSON string → struct)

Both are derived automatically with `#[derive(Serialize)]` / `#[derive(Deserialize)]`.

---

## How Serialization and Deserialization Work in This Project

### Deserialization (incoming request)

When a client sends a POST request with a JSON body, Actix-Web reads the raw bytes
and calls Serde's `Deserialize` implementation for the target struct. If any required
field is missing or has the wrong type, Actix returns **400 Bad Request** automatically
— no manual parsing or `unwrap()` needed.

```rust
#[derive(Debug, Deserialize)]
struct CreateProfileRequest {
    name: String,
    email: String,
    role: String,
}
```

### Serialization (outgoing response)

When the handler calls `HttpResponse::Created().json(response)`, Actix-Web calls
Serde's `Serialize` implementation on the struct and writes the resulting JSON to
the response body with `Content-Type: application/json`.

```rust
#[derive(Debug, Serialize)]
struct ProfileResponse {
    id: i32,
    name: String,
    email: String,
    role: String,
    message: String,
}
```

---

## The Endpoint

**POST** `/api/profile` (auth-service, port 8080)

| Layer       | Type                   | Serde trait   |
|-------------|------------------------|---------------|
| Request body | `CreateProfileRequest` | `Deserialize` |
| Response body | `ProfileResponse`     | `Serialize`   |

Handler (in `auth-service/src/main.rs`):

```rust
async fn create_profile(
    body: web::Json<CreateProfileRequest>,
) -> HttpResponse {
    let response = ProfileResponse {
        id: 1,
        name: body.name.clone(),
        email: body.email.clone(),
        role: body.role.clone(),
        message: "Profile created successfully".to_string(),
    };
    HttpResponse::Created().json(response)
}
```

- Returns **201 Created** on success.
- Returns **400 Bad Request** automatically when the JSON body is invalid or
  missing required fields (Actix-Web / Serde default behaviour — no custom error
  handling code required).

---

## Error Handling

Invalid JSON is rejected before the handler runs. Examples:

| Scenario                        | HTTP Status |
|---------------------------------|-------------|
| Valid JSON, all fields present  | 201 Created |
| Missing a required field        | 400 Bad Request |
| Malformed JSON (syntax error)   | 400 Bad Request |
| Wrong content-type header       | 400 Bad Request |

No `unsafe` code, no manual `serde_json::from_str`, no `.unwrap()` on parse results.

---

## Testing the Endpoint

### curl — success case

```bash
curl -X POST http://localhost:8080/api/profile \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Smith",
    "email": "alice@campus.edu",
    "role": "student"
  }'
```

Expected response (201 Created):

```json
{
  "id": 1,
  "name": "Alice Smith",
  "email": "alice@campus.edu",
  "role": "student",
  "message": "Profile created successfully"
}
```

### curl — invalid payload (missing field)

```bash
curl -X POST http://localhost:8080/api/profile \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Smith"}'
```

Expected response (400 Bad Request) — Serde rejects the incomplete body automatically.

### Postman

1. Method: `POST`
2. URL: `http://localhost:8080/api/profile`
3. Headers: `Content-Type: application/json`
4. Body → raw → JSON:
   ```json
   {
     "name": "Alice Smith",
     "email": "alice@campus.edu",
     "role": "student"
   }
   ```

---

## Running the Auth Service

```bash
cd auth-service
cargo run
```

The service starts on `http://127.0.0.1:8080`.
