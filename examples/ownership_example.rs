// Ownership Example: Demonstrating Move Semantics and Drop Behavior

fn main() {
    println!("=== Ownership Example ===\n");

    // Example 1: Basic Ownership Transfer
    println!("1. Basic Ownership Transfer:");
    let s1 = String::from("hello");
    println!("   s1 = {}", s1);
    
    let s2 = s1; // Ownership moves from s1 to s2
    println!("   s2 = {}", s2);
    
    // ❌ This would cause a compile error:
    // println!("   s1 = {}", s1); // ERROR: value borrowed after move
    println!("   ✅ s1 is now invalid - ownership moved to s2\n");

    // Example 2: Why Ownership Matters - Preventing Double Free
    println!("2. Preventing Double Free:");
    {
        let data = String::from("important data");
        println!("   Created: {}", data);
        // When this scope ends, data is dropped and memory is freed
    }
    println!("   ✅ Memory freed exactly once - no double-free bug\n");

    // Example 3: Ownership with Functions
    println!("3. Ownership Transfer to Functions:");
    let message = String::from("Hello, Rust!");
    println!("   Before function call: {}", message);
    
    take_ownership(message); // message is moved into function
    
    // ❌ This would cause a compile error:
    // println!("   After function call: {}", message); // ERROR: value moved
    println!("   ✅ message is invalid after being moved to function\n");

    // Example 4: Returning Ownership from Functions
    println!("4. Returning Ownership:");
    let s3 = gives_ownership();
    println!("   Received ownership: {}", s3);
    
    let s4 = String::from("world");
    let s5 = takes_and_gives_back(s4);
    println!("   Ownership transferred through function: {}", s5);
    // s4 is invalid here, s5 owns the value
    println!("   ✅ Ownership can be returned from functions\n");

    // Example 5: Clone to Keep Original
    println!("5. Using Clone to Keep Original:");
    let original = String::from("original");
    let copy = original.clone(); // Deep copy - both are valid
    println!("   Original: {}", original);
    println!("   Copy: {}", copy);
    println!("   ✅ Both variables are valid - clone creates new ownership\n");

    // Example 6: Copy Types (Stack-Only Data)
    println!("6. Copy Types (Integers, Booleans, etc.):");
    let x = 5;
    let y = x; // Copy, not move - integers implement Copy trait
    println!("   x = {}, y = {}", x, y);
    println!("   ✅ Both valid - simple types are copied, not moved\n");

    // Example 7: Ownership in Backend Context
    println!("7. Backend Example - User Data:");
    let user_data = String::from("user@example.com");
    process_user_data(user_data);
    // user_data is moved and can't be used again
    println!("   ✅ User data processed and cleaned up automatically\n");
}

// Function that takes ownership
fn take_ownership(s: String) {
    println!("   Inside function: {}", s);
    // s is dropped here when function ends
}

// Function that gives ownership
fn gives_ownership() -> String {
    let some_string = String::from("yours");
    some_string // Ownership moved to caller
}

// Function that takes and returns ownership
fn takes_and_gives_back(a_string: String) -> String {
    a_string // Ownership moved back to caller
}

// Backend-style function
fn process_user_data(email: String) {
    println!("   Processing: {}", email);
    // Simulate database operation
    save_to_database(email);
    // email is dropped here - automatic cleanup
}

fn save_to_database(data: String) {
    println!("   Saved to database: {}", data);
    // data is dropped here
}

/* 
Key Takeaways:
1. Each value has exactly one owner
2. When owner goes out of scope, value is dropped (memory freed)
3. Ownership can be transferred (moved) to another variable or function
4. This prevents double-free errors and memory leaks
5. In backend code, this ensures resources are always cleaned up properly

Run this example:
    rustc ownership_example.rs && ./ownership_example
*/
