# Rust Memory Model Examples

This directory contains runnable examples demonstrating Rust's ownership, borrowing, and lifetime concepts.

## 📁 Files

1. **ownership_example.rs** - Demonstrates ownership transfer and drop behavior
2. **borrowing_example.rs** - Shows immutable and mutable borrowing rules
3. **lifetime_example.rs** - Explains lifetime annotations and reference validity
4. **backend_example.rs** - Real-world Actix Web patterns

## 🚀 Running the Examples

### Compile and run individual examples:

```bash
# Ownership example
rustc ownership_example.rs && ./ownership_example

# Borrowing example
rustc borrowing_example.rs && ./borrowing_example

# Lifetime example
rustc lifetime_example.rs && ./lifetime_example

# Backend example
rustc backend_example.rs && ./backend_example
```

### Or run all examples:

```bash
# On Unix/Linux/Mac:
for file in *.rs; do
    echo "Running $file..."
    rustc "$file" && ./"${file%.rs}"
    echo ""
done

# On Windows PowerShell:
Get-ChildItem *.rs | ForEach-Object {
    Write-Host "Running $($_.Name)..."
    rustc $_.Name
    $exe = $_.BaseName + ".exe"
    & ".\$exe"
    Write-Host ""
}
```

## 📚 What Each Example Teaches

### ownership_example.rs
- Value movement and ownership transfer
- Automatic memory cleanup (Drop trait)
- Preventing double-free errors
- Clone vs Move semantics
- Copy types (stack-only data)

### borrowing_example.rs
- Immutable references (&T)
- Mutable references (&mut T)
- Borrowing rules enforcement
- Preventing data races
- Iterator invalidation prevention

### lifetime_example.rs
- Lifetime annotations ('a, 'b)
- Reference validity guarantees
- Struct lifetimes
- Lifetime elision
- Static lifetimes

### backend_example.rs
- Database connection management
- JWT token validation
- Request handler patterns
- Shared state with Arc<Mutex<T>>
- Middleware chains

## 🎯 Learning Path

1. Start with **ownership_example.rs** to understand the basics
2. Move to **borrowing_example.rs** to learn about references
3. Study **lifetime_example.rs** for advanced reference handling
4. Finish with **backend_example.rs** to see real-world applications

## 💡 Key Concepts

### Ownership Rules
1. Each value has exactly one owner
2. When the owner goes out of scope, the value is dropped
3. Ownership can be transferred (moved)

### Borrowing Rules
1. Multiple immutable references OR one mutable reference
2. References must always be valid
3. Cannot have mutable and immutable references simultaneously

### Lifetime Rules
1. Lifetimes ensure references remain valid
2. Compiler prevents dangling references
3. Lifetime annotations describe relationships between references

## 🔧 Troubleshooting

### Common Compile Errors

**Error: "value borrowed after move"**
- Solution: Use borrowing (&) instead of moving, or clone the value

**Error: "cannot borrow as mutable more than once"**
- Solution: Limit mutable borrow scope or use RefCell/Mutex

**Error: "lifetime may not live long enough"**
- Solution: Adjust function signature or use owned types

## 📖 Additional Resources

- [The Rust Book - Ownership](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html)
- [The Rust Book - References and Borrowing](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html)
- [The Rust Book - Lifetimes](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html)
- [Rust by Example - Ownership](https://doc.rust-lang.org/rust-by-example/scope/move.html)

## 🎓 Next Steps

After understanding these examples:
1. Review the main documentation in `../RUST_MEMORY_MODEL.md`
2. Examine the auth-service implementation in `../auth-service/src/main.rs`
3. Try modifying the examples to experiment with different scenarios
4. Apply these concepts to your own Rust projects
