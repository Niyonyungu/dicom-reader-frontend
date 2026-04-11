# Backend Integration Checklist for Frontend

## 🎯 Frontend Implementation Complete - Backend API Required

The frontend is now fully scaffolded with all required UI components. This document guides backend developers on which APIs need to be implemented to connect all frontend features.

## 🔌 Critical API Endpoints (Required for MVP)

### Priority 1: Authentication & User Management

```
✅ POST   /api/v1/auth/login           - Login with email/password
✅ POST   /api/v1/auth/logout          - Logout (revoke token)
✅ POST   /api/v1/auth/refresh         - Refresh JWT tokens
✅ GET    /api/v1/auth/me              - Get current user info
```

**Frontend Status**: Ready ✅
**Note**: Already implemented, just needs backend endpoints

---

### Priority 2: Patient Management

```
✅ GET    /api/v1/patients             - List patients (paginated)
✅ POST   /api/v1/patients             - Create patient
✅ GET    /api/v1/patients/{id}        - Get patient detail
✅ PUT    /api/v1/patients/{id}        - Update patient
✅ DELETE /api/v1/patients/{id}        - Delete patient
✅ GET    /api/v1/patients/search?q=   - Search patients
```

**Frontend Components**:

- Patient management page (`/dashboard/patients`)
- Patient detail page (`/dashboard/patients/[id]`)
  **Service**: `services/patients-service.ts`

---

### Priority 3: Studies Management

```
✅ GET    /api/v1/studies              - List studies (filtered, paginated)
✅ POST   /api/v1/studies              - Create study
✅ GET    /api/v1/studies/{id}         - Get study details
✅ PUT    /api/v1/studies/{id}         - Update study status
```

**Frontend Components**:

- Studies browsing page (`/dashboard/studies`)
  **Service**: `hooks/use-clinical-api.ts` (exists)

**Query Parameters Supported**:

```
page=1&page_size=20
status=new|ongoing|completed|archived
modality=CT|MR|XR|US|NM|PT
search=<text>
```

---

### Priority 4: Series Management

```
✅ GET    /api/v1/studies/{id}/series  - Get all series in study
```

**Frontend Components**:

- Series browser (`components/viewer/series-browser.tsx`)
  **Expected Response**:

```typescript
Series {
  id: string          // Series UID
  study_id: string
  series_number: number
  series_description: string
  modality: string    // CT, MR, XR, etc
  body_part_examined?: string
  protocol_name?: string
  series_date?: string
  total_instances: number
  created_at: string
}
```

---

### Priority 5: Reports Management

```
✅ GET    /api/v1/reports              - List reports (filterable, paginated)
✅ POST   /api/v1/reports              - Create report
✅ GET    /api/v1/reports/{id}         - Get report detail
✅ PUT    /api/v1/reports/{id}         - Update report (draft only)
✅ DELETE /api/v1/reports/{id}         - Delete report (draft only)
✅ POST   /api/v1/reports/{id}/approve - Approve report (senior radiologist)
✅ POST   /api/v1/reports/{id}/sign    - Sign/finalize report
```

**Frontend Components**:

- Reports page (`/dashboard/reports`)
- Report detail page (`/dashboard/reports/[id]`)
  **Service**: `services/reports-service.ts`

**Report Status Flow**:

```
draft → completed → signed → approved
```

---

### Priority 6: Audit Logging

```
✅ GET    /api/v1/audit-logs           - List all audit logs (admin only)
✅ GET    /api/v1/audit-logs/user/{id} - Get user's audit logs
✅ GET    /api/v1/audit-logs/study/{id} - Get study audit logs
✅ GET    /api/v1/audit-logs/export    - Export logs as CSV
```

**Frontend Components**:

- Audit logs page (`/dashboard/settings/audit-logs`)
  **Service**: `services/audit-service.ts`

**Supported Filters**:

```
page, page_size, user_id, study_id, action, severity
start_date, end_date, resource_type
```

**Expected Response**:

```typescript
AuditLog {
  id: number
  user_id: number
  user_role: string
  action: string              // STUDY_VIEWED, MEASUREMENT_CREATED, etc
  resource_type: string       // study, measurement, annotation, report
  resource_id?: string
  study_id?: string
  details?: Record<string, any>
  severity: "info" | "warning" | "error" | "critical"
  ip_address?: string
  user_agent?: string
  created_at: string
}
```

---

## 🔌 Secondary APIs (For Full Feature Completeness)

### Measurements

```
POST   /api/v1/measurements            - Create measurement
GET    /api/v1/measurements/{id}       - Get measurement
PUT    /api/v1/measurements/{id}       - Update measurement
DELETE /api/v1/measurements/{id}       - Delete measurement
GET    /api/v1/measurements/instance/{instance_id} - Get instance measurements
```

**Frontend Component**: `MeasurementsManager` (ready to integrate)

---

### Annotations

```
POST   /api/v1/annotations             - Create annotation
GET    /api/v1/annotations/{id}        - Get annotation
PUT    /api/v1/annotations/{id}        - Update annotation
DELETE /api/v1/annotations/{id}        - Delete annotation
GET    /api/v1/annotations/instance/{instance_id} - Get instance annotations
```

**Frontend Component**: `AnnotationsManager` (ready to integrate)

---

### DICOM Upload

```
POST   /api/v1/dicom/upload            - Upload DICOM files (multipart)
POST   /api/v1/dicom/upload-batch      - Batch upload
GET    /api/v1/dicom/upload-status/{id} - Get upload progress
```

**Frontend**: Upload page ready (`/dashboard/upload`)

---

### Instance/Image Rendering

```
GET    /api/v1/instances/{id}          - Get instance metadata
GET    /api/v1/instances/{id}/image    - Get rendered image (PNG/JPEG)
POST   /api/v1/instances/{id}/window   - Apply windowing
POST   /api/v1/instances/{id}/render   - Custom rendering
GET    /api/v1/instances/{id}/dicom    - Download original DICOM
```

---

## 📋 Response Format Expected

### Paginated List Responses

```typescript
ListResponse<T> {
  total: number        // Total items in database
  page: number         // Current page (1-indexed)
  page_size: number    // Items per page
  items: T[]          // Array of items
}
```

### Error Responses

```typescript
ErrorResponse {
  error: string           // Error code
  message: string         // Human-readable message
  details?: any          // Additional details
  request_id?: string    // For tracing
}
```

### Success Response

```typescript
{
  access_token: string
  refresh_token: string
  token_type: "bearer"
  user: {
    id: number
    email: string
    full_name: string
    role: UserRole            // admin|radiologist|imaging_technician|radiographer|service
    is_active: boolean
    is_verified: boolean
    permissions: string[]
    created_at: string
    updated_at: string
  }
}
```

---

## 🔐 Authentication Schema

### JWT Token Required

All API requests (except login) must include:

```
Authorization: Bearer <access_token>
```

### Token Refresh Flow

```python
# When access_token expires (401):
POST /api/v1/auth/refresh
{
  "refresh_token": "<refresh_token>"
}

# Response:
{
  "access_token": "new_token",
  "refresh_token": "new_refresh_token",
  "token_type": "bearer"
}
```

---

## 📊 Data Model Summary (From Frontend Types)

### User Role Enum

```typescript
type UserRole =
  | "admin"
  | "radiologist"
  | "imaging_technician"
  | "radiographer"
  | "service";
```

### Patient Model

```typescript
Patient {
  id: string
  name: string
  date_of_birth: string         // YYYY-MM-DD
  gender?: "M" | "F" | "O"
  age?: number
  contact_info?: string
  email?: string
  weight_kg?: number
  height_cm?: number
  medical_record_number?: string
  created_by_id?: number
  created_at: string
  updated_at: string
}
```

### Study Model

```typescript
Study {
  id: string                    // DICOM Study UID
  patient_id: string
  study_date: string            // YYYY-MM-DD
  study_time?: string
  modality: string              // CT, MR, XR, etc
  study_description?: string
  referring_physician?: string
  accession_number?: string
  total_series: number
  total_instances: number
  study_status: string          // new|ongoing|completed|archived
  institution_name?: string
  created_by_id?: number
  created_at: string
  updated_at: string
}
```

### Report Model

```typescript
Report {
  id: string
  study_id: string
  patient_id: string
  radiologist_id: number
  radiologist_name?: string
  findings: string              // Clinical findings text
  impression: string            // Clinical impression
  recommendations?: string      // Follow-up recommendations
  status: "draft" | "completed" | "signed" | "approved"
  signed_by_id?: number
  signed_by_name?: string
  signed_at?: string
  created_at: string
  updated_at: string
}
```

---

## ✅ Implementation Checklist

### Phase 1: Authentication & Basics (Week 1)

- [ ] `/auth/login` with JWT generation
- [ ] `/auth/logout` - token revocation
- [ ] `/auth/refresh` - token refresh
- [ ] `/auth/me` - current user

### Phase 2: Patient & Studies (Week 2)

- [ ] Patient CRUD + search
- [ ] Studies list + filters
- [ ] Series listing
- [ ] Study details

### Phase 3: Reports (Week 3)

- [ ] Report CRUD
- [ ] Report approve/sign workflow
- [ ] Study-report associations

### Phase 4: Audit & Admin (Week 4)

- [ ] Audit log tracking
- [ ] CSV export
- [ ] User management
- [ ] Role assignment

### Phase 5: Clinical Features (Week 5)

- [ ] Measurements CRUD
- [ ] Annotations CRUD
- [ ] Instance metadata
- [ ] Image rendering

---

## 🚀 Quick Start for Backend Dev

1. **Start with OAuth Token Framework**
   - Implement JWT generation/validation
   - Base auth middleware

2. **Add Patient Resource**
   - Simple CRUD model
   - Validation and constraints

3. **Add Studies**
   - FK to patients
   - Query filters support

4. **Add Reports**
   - FK to studies and users
   - Workflow status machine

5. **Add Audit Logging**
   - Middleware to log all requests
   - Actions enum matching frontend

6. **Add Measurements/Annotations**
   - FK to instances (child resources)
   - JSON storage for coordinates

---

## 📞 Frontend Contact Points

**Main API Base**: `process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"`

**API Prefix**: `/api/v1`

**Frontend Port**: `3000` (Next.js dev server)
**Backend Port**: `8000` (Expected FastAPI)

---

## 🔍 Testing the Integration

### Frontend Smoke Test Sequence

```typescript
// 1. Login
POST /api/v1/auth/login
{ email: "admin@example.com", password: "pass" }

// 2. Get current user
GET /api/v1/auth/me
Authorization: Bearer <token>

// 3. List patients
GET /api/v1/patients?page=1&page_size=20

// 4. List studies
GET /api/v1/studies?page=1&status=new

// 5. Get audit logs
GET /api/v1/audit-logs?page=1

// Should all return proper 200/201 responses
```

---

## ⚠️ Common Integration Issues

### Issue: CORS Errors

**Solution**: Backend must include CORS headers:

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
```

### Issue: 401 on All Requests

**Solution**: Ensure JWT token validation matches frontend secret

### Issue: 400 on Patient Creation

**Solution**: Validate request body matches `PatientCreateRequest` schema

### Issue: CSV Export Broken

**Solution**: Ensure `/audit-logs/export` returns `Content-Type: text/csv`

---

## 📝 Summary

**Frontend Status**: ✅ **100% Ready**

- All UI pages created
- All services scaffolded
- All components integrated
- Navigation complete
- Role-based access ready

**Backend Status**: ⏳ **Needed**

- API endpoints
- Database models
- Business logic
- Validation rules
- Error handling

**Next Action**: Start Phase 1 backend implementation with authentication

---

**Generated**: April 2026
**Framework**: FastAPI + PostgreSQL + Next.js
**Status**: Ready for backend development
