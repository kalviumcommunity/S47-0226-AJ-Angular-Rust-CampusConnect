# API Security — Middleware, CORS & Authentication

## What was changed

Both Rust services (`auth-service` on port 8080, `academics-service` on port 8081) were updated to replace permissive development defaults with production-ready security layers.

---

## 1. Middleware Implemented

Two custom Actix-Web middleware layers are registered on every service using the `Transform` + `Service` trait pattern.

### RequestLogger
Runs before every handler. Logs the HTTP method, path, and response status code to stdout via the `log` crate.

```
INFO  GET /health -> 200
INFO  POST /api/auth/login -> 200
INFO  GET /api/courses -> 401
```

Set `RUST_LOG=info` in `.env` to enable output.

### JwtAuth
Runs before every handler. Checks the `Authorization: Bearer <token>` header on all non-public routes. If the token is missing or fails JWT validation (wrong secret, expired, malformed), the middleware short-circuits and returns a `401 Unauthorized` response — the handler is never called.

Handlers contain zero authentication logic. All auth is enforced at the middleware layer.

---

## 2. CORS Configuration

Both services previously used `Cors::permissive()` (allows all origins). This has been replaced with an explicit configuration:

```rust
Cors::default()
    .allowed_origin("http://localhost:4200")   // Angular dev server only
    .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    .allowed_headers(vec![AUTHORIZATION, CONTENT_TYPE, ACCEPT])
    .max_age(3600)
```

- Only `http://localhost:4200` is whitelisted — any other origin is rejected by the browser
- `Authorization` and `Content-Type` headers are explicitly allowed so the Angular `HttpClient` and the `authInterceptor` work without CORS errors
- `max_age(3600)` caches the preflight response for 1 hour, reducing OPTIONS round-trips

---

## 3. Route Protection

### auth-service (port 8080)

| Route | Method | Public? |
|---|---|---|
| `/health` | GET | Yes |
| `/api/auth/register` | POST | Yes |
| `/api/auth/login` | POST | Yes |
| `/api/auth/validate` | GET | No — requires JWT |
| `/api/profile` | POST | No — requires JWT |

### academics-service (port 8081)

| Route | Method | Public? |
|---|---|---|
| `/health` | GET | Yes |
| `/api/courses` | GET, POST | No — requires JWT |
| `/api/enrollments` | GET, POST | No — requires JWT |
| `/api/attendance` | GET, POST | No — requires JWT |
| `/api/student/*` | GET | No — requires JWT |
| `/api/results` | POST | No — requires JWT |
| `/api/batches` | GET, POST | No — requires JWT |
| `/api/notes` | GET, POST | No — requires JWT |
| `/api/teacher/*` | GET, PUT | No — requires JWT |

---

## 4. Authentication Flow

1. Client POSTs credentials to `POST /api/auth/login`
2. Auth service validates password with bcrypt, generates a signed HS256 JWT (24h expiry)
3. Token is stored in `localStorage` by the Angular `AuthService`
4. Angular `authInterceptor` attaches `Authorization: Bearer <token>` to every outgoing request
5. `JwtAuth` middleware on each service decodes and validates the token before the handler runs
6. Invalid/missing tokens return `401 Unauthorized` with `{"error": "..."}` — no internal details leaked

---

## 5. Error Response Format

All error responses use a consistent JSON shape:

```json
{ "error": "Invalid or expired token" }
```

- `401` — missing or invalid JWT
- `403` — valid token but insufficient role (returned by handlers, not middleware)
- `400` — malformed request body or missing fields
- `500` — internal errors (message is generic, no stack traces exposed)

---

## Testing

### Start services

```bash
# Terminal 1
cd auth-service && RUST_LOG=info cargo run

# Terminal 2
cd academics-service && RUST_LOG=info cargo run
```

### Public route — no token needed

```bash
curl http://localhost:8080/health
# {"status":"ok","service":"auth-service"}

curl http://localhost:8081/health
# {"status":"ok","service":"academics-service"}
```

### Register and login

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret123","role":"teacher","campus_id":"CAMPUS_A","email":"alice@campus.edu","full_name":"Alice Smith"}'

curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"secret123"}'
# Returns: {"token":"eyJ...","user":{...}}
```

### Authorized request

```bash
TOKEN="eyJ..."   # paste token from login response

curl http://localhost:8081/api/courses \
  -H "Authorization: Bearer $TOKEN"
# Returns course list
```

### Unauthorized request — no token

```bash
curl http://localhost:8081/api/courses
# 401: {"error":"No token provided"}
```

### Unauthorized request — bad token

```bash
curl http://localhost:8081/api/courses \
  -H "Authorization: Bearer invalid.token.here"
# 401: {"error":"Invalid or expired token"}
```

### Validate token

```bash
curl http://localhost:8080/api/auth/validate \
  -H "Authorization: Bearer $TOKEN"
# {"valid":true,"claims":{"sub":"alice","role":"teacher",...}}
```
