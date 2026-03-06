use actix_web::{web, App, HttpServer, HttpResponse, HttpRequest, Error, middleware};
use actix_cors::Cors;
use mongodb::{Client, Collection, bson::{doc, oid::ObjectId}};
use serde::{Deserialize, Serialize};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use chrono::{DateTime, Utc, Duration};
use std::env;

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    role: String,
    campus_id: String,
    exp: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Book {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    isbn: String,
    title: String,
    author: String,
    category: String,
    total_copies: i32,
    available_copies: i32,
    campus_id: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
struct BookRequest {
    isbn: String,
    title: String,
    author: String,
    category: String,
    total_copies: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct BookIssue {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    book_id: String,
    book_title: String,
    student_id: String,
    issue_date: DateTime<Utc>,
    due_date: DateTime<Utc>,
    return_date: Option<DateTime<Utc>>,
    status: String, // issued, returned, overdue
    fine_amount: f64,
    campus_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct IssueRequest {
    book_id: String,
    student_id: String,
    days: i64,
}

#[derive(Debug, Serialize, Deserialize)]
struct ReturnRequest {
    issue_id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct WaitingListEntry {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    book_id: String,
    book_title: String,
    student_id: String,
    queued_at: DateTime<Utc>,
    status: String, // waiting, notified, fulfilled, cancelled
    campus_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct WaitingListRequest {
    book_id: String,
    student_id: String,
}

struct AppState {
    db: mongodb::Database,
    jwt_secret: String,
}

fn extract_claims(req: &HttpRequest, jwt_secret: &str) -> Result<Claims, String> {
    if let Some(auth_header) = req.headers().get("Authorization") {
        if let Ok(auth_str) = auth_header.to_str() {
            if auth_str.starts_with("Bearer ") {
                let token = &auth_str[7..];
                
                match decode::<Claims>(
                    token,
                    &DecodingKey::from_secret(jwt_secret.as_bytes()),
                    &Validation::new(Algorithm::HS256),
                ) {
                    Ok(token_data) => return Ok(token_data.claims),
                    Err(_) => return Err("Invalid token".to_string()),
                }
            }
        }
    }
    Err("No token provided".to_string())
}

async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "service": "library-service"
    }))
}

// Book Management
async fn add_book(
    data: web::Data<AppState>,
    req: HttpRequest,
    book_data: web::Json<BookRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<Book> = data.db.collection("books");

    let new_book = Book {
        id: None,
        isbn: book_data.isbn.clone(),
        title: book_data.title.clone(),
        author: book_data.author.clone(),
        category: book_data.category.clone(),
        total_copies: book_data.total_copies,
        available_copies: book_data.total_copies,
        campus_id: claims.campus_id,
        created_at: Utc::now(),
    };

    collection
        .insert_one(new_book, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Book added successfully"
    })))
}

async fn get_books(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<Book> = data.db.collection("books");

    let mut cursor = collection
        .find(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut books = Vec::new();
    use futures::stream::StreamExt;
    
    while let Some(result) = cursor.next().await {
        match result {
            Ok(book) => books.push(book),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    Ok(HttpResponse::Ok().json(books))
}

// Issue Book
async fn issue_book(
    data: web::Data<AppState>,
    req: HttpRequest,
    issue_data: web::Json<IssueRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let book_collection: Collection<Book> = data.db.collection("books");
    let issue_collection: Collection<BookIssue> = data.db.collection("book_issues");

    // Get book details
    let book_obj_id = ObjectId::parse_str(&issue_data.book_id)
        .map_err(|e| actix_web::error::ErrorBadRequest(e))?;

    let book = book_collection
        .find_one(doc! { "_id": book_obj_id, "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let book = match book {
        Some(b) => b,
        None => return Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Book not found"
        }))),
    };

    // Check availability
    if book.available_copies <= 0 {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Book not available"
        })));
    }

    // Create issue record
    let issue_date = Utc::now();
    let due_date = issue_date + Duration::days(issue_data.days);

    let new_issue = BookIssue {
        id: None,
        book_id: issue_data.book_id.clone(),
        book_title: book.title.clone(),
        student_id: issue_data.student_id.clone(),
        issue_date,
        due_date,
        return_date: None,
        status: "issued".to_string(),
        fine_amount: 0.0,
        campus_id: claims.campus_id.clone(),
    };

    issue_collection
        .insert_one(new_issue, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    // Update book availability
    book_collection
        .update_one(
            doc! { "_id": book_obj_id },
            doc! { "$inc": { "available_copies": -1 } },
            None,
        )
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Book issued successfully",
        "due_date": due_date
    })))
}

// Return Book
async fn return_book(
    data: web::Data<AppState>,
    req: HttpRequest,
    return_data: web::Json<ReturnRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let issue_collection: Collection<BookIssue> = data.db.collection("book_issues");
    let book_collection: Collection<Book> = data.db.collection("books");

    // Get issue record
    let issue_obj_id = ObjectId::parse_str(&return_data.issue_id)
        .map_err(|e| actix_web::error::ErrorBadRequest(e))?;

    let issue = issue_collection
        .find_one(doc! { "_id": issue_obj_id, "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let issue = match issue {
        Some(i) => i,
        None => return Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Issue record not found"
        }))),
    };

    // Calculate fine if overdue
    let return_date = Utc::now();
    let mut fine_amount = 0.0;
    let mut status = "returned".to_string();

    if return_date > issue.due_date {
        let overdue_days = (return_date - issue.due_date).num_days();
        fine_amount = overdue_days as f64 * 5.0; // $5 per day
        status = "returned_with_fine".to_string();
    }

    // Update issue record
    issue_collection
        .update_one(
            doc! { "_id": issue_obj_id },
            doc! {
                "$set": {
                    "return_date": mongodb::bson::DateTime::from_millis(return_date.timestamp_millis()),
                    "status": &status,
                    "fine_amount": fine_amount
                }
            },
            None,
        )
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    // Update book availability
    let book_obj_id = ObjectId::parse_str(&issue.book_id)
        .map_err(|e| actix_web::error::ErrorBadRequest(e))?;

    book_collection
        .update_one(
            doc! { "_id": book_obj_id },
            doc! { "$inc": { "available_copies": 1 } },
            None,
        )
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Book returned successfully",
        "fine_amount": fine_amount
    })))
}

// Get all issues
async fn get_issues(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<BookIssue> = data.db.collection("book_issues");

    let mut cursor = collection
        .find(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut issues = Vec::new();
    use futures::stream::StreamExt;
    
    while let Some(result) = cursor.next().await {
        match result {
            Ok(issue) => issues.push(issue),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    Ok(HttpResponse::Ok().json(issues))
}

// ===== LIBRARIAN DASHBOARD ENDPOINTS =====

// Get all currently borrowed books
async fn librarian_borrowed_books(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    if claims.role != "librarian" && claims.role != "admin" {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Access denied: Librarian role required"
        })));
    }

    let collection: Collection<BookIssue> = data.db.collection("book_issues");
    let now = Utc::now();

    // First, auto-mark overdue: any issued book past due_date
    let now_bson = mongodb::bson::DateTime::from_millis(now.timestamp_millis());
    let _ = collection
        .update_many(
            doc! {
                "campus_id": &claims.campus_id,
                "status": "issued",
                "due_date": { "$lt": now_bson }
            },
            doc! { "$set": { "status": "overdue" } },
            None,
        )
        .await;

    let mut cursor = collection
        .find(doc! {
            "campus_id": &claims.campus_id,
            "status": { "$in": ["issued", "overdue"] }
        }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut borrowed = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        match result {
            Ok(issue) => borrowed.push(issue),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    let overdue_count = borrowed.iter().filter(|b| b.status == "overdue").count();
    let issued_count = borrowed.iter().filter(|b| b.status == "issued").count();

    // Calculate days remaining/overdue for each
    let enriched: Vec<serde_json::Value> = borrowed.iter().map(|b| {
        let days_diff = (b.due_date - now).num_days();
        serde_json::json!({
            "_id": b.id,
            "book_id": b.book_id,
            "book_title": b.book_title,
            "student_id": b.student_id,
            "issue_date": b.issue_date,
            "due_date": b.due_date,
            "status": b.status,
            "days_remaining": if days_diff >= 0 { days_diff } else { 0 },
            "days_overdue": if days_diff < 0 { -days_diff } else { 0 }
        })
    }).collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "total_borrowed": borrowed.len(),
        "issued_count": issued_count,
        "overdue_count": overdue_count,
        "books": enriched
    })))
}

// Get returned books history
async fn librarian_returned_books(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    if claims.role != "librarian" && claims.role != "admin" {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Access denied: Librarian role required"
        })));
    }

    let collection: Collection<BookIssue> = data.db.collection("book_issues");

    let mut cursor = collection
        .find(doc! {
            "campus_id": &claims.campus_id,
            "status": { "$in": ["returned", "returned_with_fine"] }
        }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut returned = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        match result {
            Ok(issue) => returned.push(issue),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    let total_fines: f64 = returned.iter().map(|r| r.fine_amount).sum();
    let with_fine: Vec<&BookIssue> = returned.iter().filter(|r| r.fine_amount > 0.0).collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "total_returned": returned.len(),
        "total_fines_collected": total_fines,
        "returned_with_fine": with_fine.len(),
        "books": returned
    })))
}

// Get library dashboard summary
async fn librarian_summary(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    if claims.role != "librarian" && claims.role != "admin" {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Access denied: Librarian role required"
        })));
    }

    let book_collection: Collection<Book> = data.db.collection("books");
    let issue_collection: Collection<BookIssue> = data.db.collection("book_issues");
    let waitlist_collection: Collection<WaitingListEntry> = data.db.collection("waiting_list");

    // Count books
    let total_books = book_collection
        .count_documents(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .unwrap_or(0) as i64;

    // Count currently issued
    let now = Utc::now();
    let now_bson = mongodb::bson::DateTime::from_millis(now.timestamp_millis());

    // Auto-mark overdue
    let _ = issue_collection
        .update_many(
            doc! { "campus_id": &claims.campus_id, "status": "issued", "due_date": { "$lt": now_bson } },
            doc! { "$set": { "status": "overdue" } },
            None,
        )
        .await;

    let borrowed_count = issue_collection
        .count_documents(doc! { "campus_id": &claims.campus_id, "status": { "$in": ["issued", "overdue"] } }, None)
        .await
        .unwrap_or(0) as i64;

    let overdue_count = issue_collection
        .count_documents(doc! { "campus_id": &claims.campus_id, "status": "overdue" }, None)
        .await
        .unwrap_or(0) as i64;

    let returned_count = issue_collection
        .count_documents(doc! { "campus_id": &claims.campus_id, "status": { "$in": ["returned", "returned_with_fine"] } }, None)
        .await
        .unwrap_or(0) as i64;

    let waiting_count = waitlist_collection
        .count_documents(doc! { "campus_id": &claims.campus_id, "status": "waiting" }, None)
        .await
        .unwrap_or(0) as i64;

    // Due within 2 days (approaching due)
    let two_days = now + Duration::days(2);
    let two_days_bson = mongodb::bson::DateTime::from_millis(two_days.timestamp_millis());
    let due_soon_count = issue_collection
        .count_documents(doc! {
            "campus_id": &claims.campus_id,
            "status": "issued",
            "due_date": { "$lte": two_days_bson, "$gte": now_bson }
        }, None)
        .await
        .unwrap_or(0) as i64;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "total_books": total_books,
        "currently_borrowed": borrowed_count,
        "overdue": overdue_count,
        "returned": returned_count,
        "waiting_list": waiting_count,
        "due_soon": due_soon_count
    })))
}

// Add to waiting list
async fn add_to_waitlist(
    data: web::Data<AppState>,
    req: HttpRequest,
    waitlist_data: web::Json<WaitingListRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let book_collection: Collection<Book> = data.db.collection("books");
    let waitlist_collection: Collection<WaitingListEntry> = data.db.collection("waiting_list");

    // Get book title
    let book_obj_id = ObjectId::parse_str(&waitlist_data.book_id)
        .map_err(|e| actix_web::error::ErrorBadRequest(e))?;

    let book = book_collection
        .find_one(doc! { "_id": book_obj_id, "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let book = match book {
        Some(b) => b,
        None => return Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Book not found"
        }))),
    };

    // Check if already on waitlist
    let existing = waitlist_collection
        .find_one(doc! {
            "book_id": &waitlist_data.book_id,
            "student_id": &waitlist_data.student_id,
            "status": "waiting",
            "campus_id": &claims.campus_id
        }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    if existing.is_some() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Student is already on the waiting list for this book"
        })));
    }

    let entry = WaitingListEntry {
        id: None,
        book_id: waitlist_data.book_id.clone(),
        book_title: book.title.clone(),
        student_id: waitlist_data.student_id.clone(),
        queued_at: Utc::now(),
        status: "waiting".to_string(),
        campus_id: claims.campus_id,
    };

    waitlist_collection
        .insert_one(entry, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Added to waiting list"
    })))
}

// Get waiting list
async fn get_waitlist(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    if claims.role != "librarian" && claims.role != "admin" {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Access denied: Librarian role required"
        })));
    }

    let collection: Collection<WaitingListEntry> = data.db.collection("waiting_list");

    let mut cursor = collection
        .find(doc! { "campus_id": &claims.campus_id, "status": "waiting" }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut entries = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        match result {
            Ok(entry) => entries.push(entry),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "total_waiting": entries.len(),
        "entries": entries
    })))
}

// Notify/fulfill waiting list entry
async fn update_waitlist_status(
    data: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<(String, String)>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    if claims.role != "librarian" && claims.role != "admin" {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Access denied: Librarian role required"
        })));
    }

    let (entry_id, new_status) = path.into_inner();
    if new_status != "notified" && new_status != "fulfilled" && new_status != "cancelled" {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Invalid status. Use: notified, fulfilled, cancelled"
        })));
    }

    let collection: Collection<WaitingListEntry> = data.db.collection("waiting_list");
    let obj_id = ObjectId::parse_str(&entry_id)
        .map_err(|e| actix_web::error::ErrorBadRequest(e))?;

    collection
        .update_one(
            doc! { "_id": obj_id, "campus_id": &claims.campus_id },
            doc! { "$set": { "status": &new_status } },
            None,
        )
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": format!("Waiting list entry updated to {}", new_status)
    })))
}

// ===== STUDENT DASHBOARD - BORROWED BOOKS =====

async fn get_student_books(
    data: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<String>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let student_id = path.into_inner();
    if claims.role == "student" && claims.sub != student_id {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Access denied: You can only view your own borrowed books"
        })));
    }

    let collection: Collection<BookIssue> = data.db.collection("book_issues");

    let mut cursor = collection
        .find(doc! { "student_id": &student_id, "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut all_books = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        match result {
            Ok(issue) => all_books.push(issue),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    let currently_borrowed: Vec<&BookIssue> = all_books.iter()
        .filter(|b| b.status == "issued")
        .collect();

    let returned: Vec<&BookIssue> = all_books.iter()
        .filter(|b| b.status == "returned" || b.status == "returned_with_fine")
        .collect();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "student_id": student_id,
        "currently_borrowed": currently_borrowed,
        "returned_books": returned,
        "total_borrowed": currently_borrowed.len(),
        "total_returned": returned.len()
    })))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    env_logger::init();

    let mongodb_uri = env::var("MONGODB_URI").unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
    let database_name = env::var("DATABASE_NAME").unwrap_or_else(|_| "campusconnect".to_string());
    let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "your-secret-key".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "8084".to_string());

    println!("📚 Starting Library Service...");
    println!("📡 Connecting to MongoDB: {}", mongodb_uri);

    let client = Client::with_uri_str(&mongodb_uri)
        .await
        .expect("Failed to connect to MongoDB");
    
    let db = client.database(&database_name);

    println!("✅ Connected to MongoDB");
    println!("🚀 Server starting on http://127.0.0.1:{}", port);

    let app_state = web::Data::new(AppState {
        db,
        jwt_secret,
    });

    HttpServer::new(move || {
        let cors = Cors::permissive();

        App::new()
            .wrap(cors)
            .wrap(middleware::Logger::default())
            .app_data(app_state.clone())
            .route("/health", web::get().to(health_check))
            // Book routes
            .route("/api/books", web::post().to(add_book))
            .route("/api/books", web::get().to(get_books))
            // Issue/Return routes
            .route("/api/issue", web::post().to(issue_book))
            .route("/api/return", web::post().to(return_book))
            .route("/api/issues", web::get().to(get_issues))
            // Student Dashboard routes
            .route("/api/student/books/{student_id}", web::get().to(get_student_books))
            // Librarian Dashboard routes
            .route("/api/librarian/summary", web::get().to(librarian_summary))
            .route("/api/librarian/borrowed", web::get().to(librarian_borrowed_books))
            .route("/api/librarian/returned", web::get().to(librarian_returned_books))
            .route("/api/librarian/waitlist", web::get().to(get_waitlist))
            .route("/api/waitlist", web::post().to(add_to_waitlist))
            .route("/api/librarian/waitlist/{entry_id}/{status}", web::put().to(update_waitlist_status))
    })
    .bind(format!("127.0.0.1:{}", port))?
    .run()
    .await
}
