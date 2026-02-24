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
struct Room {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    room_number: String,
    hostel_name: String,
    capacity: i32,
    occupied: i32,
    room_type: String, // single, double, triple
    floor: i32,
    campus_id: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
struct RoomRequest {
    room_number: String,
    hostel_name: String,
    capacity: i32,
    room_type: String,
    floor: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct RoomAllocation {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    student_id: String,
    room_id: String,
    hostel_name: String,
    room_number: String,
    allocation_date: DateTime<Utc>,
    status: String, // active, vacated
    campus_id: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct AllocationRequest {
    student_id: String,
    room_id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct MaintenanceRequest {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    room_number: String,
    hostel_name: String,
    issue_type: String,
    description: String,
    status: String, // pending, in_progress, resolved
    reported_by: String,
    campus_id: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
struct MaintenanceRequestData {
    room_number: String,
    hostel_name: String,
    issue_type: String,
    description: String,
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
        "service": "hostel-service"
    }))
}

// Room Management
async fn create_room(
    data: web::Data<AppState>,
    req: HttpRequest,
    room_data: web::Json<RoomRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<Room> = data.db.collection("rooms");

    let new_room = Room {
        id: None,
        room_number: room_data.room_number.clone(),
        hostel_name: room_data.hostel_name.clone(),
        capacity: room_data.capacity,
        occupied: 0,
        room_type: room_data.room_type.clone(),
        floor: room_data.floor,
        campus_id: claims.campus_id,
        created_at: Utc::now(),
    };

    collection
        .insert_one(new_room, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Room created successfully"
    })))
}

async fn get_rooms(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<Room> = data.db.collection("rooms");

    let mut cursor = collection
        .find(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut rooms = Vec::new();
    use futures::stream::StreamExt;
    
    while let Some(result) = cursor.next().await {
        match result {
            Ok(room) => rooms.push(room),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    Ok(HttpResponse::Ok().json(rooms))
}

// Room Allocation
async fn allocate_room(
    data: web::Data<AppState>,
    req: HttpRequest,
    allocation_data: web::Json<AllocationRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let room_collection: Collection<Room> = data.db.collection("rooms");
    let allocation_collection: Collection<RoomAllocation> = data.db.collection("room_allocations");

    // Get room details
    let room_obj_id = ObjectId::parse_str(&allocation_data.room_id)
        .map_err(|e| actix_web::error::ErrorBadRequest(e))?;

    let room = room_collection
        .find_one(doc! { "_id": room_obj_id, "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let room = match room {
        Some(r) => r,
        None => return Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Room not found"
        }))),
    };

    // Check if room is available
    if room.occupied >= room.capacity {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Room is full"
        })));
    }

    // Create allocation
    let new_allocation = RoomAllocation {
        id: None,
        student_id: allocation_data.student_id.clone(),
        room_id: allocation_data.room_id.clone(),
        hostel_name: room.hostel_name.clone(),
        room_number: room.room_number.clone(),
        allocation_date: Utc::now(),
        status: "active".to_string(),
        campus_id: claims.campus_id.clone(),
    };

    allocation_collection
        .insert_one(new_allocation, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    // Update room occupied count
    room_collection
        .update_one(
            doc! { "_id": room_obj_id },
            doc! { "$inc": { "occupied": 1 } },
            None,
        )
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Room allocated successfully"
    })))
}

async fn get_allocations(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<RoomAllocation> = data.db.collection("room_allocations");

    let mut cursor = collection
        .find(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut allocations = Vec::new();
    use futures::stream::StreamExt;
    
    while let Some(result) = cursor.next().await {
        match result {
            Ok(allocation) => allocations.push(allocation),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    Ok(HttpResponse::Ok().json(allocations))
}

// Maintenance Management
async fn create_maintenance_request(
    data: web::Data<AppState>,
    req: HttpRequest,
    maintenance_data: web::Json<MaintenanceRequestData>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<MaintenanceRequest> = data.db.collection("maintenance_requests");

    let new_request = MaintenanceRequest {
        id: None,
        room_number: maintenance_data.room_number.clone(),
        hostel_name: maintenance_data.hostel_name.clone(),
        issue_type: maintenance_data.issue_type.clone(),
        description: maintenance_data.description.clone(),
        status: "pending".to_string(),
        reported_by: claims.sub.clone(),
        campus_id: claims.campus_id,
        created_at: Utc::now(),
    };

    collection
        .insert_one(new_request, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Maintenance request created successfully"
    })))
}

async fn get_maintenance_requests(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<MaintenanceRequest> = data.db.collection("maintenance_requests");

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

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    env_logger::init();

    let mongodb_uri = env::var("MONGODB_URI").unwrap_or_else(|_| "mongodb://localhost:27017".to_string());
    let database_name = env::var("DATABASE_NAME").unwrap_or_else(|_| "campusconnect".to_string());
    let jwt_secret = env::var("JWT_SECRET").unwrap_or_else(|_| "your-secret-key".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "8083".to_string());

    println!("🏠 Starting Hostel Service...");
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
            // Room routes
            .route("/api/rooms", web::post().to(create_room))
            .route("/api/rooms", web::get().to(get_rooms))
            // Allocation routes
            .route("/api/allocations", web::post().to(allocate_room))
            .route("/api/allocations", web::get().to(get_allocations))
            // Maintenance routes
            .route("/api/maintenance", web::post().to(create_maintenance_request))
            .route("/api/maintenance", web::get().to(get_maintenance_requests))
    })
    .bind(format!("127.0.0.1:{}", port))?
    .run()
    .await
}
