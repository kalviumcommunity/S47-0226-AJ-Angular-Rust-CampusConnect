use actix_web::{web, App, HttpServer, HttpResponse, HttpRequest, Error, middleware};
use actix_cors::Cors;
use mongodb::{Client, Collection, bson::{doc, oid::ObjectId}};
use serde::{Deserialize, Serialize};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use chrono::{DateTime, Utc};
use std::env;

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    role: String,
    campus_id: String,
    exp: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Course {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    course_code: String,
    course_name: String,
    credits: i32,
    department: String,
    campus_id: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
struct CourseRequest {
    course_code: String,
    course_name: String,
    credits: i32,
    department: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Enrollment {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    student_id: String,
    course_code: String,
    semester: String,
    campus_id: String,
    enrolled_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
struct EnrollmentRequest {
    student_id: String,
    course_code: String,
    semester: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Attendance {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    student_id: String,
    course_code: String,
    date: String,
    status: String, // present, absent, late
    campus_id: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
struct AttendanceRequest {
    student_id: String,
    course_code: String,
    date: String,
    status: String,
}

struct AppState {
    db: mongodb::Database,
    jwt_secret: String,
}

// Middleware to validate JWT token
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
        "service": "academics-service"
    }))
}

// Course Management
async fn create_course(
    data: web::Data<AppState>,
    req: HttpRequest,
    course_data: web::Json<CourseRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<Course> = data.db.collection("courses");

    let new_course = Course {
        id: None,
        course_code: course_data.course_code.clone(),
        course_name: course_data.course_name.clone(),
        credits: course_data.credits,
        department: course_data.department.clone(),
        campus_id: claims.campus_id,
        created_at: Utc::now(),
    };

    collection
        .insert_one(new_course, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Course created successfully"
    })))
}

async fn get_courses(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<Course> = data.db.collection("courses");

    let mut cursor = collection
        .find(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut courses = Vec::new();
    use futures::stream::StreamExt;
    
    while let Some(result) = cursor.next().await {
        match result {
            Ok(course) => courses.push(course),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    Ok(HttpResponse::Ok().json(courses))
}

// Enrollment Management
async fn create_enrollment(
    data: web::Data<AppState>,
    req: HttpRequest,
    enrollment_data: web::Json<EnrollmentRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<Enrollment> = data.db.collection("enrollments");

    // Check if already enrolled
    let existing = collection
        .find_one(doc! {
            "student_id": &enrollment_data.student_id,
            "course_code": &enrollment_data.course_code,
            "campus_id": &claims.campus_id
        }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    if existing.is_some() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Student already enrolled in this course"
        })));
    }

    let new_enrollment = Enrollment {
        id: None,
        student_id: enrollment_data.student_id.clone(),
        course_code: enrollment_data.course_code.clone(),
        semester: enrollment_data.semester.clone(),
        campus_id: claims.campus_id,
        enrolled_at: Utc::now(),
    };

    collection
        .insert_one(new_enrollment, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Enrollment created successfully"
    })))
}

async fn get_enrollments(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<Enrollment> = data.db.collection("enrollments");

    let mut cursor = collection
        .find(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut enrollments = Vec::new();
    use futures::stream::StreamExt;
    
    while let Some(result) = cursor.next().await {
        match result {
            Ok(enrollment) => enrollments.push(enrollment),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    Ok(HttpResponse::Ok().json(enrollments))
}

// Attendance Management
async fn mark_attendance(
    data: web::Data<AppState>,
    req: HttpRequest,
    attendance_data: web::Json<AttendanceRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<Attendance> = data.db.collection("attendance");

    let new_attendance = Attendance {
        id: None,
        student_id: attendance_data.student_id.clone(),
        course_code: attendance_data.course_code.clone(),
        date: attendance_data.date.clone(),
        status: attendance_data.status.clone(),
        campus_id: claims.campus_id,
        created_at: Utc::now(),
    };

    collection
        .insert_one(new_attendance, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Attendance marked successfully"
    })))
}

async fn get_attendance(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<Attendance> = data.db.collection("attendance");

    let mut cursor = collection
        .find(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut attendance_records = Vec::new();
    use futures::stream::StreamExt;
    
    while let Some(result) = cursor.next().await {
        match result {
            Ok(record) => attendance_records.push(record),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    Ok(HttpResponse::Ok().json(attendance_records))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    env_logger::init();

    let mongodb_uri = env::var("MONGODB_URI").unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
    let database_name = env::var("DATABASE_NAME").unwrap_or_else(|_| "campusconnect".to_string());
    let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "your-secret-key".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "8081".to_string());

    println!("📘 Starting Academics Service...");
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
            // Course routes
            .route("/api/courses", web::post().to(create_course))
            .route("/api/courses", web::get().to(get_courses))
            // Enrollment routes
            .route("/api/enrollments", web::post().to(create_enrollment))
            .route("/api/enrollments", web::get().to(get_enrollments))
            // Attendance routes
            .route("/api/attendance", web::post().to(mark_attendance))
            .route("/api/attendance", web::get().to(get_attendance))
    })
    .bind(format!("127.0.0.1:{}", port))?
    .run()
    .await
}
