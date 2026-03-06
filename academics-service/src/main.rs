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

// Batch Management
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

#[derive(Debug, Serialize, Deserialize)]
struct BatchRequest {
    batch_name: String,
    course_code: String,
    student_ids: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct BatchStudentsRequest {
    student_ids: Vec<String>,
}

// Batch Attendance
#[derive(Debug, Serialize, Deserialize)]
struct BatchAttendanceRequest {
    batch_id: String,
    course_code: String,
    date: String,
    records: Vec<StudentAttendanceRecord>,
}

#[derive(Debug, Serialize, Deserialize)]
struct StudentAttendanceRecord {
    student_id: String,
    status: String,
}

// Exam Results
#[derive(Debug, Serialize, Deserialize, Clone)]
struct ExamResult {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    student_id: String,
    course_code: String,
    exam_type: String, // midterm, final, quiz, assignment
    marks_obtained: f64,
    total_marks: f64,
    grade: String,
    semester: String,
    campus_id: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ExamResultRequest {
    student_id: String,
    course_code: String,
    exam_type: String,
    marks_obtained: f64,
    total_marks: f64,
    semester: String,
}

// Notes & Study Materials
#[derive(Debug, Serialize, Deserialize, Clone)]
struct Note {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    id: Option<ObjectId>,
    title: String,
    description: String,
    course_code: String,
    file_url: String,
    file_type: String, // pdf, doc, video, ppt
    uploaded_by: String,
    uploader_role: String, // teacher, student
    campus_id: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
struct NoteRequest {
    title: String,
    description: String,
    course_code: String,
    file_url: String,
    file_type: String,
}

// Student Notes Submission
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
    status: String, // submitted, reviewed, verified, rejected
    review_comment: Option<String>,
    reviewed_by: Option<String>,
    campus_id: String,
    created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
struct StudentNoteSubmissionRequest {
    title: String,
    description: String,
    course_code: String,
    file_url: String,
    file_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ReviewNoteRequest {
    status: String,
    review_comment: String,
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

// ===== STUDENT DASHBOARD ENDPOINTS =====

// Get student's own attendance with percentage per subject
async fn get_student_attendance(
    data: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<String>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    // Students can only view their own attendance
    let student_id = path.into_inner();
    if claims.role == "student" && claims.sub != student_id {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Access denied: You can only view your own attendance"
        })));
    }

    let collection: Collection<Attendance> = data.db.collection("attendance");

    let mut cursor = collection
        .find(doc! { "student_id": &student_id, "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut records = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        match result {
            Ok(record) => records.push(record),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    // Calculate attendance percentage per subject
    let mut subject_stats: std::collections::HashMap<String, (i32, i32)> = std::collections::HashMap::new();
    for record in &records {
        let entry = subject_stats.entry(record.course_code.clone()).or_insert((0, 0));
        entry.1 += 1; // total classes
        if record.status == "present" || record.status == "late" {
            entry.0 += 1; // attended
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
    let overall_percentage = if total_classes > 0 { (total_attended as f64 / total_classes as f64) * 100.0 } else { 0.0 };

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "student_id": student_id,
        "overall_attendance_percentage": format!("{:.1}", overall_percentage),
        "total_classes_attended": total_attended,
        "total_classes": total_classes,
        "subject_wise_attendance": subject_attendance,
        "records": records
    })))
}

// Get student's enrolled classes
async fn get_student_enrollments(
    data: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<String>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let student_id = path.into_inner();
    if claims.role == "student" && claims.sub != student_id {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Access denied: You can only view your own enrollments"
        })));
    }

    let enrollment_collection: Collection<Enrollment> = data.db.collection("enrollments");
    let course_collection: Collection<Course> = data.db.collection("courses");
    let attendance_collection: Collection<Attendance> = data.db.collection("attendance");

    // Get enrolled courses
    let mut cursor = enrollment_collection
        .find(doc! { "student_id": &student_id, "campus_id": &claims.campus_id }, None)
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

    let mut classes_info = Vec::new();
    for enrollment in &enrollments {
        // Get course details
        let course = course_collection
            .find_one(doc! { "course_code": &enrollment.course_code, "campus_id": &claims.campus_id }, None)
            .await
            .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

        // Get attendance for this course
        let attended = attendance_collection
            .count_documents(doc! {
                "student_id": &student_id,
                "course_code": &enrollment.course_code,
                "status": { "$in": ["present", "late"] },
                "campus_id": &claims.campus_id
            }, None)
            .await
            .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

        let total = attendance_collection
            .count_documents(doc! {
                "student_id": &student_id,
                "course_code": &enrollment.course_code,
                "campus_id": &claims.campus_id
            }, None)
            .await
            .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

        let missed = total - attended;

        classes_info.push(serde_json::json!({
            "course_code": enrollment.course_code,
            "course_name": course.map(|c| c.course_name).unwrap_or_default(),
            "semester": enrollment.semester,
            "enrolled_at": enrollment.enrolled_at,
            "classes_attended": attended,
            "classes_missed": missed,
            "total_classes": total
        }));
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "student_id": student_id,
        "enrollments": classes_info
    })))
}

// ===== EXAM RESULTS =====

async fn create_result(
    data: web::Data<AppState>,
    req: HttpRequest,
    result_data: web::Json<ExamResultRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    if claims.role != "teacher" && claims.role != "admin" {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Only teachers can add exam results"
        })));
    }

    let collection: Collection<ExamResult> = data.db.collection("exam_results");

    let grade = calculate_grade(result_data.marks_obtained, result_data.total_marks);

    let new_result = ExamResult {
        id: None,
        student_id: result_data.student_id.clone(),
        course_code: result_data.course_code.clone(),
        exam_type: result_data.exam_type.clone(),
        marks_obtained: result_data.marks_obtained,
        total_marks: result_data.total_marks,
        grade,
        semester: result_data.semester.clone(),
        campus_id: claims.campus_id,
        created_at: Utc::now(),
    };

    collection
        .insert_one(new_result, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Exam result added successfully"
    })))
}

fn calculate_grade(marks: f64, total: f64) -> String {
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

async fn get_student_results(
    data: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<String>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let student_id = path.into_inner();
    if claims.role == "student" && claims.sub != student_id {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Access denied: You can only view your own results"
        })));
    }

    let collection: Collection<ExamResult> = data.db.collection("exam_results");

    let mut cursor = collection
        .find(doc! { "student_id": &student_id, "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut results = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        match result {
            Ok(r) => results.push(r),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    // Calculate overall performance
    let total_marks: f64 = results.iter().map(|r| r.marks_obtained).sum();
    let total_possible: f64 = results.iter().map(|r| r.total_marks).sum();
    let overall_percentage = if total_possible > 0.0 { (total_marks / total_possible) * 100.0 } else { 0.0 };

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "student_id": student_id,
        "results": results,
        "overall_marks_obtained": total_marks,
        "overall_total_marks": total_possible,
        "overall_percentage": format!("{:.1}", overall_percentage),
        "overall_grade": calculate_grade(total_marks, total_possible)
    })))
}

// ===== BATCH MANAGEMENT (TEACHER) =====

async fn create_batch(
    data: web::Data<AppState>,
    req: HttpRequest,
    batch_data: web::Json<BatchRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    if claims.role != "teacher" && claims.role != "admin" {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Only teachers can manage batches"
        })));
    }

    let collection: Collection<Batch> = data.db.collection("batches");

    let new_batch = Batch {
        id: None,
        batch_name: batch_data.batch_name.clone(),
        course_code: batch_data.course_code.clone(),
        teacher_id: claims.sub.clone(),
        student_ids: batch_data.student_ids.clone(),
        campus_id: claims.campus_id,
        created_at: Utc::now(),
    };

    collection
        .insert_one(new_batch, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Batch created successfully"
    })))
}

async fn get_batches(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<Batch> = data.db.collection("batches");

    let filter = if claims.role == "teacher" {
        doc! { "teacher_id": &claims.sub, "campus_id": &claims.campus_id }
    } else {
        doc! { "campus_id": &claims.campus_id }
    };

    let mut cursor = collection
        .find(filter, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut batches = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        match result {
            Ok(batch) => batches.push(batch),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    Ok(HttpResponse::Ok().json(batches))
}

async fn get_batch_students(
    data: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<String>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let batch_id = path.into_inner();
    let collection: Collection<Batch> = data.db.collection("batches");

    let batch_obj_id = ObjectId::parse_str(&batch_id)
        .map_err(|e| actix_web::error::ErrorBadRequest(e))?;

    let batch = collection
        .find_one(doc! { "_id": batch_obj_id, "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    match batch {
        Some(b) => Ok(HttpResponse::Ok().json(serde_json::json!({
            "batch_name": b.batch_name,
            "course_code": b.course_code,
            "student_ids": b.student_ids,
            "total_students": b.student_ids.len()
        }))),
        None => Ok(HttpResponse::NotFound().json(serde_json::json!({
            "error": "Batch not found"
        }))),
    }
}

async fn add_students_to_batch(
    data: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<String>,
    body: web::Json<BatchStudentsRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    if claims.role != "teacher" && claims.role != "admin" {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Only teachers can manage batches"
        })));
    }

    let batch_id = path.into_inner();
    let collection: Collection<Batch> = data.db.collection("batches");

    let batch_obj_id = ObjectId::parse_str(&batch_id)
        .map_err(|e| actix_web::error::ErrorBadRequest(e))?;

    collection
        .update_one(
            doc! { "_id": batch_obj_id, "campus_id": &claims.campus_id },
            doc! { "$addToSet": { "student_ids": { "$each": &body.student_ids } } },
            None,
        )
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Students added to batch successfully"
    })))
}

// Mark batch attendance (teacher marks all students at once)
async fn mark_batch_attendance(
    data: web::Data<AppState>,
    req: HttpRequest,
    body: web::Json<BatchAttendanceRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    if claims.role != "teacher" && claims.role != "admin" {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Only teachers can mark attendance"
        })));
    }

    let collection: Collection<Attendance> = data.db.collection("attendance");

    let mut inserted = 0;
    for record in &body.records {
        let attendance = Attendance {
            id: None,
            student_id: record.student_id.clone(),
            course_code: body.course_code.clone(),
            date: body.date.clone(),
            status: record.status.clone(),
            campus_id: claims.campus_id.clone(),
            created_at: Utc::now(),
        };

        collection
            .insert_one(attendance, None)
            .await
            .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;
        inserted += 1;
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": format!("Attendance marked for {} students", inserted)
    })))
}

// ===== NOTES & STUDY MATERIALS =====

// Teacher uploads notes/lectures
async fn upload_note(
    data: web::Data<AppState>,
    req: HttpRequest,
    note_data: web::Json<NoteRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    if claims.role != "teacher" && claims.role != "admin" {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Only teachers can upload notes"
        })));
    }

    let collection: Collection<Note> = data.db.collection("notes");

    let new_note = Note {
        id: None,
        title: note_data.title.clone(),
        description: note_data.description.clone(),
        course_code: note_data.course_code.clone(),
        file_url: note_data.file_url.clone(),
        file_type: note_data.file_type.clone(),
        uploaded_by: claims.sub.clone(),
        uploader_role: claims.role.clone(),
        campus_id: claims.campus_id,
        created_at: Utc::now(),
    };

    collection
        .insert_one(new_note, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Note uploaded successfully"
    })))
}

// Get notes for a course (students and teachers)
async fn get_notes(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<Note> = data.db.collection("notes");

    let filter = doc! { "campus_id": &claims.campus_id, "uploader_role": "teacher" };

    let mut cursor = collection
        .find(filter, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut notes = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        match result {
            Ok(note) => notes.push(note),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    Ok(HttpResponse::Ok().json(notes))
}

// Get notes for specific course
async fn get_course_notes(
    data: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<String>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let course_code = path.into_inner();
    let collection: Collection<Note> = data.db.collection("notes");

    let mut cursor = collection
        .find(doc! { "course_code": &course_code, "campus_id": &claims.campus_id, "uploader_role": "teacher" }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut notes = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        match result {
            Ok(note) => notes.push(note),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    Ok(HttpResponse::Ok().json(notes))
}

// Student submits notes
async fn submit_student_note(
    data: web::Data<AppState>,
    req: HttpRequest,
    note_data: web::Json<StudentNoteSubmissionRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    let collection: Collection<StudentNoteSubmission> = data.db.collection("student_note_submissions");

    let submission = StudentNoteSubmission {
        id: None,
        student_id: claims.sub.clone(),
        title: note_data.title.clone(),
        description: note_data.description.clone(),
        course_code: note_data.course_code.clone(),
        file_url: note_data.file_url.clone(),
        file_type: note_data.file_type.clone(),
        status: "submitted".to_string(),
        review_comment: None,
        reviewed_by: None,
        campus_id: claims.campus_id,
        created_at: Utc::now(),
    };

    collection
        .insert_one(submission, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Note submitted for review"
    })))
}

// Teacher views student note submissions
async fn get_student_submissions(
    data: web::Data<AppState>,
    req: HttpRequest,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    if claims.role != "teacher" && claims.role != "admin" {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Only teachers can view student submissions"
        })));
    }

    let collection: Collection<StudentNoteSubmission> = data.db.collection("student_note_submissions");

    let mut cursor = collection
        .find(doc! { "campus_id": &claims.campus_id }, None)
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    let mut submissions = Vec::new();
    use futures::stream::StreamExt;
    while let Some(result) = cursor.next().await {
        match result {
            Ok(submission) => submissions.push(submission),
            Err(e) => return Err(actix_web::error::ErrorInternalServerError(e)),
        }
    }

    Ok(HttpResponse::Ok().json(submissions))
}

// Teacher reviews student note
async fn review_student_note(
    data: web::Data<AppState>,
    req: HttpRequest,
    path: web::Path<String>,
    review_data: web::Json<ReviewNoteRequest>,
) -> Result<HttpResponse, Error> {
    let claims = extract_claims(&req, &data.jwt_secret)
        .map_err(|e| actix_web::error::ErrorUnauthorized(e))?;

    if claims.role != "teacher" && claims.role != "admin" {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Only teachers can review notes"
        })));
    }

    let note_id = path.into_inner();
    let collection: Collection<StudentNoteSubmission> = data.db.collection("student_note_submissions");

    let note_obj_id = ObjectId::parse_str(&note_id)
        .map_err(|e| actix_web::error::ErrorBadRequest(e))?;

    collection
        .update_one(
            doc! { "_id": note_obj_id, "campus_id": &claims.campus_id },
            doc! { "$set": {
                "status": &review_data.status,
                "review_comment": &review_data.review_comment,
                "reviewed_by": &claims.sub
            }},
            None,
        )
        .await
        .map_err(|e| actix_web::error::ErrorInternalServerError(e))?;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "message": "Note reviewed successfully"
    })))
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
            // Student Dashboard routes
            .route("/api/student/attendance/{student_id}", web::get().to(get_student_attendance))
            .route("/api/student/enrollments/{student_id}", web::get().to(get_student_enrollments))
            .route("/api/student/results/{student_id}", web::get().to(get_student_results))
            // Exam Results routes
            .route("/api/results", web::post().to(create_result))
            // Batch Management routes (Teacher)
            .route("/api/batches", web::post().to(create_batch))
            .route("/api/batches", web::get().to(get_batches))
            .route("/api/batches/{batch_id}/students", web::get().to(get_batch_students))
            .route("/api/batches/{batch_id}/students", web::post().to(add_students_to_batch))
            .route("/api/attendance/batch", web::post().to(mark_batch_attendance))
            // Notes routes
            .route("/api/notes", web::post().to(upload_note))
            .route("/api/notes", web::get().to(get_notes))
            .route("/api/notes/course/{course_code}", web::get().to(get_course_notes))
            // Student Notes Submission
            .route("/api/student/notes/submit", web::post().to(submit_student_note))
            .route("/api/teacher/student-notes", web::get().to(get_student_submissions))
            .route("/api/teacher/student-notes/{id}/review", web::put().to(review_student_note))
    })
    .bind(format!("127.0.0.1:{}", port))?
    .run()
    .await
}
