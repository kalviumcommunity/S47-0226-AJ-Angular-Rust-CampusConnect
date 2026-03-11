# Rust Memory Model: Ownership, Borrowing & Lifetimes

## 📚 Table of Contents
1. [Ownership](#ownership)
2. [Borrowing](#borrowing)
3. [Lifetimes](#lifetimes)
4. [Backend Application](#backend-application)
5. [Code Examples](#code-examples)

---

## 🔐 Ownership

### What is Ownership?

Ownership is Rust's core memory management principle that ensures memory safety without a garbage collector. Think of it like having a single key to a locked room - only one person can hold the key at any given time.

### Key Rules:
1. **Each value has exactly one owner** - No shared ownership by default
2. **When the owner goes out of scope, the value is dropped** - Automatic cleanup
3. **Ownership can be transferred (moved)** - The key changes hands

### How It Works:

When you assign a value to a variable, that variable becomes the owner. If you assign that value to another variable, ownership moves to the new variable, and the original variable becomes invalid.

```rust
let s1 = String::from("hello");
let s2 = s1; // Ownership moves from s1 to s2
// s1 is now invalid and cannot be used
```

### Why This Matters:

- **No double-free errors**: Only one owner means memory is freed exactly once
- **No dangling pointers**: You can't access data after it's been freed
- **Predictable cleanup**: Memory is freed as soon as the owner goes out of scope

---

## 🔄 Borrowing

### What is Borrowing?

Borrowing allows you to reference data without taking ownership. It's like lending someone your book - they can read it, but you still own it and get it back.

### Key Rules:
1. **You can have unlimited immutable references (&T)** - Multiple readers are safe
2. **OR exactly one mutable reference (&mut T)** - Only one writer at a time
3. **References must always be valid** - No dangling references allowed

### Immutable Borrowing:

Multiple parts of your code can read data simultaneously without conflicts.

```rust
fn print_len(s: &String) {
    println!("Length: {}", s.len());
}

let text = String::from("hello");
print_len(&text); // Borrow text
print_len(&text); // Can borrow again
println!("{}", text); // Original owner still valid
```

### Mutable Borrowing:

Only one part of your code can modify data at a time, preventing data races.

```rust
fn add_exclamation(s: &mut String) {
    s.push_str("!");
}

let mut text = String::from("hello");
add_exclamation(&mut text);
println!("{}", text); // Prints: hello!
```

### Borrowing Errors:

Rust prevents common bugs at compile time:

```rust
// ❌ ERROR: Cannot have mutable and immutable references simultaneously
let mut s = String::from("hello");
let r1 = &s;     // immutable borrow
let r2 = &mut s; // ERROR: cannot borrow as mutable while immutably borrowed

// ❌ ERROR: Cannot have multiple mutable references
let mut s = String::from("hello");
let r1 = &mut s;
let r2 = &mut s; // ERROR: cannot borrow as mutable more than once
```

### Why This Matters:

- **Prevents data races**: No simultaneous read/write conflicts
- **Thread safety**: Borrowing rules enforce safe concurrent access
- **No iterator invalidation**: Can't modify a collection while iterating over it

---

## ⏱️ Lifetimes

### What are Lifetimes?

Lifetimes are Rust's way of ensuring that references remain valid for as long as they're used. They're like expiration dates on references - Rust checks that you don't use expired references.

### The Problem Lifetimes Solve:

Without lifetimes, you could return a reference to data that gets destroyed:

```rust
// This would be dangerous without lifetime checking:
fn get_reference() -> &String {
    let s = String::from("hello");
    &s // ERROR: s is dropped here, reference would be invalid!
}
```

### Lifetime Annotations:

Lifetime annotations tell Rust how long references should remain valid. They don't change how long values live - they just describe the relationships between references.

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

### What `'a` Guarantees:

The lifetime `'a` means: "The returned reference will be valid for at least as long as both input references are valid."

In other words:
- If `x` lives for 10 seconds and `y` lives for 5 seconds
- The returned reference is only guaranteed valid for 5 seconds (the shorter lifetime)
- Rust ensures you can't use the reference after that

### Lifetime Example:

```rust
fn main() {
    let string1 = String::from("long string");
    let result;
    
    {
        let string2 = String::from("short");
        result = longest(string1.as_str(), string2.as_str());
        println!("{}", result); // ✅ Valid: string2 still in scope
    }
    
    // ❌ ERROR: result references string2, which is now dropped
    // println!("{}", result);
}
```

### Why This Matters:

- **No dangling references**: Compiler prevents use-after-free bugs
- **Clear contracts**: Function signatures show how long data must live
- **Zero runtime cost**: All checks happen at compile time

---

## 🚀 Backend Application: How These Concepts Prevent Bugs

### In Actix Web / Axum Applications:

Rust's memory model provides critical safety guarantees for backend services:

### 1. Preventing Dangling References in Request Handlers

```rust
// ❌ This would be caught at compile time:
async fn bad_handler() -> HttpResponse {
    let data = String::from("response");
    HttpResponse::Ok().body(&data) // ERROR: data dropped before response sent
}

// ✅ Correct: Ownership transferred to response
async fn good_handler() -> HttpResponse {
    let data = String::from("response");
    HttpResponse::Ok().body(data) // Ownership moved
}
```

**Why it matters**: In traditional languages, returning a reference to local data causes crashes. Rust prevents this at compile time.

### 2. Safe Database Connection Handling

```rust
// Ownership ensures connections are properly closed
async fn query_user(pool: &DbPool, user_id: i32) -> Result<User, Error> {
    let conn = pool.get().await?; // Borrow connection from pool
    let user = conn.query_one("SELECT * FROM users WHERE id = $1", &[&user_id]).await?;
    Ok(user)
} // conn automatically returned to pool when dropped
```

**Why it matters**: Database connections are expensive resources. Ownership ensures they're always released, preventing connection leaks.

### 3. Preventing Race Conditions in Async Tasks

```rust
// ❌ This won't compile - prevents data races:
let mut counter = 0;
tokio::spawn(async move {
    counter += 1; // ERROR: counter moved into this task
});
tokio::spawn(async move {
    counter += 1; // ERROR: counter already moved
});

// ✅ Correct: Use Arc<Mutex<T>> for shared mutable state
let counter = Arc::new(Mutex::new(0));
let counter1 = counter.clone();
let counter2 = counter.clone();

tokio::spawn(async move {
    let mut num = counter1.lock().await;
    *num += 1;
});
tokio::spawn(async move {
    let mut num = counter2.lock().await;
    *num += 1;
});
```

**Why it matters**: Concurrent access to shared data causes race conditions. Rust forces you to use proper synchronization primitives.

### 4. Safe JWT Token Validation

```rust
// Borrowing prevents unnecessary cloning
async fn validate_token(token: &str, secret: &str) -> Result<Claims, Error> {
    // token and secret are borrowed, not copied
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default()
    )
} // No cleanup needed - we never owned the data
```

**Why it matters**: Borrowing avoids expensive string copies in hot paths, improving performance without sacrificing safety.

### 5. Ensuring Valid Request Data

```rust
// Lifetimes ensure request data outlives the handler
async fn process_request<'a>(
    req: &'a HttpRequest,
    data: &'a web::Json<UserData>
) -> Result<HttpResponse, Error> {
    // Compiler ensures req and data are valid throughout function
    validate_user(&data.username)?;
    Ok(HttpResponse::Ok().json(data.into_inner()))
}
```

**Why it matters**: In async handlers, data might be accessed after the request is dropped. Lifetimes prevent this entire class of bugs.

### 6. Memory-Safe Middleware Chains

```rust
// Ownership ensures middleware state is properly managed
pub struct AuthMiddleware {
    jwt_secret: String, // Owned by middleware
}

impl AuthMiddleware {
    pub fn new(secret: String) -> Self {
        Self { jwt_secret: secret }
    }
    
    pub async fn validate(&self, token: &str) -> Result<Claims, Error> {
        // Borrows jwt_secret, doesn't move it
        decode_token(token, &self.jwt_secret)
    }
}
```

**Why it matters**: Middleware runs on every request. Ownership ensures configuration data lives as long as the server without memory leaks.

### Real-World Impact:

1. **No Null Pointer Exceptions**: Rust's ownership prevents null/undefined errors that crash production servers
2. **No Memory Leaks**: Automatic cleanup when owners go out of scope
3. **No Data Races**: Borrowing rules enforced at compile time prevent concurrent access bugs
4. **No Use-After-Free**: Lifetimes ensure references are always valid
5. **Better Performance**: Zero-cost abstractions mean safety doesn't sacrifice speed

### The Bottom Line:

In backend development, these bugs are expensive:
- Crashes lose customer data and revenue
- Memory leaks require server restarts
- Race conditions cause data corruption
- Security vulnerabilities from invalid memory access

Rust's ownership, borrowing, and lifetimes eliminate these entire categories of bugs **before your code ever runs in production**. This is why companies like Discord, Cloudflare, and AWS use Rust for critical backend services.

---

## 📝 Code Examples

See the `examples/` directory for runnable code demonstrating:
- `ownership_example.rs` - Value movement and drop behavior
- `borrowing_example.rs` - Immutable and mutable references
- `lifetime_example.rs` - Lifetime annotations in functions
- `backend_example.rs` - Real-world Actix Web patterns

---

## 🎯 Summary

| Concept | Purpose | Key Benefit |
|---------|---------|-------------|
| **Ownership** | One owner per value | Prevents double-free and memory leaks |
| **Borrowing** | Temporary access without ownership | Prevents data races and concurrent bugs |
| **Lifetimes** | Ensures references stay valid | Prevents dangling pointers and use-after-free |

Together, these concepts make Rust one of the safest languages for building reliable backend systems.
