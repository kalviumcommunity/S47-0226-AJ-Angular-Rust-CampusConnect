// Lifetime Example: Demonstrating Lifetime Annotations and Reference Validity

fn main() {
    println!("=== Lifetime Example ===\n");

    // Example 1: Basic Lifetime - Longest String
    println!("1. Basic Lifetime Annotation:");
    let string1 = String::from("long string is long");
    let string2 = String::from("short");
    
    let result = longest(string1.as_str(), string2.as_str());
    println!("   The longest string is: {}", result);
    println!("   ✅ Lifetime 'a ensures result is valid\n");

    // Example 2: Lifetime Scope Demonstration
    println!("2. Lifetime Scope:");
    let string1 = String::from("outer scope");
    let result;
    
    {
        let string2 = String::from("inner scope");
        result = longest(string1.as_str(), string2.as_str());
        println!("   Inside inner scope: {}", result);
        // ✅ Valid: string2 still exists
    }
    
    // ❌ This would cause a compile error:
    // println!("   Outside inner scope: {}", result);
    // ERROR: string2 dropped, result might reference it
    
    println!("   ✅ Rust prevents using result after string2 is dropped\n");

    // Example 3: Struct with Lifetime
    println!("3. Struct with Lifetime:");
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().expect("Could not find a '.'");
    
    let excerpt = ImportantExcerpt {
        part: first_sentence,
    };
    
    println!("   Excerpt: {}", excerpt.part);
    println!("   ✅ Struct holds reference with lifetime annotation\n");

    // Example 4: Multiple Lifetime Parameters
    println!("4. Multiple Lifetime Parameters:");
    let string1 = String::from("first");
    let string2 = String::from("second");
    
    let announcement = "Comparing strings!";
    let result = longest_with_announcement(
        string1.as_str(),
        string2.as_str(),
        announcement,
    );
    println!("   Result: {}", result);
    println!("   ✅ Different lifetimes for different parameters\n");

    // Example 5: Backend Use Case - Request Handler
    println!("5. Backend Example - Request Handler:");
    let request_data = String::from("user_id=123&action=login");
    let config = ServerConfig {
        max_connections: 100,
        timeout: 30,
    };
    
    let handler = RequestHandler {
        request: &request_data,
        config: &config,
    };
    
    handler.process();
    println!("   ✅ Handler safely references request and config\n");

    // Example 6: Backend Use Case - Database Query Result
    println!("6. Backend Example - Query Result:");
    let query = String::from("SELECT * FROM users WHERE id = 1");
    let result = execute_query(&query);
    
    println!("   Query: {}", result.query);
    println!("   Rows affected: {}", result.rows_affected);
    println!("   ✅ Query result references original query string\n");

    // Example 7: Lifetime Elision (Implicit Lifetimes)
    println!("7. Lifetime Elision:");
    let text = String::from("Hello, World!");
    let first_word = get_first_word(&text);
    println!("   First word: {}", first_word);
    println!("   ✅ Compiler infers lifetime automatically\n");

    // Example 8: Static Lifetime
    println!("8. Static Lifetime:");
    let s: &'static str = "I live for the entire program";
    print_static(s);
    println!("   ✅ Static references live for entire program duration\n");
}

// Basic lifetime annotation
// 'a means: returned reference valid as long as both inputs are valid
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

// Struct with lifetime - part must live as long as the struct
struct ImportantExcerpt<'a> {
    part: &'a str,
}

// Multiple lifetime parameters
// 'a for x and y (and return value)
// 'b for announcement (independent lifetime)
fn longest_with_announcement<'a, 'b>(
    x: &'a str,
    y: &'a str,
    announcement: &'b str,
) -> &'a str {
    println!("   Announcement: {}", announcement);
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

// Backend example: Request handler with lifetimes
struct ServerConfig {
    max_connections: u32,
    timeout: u32,
}

struct RequestHandler<'a, 'b> {
    request: &'a str,
    config: &'b ServerConfig,
}

impl<'a, 'b> RequestHandler<'a, 'b> {
    fn process(&self) {
        println!("   Processing request: {}", self.request);
        println!("   Max connections: {}", self.config.max_connections);
        println!("   Timeout: {}s", self.config.timeout);
    }
}

// Backend example: Query result with lifetime
struct QueryResult<'a> {
    query: &'a str,
    rows_affected: u32,
}

fn execute_query<'a>(query: &'a str) -> QueryResult<'a> {
    println!("   Executing: {}", query);
    QueryResult {
        query,
        rows_affected: 1,
    }
}

// Lifetime elision - compiler infers lifetime
// Equivalent to: fn get_first_word<'a>(s: &'a str) -> &'a str
fn get_first_word(s: &str) -> &str {
    let bytes = s.as_bytes();
    
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[0..i];
        }
    }
    
    &s[..]
}

// Static lifetime - lives for entire program
fn print_static(s: &'static str) {
    println!("   Static string: {}", s);
}

// Advanced example: Method with lifetime
impl<'a> ImportantExcerpt<'a> {
    fn level(&self) -> i32 {
        3
    }
    
    // Lifetime elision: self's lifetime used for return value
    fn announce_and_return_part(&self, announcement: &str) -> &str {
        println!("   Attention: {}", announcement);
        self.part
    }
}

/*
Key Takeaways:
1. Lifetimes ensure references remain valid
2. 'a is a lifetime parameter - describes relationship between references
3. Returned reference can't outlive the data it references
4. Compiler prevents dangling references at compile time
5. Lifetime elision: compiler infers lifetimes in simple cases
6. 'static: reference valid for entire program duration

Common Lifetime Patterns:

Pattern 1: Input and output have same lifetime
fn process<'a>(input: &'a str) -> &'a str

Pattern 2: Multiple inputs, one output
fn combine<'a>(x: &'a str, y: &'a str) -> &'a str

Pattern 3: Struct holding references
struct Container<'a> {
    data: &'a str,
}

Pattern 4: Independent lifetimes
fn process<'a, 'b>(x: &'a str, y: &'b str) -> &'a str

Backend Applications:
- Request handlers: Ensure request data outlives handler
- Database connections: Ensure queries don't outlive connections
- Configuration: Ensure config references remain valid
- Middleware: Ensure request/response references are valid

Common Lifetime Errors:

❌ ERROR: lifetime may not live long enough
Solution: Adjust function signature or use owned types

❌ ERROR: cannot return reference to local variable
Solution: Return owned type (String) instead of reference (&str)

❌ ERROR: borrowed value does not live long enough
Solution: Extend lifetime of borrowed value or clone it

Run this example:
    rustc lifetime_example.rs && ./lifetime_example
*/
