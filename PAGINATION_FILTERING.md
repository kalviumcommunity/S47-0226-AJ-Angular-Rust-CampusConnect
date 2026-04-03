# PR: Pagination, Filtering & Query Optimization

## What Changed

Enhanced three `GET` endpoints in `academics-service` with pagination and filtering support.

---

## Endpoints with Pagination & Filtering

### 1. `GET /api/attendance`

**Query Parameters:**

| Param | Default | Description |
|-------|---------|-------------|
| `page` | `1` | Page number (1-indexed) |
| `limit` | `20` | Records per page (max 100) |
| `status` | — | Filter: `present` \| `absent` \| `late` |
| `course_code` | — | Filter by course code |
| `student_id` | — | Filter by student ID |

### 2. `GET /api/enrollments`

| Param | Default | Description |
|-------|---------|-------------|
| `page` | `1` | Page number |
| `limit` | `20` | Records per page (max 100) |
| `semester` | — | Filter by semester, e.g. `Fall 2024` |
| `course_code` | — | Filter by course code |

### 3. `GET /api/courses`

| Param | Default | Description |
|-------|---------|-------------|
| `page` | `1` | Page number |
| `limit` | `20` | Records per page (max 100) |
| `department` | — | Filter by department name |

---

## Pagination Calculation

```
skip = (page - 1) * limit
total_pages = ceil(total / limit)
```

- `page` is clamped to a minimum of `1`
- `limit` is clamped between `1` and `100`
- Results are ordered by `created_at DESC` so newest records appear first

**Response shape:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 500,
    "total_pages": 25
  }
}
```

---

## How Filtering Improves Performance

Filters are applied **at the database level** inside the MongoDB query document before any data is fetched. This means:

- MongoDB only scans and returns matching documents — no over-fetching
- `count_documents` uses the same filter, so the total count is accurate without loading all records
- Combined with `LIMIT`/`OFFSET` (MongoDB `limit`/`skip`), the server never loads the full collection into memory

---

## Query Safety

- All filters use typed `Option<String>` fields deserialized via `serde` — no string concatenation
- Filter values are inserted into the BSON `doc!` macro as typed values, not raw strings
- `status` filter is validated against the allowed enum (`present`, `absent`, `late`) before the query runs
- Empty/whitespace filter values are ignored rather than passed to the DB

---

## How to Test Locally

**1. Start the service:**
```bash
cd academics-service
cargo run
# Listens on http://localhost:8081
```

**2. Get a token:**
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')
```

**3. Test pagination:**
```bash
# Page 1, 5 records per page
curl "http://localhost:8081/api/attendance?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN"

# Page 2
curl "http://localhost:8081/api/attendance?page=2&limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

**4. Test filtering:**
```bash
# Only absent records
curl "http://localhost:8081/api/attendance?status=absent" \
  -H "Authorization: Bearer $TOKEN"

# Absent records for a specific course
curl "http://localhost:8081/api/attendance?status=absent&course_code=CS101" \
  -H "Authorization: Bearer $TOKEN"

# Enrollments for Fall 2024
curl "http://localhost:8081/api/enrollments?semester=Fall%202024&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Courses in Computer Science department
curl "http://localhost:8081/api/courses?department=Computer%20Science" \
  -H "Authorization: Bearer $TOKEN"
```

**5. Expected response shape:**
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 47,
    "total_pages": 10
  }
}
```
