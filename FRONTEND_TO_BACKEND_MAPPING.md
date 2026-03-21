# Frontend → Backend Mapping Guide

This document maps each frontend component/feature to the backend support it needs.

---

## 📍 Feature Mapping

### 1. AUTHENTICATION (app/login/page.tsx)

**Frontend Code:**

```typescript
// app/login/page.tsx
const login = (username: string, password: string) => {
  const foundUser = mockUsers.find(
    (u) => u.username === username && u.password === password,
  );
  if (foundUser) {
    setUser(foundUser);
    return true;
  }
  return false;
};
```

**Frontend Expects:**

- Mock user database (currently hardcoded)
- Password matching

**Backend Needed:**

```
POST /api/v1/auth/login
  Request: { username: string, password: string }
  Response: {
    access_token: string,
    refresh_token: string,
    user: { id, username, role, name, email }
  }
```

**Backend Implementation:**

- PostgreSQL users table
- JWT token generation
- Password hashing with bcrypt
- Token storage/validation

**Status:** ❌ Not implemented (using mock)

---

### 2. USER ROLES & AUTHORIZATION

**Frontend Code:**

```typescript
// lib/mock-data.ts
type role = 'user' | 'admin' | 'service' | 'imaging-technician' | 'radiographer';

// Example roles:
{ id: 1, role: 'user', name: 'Dr. John Smith' }
{ id: 2, role: 'admin', name: 'Admin User' }
{ id: 4, role: 'imaging-technician', name: 'Sarah Johnson' }
```

**Frontend Expects:**

- Users with assigned roles
- Different permissions per role

**Backend Needed:**

```
Users table with role column
Permission matrix:
- admin: all permissions
- radiologist: view studies, create reports, measurements
- imaging-technician: upload DICOM, manage studies
- radiographer: upload DICOM
- service: automated uploads

Middleware to check permissions on all endpoints
```

**Backend Implementation:**

- RBAC middleware
- Permission decorators
- Role-based response filtering

**Status:** ❌ Not implemented (roles exist but no enforcement)

---

### 3. PATIENT MANAGEMENT (components/patients/)

**Frontend Code:**

```typescript
// context/patients-context.tsx
interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  dob: string;
  contactInfo: string;
  email?: string;
  weightKg?: number;
  heightCm?: number;
  createdAt: string;
}

// Functions needed:
addPatient(patient) -> void
updatePatient(id, patient) -> void
deletePatient(id) -> void
searchPatients(text) -> Patient[]
```

**Frontend Expects:**

- List of patients (pagination)
- Add new patient
- Edit patient info
- Delete patient
- Search by name/ID/email

**Backend Needed:**

```
GET    /api/v1/patients              - List with pagination
POST   /api/v1/patients              - Create
GET    /api/v1/patients/{id}         - Get details
PUT    /api/v1/patients/{id}         - Update
DELETE /api/v1/patients/{id}         - Delete
GET    /api/v1/patients/search?q={text}
```

**Backend Implementation:**

- Patient model in database
- CRUD endpoints
- Search functionality
- Validation (date format, email)
- Access control (only authorized users can view)

**Status:** ❌ Not implemented (using mock data)

---

### 4. WORKLIST (components/worklist/, context/worklist-context.tsx)

**Frontend Code:**

```typescript
interface WorklistItem {
  id: string;
  patientId: string;
  patientName: string;
  studyDate: string;
  studyTime: string;
  modality: 'MRI' | 'CT' | 'XR' | 'US';
  description: string;
  status: 'new' | 'ongoing' | 'completed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  imageCount: number;
  images: DicomImage[];
}

// Functions needed:
filterWorklist(modality?, status?, searchText?) -> WorklistItem[]
updateWorklistItem(id, item) -> void
```

**Frontend UI:**

- Worklist table with columns: Patient, Modality, Status, Priority, Images
- Filter by modality, status
- Search by patient name/ID
- Click to open viewer

**Backend Needed:**

```
GET /api/v1/worklist                  - Get user's worklist
GET /api/v1/worklist?status=new&modality=MRI
GET /api/v1/worklist/{id}             - Get item details
PUT /api/v1/worklist/{id}             - Update status
GET /api/v1/worklist/filters          - Filter options
```

**Backend Implementation:**

- Worklist table (tracks which studies assigned to which radiologist)
- Study/Series/Instance relationships
- Status and priority tracking
- User-based filtering (show only user's worklist)

**Status:** ❌ Not implemented (using mock data)

---

### 5. DICOM UPLOAD (components/upload/dicom-upload-area.tsx)

**Frontend Code:**

```typescript
// Components/upload/dicom-upload-area.tsx
// Handles file drag-drop
// Shows upload progress
// Lists uploaded files
```

**Frontend Expects:**

- File upload (drag-drop support)
- Progress indicator
- File list display
- Upload status

**Backend Needed:**

```
POST /api/v1/dicom/upload             - Upload files
  Content-Type: multipart/form-data
  Body: { files: [...], patient_id: string, ... }
  Response: { upload_id, status, task_id }

GET /api/v1/dicom/upload-status/{upload_id}
  Response: { files_received, files_processed, files_failed, status }
```

**Backend Implementation:**

- Multipart file handling
- File validation (DICOM format check)
- Async processing with Celery
- Upload progress tracking
- Error handling
- File storage (S3 or local)

**Status:** ❌ Not implemented (upload component UI only)

---

### 6. DICOM VIEWER (components/viewer/dicom-viewer.tsx)

**Frontend Code:**

```typescript
interface DicomViewerProps {
  images: (DicomImage & { pixelData?: ImageData })[];
  modality: string;
  description: string;
}

// Currently uses:
generateMockDICOMImage() - Creates fake ImageData
```

**Frontend UI:**

- Canvas displays image
- Window/level controls
- Zoom, pan, rotate
- Image slicing navigation
- Annotations
- Measurements

**Backend Needed:**

```
GET /api/v1/instances/{id}/image      - Get rendered PNG/JPEG
  Query params: window_center, window_width, zoom, rotate, format

GET /api/v1/instances/{id}/dicom      - Get original DICOM (optional)

GET /api/v1/studies/{study_id}/instances - List all images in study
```

**Backend Implementation:**

- DICOM file storage (S3/local)
- Pixel array extraction
- Image rendering with windowing
- PNG/JPEG conversion
- Caching rendered images
- Metadata extraction

**Status:** ❌ Not implemented (using mock images)

---

### 7. MEASUREMENTS (components/viewer/measurement-tools.tsx)

**Frontend Code:**

```typescript
interface Measurement {
  id: string;
  type: "distance" | "angle" | "area" | "roi" | "hu";
  points: Point[];
  value: number;
  unit: string;
  imageId: string;
  timestamp: number;
  label: string;
  metadata?: Record<string, any>;
}
```

**Frontend UI:**

- Draw distance line
- Draw angle
- Draw ROI (region)
- Display HU values
- Show measurement stats

**Backend Needed:**

```
POST   /api/v1/measurements           - Create measurement
GET    /api/v1/measurements/{id}      - Get measurement
PUT    /api/v1/measurements/{id}      - Update
DELETE /api/v1/measurements/{id}      - Delete
GET    /api/v1/measurements/instance/{instance_id}
```

**Backend Implementation:**

- Measurement storage (distance, angle, area, ROI, HU values)
- Calculation engine (distance formula, angle formula, area formula)
- ROI statistics (mean HU, std dev, area)
- Pixel-to-physical unit conversion (mm_per_pixel from DICOM)
- User-based access control

**Status:** ✅ Partially (frontend logic exists, needs backend persistance)

---

### 8. ANNOTATIONS (components/viewer/ + measurement-tools.tsx)

**Frontend Code:**

```typescript
const [annotations, setAnnotations] = useState<
  Array<{
    x: number;
    y: number;
    label: string;
    imageId: string;
  }>
>([]);
```

**Frontend UI:**

- Draw text annotations on image
- Color selection
- Display on canvas

**Backend Needed:**

```
POST   /api/v1/annotations            - Create annotation
GET    /api/v1/annotations/instance/{instance_id}
PUT    /api/v1/annotations/{id}       - Update
DELETE /api/v1/annotations/{id}       - Delete
```

**Backend Implementation:**

- Annotation storage (text, coordinates, color, user, timestamp)
- Pixel coordinate storage
- User-based access control

**Status:** ❌ Not implemented (using frontend state only)

---

### 9. REPORTS (components/reports/report-generator.tsx)

**Frontend Code:**

```typescript
interface Report {
  id: string;
  patientId: string;
  worklistId: string;
  radiologist: string;
  findings: string;
  impression: string;
  recommendations?: string;
  createdAt: string;
  status: "draft" | "completed" | "signed";
}
```

**Frontend UI:**

- Text editor for findings
- Text editor for impression
- Recommendations field
- Save/submit buttons
- Status tracking

**Backend Needed:**

```
POST   /api/v1/reports                - Create report
GET    /api/v1/reports/{id}           - Get report
PUT    /api/v1/reports/{id}           - Update (draft)
DELETE /api/v1/reports/{id}           - Delete (draft only)
POST   /api/v1/reports/{id}/approve   - Approve
POST   /api/v1/reports/{id}/sign      - Sign/finalize
GET    /api/v1/reports/study/{study_id}
```

**Backend Implementation:**

- Report storage
- Status workflow (draft → completed → signed → approved)
- User tracking (who created, who approved, who signed)
- Timestamp tracking
- Permission checks (only radiologist can edit own draft)

**Status:** ❌ Not implemented (using mock data only)

---

### 10. AUDIT LOGGING (lib/audit-logger.ts)

**Frontend Code:**

```typescript
// lib/audit-logger.ts
class AuditLogger {
  log(action, details, severity);
  logMeasurement(measurement, action);
  logROIAnalysis(roiStats);
  getStudyLogs(studyId);
  getUserLogs(userId);
  exportToCSV();

  // Currently syncs to backend
  syncToBackend() {
    fetch("/api/audit-logs", {
      method: "POST",
      body: JSON.stringify(logs),
    });
  }
}
```

**Frontend UI:**

- Audit log display in dashboard
- Filter by date, user, action
- Export capability

**Backend Needed:**

```
POST   /api/v1/audit-logs             - Receive audit logs
GET    /api/v1/audit-logs             - List all logs (admin)
GET    /api/v1/audit-logs/user/{user_id}
GET    /api/v1/audit-logs/study/{study_id}
GET    /api/v1/audit-logs/export?format=csv&start=...&end=...
```

**Backend Implementation:**

- Audit log database (immutable append-only)
- Automatic logging middleware for all endpoints
- Filtering and querying
- CSV export
- HIPAA compliance (7-year retention)

**Status:** ⚠️ Partial (frontend logging exists, backend sync endpoint needed)

---

### 11. ADVANCED VISUALIZATION (components/viewer/advanced-visualization.tsx)

**Frontend Code:**

```typescript
// Multi-Planar Reconstruction (MPR)
// Maximum Intensity Projection (MIP)
// Image Fusion
// Volume Rendering

// Currently: Components exist but need image data from backend
```

**Frontend UI:**

- 4-panel view (axial, sagittal, coronal, 3D)
- Synchronized scrolling
- 3D rotation

**Backend Needed:**

```
// For MPR/MIP
GET /api/v1/studies/{id}/volume-data  - Get all series images

// For 3D Rendering
POST /api/v1/instances/render-3d      - Generate 3D mesh
  Body: { study_id, series_id, format: 'stl' | 'obj' | 'glb' }
  Response: { mesh_url, format, bounds }
```

**Backend Implementation:**

- Load all images in series
- Register and align images (volume)
- Generate multi-planar reconstructions
- Project maximum intensity
- Generate 3D mesh data
- Cache volumetric data

**Status:** ❌ Not implemented (needs backend support)

---

### 12. CLINICAL WORKFLOW (components/viewer/clinical-workflow.tsx)

**Frontend Code:**

```typescript
// Hanging protocols (standard image layouts)
// Side-by-side comparison
// Prior study comparison
// Annotations and findings
```

**Frontend UI:**

- Multi-viewport layout
- Previous study comparison
- Protocol selection

**Backend Needed:**

```
GET    /api/v1/worklist/{id}/protocol - Get hanging protocol
GET    /api/v1/studies/{id}/prior     - Get prior studies
```

**Backend Implementation:**

- Hanging protocol database
- Prior study fetching
- Study comparison logic

**Status:** ❌ Not implemented

---

### 13. OFFLINE CAPABILITY (Service Worker + hooks/use-service-worker.ts)

**Frontend Code:**

```typescript
// Service Worker caches:
// - HTML/JS/CSS
// - Study metadata
// - Rendered images
// - Measurements

// On reconnect:
// - Sync measurements
// - Sync audit logs
```

**Frontend Sync:**

```typescript
// Offline sync queues to backend:
POST / api / v1 / sync / measurements;
POST / api / v1 / sync / annotations;
POST / api / v1 / audit - logs / sync;
```

**Backend Needed:**

```
POST   /api/v1/sync/measurements      - Sync queued measurements
POST   /api/v1/sync/annotations       - Sync queued annotations
POST   /api/v1/audit-logs/sync        - Sync queued audit logs
```

**Backend Implementation:**

- Endpoints to receive synced data
- Conflict resolution (handle offline vs online edits)
- Idempotency (handle duplicate syncs)

**Status:** ⚠️ Partial (frontend caching works, sync endpoints needed)

---

### 14. MOBILE OPTIMIZATION (components/viewer/mobile-viewer-wrapper.tsx)

**Frontend Code:**

```typescript
// Touch-friendly UI
// Responsive layout
// Optimized for tablets/phones
```

**Backend Needed:**

```
// Optimize image sizes for mobile
GET /api/v1/instances/{id}/image?width=256&height=256&compression=high

// Lighter payloads for mobile
GET /api/v1/worklist?limit=10  // Pagination defaults
GET /api/v1/studies?compact=true  // Minimal data
```

**Backend Implementation:**

- Image optimization for smaller screens
- Pagination defaults for mobile
- Compressed responses
- Minimal data option for slow networks

**Status:** ⚠️ Partial (frontend responsive, backend optimization needed)

---

## 📊 Implementation Status Summary

| Feature        | Frontend        | Backend         | Status |
| -------------- | --------------- | --------------- | ------ |
| Authentication | ✅ UI done      | ❌ Needed       | 0%     |
| User Roles     | ✅ Struct       | ❌ Enforcement  | 5%     |
| Patients       | ✅ UI done      | ❌ API needed   | 10%    |
| Worklist       | ✅ UI done      | ❌ API needed   | 10%    |
| DICOM Upload   | ✅ UI done      | ❌ Full stack   | 15%    |
| Image Viewer   | ✅ Canvas ready | ❌ Image source | 20%    |
| Measurements   | ✅ Logic done   | ⚠️ Persist only | 70%    |
| Annotations    | ✅ UI ready     | ❌ API needed   | 20%    |
| Reports        | ✅ UI done      | ❌ API needed   | 20%    |
| Audit Logging  | ✅ Logging done | ⚠️ Sync only    | 60%    |
| Adv. Viz       | ✅ UI ready     | ❌ Data gen     | 30%    |
| Workflows      | ✅ UI design    | ❌ Logic        | 20%    |
| Offline        | ✅ Cache ok     | ⚠️ Sync needed  | 60%    |
| Mobile         | ✅ Responsive   | ⚠️ Optimize     | 50%    |

**Overall: 32% Complete - Backend is the critical path**

---

## 🎯 Quick Start Priority

**Phase 1 (Week 1): Core Backend**

1. Database setup with PostgreSQL
2. JWT authentication
3. User management
4. Patient CRUD endpoints
5. DICOM upload endpoint (save files, extract metadata)

**Phase 2 (Week 2): Image Processing** 6. DICOM processing service (parse, convert to PNG) 7. Image rendering endpoint 8. Windowing presets 9. Instance metadata endpoints

**Phase 3 (Week 3): Advanced Features** 10. Measurements endpoints (store, retrieve) 11. Annotations endpoints 12. Reports endpoints 13. Audit logging endpoints

**Phase 4 (Week 4): Polish & Deploy** 14. Celery async tasks 15. Caching with Redis 16. Docker deployment 17. Testing & documentation

---

## 🔗 Next Steps

1. **Read BACKEND_SPECIFICATION.md** - Full technical requirements
2. **Read BACKEND_AI_PROMPTS.md** - Use these with AI tools
3. **Start with Prompt 1-3** - Setup your backend project
4. **Implement Phase 1** - Get auth + basic CRUD working
5. **Test with Postman** - Use provided examples
6. **Connect frontend** - Replace mock API calls
7. **Iterate through features** - Add one by one

---

## 💡 Key Backend Components by Priority

### Must Have (Critical Path)

- [ ] PostgreSQL database
- [ ] JWT authentication
- [ ] DICOM file upload & storage
- [ ] DICOM parsing & image rendering
- [ ] Study/Series/Instance management
- [ ] Measurements persistence
- [ ] Audit logging

### Should Have (High Value)

- [ ] Annotations
- [ ] Reports
- [ ] Role-based permissions
- [ ] Redis caching
- [ ] Celery async tasks

### Nice to Have (Enhancement)

- [ ] 3D volume rendering
- [ ] Advanced clinical workflows
- [ ] Email notifications
- [ ] Advanced analytics

---

Good luck building your backend! 🚀
