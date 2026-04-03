use actix_web::{web, App, HttpServer, HttpResponse, HttpRequest, ResponseError};
use actix_cors::Cors;
use mongodb::{Client, Collection, bson::{doc, oid::ObjectId}};
use serde::{Deserialize, Serialize};
use jsonwebtoken::{decode, DecodingKey, Validation, Algorithm};
use chrono::{DateTime, Utc};
use std::fmt;
use std::env;
use anyhow::Context;

// ── Custom API Error Type ─────────────────────────────────────────────────────

#[derive(Debug, Serialize)]
struct ErrorBody {
    error: String,
}

#[derive(Debug)]
enum AppError {
    Unauthorized(String),
    Forbidden(String),
    BadRequest(String),
    NotFound(String),
    Internal(anyhow::Error),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Unauthorized(m) => write!(f, "{}", m),
            AppError::Forbidden(m) => write!(f, "{}", m),
            AppError::BadRequest(m) => write!(f, "{}", m),
            AppError::NotFound(m) => write!(f, "{}", m),
            AppError::Internal(e) => write!(f, "Internal server error: {}", e),
        }
    }
}

impl ResponseError for AppError {
    fn error_response(&self) -> HttpResponse {
        let body = ErrorBody { error: self.to_string() };
        match self {
            AppError::Unauthorized(_) => HttpResponse::Unauthorized().json(body),
            AppError::Forbidden(_) => HttpResponse::Forbidden().json(body),
            AppError::BadRequest(_) => HttpResponse::BadRequest().json(body),
            AppError::NotFound(_) => HttpResponse::NotFound().json(body),
            AppError::Internal(_) => HttpResponse::InternalServerError().json(body),
        }
    }
}

impl From<anyhow::Error> for AppError {
    fn from(e: anyhow::Error) -> Self {
        AppError::Internal(e)
    }
}

// ── Data Models ───────────────────────────────────────────────────────────────

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

/// All fields are Option so we can detect and reject missing ones explicitly.
#[derive(Debug, Deserialize)]
struct CourseRequest {
    course_code: Option<String>,
    course_name: Option<String>,
    credits: Option<i32>,
    department: Option<String>,
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

#[derive(Debug, Deserialize)]
struct EnrollmentRequest {
    student_id: Option<String>,
    course_code: Option<String>,
    semester: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Attendance {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    student_id: String,
    course_code: String,
    date: String,
    status: String,
    campus_id: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
struct AttendanceRequest {
    student_id: Option<String>,
    course_code: Option<String>,
    date: Option<String>,
    status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Batch {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    batch_name: String,
    course_code: String,
    teacher_id: String,
    student_ids: Vec<String>,
    campus_id: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
struct BatchRequest {
    batch_name: Option<String>,
    course_code: Option<String>,
    student_ids: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
struct BatchStudentsRequest {
    student_ids: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
struct BatchAttendanceRequest {
    batch_id: Option<String>,
    course_code: Option<String>,
    date: Option<String>,
    records: Option<Vec<StudentAttendanceRecord>>,
}

#[derive(Debug, Deserialize)]
struct StudentAttendanceRecord {
    student_id: String,
    status: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ExamResult {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    student_id: String,
    course_code: String,
    exam_type: String,
    marks_obtained: f64,
    total_marks: f64,
    grade: String,
    semester: String,
    campus_id: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
struct ExamResultRequest {
    student_id: Option<String>,
    course_code: Option<String>,
    exam_type: Option<String>,
    marks_obtained: Option<f64>,
    total_marks: Option<f64>,
    semester: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Note {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    title: String,
    description: String,
    course_code: String,
    file_url: String,
    file_type: String,
    uploaded_by: String,
    uploader_role: String,
    campus_id: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
struct NoteRequest {
    title: Option<String>,
    description: Option<String>,
    course_code: Option<String>,
    file_url: Option<String>,
    file_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct StudentNoteSubmission {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    student_id: String,
    title: String,
    description: String,
    course_code: String,
    file_url: String,
    file_type: String,
    status: String,
    review_comment: Option<String>,
    reviewed_by: Option<String>,
    campus_id: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
struct StudentNoteSubmissionRequest {
    title: Option<String>,
    description: Option<String>,
    course_code: Option<String>,
    file_url: Option<String>,
    file_type: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ReviewNoteRequest {
    status: Option<String>,
    review_comment: Option<String>,
}

struct AppState {
    db: mongodb::Database,
    jwt_secret: String,
}

// ── Input Validation Helpers ──────────────────────────────────────────────────

fn require_field<'a>(value: &'a Option<String>, field: &str) -> Result<&'a str, AppError> {
    match value {
        Some(v) if !v.trim().is_empty() => Ok(v.as_str()),
        Some(_) => Err(AppError::BadRequest(format!("'{}' must not be blank", field))),
        None => Err(AppError::BadRequest(format!("'{}' is required", field))),
    }
}

fn require_f64(value: Option<f64>, field: &str) -> Result<f64, AppError> {
    value.ok_or_else(|| AppError::BadRequest(format!("'{}' is required", field)))
}

fn require_i32(value: Option<i32>, field: &str) -> Result<i32, AppError> {
    value.ok_or_else(|| AppError::BadRequest(format!("'{}' is required", field)))
}

/// Validates attendance status values.
fn validate_attendance_status(status: &str) -> Result<(), AppError> {
    match status {
        "present" | "absent" | "late" => Ok(()),
        _ => Err(AppError::BadRequest(format!(
            "Invalid status '{}'. Must be: present, absent, or late",
            status
        ))),
    }
}

/// Validates exam type values.
fn validate_exam_type(exam_type: &str) -> Result<(), AppError> {
    match exam_type {
        "midterm" | "final" | "quiz" | "assignment" => Ok(()),
        _ => Err(AppError::BadRequest(format!(
            "Invalid exam_type '{}'. Must be: midterm, final, quiz, or assignment",
            exam_type
        ))),
    }
}

/// Validates review status values.
fn validate_review_status(status: &str) -> Result<(), AppError> {
    match status {
        "reviewed" | "verified" | "rejected" => Ok(()),
        _ => Err(AppError::BadRequest(format!(
            "Invalid status '{}'. Must be: reviewed, verified, or rejected",
            status
        ))),
    }
}

// ── JWT Extraction (uses anyhow internally) ───────────────────────────────────

/// Extracts and validates JWT claims from the Authorization header.
/// Returns Result<Claims, AppError> — no panics, no unwrap.
fn extract_claims(req: &HttpRequest, jwt_secret: &str) -> Result<Claims, AppError> {
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

    decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret.as_bytes()),
        &Validation::new(Algorithm::HS256),
    )
    .map(|data| data.claims)
    .map_err(|_| AppError::Unauthorized("Invalid or expired token".to_string()))
}

// ── Service Helpers (anyhow for DB operations) ────────────────────────────────

/// Fetches a batch by ObjectId. Returns Option<Batch> — None means not found.
/// Uses anyhow context to add meaningful error messages for DB failures.
async fn find_batch_by_id(
    collection: &Collection<Batch>,
    batch_id: &str,
    campus_id: &str,
) -> anyhow::Result<Option<Batch>> {
    let oid = ObjectId::parse_str(batch_id)
        .context("Invalid batch ID format")?;
    collection
        .find_one(doc! { "_id": oid, "campus_id": campus_id }, None)
        .await
        .context("Database error while fetching batch")
}

fn calculate_grade(marks: f64, total: f64) -> String {
    if total == 0.0 {
        return "N/A".to_string();
    }
    let percentage = (marks / total) * 100.0;
    match percentage as i32 {
        90..=100 => "A+".to_string(),
        80..=89 => "A".to_string(),
        70..=79 => "B+".to_string(),
        60..=69 => "B".to_string(),
        50..=59 => "C".to_string(),
        40..=49 => "D".to_string(),
        _ => "F".to_string(),
    }
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "service": "academics-service"
    }))
}

// ── Course Management ─────────────────────────────────────────────────────────

async fn create_course(
    data: web::Data<AppState>,
    req: HttpRequest,
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;

    let course_data: CourseRequest = serde_json::from_value(body.into_inner())
        .map_err(|e| AppError::BadRequest(format!("Invalid JSON: {}", e)))?;

    let course_code = require_field(&course_data.course_code, "course_code")?;
    let course_name = require_field(&course_data.course_name, "course_name")?;
    let department = require_field(&course_data.department, "department")?;
    let credits = require_i32(course_data.credits, "credits")?;

    if credits < 1 || credits > 6 {
        return Err(AppError::BadRequest("Credits must be between 1 and 6".to_string()));
    }

    let collection: Collection<Course> = data.db.collection("courses");

    let new_course = Course {
        id: None,
        course_code: course_code.to_string(),
        course_name: course_name.to_string(),
        credits,
        department: department.to_string(),
        campus_id: claims.campus_id,
        created_at: Utc::now(),
    };

    collection
        .insert_one(new_course, None)
        .await
        .context("Failed to insert course")?;

    Ok(HttpResponse::Ok().json(serde_json::json!({ "message": "Course created successfully" })))
}

async fn get_courses(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;
    let collection: Collection<Course> = data.db.collection("courses");

    let mut cursor = collection
        .find(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .context("Failed to query courses")?;

    let mut courses = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        let course = result.context("Failed to read course from cursor")?;
        courses.push(course);
    }

    Ok(HttpResponse::Ok().json(courses))
}

// ── Enrollment Management ─────────────────────────────────────────────────────

async fn create_enrollment(
    data: web::Data<AppState>,
    req: HttpRequest,
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;

    let enrollment_data: EnrollmentRequest = serde_json::from_value(body.into_inner())
        .map_err(|e| AppError::BadRequest(format!("Invalid JSON: {}", e)))?;

    let student_id = require_field(&enrollment_data.student_id, "student_id")?;
    let course_code = require_field(&enrollment_data.course_code, "course_code")?;
    let semester = require_field(&enrollment_data.semester, "semester")?;

    let collection: Collection<Enrollment> = data.db.collection("enrollments");

    let existing = collection
        .find_one(doc! {
            "student_id": student_id,
            "course_code": course_code,
            "campus_id": &claims.campus_id
        }, None)
        .await
        .context("Failed to check existing enrollment")?;

    // Option::is_some() — if already enrolled, reject with 400
    if existing.is_some() {
        return Err(AppError::BadRequest(
            "Student already enrolled in this course".to_string(),
        ));
    }

    let new_enrollment = Enrollment {
        id: None,
        student_id: student_id.to_string(),
        course_code: course_code.to_string(),
        semester: semester.to_string(),
        campus_id: claims.campus_id,
        enrolled_at: Utc::now(),
    };

    collection
        .insert_one(new_enrollment, None)
        .await
        .context("Failed to insert enrollment")?;

    Ok(HttpResponse::Ok().json(serde_json::json!({ "message": "Enrollment created successfully" })))
}

async fn get_enrollments(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;
    let collection: Collection<Enrollment> = data.db.collection("enrollments");

    let mut cursor = collection
        .find(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .context("Failed to query enrollments")?;

    let mut enrollments = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        let enrollment = result.context("Failed to read enrollment from cursor")?;
        enrollments.push(enrollment);
    }

    Ok(HttpResponse::Ok().json(enrollments))
}

// ── Attendance Management ─────────────────────────────────────────────────────

async fn mark_attendance(
    data: web::Data<AppState>,
    req: HttpRequest,
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;

    let attendance_data: AttendanceRequest = serde_json::from_value(body.into_inner())
        .map_err(|e| AppError::BadRequest(format!("Invalid JSON: {}", e)))?;

    let student_id = require_field(&attendance_data.student_id, "student_id")?;
    let course_code = require_field(&attendance_data.course_code, "course_code")?;
    let date = require_field(&attendance_data.date, "date")?;
    let status = require_field(&attendance_data.status, "status")?;

    validate_attendance_status(status)?;

    let collection: Collection<Attendance> = data.db.collection("attendance");

    let new_attendance = Attendance {
        id: None,
        student_id: student_id.to_string(),
        course_code: course_code.to_string(),
        date: date.to_string(),
        status: status.to_string(),
        campus_id: claims.campus_id,
        created_at: Utc::now(),
    };

    collection
        .insert_one(new_attendance, None)
        .await
        .context("Failed to insert attendance record")?;

    Ok(HttpResponse::Ok().json(serde_json::json!({ "message": "Attendance marked successfully" })))
}

async fn get_attendance(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;
    let collection: Collection<Attendance> = data.db.collection("attendance");

    let mut cursor = collection
        .find(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .context("Failed to query attendance")?;

    let mut records = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        let record = result.context("Failed to read attendance record from cursor")?;
        records.push(record);
    }

    Ok(HttpResponse::Ok().json(records))
}

// ── Student Dashboard Endpoints ───────────────────────────────────────────────

async fn get_student_attendance(
    data: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;
    let student_id = path.into_inner();

    if claims.role == "student" && claims.sub != student_id {
        return Err(AppError::Forbidden(
            "Access denied: You can only view your own attendance".to_string(),
        ));
    }

    let collection: Collection<Attendance> = data.db.collection("attendance");

    let mut cursor = collection
        .find(doc! { "student_id": &student_id, "campus_id": &claims.campus_id }, None)
        .await
        .context("Failed to query student attendance")?;

    let mut records = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        let record = result.context("Failed to read attendance record")?;
        records.push(record);
    }

    let mut subject_stats: std::collections::HashMap<String, (i32, i32)> = std::collections::HashMap::new();
    for record in &records {
        let entry = subject_stats.entry(record.course_code.clone()).or_insert((0, 0));
        entry.1 += 1;
        if record.status == "present" || record.status == "late" {
            entry.0 += 1;
        }
    }

    let subject_attendance: Vec<serde_json::Value> = subject_stats.iter().map(|(subject, (attended, total))| {
        let percentage = if *total > 0 { (*attended as f64 / *total as f64) * 100.0 } else { 0.0 };
        serde_json::json!({
            "course_code": subject,
            "classes_attended": attended,
            "total_classes": total,
            "attendance_percentage": format!("{:.1}", percentage)
        })
    }).collect();

    let total_attended: i32 = subject_stats.values().map(|(a, _)| a).sum();
    let total_classes: i32 = subject_stats.values().map(|(_, t)| t).sum();
    let overall_percentage = if total_classes > 0 {
        (total_attended as f64 / total_classes as f64) * 100.0
    } else {
        0.0
    };

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "student_id": student_id,
        "overall_attendance_percentage": format!("{:.1}", overall_percentage),
        "total_classes_attended": total_attended,
        "total_classes": total_classes,
        "subject_wise_attendance": subject_attendance,
        "records": records
    })))
}

async fn get_student_enrollments(
    data: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;
    let student_id = path.into_inner();

    if claims.role == "student" && claims.sub != student_id {
        return Err(AppError::Forbidden(
            "Access denied: You can only view your own enrollments".to_string(),
        ));
    }

    let enrollment_collection: Collection<Enrollment> = data.db.collection("enrollments");
    let course_collection: Collection<Course> = data.db.collection("courses");
    let attendance_collection: Collection<Attendance> = data.db.collection("attendance");

    let mut cursor = enrollment_collection
        .find(doc! { "student_id": &student_id, "campus_id": &claims.campus_id }, None)
        .await
        .context("Failed to query enrollments")?;

    let mut enrollments = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        let enrollment = result.context("Failed to read enrollment")?;
        enrollments.push(enrollment);
    }

    let mut classes_info = Vec::new();
    for enrollment in &enrollments {
        // Returns Option<Course> — None is handled gracefully with unwrap_or_default
        let course = course_collection
            .find_one(doc! { "course_code": &enrollment.course_code, "campus_id": &claims.campus_id }, None)
            .await
            .context("Failed to fetch course details")?;

        let attended = attendance_collection
            .count_documents(doc! {
                "student_id": &student_id,
                "course_code": &enrollment.course_code,
                "status": { "$in": ["present", "late"] },
                "campus_id": &claims.campus_id
            }, None)
            .await
            .context("Failed to count attended classes")?;

        let total = attendance_collection
            .count_documents(doc! {
                "student_id": &student_id,
                "course_code": &enrollment.course_code,
                "campus_id": &claims.campus_id
            }, None)
            .await
            .context("Failed to count total classes")?;

        classes_info.push(serde_json::json!({
            "course_code": enrollment.course_code,
            // Option<Course> — use map to extract name, fall back to empty string
            "course_name": course.map(|c| c.course_name).unwrap_or_default(),
            "semester": enrollment.semester,
            "enrolled_at": enrollment.enrolled_at,
            "classes_attended": attended,
            "classes_missed": total - attended,
            "total_classes": total
        }));
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "student_id": student_id,
        "enrollments": classes_info
    })))
}

// ── Exam Results ──────────────────────────────────────────────────────────────

async fn create_result(
    data: web::Data<AppState>,
    req: HttpRequest,
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;

    if claims.role != "teacher" && claims.role != "admin" {
        return Err(AppError::Forbidden("Only teachers can add exam results".to_string()));
    }

    let result_data: ExamResultRequest = serde_json::from_value(body.into_inner())
        .map_err(|e| AppError::BadRequest(format!("Invalid JSON: {}", e)))?;

    let student_id = require_field(&result_data.student_id, "student_id")?;
    let course_code = require_field(&result_data.course_code, "course_code")?;
    let exam_type = require_field(&result_data.exam_type, "exam_type")?;
    let semester = require_field(&result_data.semester, "semester")?;
    let marks_obtained = require_f64(result_data.marks_obtained, "marks_obtained")?;
    let total_marks = require_f64(result_data.total_marks, "total_marks")?;

    validate_exam_type(exam_type)?;

    if total_marks <= 0.0 {
        return Err(AppError::BadRequest("total_marks must be greater than 0".to_string()));
    }
    if marks_obtained < 0.0 || marks_obtained > total_marks {
        return Err(AppError::BadRequest(
            "marks_obtained must be between 0 and total_marks".to_string(),
        ));
    }

    let collection: Collection<ExamResult> = data.db.collection("exam_results");

    let new_result = ExamResult {
        id: None,
        student_id: student_id.to_string(),
        course_code: course_code.to_string(),
        exam_type: exam_type.to_string(),
        marks_obtained,
        total_marks,
        grade: calculate_grade(marks_obtained, total_marks),
        semester: semester.to_string(),
        campus_id: claims.campus_id,
        created_at: Utc::now(),
    };

    collection
        .insert_one(new_result, None)
        .await
        .context("Failed to insert exam result")?;

    Ok(HttpResponse::Ok().json(serde_json::json!({ "message": "Exam result added successfully" })))
}

async fn get_student_results(
    data: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;
    let student_id = path.into_inner();

    if claims.role == "student" && claims.sub != student_id {
        return Err(AppError::Forbidden(
            "Access denied: You can only view your own results".to_string(),
        ));
    }

    let collection: Collection<ExamResult> = data.db.collection("exam_results");

    let mut cursor = collection
        .find(doc! { "student_id": &student_id, "campus_id": &claims.campus_id }, None)
        .await
        .context("Failed to query exam results")?;

    let mut results = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        let r = result.context("Failed to read exam result")?;
        results.push(r);
    }

    let total_marks: f64 = results.iter().map(|r| r.marks_obtained).sum();
    let total_possible: f64 = results.iter().map(|r| r.total_marks).sum();
    let overall_percentage = if total_possible > 0.0 {
        (total_marks / total_possible) * 100.0
    } else {
        0.0
    };

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "student_id": student_id,
        "results": results,
        "overall_marks_obtained": total_marks,
        "overall_total_marks": total_possible,
        "overall_percentage": format!("{:.1}", overall_percentage),
        "overall_grade": calculate_grade(total_marks, total_possible)
    })))
}

// ── Batch Management ──────────────────────────────────────────────────────────

async fn create_batch(
    data: web::Data<AppState>,
    req: HttpRequest,
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;

    if claims.role != "teacher" && claims.role != "admin" {
        return Err(AppError::Forbidden("Only teachers can manage batches".to_string()));
    }

    let batch_data: BatchRequest = serde_json::from_value(body.into_inner())
        .map_err(|e| AppError::BadRequest(format!("Invalid JSON: {}", e)))?;

    let batch_name = require_field(&batch_data.batch_name, "batch_name")?;
    let course_code = require_field(&batch_data.course_code, "course_code")?;
    let student_ids = batch_data
        .student_ids
        .ok_or_else(|| AppError::BadRequest("'student_ids' is required".to_string()))?;

    let collection: Collection<Batch> = data.db.collection("batches");

    let new_batch = Batch {
        id: None,
        batch_name: batch_name.to_string(),
        course_code: course_code.to_string(),
        teacher_id: claims.sub.clone(),
        student_ids,
        campus_id: claims.campus_id,
        created_at: Utc::now(),
    };

    collection
        .insert_one(new_batch, None)
        .await
        .context("Failed to insert batch")?;

    Ok(HttpResponse::Ok().json(serde_json::json!({ "message": "Batch created successfully" })))
}

async fn get_batches(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;
    let collection: Collection<Batch> = data.db.collection("batches");

    let filter = if claims.role == "teacher" {
        doc! { "teacher_id": &claims.sub, "campus_id": &claims.campus_id }
    } else {
        doc! { "campus_id": &claims.campus_id }
    };

    let mut cursor = collection
        .find(filter, None)
        .await
        .context("Failed to query batches")?;

    let mut batches = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        let batch = result.context("Failed to read batch")?;
        batches.push(batch);
    }

    Ok(HttpResponse::Ok().json(batches))
}

async fn get_batch_students(
    data: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;
    let batch_id = path.into_inner();
    let collection: Collection<Batch> = data.db.collection("batches");

    // find_batch_by_id uses anyhow internally; returns Option<Batch>
    let batch = find_batch_by_id(&collection, &batch_id, &claims.campus_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Batch not found".to_string()))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "batch_name": batch.batch_name,
        "course_code": batch.course_code,
        "student_ids": batch.student_ids,
        "total_students": batch.student_ids.len()
    })))
}

async fn add_students_to_batch(
    data: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<String>,
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;

    if claims.role != "teacher" && claims.role != "admin" {
        return Err(AppError::Forbidden("Only teachers can manage batches".to_string()));
    }

    let batch_req: BatchStudentsRequest = serde_json::from_value(body.into_inner())
        .map_err(|e| AppError::BadRequest(format!("Invalid JSON: {}", e)))?;

    let student_ids = batch_req
        .student_ids
        .ok_or_else(|| AppError::BadRequest("'student_ids' is required".to_string()))?;

    if student_ids.is_empty() {
        return Err(AppError::BadRequest("'student_ids' must not be empty".to_string()));
    }

    let batch_id = path.into_inner();
    let collection: Collection<Batch> = data.db.collection("batches");

    let oid = ObjectId::parse_str(&batch_id)
        .map_err(|_| AppError::BadRequest("Invalid batch ID format".to_string()))?;

    collection
        .update_one(
            doc! { "_id": oid, "campus_id": &claims.campus_id },
            doc! { "$addToSet": { "student_ids": { "$each": &student_ids } } },
            None,
        )
        .await
        .context("Failed to update batch")?;

    Ok(HttpResponse::Ok().json(serde_json::json!({ "message": "Students added to batch successfully" })))
}

async fn mark_batch_attendance(
    data: web::Data<AppState>,
    req: HttpRequest,
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;

    if claims.role != "teacher" && claims.role != "admin" {
        return Err(AppError::Forbidden("Only teachers can mark attendance".to_string()));
    }

    let batch_req: BatchAttendanceRequest = serde_json::from_value(body.into_inner())
        .map_err(|e| AppError::BadRequest(format!("Invalid JSON: {}", e)))?;

    require_field(&batch_req.batch_id, "batch_id")?;
    let course_code = require_field(&batch_req.course_code, "course_code")?;
    let date = require_field(&batch_req.date, "date")?;
    let records = batch_req
        .records
        .ok_or_else(|| AppError::BadRequest("'records' is required".to_string()))?;

    if records.is_empty() {
        return Err(AppError::BadRequest("'records' must not be empty".to_string()));
    }

    // Validate all statuses before inserting anything
    for record in &records {
        validate_attendance_status(&record.status)?;
    }

    let collection: Collection<Attendance> = data.db.collection("attendance");
    let mut inserted = 0;

    for record in &records {
        let attendance = Attendance {
            id: None,
            student_id: record.student_id.clone(),
            course_code: course_code.to_string(),
            date: date.to_string(),
            status: record.status.clone(),
            campus_id: claims.campus_id.clone(),
            created_at: Utc::now(),
        };
        collection
            .insert_one(attendance, None)
            .await
            .context("Failed to insert batch attendance record")?;
        inserted += 1;
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": format!("Attendance marked for {} students", inserted)
    })))
}

// ── Notes & Study Materials ───────────────────────────────────────────────────

async fn upload_note(
    data: web::Data<AppState>,
    req: HttpRequest,
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;

    if claims.role != "teacher" && claims.role != "admin" {
        return Err(AppError::Forbidden("Only teachers can upload notes".to_string()));
    }

    let note_data: NoteRequest = serde_json::from_value(body.into_inner())
        .map_err(|e| AppError::BadRequest(format!("Invalid JSON: {}", e)))?;

    let title = require_field(&note_data.title, "title")?;
    let description = require_field(&note_data.description, "description")?;
    let course_code = require_field(&note_data.course_code, "course_code")?;
    let file_url = require_field(&note_data.file_url, "file_url")?;
    let file_type = require_field(&note_data.file_type, "file_type")?;

    let collection: Collection<Note> = data.db.collection("notes");

    let new_note = Note {
        id: None,
        title: title.to_string(),
        description: description.to_string(),
        course_code: course_code.to_string(),
        file_url: file_url.to_string(),
        file_type: file_type.to_string(),
        uploaded_by: claims.sub.clone(),
        uploader_role: claims.role.clone(),
        campus_id: claims.campus_id,
        created_at: Utc::now(),
    };

    collection
        .insert_one(new_note, None)
        .await
        .context("Failed to insert note")?;

    Ok(HttpResponse::Ok().json(serde_json::json!({ "message": "Note uploaded successfully" })))
}

async fn get_notes(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;
    let collection: Collection<Note> = data.db.collection("notes");

    let mut cursor = collection
        .find(doc! { "campus_id": &claims.campus_id, "uploader_role": "teacher" }, None)
        .await
        .context("Failed to query notes")?;

    let mut notes = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        let note = result.context("Failed to read note")?;
        notes.push(note);
    }

    Ok(HttpResponse::Ok().json(notes))
}

async fn get_course_notes(
    data: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<String>,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;
    let course_code = path.into_inner();

    if course_code.trim().is_empty() {
        return Err(AppError::BadRequest("course_code must not be empty".to_string()));
    }

    let collection: Collection<Note> = data.db.collection("notes");

    let mut cursor = collection
        .find(doc! {
            "course_code": &course_code,
            "campus_id": &claims.campus_id,
            "uploader_role": "teacher"
        }, None)
        .await
        .context("Failed to query course notes")?;

    let mut notes = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        let note = result.context("Failed to read note")?;
        notes.push(note);
    }

    Ok(HttpResponse::Ok().json(notes))
}

async fn submit_student_note(
    data: web::Data<AppState>,
    req: HttpRequest,
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;

    let note_data: StudentNoteSubmissionRequest = serde_json::from_value(body.into_inner())
        .map_err(|e| AppError::BadRequest(format!("Invalid JSON: {}", e)))?;

    let title = require_field(&note_data.title, "title")?;
    let description = require_field(&note_data.description, "description")?;
    let course_code = require_field(&note_data.course_code, "course_code")?;
    let file_url = require_field(&note_data.file_url, "file_url")?;
    let file_type = require_field(&note_data.file_type, "file_type")?;

    let collection: Collection<StudentNoteSubmission> = data.db.collection("student_note_submissions");

    let submission = StudentNoteSubmission {
        id: None,
        student_id: claims.sub.clone(),
        title: title.to_string(),
        description: description.to_string(),
        course_code: course_code.to_string(),
        file_url: file_url.to_string(),
        file_type: file_type.to_string(),
        status: "submitted".to_string(),
        review_comment: None,
        reviewed_by: None,
        campus_id: claims.campus_id,
        created_at: Utc::now(),
    };

    collection
        .insert_one(submission, None)
        .await
        .context("Failed to insert student note submission")?;

    Ok(HttpResponse::Ok().json(serde_json::json!({ "message": "Note submitted for review" })))
}

async fn get_student_submissions(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;

    if claims.role != "teacher" && claims.role != "admin" {
        return Err(AppError::Forbidden(
            "Only teachers can view student submissions".to_string(),
        ));
    }

    let collection: Collection<StudentNoteSubmission> = data.db.collection("student_note_submissions");

    let mut cursor = collection
        .find(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .context("Failed to query student submissions")?;

    let mut submissions = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        let submission = result.context("Failed to read submission")?;
        submissions.push(submission);
    }

    Ok(HttpResponse::Ok().json(submissions))
}

async fn review_student_note(
    data: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<String>,
    body: web::Json<serde_json::Value>,
) -> Result<HttpResponse, AppError> {
    let claims = extract_claims(&req, &data.jwt_secret)?;

    if claims.role != "teacher" && claims.role != "admin" {
        return Err(AppError::Forbidden("Only teachers can review notes".to_string()));
    }

    let review_data: ReviewNoteRequest = serde_json::from_value(body.into_inner())
        .map_err(|e| AppError::BadRequest(format!("Invalid JSON: {}", e)))?;

    let status = require_field(&review_data.status, "status")?;
    let review_comment = require_field(&review_data.review_comment, "review_comment")?;

    validate_review_status(status)?;

    let note_id = path.into_inner();
    let note_obj_id = ObjectId::parse_str(&note_id)
        .map_err(|_| AppError::BadRequest("Invalid note ID format".to_string()))?;

    let collection: Collection<StudentNoteSubmission> = data.db.collection("student_note_submissions");

    collection
        .update_one(
            doc! { "_id": note_obj_id, "campus_id": &claims.campus_id },
            doc! { "$set": {
                "status": status,
                "review_comment": review_comment,
                "reviewed_by": &claims.sub
            }},
            None,
        )
        .await
        .context("Failed to update note review")?;

    Ok(HttpResponse::Ok().json(serde_json::json!({ "message": "Note reviewed successfully" })))
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
    let port = env::var("PORT").unwrap_or_else(|_| "8081".to_string());

    println!("Starting Academics Service...");
    println!("Connecting to MongoDB: {}", mongodb_uri);

    let client = Client::with_uri_str(&mongodb_uri)
        .await
        .expect("Failed to connect to MongoDB");

    let db = client.database(&database_name);

    println!("Connected to MongoDB");
    println!("Server starting on http://127.0.0.1:{}", port);

    let app_state = web::Data::new(AppState { db, jwt_secret });

    HttpServer::new(move || {
        let cors = Cors::permissive();
        App::new()
            .wrap(cors)
            .app_data(app_state.clone())
            .app_data(
                web::JsonConfig::default()
                    .error_handler(|err, _req| {
                        let response = HttpResponse::BadRequest().json(ErrorBody {
                            error: format!("Invalid JSON body: {}", err),
                        });
                        actix_web::error::InternalError::from_response(err, response).into()
                    }),
            )
            .route("/health", web::get().to(health_check))
            .route("/api/courses", web::post().to(create_course))
            .route("/api/courses", web::get().to(get_courses))
            .route("/api/enrollments", web::post().to(create_enrollment))
            .route("/api/enrollments", web::get().to(get_enrollments))
            .route("/api/attendance", web::post().to(mark_attendance))
            .route("/api/attendance", web::get().to(get_attendance))
            .route("/api/student/attendance/{student_id}", web::get().to(get_student_attendance))
            .route("/api/student/enrollments/{student_id}", web::get().to(get_student_enrollments))
            .route("/api/student/results/{student_id}", web::get().to(get_student_results))
            .route("/api/results", web::post().to(create_result))
            .route("/api/batches", web::post().to(create_batch))
            .route("/api/batches", web::get().to(get_batches))
            .route("/api/batches/{batch_id}/students", web::get().to(get_batch_students))
            .route("/api/batches/{batch_id}/students", web::post().to(add_students_to_batch))
            .route("/api/attendance/batch", web::post().to(mark_batch_attendance))
            .route("/api/notes", web::post().to(upload_note))
            .route("/api/notes", web::get().to(get_notes))
            .route("/api/notes/course/{course_code}", web::get().to(get_course_notes))
            .route("/api/student/notes/submit", web::post().to(submit_student_note))
            .route("/api/teacher/student-notes", web::get().to(get_student_submissions))
            .route("/api/teacher/student-notes/{id}/review", web::put().to(review_student_note))
    })
    .bind(format!("127.0.0.1:{}", port))?
    .run()
    .await
}
