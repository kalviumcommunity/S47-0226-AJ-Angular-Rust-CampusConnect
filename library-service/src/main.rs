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
    })
    .bind(format!("127.0.0.1:{}", port))?
    .run()
    .await
}
