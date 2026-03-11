// Backend Example: Real-world Actix Web patterns demonstrating
// Ownership, Borrowing, and Lifetimes in action

use std::sync::{Arc, Mutex};

// Simulated types (in real code, these come from actix-web)
type HttpResponse = String;
type Result<T> = std::result::Result<T, String>;

fn main() {
    println!("=== Backend Real-World Examples ===\n");
    
    // Example 1: Safe Database Connection Handling
    println!("1. Database Connection Pool (Ownership):");
    database_connection_example();
    println!();
    
    // Example 2: JWT Token Validation
    println!("2. JWT Token Validation (Borrowing):");
    jwt_validation_example();
    println!();
    
    // Example 3: Request Handler with Lifetimes
    println!("3. Request Handler (Lifetimes):");
    request_handler_example();
    println!();
    
    // Example 4: Shared State in Async Handlers
    println!("4. Shared State (Arc + Mutex):");
    shared_state_example();
    println!();
    
    // Example 5: Middleware Chain
    println!("5. Middleware Chain (Borrowing):");
    middleware_example();
    println!();
}

// ============================================================================
// Example 1: Database Connection Pool - Ownership ensures cleanup
// ============================================================================

struct DbConnection {
    id: u32,
}

impl DbConnection {
    fn new(id: u32) -> Self {
        println!("   ✅ Connection {} opened", id);
        DbConnection { id }
    }
    
    fn query(&self, sql: &str) -> Result<Vec<String>> {
        println!("   📊 Executing query on connection {}: {}", self.id, sql);
        Ok(vec!["row1".to_string(), "row2".to_string()])
    }
}

impl Drop for DbConnection {
    fn drop(&mut self) {
        println!("   ❌ Connection {} closed (automatic cleanup)", self.id);
    }
}

fn database_connection_example() {
    // Ownership ensures connection is closed when it goes out of scope
    {
        let conn = DbConnection::new(1);
        let _results = conn.query("SELECT * FROM users");
        // conn is dropped here - connection automatically closed
    }
    println!("   ✅ Connection cleaned up automatically via ownership");
}

// ============================================================================
// Example 2: JWT Token Validation - Borrowing avoids expensive copies
// ============================================================================

struct JwtSecret {
    secret: String,
}

impl JwtSecret {
    fn new(secret: String) -> Self {
        JwtSecret { secret }
    }
    
    // Borrows token and secret - no copying
    fn validate_token(&self, token: &str) -> Result<Claims> {
        println!("   🔐 Validating token (borrowed, not copied)");
        
        // In real code, this would decode and verify the JWT
        if token.starts_with("valid_") {
            Ok(Claims {
                user_id: 123,
                role: "admin".to_string(),
            })
        } else {
            Err("Invalid token".to_string())
        }
    }
}

struct Claims {
    user_id: u32,
    role: String,
}

fn jwt_validation_example() {
    let jwt_secret = JwtSecret::new("super-secret-key".to_string());
    let token = "valid_token_abc123";
    
    // Borrow token and secret - efficient, no copying
    match jwt_secret.validate_token(token) {
        Ok(claims) => {
            println!("   ✅ Token valid for user {} with role {}", 
                     claims.user_id, claims.role);
        }
        Err(e) => println!("   ❌ Token validation failed: {}", e),
    }
    
    // Both jwt_secret and token still valid here
    println!("   ✅ Original token still accessible: {}", token);
}

// ============================================================================
// Example 3: Request Handler - Lifetimes ensure data validity
// ============================================================================

struct Request<'a> {
    path: &'a str,
    method: &'a str,
    body: &'a str,
}

struct Response {
    status: u16,
    body: String,
}

// Lifetime 'a ensures request data outlives the handler
fn handle_request<'a>(req: &'a Request<'a>) -> Response {
    println!("   📨 Handling {} {}", req.method, req.path);
    
    // Lifetime ensures req.path is valid throughout function
    if req.path == "/api/users" && req.method == "GET" {
        Response {
            status: 200,
            body: r#"{"users": ["alice", "bob"]}"#.to_string(),
        }
    } else {
        Response {
            status: 404,
            body: "Not found".to_string(),
        }
    }
}

fn request_handler_example() {
    let path = "/api/users";
    let method = "GET";
    let body = "";
    
    let request = Request { path, method, body };
    let response = handle_request(&request);
    
    println!("   ✅ Response: {} - {}", response.status, response.body);
    println!("   ✅ Lifetimes ensured request data remained valid");
}

// ============================================================================
// Example 4: Shared State - Arc + Mutex for thread-safe access
// ============================================================================

struct AppState {
    request_count: u32,
    active_users: u32,
}

fn shared_state_example() {
    // Arc: Atomic Reference Counting - shared ownership
    // Mutex: Mutual exclusion - safe mutable access
    let state = Arc::new(Mutex::new(AppState {
        request_count: 0,
        active_users: 0,
    }));
    
    // Simulate multiple handlers accessing shared state
    let state1 = Arc::clone(&state);
    let state2 = Arc::clone(&state);
    
    // Handler 1
    {
        let mut data = state1.lock().unwrap();
        data.request_count += 1;
        data.active_users += 1;
        println!("   📊 Handler 1: {} requests, {} users", 
                 data.request_count, data.active_users);
    } // Lock released here
    
    // Handler 2
    {
        let mut data = state2.lock().unwrap();
        data.request_count += 1;
        println!("   📊 Handler 2: {} requests, {} users", 
                 data.request_count, data.active_users);
    } // Lock released here
    
    // Read final state
    {
        let data = state.lock().unwrap();
        println!("   ✅ Final state: {} requests, {} users", 
                 data.request_count, data.active_users);
    }
    
    println!("   ✅ No data races - Mutex ensures exclusive access");
}

// ============================================================================
// Example 5: Middleware Chain - Borrowing for efficient processing
// ============================================================================

struct Middleware {
    name: String,
}

impl Middleware {
    fn new(name: &str) -> Self {
        Middleware {
            name: name.to_string(),
        }
    }
    
    // Borrows request mutably to add headers
    fn process(&self, req: &mut RequestData) {
        println!("   🔧 Middleware '{}' processing request", self.name);
        req.headers.push(format!("X-{}: processed", self.name));
    }
}

struct RequestData {
    path: String,
    headers: Vec<String>,
}

fn middleware_example() {
    let auth_middleware = Middleware::new("Auth");
    let logging_middleware = Middleware::new("Logging");
    let cors_middleware = Middleware::new("CORS");
    
    let mut request = RequestData {
        path: "/api/users".to_string(),
        headers: vec![],
    };
    
    println!("   📨 Original request: {}", request.path);
    
    // Each middleware borrows request mutably, one at a time
    auth_middleware.process(&mut request);
    logging_middleware.process(&mut request);
    cors_middleware.process(&mut request);
    
    println!("   ✅ Final headers:");
    for header in &request.headers {
        println!("      - {}", header);
    }
    
    println!("   ✅ Request safely modified through borrowing chain");
}

/*
Real-World Backend Patterns Demonstrated:

1. Database Connections (Ownership):
   - Connection opened when created
   - Automatically closed when dropped
   - Prevents connection leaks
   - No manual cleanup needed

2. JWT Validation (Borrowing):
   - Borrow token and secret instead of copying
   - Efficient - no string allocations
   - Original values remain valid
   - Multiple validations possible

3. Request Handlers (Lifetimes):
   - Ensure request data outlives handler
   - Prevent dangling references
   - Compile-time safety guarantees
   - No runtime overhead

4. Shared State (Arc + Mutex):
   - Thread-safe shared ownership
   - Prevents data races
   - Exclusive mutable access
   - Automatic lock release

5. Middleware Chain (Borrowing):
   - Sequential mutable borrows
   - No copying of request data
   - Type-safe modifications
   - Compiler enforces order

Key Benefits for Backend Development:

✅ Memory Safety: No null pointers, no dangling references
✅ Thread Safety: No data races, enforced at compile time
✅ Performance: Zero-cost abstractions, no garbage collection
✅ Reliability: Bugs caught before production
✅ Resource Management: Automatic cleanup, no leaks

Common Backend Bugs Prevented:

❌ Use-after-free: Lifetimes prevent accessing freed memory
❌ Double-free: Ownership ensures single cleanup
❌ Data races: Borrowing rules prevent concurrent mutations
❌ Null pointer dereference: Option<T> instead of null
❌ Memory leaks: Drop trait ensures cleanup
❌ Iterator invalidation: Can't modify while iterating

This is why companies like Discord, Cloudflare, and AWS
use Rust for critical backend infrastructure!

Run this example:
    rustc backend_example.rs && ./backend_example
*/
