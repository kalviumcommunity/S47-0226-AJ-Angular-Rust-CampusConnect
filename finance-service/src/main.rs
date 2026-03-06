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
struct FeeStructure {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    student_id: String,
    fee_type: String, // tuition, hostel, library, misc
    amount: f64,
    due_date: String,
    status: String, // pending, paid, overdue
    campus_id: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
struct FeeRequest {
    student_id: String,
    fee_type: String,
    amount: f64,
    due_date: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Payment {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    student_id: String,
    fee_id: String,
    amount: f64,
    payment_method: String, // cash, card, upi, bank_transfer
    transaction_id: String,
    payment_date: DateTime<Utc>,
    campus_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct PaymentRequest {
    student_id: String,
    fee_id: String,
    amount: f64,
    payment_method: String,
    transaction_id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Invoice {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    invoice_number: String,
    student_id: String,
    items: Vec<InvoiceItem>,
    total_amount: f64,
    campus_id: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct InvoiceItem {
    description: String,
    amount: f64,
}

#[derive(Debug, Serialize, Deserialize)]
struct InvoiceRequest {
    student_id: String,
    items: Vec<InvoiceItem>,
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
        "service": "finance-service"
    }))
}

// Fee Management
async fn create_fee(
    data: web::Data<AppState>,
    req: HttpRequest,
    fee_data: web::Json<FeeRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<FeeStructure> = data.db.collection("fees");

    let new_fee = FeeStructure {
        id: None,
        student_id: fee_data.student_id.clone(),
        fee_type: fee_data.fee_type.clone(),
        amount: fee_data.amount,
        due_date: fee_data.due_date.clone(),
        status: "pending".to_string(),
        campus_id: claims.campus_id,
        created_at: Utc::now(),
    };

    collection
        .insert_one(new_fee, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Fee created successfully"
    })))
}

async fn get_fees(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<FeeStructure> = data.db.collection("fees");

    let mut cursor = collection
        .find(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut fees = Vec::new();
    use futures::stream::StreamExt;
    
    while let Some(result) = cursor.next().await {
        match result {
            Ok(fee) => fees.push(fee),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    Ok(HttpResponse::Ok().json(fees))
}

// Payment Management
async fn create_payment(
    data: web::Data<AppState>,
    req: HttpRequest,
    payment_data: web::Json<PaymentRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<Payment> = data.db.collection("payments");

    let new_payment = Payment {
        id: None,
        student_id: payment_data.student_id.clone(),
        fee_id: payment_data.fee_id.clone(),
        amount: payment_data.amount,
        payment_method: payment_data.payment_method.clone(),
        transaction_id: payment_data.transaction_id.clone(),
        payment_date: Utc::now(),
        campus_id: claims.campus_id.clone(),
    };

    collection
        .insert_one(new_payment, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    // Update fee status to paid
    let fee_collection: Collection<FeeStructure> = data.db.collection("fees");
    let fee_obj_id = ObjectId::parse_str(&payment_data.fee_id)
        .map_err(|e| actix_web::error::ErrorBadRequest(e))?;

    fee_collection
        .update_one(
            doc! { "_id": fee_obj_id, "campus_id": &claims.campus_id },
            doc! { "$set": { "status": "paid" } },
            None,
        )
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Payment recorded successfully"
    })))
}

async fn get_payments(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<Payment> = data.db.collection("payments");

    let mut cursor = collection
        .find(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut payments = Vec::new();
    use futures::stream::StreamExt;
    
    while let Some(result) = cursor.next().await {
        match result {
            Ok(payment) => payments.push(payment),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    Ok(HttpResponse::Ok().json(payments))
}

// Invoice Management
async fn create_invoice(
    data: web::Data<AppState>,
    req: HttpRequest,
    invoice_data: web::Json<InvoiceRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<Invoice> = data.db.collection("invoices");

    let total: f64 = invoice_data.items.iter().map(|item| item.amount).sum();
    let invoice_number = format!("INV-{}", Utc::now().timestamp());

    let new_invoice = Invoice {
        id: None,
        invoice_number,
        student_id: invoice_data.student_id.clone(),
        items: invoice_data.items.clone(),
        total_amount: total,
        campus_id: claims.campus_id,
        created_at: Utc::now(),
    };

    collection
        .insert_one(new_invoice, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Invoice created successfully"
    })))
}

async fn get_invoices(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<Invoice> = data.db.collection("invoices");

    let mut cursor = collection
        .find(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut invoices = Vec::new();
    use futures::stream::StreamExt;
    
    while let Some(result) = cursor.next().await {
        match result {
            Ok(invoice) => invoices.push(invoice),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    Ok(HttpResponse::Ok().json(invoices))
}

// ===== HR DASHBOARD ENDPOINTS =====

// Get fee summary for HR dashboard
async fn hr_fee_summary(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    if claims.role != "hr" && claims.role != "admin" {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Access denied: HR role required"
        })));
    }

    let fee_collection: Collection<FeeStructure> = data.db.collection("fees");

    let mut cursor = fee_collection
        .find(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut fees = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        match result {
            Ok(fee) => fees.push(fee),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    let total_fees: f64 = fees.iter().map(|f| f.amount).sum();
    let total_paid: f64 = fees.iter().filter(|f| f.status == "paid").map(|f| f.amount).sum();
    let total_pending: f64 = fees.iter().filter(|f| f.status != "paid").map(|f| f.amount).sum();

    // Separate by fee type
    let tuition_total: f64 = fees.iter().filter(|f| f.fee_type == "tuition").map(|f| f.amount).sum();
    let hostel_total: f64 = fees.iter().filter(|f| f.fee_type == "hostel").map(|f| f.amount).sum();
    let library_total: f64 = fees.iter().filter(|f| f.fee_type == "library").map(|f| f.amount).sum();
    let misc_total: f64 = fees.iter().filter(|f| f.fee_type == "misc").map(|f| f.amount).sum();

    // Unique students
    let mut all_student_ids: Vec<&String> = fees.iter().map(|f| &f.student_id).collect();
    all_student_ids.sort();
    all_student_ids.dedup();
    let total_students = all_student_ids.len();

    // Students with hostel fees = hostellers
    let mut hosteller_ids: Vec<&String> = fees.iter()
        .filter(|f| f.fee_type == "hostel")
        .map(|f| &f.student_id)
        .collect();
    hosteller_ids.sort();
    hosteller_ids.dedup();
    let total_hostellers = hosteller_ids.len();
    let total_day_scholars = total_students - total_hostellers;

    // Paid/unpaid student counts
    let mut fully_paid_students = 0;
    let mut partially_paid_students = 0;
    let mut unpaid_students = 0;
    for sid in &all_student_ids {
        let student_fees: Vec<&FeeStructure> = fees.iter().filter(|f| &f.student_id == *sid).collect();
        let all_paid = student_fees.iter().all(|f| f.status == "paid");
        let any_paid = student_fees.iter().any(|f| f.status == "paid");
        if all_paid {
            fully_paid_students += 1;
        } else if any_paid {
            partially_paid_students += 1;
        } else {
            unpaid_students += 1;
        }
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "total_fees": total_fees,
        "total_paid": total_paid,
        "total_pending": total_pending,
        "collection_rate": if total_fees > 0.0 { (total_paid / total_fees * 100.0) } else { 0.0 },
        "category_breakdown": {
            "tuition": tuition_total,
            "hostel": hostel_total,
            "library": library_total,
            "misc": misc_total
        },
        "student_counts": {
            "total": total_students,
            "hostellers": total_hostellers,
            "day_scholars": total_day_scholars,
            "fully_paid": fully_paid_students,
            "partially_paid": partially_paid_students,
            "unpaid": unpaid_students
        }
    })))
}

// Get all students' fee records for HR with filters
async fn hr_student_fees(
    data: web::Data<AppState>,
    req: HttpRequest,
    query: web::Query<std::collections::HashMap<String, String>>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    if claims.role != "hr" && claims.role != "admin" {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Access denied: HR role required"
        })));
    }

    let fee_collection: Collection<FeeStructure> = data.db.collection("fees");

    let mut cursor = fee_collection
        .find(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut fees = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        match result {
            Ok(fee) => fees.push(fee),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    // Get unique student IDs
    let mut student_ids: Vec<String> = fees.iter().map(|f| f.student_id.clone()).collect();
    student_ids.sort();
    student_ids.dedup();

    // Get filter params
    let status_filter = query.get("status").map(|s| s.as_str());
    let type_filter = query.get("type").map(|s| s.as_str()); // dayscholar, hosteller

    // Build per-student summaries
    let mut student_records: Vec<serde_json::Value> = Vec::new();
    for sid in &student_ids {
        let student_fees: Vec<&FeeStructure> = fees.iter().filter(|f| &f.student_id == sid).collect();
        let has_hostel = student_fees.iter().any(|f| f.fee_type == "hostel");
        let is_hosteller = has_hostel;

        // Apply type filter
        if let Some(t) = type_filter {
            if t == "dayscholar" && is_hosteller { continue; }
            if t == "hosteller" && !is_hosteller { continue; }
        }

        let total: f64 = student_fees.iter().map(|f| f.amount).sum();
        let paid: f64 = student_fees.iter().filter(|f| f.status == "paid").map(|f| f.amount).sum();
        let pending: f64 = total - paid;
        let all_paid = student_fees.iter().all(|f| f.status == "paid");
        let any_paid = student_fees.iter().any(|f| f.status == "paid");

        let fee_status = if all_paid { "paid" } else if any_paid { "partial" } else { "unpaid" };

        // Apply status filter
        if let Some(s) = status_filter {
            if s != fee_status { continue; }
        }

        let college_total: f64 = student_fees.iter().filter(|f| f.fee_type != "hostel").map(|f| f.amount).sum();
        let college_paid: f64 = student_fees.iter().filter(|f| f.fee_type != "hostel" && f.status == "paid").map(|f| f.amount).sum();
        let hostel_total: f64 = student_fees.iter().filter(|f| f.fee_type == "hostel").map(|f| f.amount).sum();
        let hostel_paid: f64 = student_fees.iter().filter(|f| f.fee_type == "hostel" && f.status == "paid").map(|f| f.amount).sum();

        student_records.push(serde_json::json!({
            "student_id": sid,
            "is_hosteller": is_hosteller,
            "fee_status": fee_status,
            "total_fees": total,
            "total_paid": paid,
            "total_pending": pending,
            "college_fees": { "total": college_total, "paid": college_paid, "pending": college_total - college_paid },
            "hostel_fees": { "total": hostel_total, "paid": hostel_paid, "pending": hostel_total - hostel_paid },
            "fees": student_fees
        }));
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "total_records": student_records.len(),
        "students": student_records
    })))
}

// ===== STUDENT DASHBOARD - FEE DETAILS =====

async fn get_student_fees(
    data: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<String>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let student_id = path.into_inner();
    if claims.role == "student" && claims.sub != student_id {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Access denied: You can only view your own fees"
        })));
    }

    let fee_collection: Collection<FeeStructure> = data.db.collection("fees");
    let payment_collection: Collection<Payment> = data.db.collection("payments");

    // Get all fees for this student
    let mut fee_cursor = fee_collection
        .find(doc! { "student_id": &student_id, "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut fees = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = fee_cursor.next().await {
        match result {
            Ok(fee) => fees.push(fee),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    // Get all payments for this student
    let mut payment_cursor = payment_collection
        .find(doc! { "student_id": &student_id, "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut payments = Vec::new();
    while let Some(result) = payment_cursor.next().await {
        match result {
            Ok(payment) => payments.push(payment),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    // Separate college fees and hostel fees
    let college_fees: Vec<&FeeStructure> = fees.iter().filter(|f| f.fee_type != "hostel").collect();
    let hostel_fees: Vec<&FeeStructure> = fees.iter().filter(|f| f.fee_type == "hostel").collect();

    let college_total: f64 = college_fees.iter().map(|f| f.amount).sum();
    let college_paid: f64 = college_fees.iter().filter(|f| f.status == "paid").map(|f| f.amount).sum();
    let college_pending: f64 = college_total - college_paid;

    let hostel_total: f64 = hostel_fees.iter().map(|f| f.amount).sum();
    let hostel_paid: f64 = hostel_fees.iter().filter(|f| f.status == "paid").map(|f| f.amount).sum();
    let hostel_pending: f64 = hostel_total - hostel_paid;

    let is_hosteller = !hostel_fees.is_empty();

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "student_id": student_id,
        "is_hosteller": is_hosteller,
        "college_fees": {
            "total_amount": college_total,
            "amount_paid": college_paid,
            "amount_pending": college_pending,
            "status": if college_pending <= 0.0 { "paid" } else { "pending" },
            "breakdown": college_fees
        },
        "hostel_fees": {
            "total_amount": hostel_total,
            "amount_paid": hostel_paid,
            "amount_pending": hostel_pending,
            "status": if hostel_pending <= 0.0 { "paid" } else { "pending" },
            "breakdown": hostel_fees
        },
        "total_fees": college_total + hostel_total,
        "total_paid": college_paid + hostel_paid,
        "total_pending": college_pending + hostel_pending,
        "payments": payments
    })))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    env_logger::init();

    let mongodb_uri = env::var("MONGODB_URI").unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
    let database_name = env::var("DATABASE_NAME").unwrap_or_else(|_| "campusconnect".to_string());
    let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "your-secret-key".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "8082".to_string());

    println!("💰 Starting Finance Service...");
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
            // Fee routes
            .route("/api/fees", web::post().to(create_fee))
            .route("/api/fees", web::get().to(get_fees))
            // Payment routes
            .route("/api/payments", web::post().to(create_payment))
            .route("/api/payments", web::get().to(get_payments))
            // Invoice routes
            .route("/api/invoices", web::post().to(create_invoice))
            .route("/api/invoices", web::get().to(get_invoices))
            // Student Dashboard routes
            .route("/api/student/fees/{student_id}", web::get().to(get_student_fees))
            // HR Dashboard routes
            .route("/api/hr/fees/summary", web::get().to(hr_fee_summary))
            .route("/api/hr/fees/students", web::get().to(hr_student_fees))
    })
    .bind(format!("127.0.0.1:{}", port))?
    .run()
    .await
}
