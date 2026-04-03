use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    web, App, HttpServer, HttpResponse, HttpRequest, ResponseError,
    http::header,
    body::EitherBody,
};
use actix_cors::Cors;
use mongodb::{Client, Collection, bson::doc};
use serde::{Deserialize, Serialize};
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey, Algorithm};
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{Utc, Duration};
use std::fmt;
use std::env;
use std::future::{ready, Ready, Future};
use std::pin::Pin;
use std::rc::Rc;
use anyhow::Context;
use log::info;

// ── Custom API Error Type ─────────────────────────────────────────────────────
// Converts internal errors into structured JSON HTTP responses.
// Using an enum lets each variant map to a specific HTTP status code.

#[derive(Debug, Serialize)]
struct ErrorBody {
    error: String,
}

#[derive(Debug)]
enum AppError {
    Unauthorized(String),
    BadRequest(String),
    NotFound(String),
    Internal(anyhow::Error),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Unauthorized(msg) => write!(f, "{}", msg),
            AppError::BadRequest(msg) => write!(f, "{}", msg),
            AppError::NotFound(msg) => write!(f, "{}", msg),
            AppError::Internal(e) => write!(f, "Internal server error: {}", e),
        }
    }
}

// ResponseError lets actix-web automatically convert AppError into an HTTP response.
impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        let body = ErrorBody { error: self.to_string() };
        match self {
            AppError::Unauthorized(_) => HttpResponse::Unauthorized().json(body),
            AppError::BadRequest(_) => HttpResponse::BadRequest().json(body),
            AppError::NotFound(_) => HttpResponse::NotFound().json(body),
            AppError::Internal(_) => HttpResponse::InternalServerError().json(body),
        }
    }
}

// Allow anyhow::Error to be wrapped automatically via `?`
impl From<anyhow::Error> for AppError {
    fn from(e: anyhow::Error) -> Self {
        AppError::Internal(e)
    }
}

// ── Data Models ───────────────────────────────────────────────────────────────

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

#[derive(Debug, Deserialize)]
struct LoginRequest {
    username: Option<String>,
    password: Option<String>,
}

#[derive(Debug, Deserialize)]
struct RegisterRequest {
    username: Option<String>,
    password: Option<String>,
    role: Option<String>,
    campus_id: Option<String>,
    email: Option<String>,
    full_name: Option<String>,
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

// ── Serde Demo: Typed Request / Response Models ───────────────────────────────

/// All fields are Option so we can detect and reject missing ones explicitly.
#[derive(Debug, Deserialize)]
struct CreateProfileRequest {
    name: Option<String>,
    email: Option<String>,
    role: Option<String>,
}

#[derive(Debug, Serialize)]
struct ProfileResponse {
    id: i32,
    name: String,
    email: String,
    role: String,
    message: String,
}

// ── App State ─────────────────────────────────────────────────────────────────

struct AppState {
    db: mongodb::Database,
    jwt_secret: String,
}

// ── Logging Middleware ────────────────────────────────────────────────────────
// Logs method, path, and response status for every request.

pub struct RequestLogger;

impl<S, B> Transform<S, ServiceRequest> for RequestLogger
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = actix_web::Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = actix_web::Error;
    type Transform = RequestLoggerMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(RequestLoggerMiddleware { service: Rc::new(service) }))
    }
}

pub struct RequestLoggerMiddleware<S> {
    service: Rc<S>,
}

impl<S, B> Service<ServiceRequest> for RequestLoggerMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = actix_web::Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<B>;
    type Error = actix_web::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let method = req.method().to_string();
        let path = req.path().to_string();
        let svc = self.service.clone();

        Box::pin(async move {
            let res = svc.call(req).await?;
            info!("{} {} -> {}", method, path, res.status().as_u16());
            Ok(res)
        })
    }
}

// ── JWT Auth Middleware ───────────────────────────────────────────────────────
// Blocks requests to protected routes that lack a valid Bearer token.
// Public routes (/health, /api/auth/login, /api/auth/register) are skipped.

pub struct JwtAuth {
    pub jwt_secret: String,
}

impl<S, B> Transform<S, ServiceRequest> for JwtAuth
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = actix_web::Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = actix_web::Error;
    type Transform = JwtAuthMiddleware<S>;
    type InitError = ();
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(JwtAuthMiddleware {
            service: Rc::new(service),
            jwt_secret: self.jwt_secret.clone(),
        }))
    }
}

pub struct JwtAuthMiddleware<S> {
    service: Rc<S>,
    jwt_secret: String,
}

/// Routes that do NOT require a JWT token.
fn is_public_route(path: &str, method: &str) -> bool {
    matches!(
        (method, path),
        ("GET", "/health")
            | ("POST", "/api/auth/login")
            | ("POST", "/api/auth/register")
    )
}

impl<S, B> Service<ServiceRequest> for JwtAuthMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = actix_web::Error> + 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = actix_web::Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let path = req.path().to_string();
        let method = req.method().to_string();
        let svc = self.service.clone();
        let secret = self.jwt_secret.clone();

        Box::pin(async move {
            // Skip auth check for public routes
            if is_public_route(&path, &method) {
                return svc.call(req).await.map(|r| r.map_into_left_body());
            }

            // Extract and validate the Bearer token
            let auth_result = req
                .headers()
                .get(header::AUTHORIZATION)
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.strip_prefix("Bearer "))
                .ok_or("missing")
                .and_then(|token| {
                    decode::<Claims>(
                        token,
                        &DecodingKey::from_secret(secret.as_bytes()),
                        &Validation::new(Algorithm::HS256),
                    )
                    .map_err(|_| "invalid")
                });

            match auth_result {
                Ok(_) => svc.call(req).await.map(|r| r.map_into_left_body()),
                Err(reason) => {
                    let msg = if reason == "missing" {
                        "No token provided"
                    } else {
                        "Invalid or expired token"
                    };
                    let response = HttpResponse::Unauthorized()
                        .json(ErrorBody { error: msg.to_string() });
                    let (http_req, _) = req.into_parts();
                    Ok(ServiceResponse::new(http_req, response).map_into_right_body())
                }
            }
        })
    }
}



/// Returns Err(AppError::BadRequest) if the string is empty or whitespace-only.
fn require_field<'a>(value: &'a Option<String>, field: &str) -> Result<&'a str, AppError> {
    match value {
        Some(v) if !v.trim().is_empty() => Ok(v.as_str()),
        Some(_) => Err(AppError::BadRequest(format!("'{}' must not be blank", field))),
        None => Err(AppError::BadRequest(format!("'{}' is required", field))),
    }
}

/// Validates that an email contains '@' — minimal but illustrative.
fn validate_email(email: &str) -> Result<(), AppError> {
    if email.contains('@') {
        Ok(())
    } else {
        Err(AppError::BadRequest("Invalid email address".to_string()))
    }
}

/// Validates allowed roles.
fn validate_role(role: &str) -> Result<(), AppError> {
    match role {
        "student" | "teacher" | "hr" | "librarian" | "admin" => Ok(()),
        _ => Err(AppError::BadRequest(format!(
            "Invalid role '{}'. Must be one of: student, teacher, hr, librarian, admin",
            role
        ))),
    }
}

// ── Service Layer (uses anyhow for internal error propagation) ────────────────

/// Looks up a user by username. Returns Option<User> — None means not found.
/// Uses anyhow's `?` + `.context()` to add meaningful context to DB errors.
async fn find_user_by_username(
    collection: &Collection<User>,
    username: &str,
) -> anyhow::Result<Option<User>> {
    collection
        .find_one(doc! { "username": username }, None)
        .await
        .context("Database error while looking up user")
}

/// Hashes a password using bcrypt. Returns anyhow::Result for clean propagation.
fn hash_password(password: &str) -> anyhow::Result<String> {
    hash(password, DEFAULT_COST).context("Failed to hash password")
}

/// Generates a JWT token for the given user claims.
fn generate_token(claims: &Claims, secret: &str) -> anyhow::Result<String> {
    encode(
        &Header::default(),
        claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .context("Failed to generate JWT token")
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "service": "auth-service"
    }))
}

/// POST /api/auth/register
/// Demonstrates: Option field validation, anyhow propagation, duplicate check.
async fn register(
    data: web::Data<AppState>,
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse, AppError> {
    // Parse into our typed struct — missing fields become None
    let req: RegisterRequest = serde_json::from_value(body.into_inner())
        .map_err(|e| AppError::BadRequest(format!("Invalid JSON: {}", e)))?;

    // Validate all required fields using Option explicitly
    let username = require_field(&req.username, "username")?;
    let password = require_field(&req.password, "password")?;
    let role = require_field(&req.role, "role")?;
    let campus_id = require_field(&req.campus_id, "campus_id")?;
    let email = require_field(&req.email, "email")?;
    let full_name = require_field(&req.full_name, "full_name")?;

    validate_email(email)?;
    validate_role(role)?;

    if password.len() < 6 {
        return Err(AppError::BadRequest(
            "Password must be at least 6 characters".to_string(),
        ));
    }

    let collection: Collection<User> = data.db.collection("users");

    // Use service function — anyhow error auto-converts to AppError::Internal
    let existing = find_user_by_username(&collection, username).await?;
    if existing.is_some() {
        return Err(AppError::BadRequest("Username already exists".to_string()));
    }

    let password_hash = hash_password(password)?;

    let new_user = User {
        id: None,
        username: username.to_string(),
        password_hash,
        role: role.to_string(),
        campus_id: campus_id.to_string(),
        email: email.to_string(),
        full_name: full_name.to_string(),
    };

    collection
        .insert_one(new_user, None)
        .await
        .context("Failed to insert user into database")?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "User registered successfully"
    })))
}

/// POST /api/auth/login
/// Demonstrates: Option-based field validation, Result for credential check.
async fn login(
    data: web::Data<AppState>,
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse, AppError> {
    let req: LoginRequest = serde_json::from_value(body.into_inner())
        .map_err(|e| AppError::BadRequest(format!("Invalid JSON: {}", e)))?;

    let username = require_field(&req.username, "username")?;
    let password = require_field(&req.password, "password")?;

    let collection: Collection<User> = data.db.collection("users");

    // find_user_by_username returns Option<User> — None means user doesn't exist
    let user = find_user_by_username(&collection, username)
        .await?
        .ok_or_else(|| AppError::Unauthorized("Invalid credentials".to_string()))?;

    // verify returns Result<bool> — we propagate errors via anyhow context
    let valid = verify(password, &user.password_hash)
        .context("Failed to verify password")?;

    if !valid {
        return Err(AppError::Unauthorized("Invalid credentials".to_string()));
    }

    let expiration = Utc::now()
        .checked_add_signed(Duration::hours(24))
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Timestamp overflow")))?
        .timestamp();

    let claims = Claims {
        sub: user.username.clone(),
        role: user.role.clone(),
        campus_id: user.campus_id.clone(),
        exp: expiration as usize,
    };

    let token = generate_token(&claims, &data.jwt_secret)?;

    Ok(HttpResponse::Ok().json(TokenResponse {
        token,
        user: UserInfo {
            username: user.username,
            role: user.role,
            campus_id: user.campus_id,
            email: user.email,
            full_name: user.full_name,
        },
    }))
}

/// POST /api/profile
/// Demonstrates: missing field detection via Option, structured error response.
async fn create_profile(
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse, AppError> {
    let req: CreateProfileRequest = serde_json::from_value(body.into_inner())
        .map_err(|e| AppError::BadRequest(format!("Invalid JSON: {}", e)))?;

    // Each field is Option — we explicitly check and return clear errors
    let name = require_field(&req.name, "name")?;
    let email = require_field(&req.email, "email")?;
    let role = require_field(&req.role, "role")?;

    validate_email(email)?;

    Ok(HttpResponse::Created().json(ProfileResponse {
        id: 1,
        name: name.to_string(),
        email: email.to_string(),
        role: role.to_string(),
        message: "Profile created successfully".to_string(),
    }))
}

/// GET /api/auth/validate
async fn validate_token(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .ok_or_else(|| AppError::Unauthorized("No token provided".to_string()))?;

    let auth_str = auth_header
        .to_str()
        .map_err(|_| AppError::Unauthorized("Malformed Authorization header".to_string()))?;

    if !auth_str.starts_with("Bearer ") {
        return Err(AppError::Unauthorized(
            "Authorization header must use Bearer scheme".to_string(),
        ));
    }

    let token = &auth_str[7..];

    match decode::<Claims>(
        token,
        &DecodingKey::from_secret(data.jwt_secret.as_bytes()),
        &Validation::new(Algorithm::HS256),
    ) {
        Ok(token_data) => Ok(HttpResponse::Ok().json(serde_json::json!({
            "valid": true,
            "claims": token_data.claims
        }))),
        Err(_) => Err(AppError::Unauthorized("Invalid or expired token".to_string())),
    }
}

// ── Main ──────────────────────────────────────────────────────────────────────

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    env_logger::init();

    let mongodb_uri = env::var("MONGODB_URI")
        .unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
    let database_name = env::var("DATABASE_NAME")
        .unwrap_or_else(|_| "campusconnect".to_string());
    let jwt_secret = env::var("JWT_SECRET")
        .unwrap_or_else(|_| "your-secret-key".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());

    println!("Starting Auth Service...");
    println!("Connecting to MongoDB: {}", mongodb_uri);

    let client = Client::with_uri_str(&mongodb_uri)
        .await
        .expect("Failed to connect to MongoDB");

    let db = client.database(&database_name);

    println!("Connected to MongoDB");
    println!("Server starting on http://127.0.0.1:{}", port);

    let app_state = web::Data::new(AppState { db, jwt_secret: jwt_secret.clone() });

    HttpServer::new(move || {
        // Explicit CORS: only allow the Angular dev server origin.
        // Permissive CORS is replaced so the browser enforces origin checks.
        let cors = Cors::default()
            .allowed_origin("http://localhost:4200")
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
            .allowed_headers(vec![
                header::AUTHORIZATION,
                header::CONTENT_TYPE,
                header::ACCEPT,
            ])
            .max_age(3600);

        App::new()
            // CORS must wrap everything — register it first
            .wrap(cors)
            // Log every request: METHOD /path -> STATUS
            .wrap(RequestLogger)
            // JWT auth gate — blocks protected routes without a valid token
            .wrap(JwtAuth { jwt_secret: jwt_secret.clone() })
            .app_data(app_state.clone())
            // Return JSON for malformed request bodies instead of plain-text 400
            .app_data(
                web::JsonConfig::default()
                    .error_handler(|err, _req| {
                        let response = HttpResponse::BadRequest().json(ErrorBody {
                            error: format!("Invalid JSON body: {}", err),
                        });
                        actix_web::error::InternalError::from_response(err, response).into()
                    }),
            )
            // Public routes
            .route("/health", web::get().to(health_check))
            .route("/api/auth/register", web::post().to(register))
            .route("/api/auth/login", web::post().to(login))
            // Protected routes (JWT middleware enforces auth above)
            .route("/api/auth/validate", web::get().to(validate_token))
            .route("/api/profile", web::post().to(create_profile))
    })
    .bind(format!("127.0.0.1:{}", port))?
    .run()
    .await
}
