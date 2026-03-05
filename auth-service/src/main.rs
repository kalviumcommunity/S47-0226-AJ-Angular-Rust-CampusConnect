use actix_web::{web, App, HttpServer, HttpResponse, HttpRequest, Error};
use actix_cors::Cors;
use mongodb::{Client, Collection, bson::doc};
use serde::{Deserialize, Serialize};
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey, Algorithm};
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Utc, Duration};
use std::env;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct User {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<mongodb::bson::oid::ObjectId>,
    username: String,
    password_hash: String,
    role: String,
    campus_id: String,
    email: String,
    full_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct RegisterRequest {
    username: String,
    password: String,
    role: String,
    campus_id: String,
    email: String,
    full_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    role: String,
    campus_id: String,
    exp: usize,
}

#[derive(Debug, Serialize)]
struct TokenResponse {
    token: String,
    user: UserInfo,
}

#[derive(Debug, Serialize, Deserialize)]
struct UserInfo {
    username: String,
    role: String,
    campus_id: String,
    email: String,
    full_name: String,
}

struct AppState {
    db: mongodb::Database,
    jwt_secret: String,
}

// Health check endpoint
async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "service": "auth-service"
    }))
}

// Register new user
async fn register(
    data: web::Data<AppState>,
    user_data: web::Json<RegisterRequest>,
) -> Result<HttpResponse, Error> {
    let collection: Collection<User> = data.db.collection("users");

    // Check if user already exists
    let existing_user = collection
        .find_one(doc! { "username": &user_data.username }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    if existing_user.is_some() {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Username already exists"
        })));
    }

    // Hash password
    let password_hash = hash(&user_data.password, DEFAULT_COST)
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let new_user = User {
        id: None,
        username: user_data.username.clone(),
        password_hash,
        role: user_data.role.clone(),
        campus_id: user_data.campus_id.clone(),
        email: user_data.email.clone(),
        full_name: user_data.full_name.clone(),
    };

    collection
        .insert_one(new_user, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "User registered successfully"
    })))
}

// Login user
async fn login(
    data: web::Data<AppState>,
    credentials: web::Json<LoginRequest>,
) -> Result<HttpResponse, Error> {
    let collection: Collection<User> = data.db.collection("users");

    // Find user
    let user = collection
        .find_one(doc! { "username": &credentials.username }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    match user {
        Some(user) => {
            // Verify password
            let valid = verify(&credentials.password, &user.password_hash)
                .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

            if !valid {
                return Ok(HttpResponse::Unauthorized().json(serde_json::json!({
                    "error": "Invalid credentials"
                })));
            }

            // Generate JWT token
            let expiration = Utc::now()
                .checked_add_signed(Duration::hours(24))
                .expect("valid timestamp")
                .timestamp();

            let claims = Claims {
                sub: user.username.clone(),
                role: user.role.clone(),
                campus_id: user.campus_id.clone(),
                exp: expiration as usize,
            };

            let token = encode(
                &Header::default(),
                &claims,
                &EncodingKey::from_secret(data.jwt_secret.as_bytes()),
            )
            .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

            let response = TokenResponse {
                token,
                user: UserInfo {
                    username: user.username,
                    role: user.role,
                    campus_id: user.campus_id,
                    email: user.email,
                    full_name: user.full_name,
                },
            };

            Ok(HttpResponse::Ok().json(response))
        }
        None => Ok(HttpResponse::Unauthorized().json(serde_json::json!({
            "error": "Invalid credentials"
        }))),
    }
}

// Validate token endpoint
async fn validate_token(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    if let Some(auth_header) = req.headers().get("Authorization") {
        if let Ok(auth_str) = auth_header.to_str() {
            if auth_str.starts_with("Bearer ") {
                let token = &auth_str[7..];
                
                match decode::<Claims>(
                    token,
                    &DecodingKey::from_secret(data.jwt_secret.as_bytes()),
                    &Validation::new(Algorithm::HS256),
                ) {
                    Ok(token_data) => {
                        return Ok(HttpResponse::Ok().json(serde_json::json!({
                            "valid": true,
                            "claims": token_data.claims
                        })));
                    }
                    Err(_) => {
                        return Ok(HttpResponse::Unauthorized().json(serde_json::json!({
                            "valid": false,
                            "error": "Invalid token"
                        })));
                    }
                }
            }
        }
    }

    Ok(HttpResponse::Unauthorized().json(serde_json::json!({
        "valid": false,
        "error": "No token provided"
    })))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    env_logger::init();

    let mongodb_uri = env::var("MONGODB_URI").unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
    let database_name = env::var("DATABASE_NAME").unwrap_or_else(|_| "campusconnect".to_string());
    let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "your-secret-key".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());

    println!("🔐 Starting Auth Service...");
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
            .app_data(app_state.clone())
            .route("/health", web::get().to(health_check))
            .route("/api/auth/register", web::post().to(register))
            .route("/api/auth/login", web::post().to(login))
            .route("/api/auth/validate", web::get().to(validate_token))
    })
    .bind(format!("127.0.0.1:{}", port))?
    .run()
    .await
}
