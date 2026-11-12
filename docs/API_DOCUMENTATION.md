# HostelFix REST API Documentation

Comprehensive reference documentation for the HostelFix Express REST API.

## Base URL & Protocols
- **Production API**: `https://hostelfix-api-5uzs.onrender.com/api`
- **Local Development**: `http://localhost:5000/api`
- **Supported Protocols**: HTTPS / HTTP/1.1 / HTTP/2

---

## Authentication & Headers

HostelFix supports dual authentication:
1. **HTTP-Only Cookies** (`hostelfix_token`): Preferred for web browsers. Automatically managed via `credentials: 'include'`.
2. **Bearer Token Authorization**: Supported for external clients and mobile integrations.
   ```http
   Authorization: Bearer <jwt_token>
   ```

### Standard Response Format
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error description message",
  "errors": []
}
```

---

## 1. System Health Endpoints

### 1.1 Liveness Probe
Lightweight process liveness check. Responds in < 10ms with zero database dependencies.
- **Method**: `GET`
- **Endpoint**: `/health`
- **Response**: `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2026-11-12T15:30:00.000Z",
  "uptime": 124.5
}
```

### 1.2 Readiness Probe
Deep system readiness check verifying database connectivity.
- **Method**: `GET`
- **Endpoint**: `/health/ready`
- **Response**: `200 OK` (or `503 Service Unavailable` if database is disconnected)
```json
{
  "status": "ready",
  "database": "connected",
  "timestamp": "2026-11-12T15:30:00.000Z"
}
```

---

## 2. Authentication Endpoints

### 2.1 Student Google OAuth Login
Exchange Google Identity Services ID token for a secure authenticated session.
- **Method**: `POST`
- **Endpoint**: `/auth/google` or `/auth/student/google`
- **Body**:
```json
{
  "credential": "<google_id_token>"
}
```
- **Response**: `200 OK`
```json
{
  "success": true,
  "user": {
    "_id": "673...",
    "name": "Aarav Sharma",
    "email": "aarav.sharma@hostelfix.edu",
    "role": "student",
    "isOnboarded": true,
    "room": "B-304",
    "block": "Block B"
  }
}
```

### 2.2 Staff Login
Authenticate staff members using email and password.
- **Method**: `POST`
- **Endpoint**: `/auth/staff/login`
- **Body**:
```json
{
  "email": "technician@hostelfix.edu",
  "password": "Password123"
}
```

### 2.3 Admin / Warden Login
Authenticate hostel wardens or platform administrators.
- **Method**: `POST`
- **Endpoint**: `/auth/admin/login`
- **Body**:
```json
{
  "loginId": "admin@hostelfix.edu",
  "password": "Warden@Secure2026"
}
```

### 2.4 Verify Session (`/auth/me`)
Verify active session and retrieve the authenticated user profile.
- **Method**: `GET`
- **Endpoint**: `/auth/me`
- **Response**: `200 OK`
```json
{
  "success": true,
  "user": {
    "id": "673...",
    "name": "Chief Warden Office",
    "role": "admin",
    "email": "admin@hostelfix.edu"
  }
}
```

### 2.5 Logout
Revoke active session in database and clear authentication cookie.
- **Method**: `POST`
- **Endpoint**: `/auth/logout`
- **Response**: `200 OK`

---

## 3. Student Endpoints

All student endpoints require `role: student`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/student/onboarding` | Complete profile (room, block, phone) |
| `GET` | `/student/dashboard` | Student statistics and recent complaints |
| `GET` | `/student/complaints` | Paginated list of student's own complaints |
| `POST` | `/student/complaints` | Create a new maintenance complaint |
| `GET` | `/student/complaints/:id` | Detailed complaint tracking with timeline |
| `POST` | `/student/complaints/:id/feedback` | Submit star rating and review on resolved complaint |
| `GET` | `/student/notifications` | Student notification feed |
| `PATCH` | `/student/notifications/:id/read` | Mark notification as read |
| `GET` | `/student/profile` | View profile details |
| `PATCH` | `/student/profile` | Update contact details |

---

## 4. Staff Endpoints

All staff endpoints require `role: staff`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/staff/dashboard` | Staff metrics, assigned count, completed count |
| `GET` | `/staff/tasks` | Active assigned task queue |
| `GET` | `/staff/tasks/:id` | Detailed task view |
| `PATCH` | `/staff/tasks/:id/status` | Update task status (`in_progress`, `resolved`) with photo proof |
| `GET` | `/staff/history` | Completed resolution history |
| `GET` | `/staff/notifications` | Staff task notifications |
| `GET` | `/staff/profile` | View technician profile |

---

## 5. Admin & Warden Endpoints

All admin endpoints require `role: admin`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/admin/dashboard` | Hostel overview, SLA breaches, triage queue |
| `GET` | `/admin/complaints` | All hostel complaints with filtering & search |
| `GET` | `/admin/complaints/:id` | Full complaint inspection with internal notes |
| `PATCH` | `/admin/complaints/:id/assign` | Assign complaint to staff member |
| `PATCH` | `/admin/complaints/:id/verify` | Verify and close resolved complaints |
| `GET` | `/admin/staff` | List staff members with workload indicators |
| `POST` | `/admin/staff` | Register new maintenance staff |
| `GET` | `/admin/blocks` | Hostel block management & room assignments |
| `GET` | `/admin/students` | Registered student directory |
| `GET` | `/admin/analytics` | Resolution time analytics, category breakdowns |
| `GET` | `/admin/reports/export` | Download CSV audit reports |
| `GET` | `/admin/settings` | System SLAs, categories, priority rules |

---

## 6. Media Uploads

### Upload Complaint Photo / Proof
- **Method**: `POST`
- **Endpoint**: `/upload`
- **Content-Type**: `multipart/form-data`
- **Field**: `image` (max 10MB; JPEG, PNG, WebP)
- **Response**: `200 OK`
```json
{
  "success": true,
  "imageUrl": "https://res.cloudinary.com/hostelfix/image/upload/v1234/..."
}
```

