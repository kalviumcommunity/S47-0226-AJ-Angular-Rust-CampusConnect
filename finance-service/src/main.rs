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
    })
    .bind(format!("127.0.0.1:{}", port))?
    .run()
    .await
}
