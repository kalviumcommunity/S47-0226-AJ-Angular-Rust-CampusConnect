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
struct Faculty {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    employee_id: String,
    name: String,
    email: String,
    department: String,
    designation: String,
    joining_date: String,
    salary: f64,
    campus_id: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
struct FacultyRequest {
    employee_id: String,
    name: String,
    email: String,
    department: String,
    designation: String,
    joining_date: String,
    salary: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct LeaveRequest {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    employee_id: String,
    leave_type: String, // sick, casual, vacation
    from_date: String,
    to_date: String,
    reason: String,
    status: String, // pending, approved, rejected
    campus_id: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
struct LeaveRequestData {
    employee_id: String,
    leave_type: String,
    from_date: String,
    to_date: String,
    reason: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct LeaveApproval {
    request_id: String,
    status: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Payroll {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    employee_id: String,
    employee_name: String,
    month: String,
    year: i32,
    basic_salary: f64,
    allowances: f64,
    deductions: f64,
    net_salary: f64,
    payment_status: String, // pending, paid
    campus_id: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
struct PayrollRequest {
    employee_id: String,
    month: String,
    year: i32,
    allowances: f64,
    deductions: f64,
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
        "service": "hr-service"
    }))
}

// Faculty Management
async fn add_faculty(
    data: web::Data<AppState>,
    req: HttpRequest,
    faculty_data: web::Json<FacultyRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<Faculty> = data.db.collection("faculty");

    let new_faculty = Faculty {
        id: None,
        employee_id: faculty_data.employee_id.clone(),
        name: faculty_data.name.clone(),
        email: faculty_data.email.clone(),
        department: faculty_data.department.clone(),
        designation: faculty_data.designation.clone(),
        joining_date: faculty_data.joining_date.clone(),
        salary: faculty_data.salary,
        campus_id: claims.campus_id,
        created_at: Utc::now(),
    };

    collection
        .insert_one(new_faculty, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Faculty added successfully"
    })))
}

async fn get_faculty(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<Faculty> = data.db.collection("faculty");

    let mut cursor = collection
        .find(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut faculty_list = Vec::new();
    use futures::stream::StreamExt;
    
    while let Some(result) = cursor.next().await {
        match result {
            Ok(faculty) => faculty_list.push(faculty),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    Ok(HttpResponse::Ok().json(faculty_list))
}

// Leave Management
async fn create_leave_request(
    data: web::Data<AppState>,
    req: HttpRequest,
    leave_data: web::Json<LeaveRequestData>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<LeaveRequest> = data.db.collection("leave_requests");

    let new_request = LeaveRequest {
        id: None,
        employee_id: leave_data.employee_id.clone(),
        leave_type: leave_data.leave_type.clone(),
        from_date: leave_data.from_date.clone(),
        to_date: leave_data.to_date.clone(),
        reason: leave_data.reason.clone(),
        status: "pending".to_string(),
        campus_id: claims.campus_id,
        created_at: Utc::now(),
    };

    collection
        .insert_one(new_request, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Leave request submitted successfully"
    })))
}

async fn get_leave_requests(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<LeaveRequest> = data.db.collection("leave_requests");

    let mut cursor = collection
        .find(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut requests = Vec::new();
    use futures::stream::StreamExt;
    
    while let Some(result) = cursor.next().await {
        match result {
            Ok(request) => requests.push(request),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    Ok(HttpResponse::Ok().json(requests))
}

async fn approve_leave(
    data: web::Data<AppState>,
    req: HttpRequest,
    approval_data: web::Json<LeaveApproval>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<LeaveRequest> = data.db.collection("leave_requests");

    let request_obj_id = ObjectId::parse_str(&approval_data.request_id)
        .map_err(|e| actix_web::error::ErrorBadRequest(e))?;

    collection
        .update_one(
            doc! { "_id": request_obj_id, "campus_id": &claims.campus_id },
            doc! { "$set": { "status": &approval_data.status } },
            None,
        )
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Leave request updated successfully"
    })))
}

// Payroll Management
async fn create_payroll(
    data: web::Data<AppState>,
    req: HttpRequest,
    payroll_data: web::Json<PayrollRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let faculty_collection: Collection<Faculty> = data.db.collection("faculty");
    let payroll_collection: Collection<Payroll> = data.db.collection("payroll");

    // Get faculty details
    let faculty = faculty_collection
        .find_one(doc! { "employee_id": &payroll_data.employee_id, "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let faculty = match faculty {
        Some(f) => f,
        None => return Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Faculty not found"
        }))),
    };

    let basic_salary = faculty.salary;
    let net_salary = basic_salary + payroll_data.allowances - payroll_data.deductions;

    let new_payroll = Payroll {
        id: None,
        employee_id: payroll_data.employee_id.clone(),
        employee_name: faculty.name.clone(),
        month: payroll_data.month.clone(),
        year: payroll_data.year,
        basic_salary,
        allowances: payroll_data.allowances,
        deductions: payroll_data.deductions,
        net_salary,
        payment_status: "pending".to_string(),
        campus_id: claims.campus_id,
        created_at: Utc::now(),
    };

    payroll_collection
        .insert_one(new_payroll, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Payroll created successfully",
        "net_salary": net_salary
    })))
}

async fn get_payroll(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<Payroll> = data.db.collection("payroll");

    let mut cursor = collection
        .find(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut payroll_records = Vec::new();
    use futures::stream::StreamExt;
    
    while let Some(result) = cursor.next().await {
        match result {
            Ok(record) => payroll_records.push(record),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    Ok(HttpResponse::Ok().json(payroll_records))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    env_logger::init();

    let mongodb_uri = env::var("MONGODB_URI").unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
    let database_name = env::var("DATABASE_NAME").unwrap_or_else(|_| "campusconnect".to_string());
    let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "your-secret-key".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "8085".to_string());

    println!("👥 Starting HR Service...");
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
            // Faculty routes
            .route("/api/faculty", web::post().to(add_faculty))
            .route("/api/faculty", web::get().to(get_faculty))
            // Leave routes
            .route("/api/leave", web::post().to(create_leave_request))
            .route("/api/leave", web::get().to(get_leave_requests))
            .route("/api/leave/approve", web::put().to(approve_leave))
            // Payroll routes
            .route("/api/payroll", web::post().to(create_payroll))
            .route("/api/payroll", web::get().to(get_payroll))
    })
    .bind(format!("127.0.0.1:{}", port))?
    .run()
    .await
}
