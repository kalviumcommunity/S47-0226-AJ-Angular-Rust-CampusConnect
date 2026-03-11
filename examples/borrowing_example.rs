// Borrowing Example: Demonstrating References and Borrowing Rules

fn main() {
    println!("=== Borrowing Example ===\n");

    // Example 1: Immutable Borrowing
    println!("1. Immutable Borrowing (Multiple Readers):");
    let text = String::from("Hello, Rust!");
    
    // Multiple immutable borrows are allowed
    let len = calculate_length(&text);
    print_message(&text);
    print_message(&text); // Can borrow multiple times
    
    println!("   Original text: {}", text);
    println!("   Length: {}", len);
    println!("   ✅ Original owner still valid after borrowing\n");

    // Example 2: Mutable Borrowing
    println!("2. Mutable Borrowing (Single Writer):");
    let mut message = String::from("Hello");
    println!("   Before: {}", message);
    
    add_exclamation(&mut message);
    println!("   After: {}", message);
    println!("   ✅ Mutable borrow allows modification\n");

    // Example 3: Borrowing Rules - Cannot Mix Mutable and Immutable
    println!("3. Borrowing Rules Enforcement:");
    let mut data = String::from("data");
    
    // ✅ This works - immutable borrows end before mutable borrow
    let r1 = &data;
    let r2 = &data;
    println!("   Immutable borrows: {} and {}", r1, r2);
    // r1 and r2 are no longer used after this point
    
    let r3 = &mut data;
    r3.push_str(" modified");
    println!("   Mutable borrow: {}", r3);
    
    // ❌ This would cause compile errors:
    // let r1 = &data;
    // let r2 = &mut data; // ERROR: cannot borrow as mutable while immutably borrowed
    // println!("{} {}", r1, r2);
    
    println!("   ✅ Rust prevents simultaneous mutable and immutable borrows\n");

    // Example 4: Multiple Mutable Borrows Not Allowed
    println!("4. Single Mutable Borrow Rule:");
    let mut value = String::from("value");
    
    {
        let r1 = &mut value;
        r1.push_str(" updated");
        println!("   First mutable borrow: {}", r1);
        // r1 scope ends here
    }
    
    {
        let r2 = &mut value;
        r2.push_str(" again");
        println!("   Second mutable borrow: {}", r2);
    }
    
    // ❌ This would cause a compile error:
    // let r1 = &mut value;
    // let r2 = &mut value; // ERROR: cannot borrow as mutable more than once
    // println!("{} {}", r1, r2);
    
    println!("   ✅ Only one mutable borrow at a time prevents data races\n");

    // Example 5: Backend Use Case - Reading Configuration
    println!("5. Backend Example - Configuration:");
    let config = Config {
        database_url: String::from("mongodb://localhost:27017"),
        jwt_secret: String::from("secret-key"),
        port: 8080,
    };
    
    // Multiple parts of code can read config simultaneously
    validate_config(&config);
    print_config(&config);
    start_server(&config);
    
    println!("   ✅ Config borrowed by multiple functions safely\n");

    // Example 6: Backend Use Case - Modifying Request Data
    println!("6. Backend Example - Request Processing:");
    let mut request = Request {
        path: String::from("/api/users"),
        method: String::from("GET"),
        body: String::new(),
    };
    
    println!("   Original request: {} {}", request.method, request.path);
    
    // Middleware can modify request
    add_auth_header(&mut request);
    normalize_path(&mut request);
    
    println!("   Modified request: {} {}", request.method, request.path);
    println!("   Body: {}", request.body);
    println!("   ✅ Request safely modified through mutable borrows\n");

    // Example 7: Preventing Iterator Invalidation
    println!("7. Preventing Iterator Invalidation:");
    let mut numbers = vec![1, 2, 3, 4, 5];
    
    // ✅ This works - immutable borrow for iteration
    for num in &numbers {
        println!("   Number: {}", num);
    }
    
    // ✅ This works - mutable borrow after iteration ends
    numbers.push(6);
    println!("   Added 6 to vector: {:?}", numbers);
    
    // ❌ This would cause a compile error:
    // for num in &numbers {
    //     numbers.push(10); // ERROR: cannot borrow as mutable while iterating
    // }
    
    println!("   ✅ Rust prevents modifying collection while iterating\n");
}

// Immutable borrow - can read but not modify
fn calculate_length(s: &String) -> usize {
    s.len()
    // s is not dropped here - we don't own it
}

fn print_message(s: &String) {
    println!("   Message: {}", s);
}

// Mutable borrow - can modify the value
fn add_exclamation(s: &mut String) {
    s.push_str("!");
}

// Backend example structs
struct Config {
    database_url: String,
    jwt_secret: String,
    port: u16,
}

struct Request {
    path: String,
    method: String,
    body: String,
}

// Functions that borrow config immutably
fn validate_config(config: &Config) {
    println!("   Validating config...");
    println!("   Database: {}", config.database_url);
}

fn print_config(config: &Config) {
    println!("   Port: {}", config.port);
}

fn start_server(config: &Config) {
    println!("   Starting server on port {}", config.port);
}

// Functions that borrow request mutably
fn add_auth_header(req: &mut Request) {
    req.body.push_str("Authorization: Bearer token123");
}

fn normalize_path(req: &mut Request) {
    req.path = req.path.to_lowercase();
}

/*
Key Takeaways:
1. Immutable borrows (&T): Multiple readers allowed, no modification
2. Mutable borrows (&mut T): Single writer, exclusive access
3. Cannot have mutable and immutable borrows simultaneously
4. Cannot have multiple mutable borrows simultaneously
5. These rules prevent data races at compile time
6. In backend code, this ensures thread-safe access to shared data

Common Borrowing Errors and Solutions:

❌ ERROR: cannot borrow as mutable while immutably borrowed
Solution: Ensure immutable borrows end before mutable borrow

❌ ERROR: cannot borrow as mutable more than once
Solution: Use scopes to limit mutable borrow lifetime, or use RefCell/Mutex

❌ ERROR: cannot borrow as immutable while mutably borrowed
Solution: Finish mutable operations before reading

Run this example:
    rustc borrowing_example.rs && ./borrowing_example
*/
