# Backend Implementation Prompts for AI

Use these prompts with Claude, ChatGPT, or other AI tools to implement your backend. Copy-paste each prompt as-is for the best results.

---

## 📋 PROJECT SETUP & INITIALIZATION

### Prompt 1: Project Setup & Dependencies

```
Create a FastAPI project structure for a DICOM medical imaging viewer backend.

Requirements:
- Python 3.11+
- FastAPI web framework
- SQLAlchemy 2.0 for ORM
- PostgreSQL database
- JWT authentication with PyJWT
- Pydantic for data validation
- pydicom for DICOM file processing
- Pillow for image manipulation
- Redis for caching
- Celery for async tasks
- three.js integration for 3D visualization (optional, for advanced features)
- NumPy for advanced image processing (MPR, HU calculations)

Create:
1. requirements.txt with all dependencies and versions
2. .env.example with all configuration variables
3. pyproject.toml with project metadata
4. Dockerfile for containerization
5. docker-compose.yml for local development (PostgreSQL, Redis, RabbitMQ)

Include production-ready configurations.
```

### Prompt 2: FastAPI Main Application

```
Create the main FastAPI application file for a DICOM viewer backend.

Requirements:
- Main entry point (app/main.py)
- CORS middleware configured for http://localhost:3000 (frontend)
- Database connection initialization
- Exception handlers for custom errors
- Logging configuration
- API versioning setup (/api/v1/)
- Health check endpoint
- Startup/shutdown events for resource management

Include:
- Proper error handling middleware
- Request/response logging
- Security headers
```

### Prompt 3: Database Configuration & Models

```
Create database configuration and SQLAlchemy models for DICOM viewer.

Database: PostgreSQL
Create:
1. app/database.py - Database connection using SQLAlchemy
2. app/models/ folder with these Python models:
   - user.py (User model with roles)
   - patient.py (Patient medical records)
   - study.py (DICOM Study - parent container)
   - series.py (DICOM Series - image grouping)
   - instance.py (DICOM Instance - individual image)
   - measurement.py (Measurements: distance, angle, area, ROI, HU)
   - annotation.py (User annotations on images)
   - report.py (Radiologist reports)
   - audit_log.py (Compliance audit trail)
   - worklist_item.py (Work assignments)

For each model:
- Include all database column definitions
- Add relationships between models
- Include timestamps (created_at, updated_at)
- Add appropriate indexes for performance
- Include SQLAlchemy configurations

Use proper column types, constraints, and validations.
```

---

## 🔐 AUTHENTICATION & SECURITY

### Prompt 4: JWT Authentication System

```
Create JWT-based authentication system for DICOM viewer backend.

Requirements:
- JWT token generation and validation
- Password hashing with bcrypt
- User login endpoint
- Token refresh mechanism
- User registration (admin only)
- Logout functionality

Create:
1. app/core/security.py - Password hashing, JWT token creation/validation
2. app/core/permissions.py - Role-based access control (RBAC)
3. app/api/v1/auth.py - Authentication endpoints

Features:
- Access tokens (30 minute expiry)
- Refresh tokens (7 day expiry)
- Secure password requirements
- Rate limiting on login attempts
- JWT payload includes: user_id, username, role, permissions

Endpoint:
POST /api/v1/auth/login - Returns access_token, refresh_token, user info
POST /api/v1/auth/refresh - Refresh expired token
GET /api/v1/auth/me - Get current user info
POST /api/v1/auth/logout - Invalidate token (optional)

Use environment variables for JWT secrets and expiry times.
```

### Prompt 5: Role-Based Access Control

```
Create role-based access control (RBAC) middleware for 5 user roles.

Roles and Permissions:
1. admin - Full system access
2. radiologist - View/analyze studies, create reports, manage measurements
3. imaging_technician - Upload DICOM files, manage studies
4. radiographer - Upload files, limited viewing
5. service - API access for automated uploads

Create:
1. app/core/permissions.py - Permission matrix and decorators
2. Authentication middleware that checks permissions
3. Pydantic schemas for role-based responses

Implement:
- Permission checking decorator @require_permission("study.read")
- Role-based endpoint filtering
- Audit logging of permission denials
- Dynamic permission loading from database

For each role, define access levels for:
- patient.*, study.*, instance.*, measurement.*, report.*, audit_log.*, dicom.*

Return 403 Forbidden for unauthorized access.
```

---

## 👥 USER MANAGEMENT

### Prompt 6: User Management Endpoints

```
Create user management API endpoints for administrator use.

Endpoints:
GET /api/v1/users - List all users (admin only)
POST /api/v1/users - Create new user (admin only)
GET /api/v1/users/{id} - Get user details
PUT /api/v1/users/{id} - Update user (admin or self)
DELETE /api/v1/users/{id} - Delete user (admin only)
PUT /api/v1/users/{id}/role - Change user role (admin only)
PUT /api/v1/users/{id}/password - Change password

Create Pydantic schemas:
- UserCreate
- UserUpdate
- UserResponse (without password hash)
- ChangePasswordRequest

Features:
- Password validation (minimum 8 chars, complexity)
- Email uniqueness check
- User status (active/inactive)
- Created/updated timestamps
- Proper error responses

Use SQLAlchemy CRUD operations.
```

---

## 🏥 PATIENT MANAGEMENT

### Prompt 7: Patient Management Endpoints

```
Create patient management API endpoints for medical records.

Endpoints:
GET /api/v1/patients - List patients with pagination and filters
POST /api/v1/patients - Create new patient
GET /api/v1/patients/{id} - Get patient details
PUT /api/v1/patients/{id} - Update patient information
DELETE /api/v1/patients/{id} - Delete patient (admin only, if no studies)
GET /api/v1/patients/search?q={text} - Search patients by name/ID/email

Create Pydantic schemas:
- PatientCreate
- PatientUpdate
- PatientResponse
- PatientDetailResponse (includes study count)

Features:
- Pagination (limit, offset)
- Filtering by gender, age range, status
- Search functionality
- Validate date of birth format
- Calculate age from DOB
- Track creation date and user who created
- Soft delete capability

Medical record validation:
- MRN uniqueness
- Email format validation
- Contact info validation
```

---

## 📚 STUDY/SERIES/INSTANCE MANAGEMENT

### Prompt 8: DICOM Study Endpoints

```
Create DICOM Study management endpoints.

Studies are the top-level container in DICOM hierarchy.

Endpoints:
GET /api/v1/studies - List studies with filters
POST /api/v1/studies - Create new study (imaging tech only)
GET /api/v1/studies/{id} - Get study details with metadata
PUT /api/v1/studies/{id} - Update study status/info
GET /api/v1/studies/{id}/series - List series in study
GET /api/v1/studies/{id}/instances - List all instances in study
GET /api/v1/studies/{id}/audit - Get study audit history
DELETE /api/v1/studies/{id} - Archive study (admin only)

Create Pydantic schemas:
- StudyCreate
- StudyUpdate
- StudyResponse
- StudyDetailResponse (with statistics)

Features:
- Filter by: date range, modality, patient, status
- Pagination
- Statistics (total series, total images, total storage)
- Status tracking: new, ongoing, completed, archived
- Study UID (DICOM uid) must be unique
- Track referring physician
- Accession number tracking

Include:
- DICOM Study UID management
- Series and instance counters
- Creation user tracking
```

### Prompt 9: DICOM Instance/Image Endpoints

```
Create DICOM Instance (individual image) endpoints.

Instances are individual DICOM images within a series.

Endpoints:
GET /api/v1/instances/{id} - Get image metadata
GET /api/v1/instances/{id}/image - Get rendered image (PNG/JPEG)
GET /api/v1/instances/{id}/dicom - Download original DICOM file
POST /api/v1/instances/{id}/render - Custom rendering request
GET /api/v1/instances/{id}/info - Get DICOM tags

Render Parameters (query string):
- width, height (resolution)
- window_center, window_width (HU windowing)
- preset (lung, bone, brain, mediastinum)
- flip_horizontal, flip_vertical (boolean)
- rotate (0, 90, 180, 270)
- zoom (1.0 to 4.0)
- pan_x, pan_y (pixel offsets)
- filter (none, sharpen, smooth, edge_detect)
- format (png, jpeg, webp)

Create Pydantic schemas:
- InstanceResponse
- InstanceDetailResponse
- RenderOptions
- WindowingPreset

Return:
- PNG/JPEG image with applied windowing/transformations
- Proper cache headers for browser caching
- ETag for cache validation

Store:
- Multiple presets (lung, bone, brain, mediastinum)
- Default windowing values from DICOM tags
```

---

## 📤 DICOM FILE UPLOAD & PROCESSING

### Prompt 10: DICOM Upload Endpoints

```
Create DICOM file upload endpoints with async processing.

Endpoints:
POST /api/v1/dicom/upload - Upload DICOM files (multipart/form-data)
GET /api/v1/dicom/upload-status/{upload_id} - Get upload progress
POST /api/v1/dicom/validate - Validate DICOM files

Upload Form Parameters:
- files: Binary file upload (multiple files)
- patient_id: Target patient ID
- study_description: (optional)
- referringPhysician: (optional)
- study_date: (optional, format YYYY-MM-DD)
- modality: (optional, CT/MRI/XR/US)

Response (202 Accepted):
{
  "upload_id": "up_123456",
  "status": "processing",
  "files_received": 45,
  "files_processed": 0,
  "files_failed": 0,
  "task_id": "celery_task_id"
}

Upload Processing:
1. Validate file format (DICOM magic numbers)
2. Extract DICOM metadata
3. Group by Study/Series UID
4. Create Study/Series/Instance records
5. Convert to PNG/JPEG for web viewing
6. Extract windowing presets
7. Calculate image statistics
8. Index for search

Use Celery for async processing.
Store original DICOM files in S3 or local storage.
Track upload progress and errors.
```

### Prompt 11: DICOM Processing Service

```
Create the core DICOM processing service.

Create file: app/services/dicom_processor.py

Functions:
1. validate_dicom(file_path) -> bool
   - Check DICOM magic number
   - Parse DICOM header
   - Validate required tags

2. parse_dicom_metadata(file_path) -> dict
   - Extract Study UID, Series UID, Instance UID
   - Extract patient info (name, age, sex)
   - Extract image info (rows, columns, bits allocated)
   - Extract windowing (window center, window width)
   - Extract modality
   - Return complete metadata dict

3. extract_pixel_array(dicom_file) -> numpy.ndarray
   - Convert DICOM pixel data to numpy array
   - Handle multi-frame images
   - Handle compressed data
   - Normalize to 0-255 range

4. convert_to_image(pixel_array, window_center, window_width) -> Image
   - Apply windowing (HU conversion for CT)
   - Convert to PIL Image
   - Return PIL Image object

5. save_rendered_image(image, instance_id, output_path) -> str
   - Save as PNG at 512x512
   - Save thumbnail at 128x128
   - Return file paths

6. group_by_study_series(dicom_files) -> dict
   - Group uploaded DICOM files by Study UID, then Series UID
   - Return hierarchical structure

Use pydicom, numpy, PIL (Pillow), SimpleITK as needed.
Include error handling and logging.
```

### Prompt 12: Image Rendering Service

```
Create image rendering service for DICOM images.

Create file: app/services/image_renderer.py

Functions:
1. apply_windowing(pixel_array, window_center, window_width) -> numpy.ndarray
   - Apply HU windowing for CT images
   - Result: values between 0-255

2. apply_preset_windowing(pixel_array, modality, preset) -> numpy.ndarray
   - Presets: lung, bone, brain, mediastinum, abdomen
   - Return windowed array

3. apply_transformations(image, options) -> PIL.Image
   - Flip horizontal/vertical
   - Rotate (0, 90, 180, 270)
   - Zoom (1.0-4.0)
   - Pan (apply offset)

4. apply_filter(image, filter_type) -> PIL.Image
   - none, sharpen, smooth, edge_detect
   - Use PIL ImageFilter

5. render_instance(instance_id, options: RenderOptions) -> PIL.Image
   - Load original DICOM
   - Apply windowing
   - Apply transformations
   - Apply filters
   - Resize to requested dimensions
   - Return PIL Image

6. get_image_bytes(image, format, quality) -> bytes
   - Convert PIL Image to bytes
   - Format: PNG, JPEG, WebP
   - Quality: 1-100 (for lossy formats)

7. cache_key(instance_id, options) -> str
   - Generate cache key for Redis
   - Include all render options

Windowing Presets:
- CT Lung: center=-600, width=1600
- CT Bone: center=400, width=1800
- CT Brain: center=40, width=400
- CT Mediastinum: center=50, width=400
- CT Abdomen: center=40, width=400
```

---

## 📐 MEASUREMENTS

### Prompt 13: Measurements Endpoints

```
Create measurement API endpoints for measurement tools.

Measurements: distance, angle, area, ROI (region), HU (Hounsfield Units)

Endpoints:
GET /api/v1/measurements - List measurements with filters
POST /api/v1/measurements - Create new measurement
GET /api/v1/measurements/{id} - Get measurement details
PUT /api/v1/measurements/{id} - Update measurement
DELETE /api/v1/measurements/{id} - Delete measurement
GET /api/v1/measurements/instance/{instance_id} - Get instance measurements
GET /api/v1/measurements/study/{study_id} - Get study measurements

Create Pydantic schemas:
- MeasurementCreate
- MeasurementUpdate
- MeasurementResponse
- MeasurementDetailResponse

Fields:
- id (UUID)
- instance_id
- type (distance, angle, area, roi, hu)
- value (numeric result)
- unit (mm, degrees, mm², HU)
- label (user-provided name)
- coordinates (JSON array of points)
- metadata (JSON for additional data like ROI statistics)
- created_by_id (user)
- created_at, updated_at

Features:
- Filter by type, user, instance, study
- Pagination
- User can only see own measurements (except radiologists can see all under their studies)
- Audit logging for all operations

### Prompt 14: PACS Query Endpoints

```

Create PACS query and retrieval API endpoints.

Endpoints:
POST /api/v1/pacs/query - Query PACS for studies
Request: {
host: string,
port: number,
aeTitle: string,
patientId?: string,
patientName?: string,
studyUID?: string
}
Response: Array of study metadata

POST /api/v1/pacs/retrieve - Retrieve study from PACS
Request: {
host: string,
port: number,
aeTitle: string,
studyUID: string,
destinationPath?: string
}
Response: { status: string, filesRetrieved: number, taskId: string }

GET /api/v1/pacs/connections - List saved PACS connections
POST /api/v1/pacs/connections - Save PACS connection config
PUT /api/v1/pacs/connections/{id} - Update connection
DELETE /api/v1/pacs/connections/{id} - Delete connection

Create Pydantic schemas:

- PACSConnection
- PACSQueryRequest
- PACSRetrieveRequest
- StudyMetadata (from PACS response)

Features:

- Async processing for large study retrievals
- Progress tracking with Celery
- Connection validation before queries
- Error handling for PACS communication failures
- Support for multiple PACS systems
- Secure storage of PACS credentials (encrypted)

### Prompt 15: Advanced Visualization Endpoints

```
Create advanced visualization API endpoints for 3D, MPR, and HU analysis.

Endpoints:
GET /api/v1/visualization/study/{study_id}/volume - Get volume data for 3D rendering
  Query params: format (json|binary), compression (none|gzip)
  Response: Volume data array or binary blob

GET /api/v1/visualization/study/{study_id}/mpr - Get MPR reconstruction data
  Query params: plane (axial|sagittal|coronal), slice_index, thickness
  Response: 2D image data for specified plane

GET /api/v1/visualization/instance/{instance_id}/hu - Get HU analysis data
  Query params: roi_x, roi_y, roi_width, roi_height
  Response: { mean: number, std: number, min: number, max: number, histogram: [] }

POST /api/v1/visualization/study/{study_id}/fusion - Create image fusion
  Request: { base_instance_id, overlay_instance_id, opacity, blend_mode }
  Response: Fused image data

GET /api/v1/visualization/presets - Get windowing presets
  Response: Array of { name, window_center, window_width, modality }

Create Pydantic schemas:
- VolumeData
- MPRData
- HUAnalysis
- FusionRequest
- WindowPreset

Features:
- Volume reconstruction from DICOM series
- Multi-planar reconstruction (MPR)
- Hounsfield Unit calculations and ROI statistics
- Image fusion capabilities
- Windowing presets for different modalities
- Caching for expensive computations
- Support for large datasets (streaming responses)

Use NumPy for 3D volume operations, SciPy for interpolation.
Return data in format compatible with Three.js and Canvas rendering.
```

---

```

### Prompt 14: Measurement Calculation Engine

```

Create measurement calculation engine.

Create file: app/services/measurement_engine.py

Functions:

1. calculate_distance(point1, point2, mm_per_pixel) -> float
   - point1, point2 format: {"x": int, "y": int}
   - mm_per_pixel: calibration from DICOM pixel spacing
   - Return distance in mm

2. calculate_angle(point1, point2, point3, mm_per_pixel) -> float
   - Angle at point2 formed by point1-point2-point3
   - Return angle in degrees (0-180)

3. calculate_area(points: list, mm_per_pixel) -> float
   - Polygon area from list of points
   - Use Shoelace formula
   - Return area in mm²

4. calculate_roi_statistics(pixel_array, roi_points, modality) -> dict
   - ROI = Region of Interest (polygon)
   - Calculate: mean HU, std dev, min, max, area
   - For each point in roi_points, get pixel value
   - Return statistics dict

5. calculate_hu_values(pixel_array, intercept, slope) -> dict
   - Convert pixel values to Hounsfield Units
   - HU = pixel_value \* slope + intercept
   - Return HU statistics

6. get_pixel_spacing(dicom_file) -> (float, float)
   - Extract pixel spacing from DICOM tags
   - Return (row_spacing, column_spacing) in mm

Response format:
{
"distance": 45.5, // mm
"angle": 90.0, // degrees
"area": 1234.5, // mm²
"roi_statistics": {
"mean_hu": 50,
"std_dev": 15,
"min_hu": 20,
"max_hu": 85,
"area": 500
}
}

```

---

## 💬 ANNOTATIONS

### Prompt 15: Annotations Endpoints

```

Create annotation API endpoints.

Annotations: User-drawn text/drawings on images.

Endpoints:
GET /api/v1/annotations - List annotations
POST /api/v1/annotations - Create annotation
GET /api/v1/annotations/{id} - Get annotation
PUT /api/v1/annotations/{id} - Update annotation
DELETE /api/v1/annotations/{id} - Delete annotation
GET /api/v1/annotations/instance/{instance_id} - Get instance annotations
GET /api/v1/annotations/study/{study_id} - Get study annotations

Create Pydantic schemas:

- AnnotationCreate
- AnnotationUpdate
- AnnotationResponse

Fields:

- id (UUID)
- instance_id
- user_id (creator)
- text (annotation text)
- x, y (pixel coordinates)
- color (hex color code, e.g., "#FF0000")
- drawing_points (optional, list of points for freehand drawing)
- created_at, updated_at

Features:

- Pixel-coordinate based positioning
- Color selection by user
- User can edit own annotations
- Admin/radiologist can delete any annotation
- Audit logging
- Pagination

Return format:
[
{
"id": "ann_123",
"instance_id": "inst_456",
"text": "Suspicious nodule",
"x": 250,
"y": 180,
"color": "#FF0000",
"created_by": "Dr. John Smith",
"created_at": "2026-03-21T10:30:00Z"
}
]

```

---

## 📋 REPORTS

### Prompt 16: Report Management Endpoints

```

Create report generation and management endpoints.

Reports are radiologist findings and impressions for studies.

Endpoints:
GET /api/v1/reports - List reports with filters
POST /api/v1/reports - Create new report
GET /api/v1/reports/{id} - Get report details
PUT /api/v1/reports/{id} - Update report (draft only)
DELETE /api/v1/reports/{id} - Delete report (draft only)
POST /api/v1/reports/{id}/approve - Approve report (senior radiologist)
POST /api/v1/reports/{id}/sign - Sign/finalize report
GET /api/v1/reports/study/{study_id} - Get study reports

Create Pydantic schemas:

- ReportCreate
- ReportUpdate
- ReportResponse
- ReportApprovalRequest

Fields:

- id (UUID)
- study_id
- patient_id
- radiologist_id (creator)
- findings (text)
- impression (text)
- recommendations (text, optional)
- status (draft, completed, signed, approved)
- created_at, updated_at
- signed_by_id (radiologist who signed)
- signed_at (timestamp)

Status Workflow:

1. Radiologist creates report in 'draft' status
2. Radiologist updates findings/impression (draft)
3. Radiologist marks 'completed' (final draft)
4. Senior radiologist 'approves' it
5. Radiologist 'signs' it (final status)

Features:

- Only creator can edit draft reports
- Only radiologists can create reports
- Only senior radiologists can approve
- Cannot delete signed reports
- Audit logging all changes
- Track who signed and when

```

---

## 🔍 AUDIT LOGGING

### Prompt 17: Audit Logging Endpoints

```

Create comprehensive audit logging for compliance.

Endpoints:
GET /api/v1/audit-logs - List audit logs (admin only)
GET /api/v1/audit-logs/user/{user_id} - User audit logs
GET /api/v1/audit-logs/study/{study_id} - Study audit logs
GET /api/v1/audit-logs/export?format=csv&start_date=...&end_date=... - Export logs
GET /api/v1/audit-logs/dashboard - Audit summary statistics

Create Pydantic schemas:

- AuditLogCreate
- AuditLogResponse
- AuditLogFilterRequest
- AuditLogExport

Fields:

- id (BIGINT auto-increment)
- user_id
- user_role
- action (event type)
- resource_type (study, measurement, annotation, report, patient, user)
- resource_id
- study_id (nullable, for study context)
- details (JSON, additional context)
- severity (info, warning, critical)
- ip_address
- user_agent
- created_at

Event Types (actions) to log:
STUDY_VIEWED, STUDY_CREATED, STUDY_UPDATED, STUDY_DELETED
MEASUREMENT_CREATED, MEASUREMENT_UPDATED, MEASUREMENT_DELETED
ANNOTATION_CREATED, ANNOTATION_UPDATED, ANNOTATION_DELETED
REPORT_CREATED, REPORT_UPDATED, REPORT_APPROVED, REPORT_SIGNED
USER_LOGIN, USER_LOGOUT, USER_CREATED, USER_UPDATED, USER_DELETED
DICOM_UPLOADED, DICOM_PROCESSED
PERMISSION_DENIED (severity: warning)
DATA_EXPORT

Features:

- Automatically log all CRUD operations
- Track IP address and user agent
- Filter by date range, user, action, severity
- Export to CSV
- Statistics dashboard
- Retention: keep for 7 years (HIPAA compliance)

Middleware: Automatically capture logs from API endpoints.

```

### Prompt 18: Audit Service Implementation

```

Create audit logging service.

Create file: app/services/audit_service.py

Class: AuditLogger

Methods:

1. log_action(user_id, user_role, action, resource_type, resource_id, details, severity, request)
   - Log an audit event
   - Extract IP from request
   - Extract user agent
   - Save to database

2. log_study_access(user_id, study_id, action)
   - Log study viewing/access

3. log_measurement_operation(user_id, action, measurement_id, instance_id, details)
   - Log measurement CRUD

4. log_report_operation(user_id, action, report_id, study_id)
   - Log report operations

5. get_logs_by_study(study_id, limit=1000) -> list
   - Get all logs for a study

6. get_logs_by_user(user_id, start_date, end_date) -> list
   - Get all logs for a user in date range

7. export_logs_to_csv(filters, output_path) -> str
   - Export filtered logs to CSV file
   - Return file path

8. cleanup_old_logs(days_to_keep=2555) # 7 years
   - Delete logs older than 7 years
   - Run weekly as scheduled task

Features:

- Automatic logging via middleware
- Cannot modify or delete logs (append-only)
- Indexes for fast queries
- Severity levels for critical events
- Context preservation (details JSON)

Use this for all audit logging operations.

```

---

## 👔 WORKLIST

### Prompt 19: Worklist Endpoints

```

Create worklist endpoints for study assignment and tracking.

Worklist: List of studies assigned to users for review.

Endpoints:
GET /api/v1/worklist - Get user's worklist
GET /api/v1/worklist/filters - Get available filter options
GET /api/v1/worklist/{id} - Get worklist item details
PUT /api/v1/worklist/{id} - Update item status
GET /api/v1/worklist/study/{study_id} - Get worklist for study
POST /api/v1/worklist/assign - Assign study to radiologist (admin)

Create Pydantic schemas:

- WorklistItemResponse
- WorklistItemUpdate
- WorklistFilterOptions
- WorklistAssignmentRequest

Fields:

- id (UUID or use study_id)
- study_id
- patient_id
- patient_name
- status (new, ongoing, completed)
- priority (low, normal, high, urgent)
- assigned_to_id (radiologist)
- last_accessed (timestamp)
- created_at

Status Workflow:

1. New - Just added to worklist
2. Ongoing - Currently being reviewed
3. Completed - Review done, report created

Features:

- Return only worklist items for current user (radiologist)
- Admin can assign studies to users
- Priority ordering (urgent > high > normal > low)
- Filter options: status, priority, modality, date range
- Last accessed tracking
- Statistics: total, new, ongoing, completed

Response format:
{
"id": "w_123",
"study_id": "study_456",
"patient": {"id": "P001", "name": "John Doe", "age": 45},
"status": "new",
"priority": "high",
"modality": "MRI",
"study_date": "2026-03-21",
"series_count": 3,
"image_count": 45
}

```

---

## 🚀 DEPLOYMENT & CELERY TASKS

### Prompt 20: Celery Async Task Configuration

```

Create Celery configuration for async DICOM processing.

Create files:

1. app/tasks/celery_app.py - Celery app configuration
2. app/tasks/dicom_processing_tasks.py - DICOM processing tasks
3. app/tasks/notification_tasks.py - Email notifications

Requirements:

- Message broker: RabbitMQ or Redis
- Result backend: Redis
- Task routing and priority queues
- Task monitoring with Flower

Configuration:

- Broker URL: from environment
- Result backend: Redis
- Task serializer: JSON
- Accept content: JSON
- Task time limit: 1 hour for DICOM processing
- Task soft time limit: 50 minutes

Celery Tasks:

1. process_dicom_upload.delay(upload_id, file_paths, patient_id)
   - Process uploaded DICOM files
   - Extract metadata
   - Create database records
   - Render images
   - Send completion email

2. render_image.delay(instance_id, options)
   - Render DICOM image with options
   - Cache result in Redis
   - Return image path

3. export_audit_logs.delay(start_date, end_date, format, user_email)
   - Export audit logs
   - Send via email
   - Return file path

4. generate_volume_data.delay(study_id, series_id)
   - Generate 3D volume data for visualization
   - Used for MPR, MIP, 3D rendering

5. send_email.delay(recipient, subject, body, attachment_path)
   - Send email notifications
   - Upload completion, report ready, etc

Include error handling, retries, and logging.

```

### Prompt 21: Docker Deployment Configuration

```

Create Docker setup for multi-container deployment.

Create:

1. Dockerfile - FastAPI application container
2. docker-compose.yml - Multi-container orchestration
3. nginx.conf - Reverse proxy configuration

Dockerfile features:

- Multi-stage build
- Python 3.11 base image
- Install system dependencies
- Copy application code
- Expose port 8000
- Health check
- Non-root user for security

docker-compose.yml services:

1. backend - FastAPI application (uvicorn)
2. db - PostgreSQL 14
3. redis - Redis cache
4. rabbitmq - RabbitMQ message broker
5. celery_worker - Celery worker for DICOM processing
6. celery_beat - Celery beat scheduler for cleanup tasks
7. flower - Celery monitoring UI

Volumes:

- dicom_files - Store uploaded DICOM files
- postgres_data - Database persistence

Networks:

- Internal network for service communication
- Only backend/nginx exposed externally

Environment variables:

- All required .env variables for each service

Health checks for all services.
Database migrations run on startup.

```

---

## 🧪 TESTING & QUALITY

### Prompt 22: Unit Tests Setup

```

Create unit tests for critical backend functions.

Create test files:

1. tests/test_auth.py - Authentication tests
2. tests/test_users.py - User management tests
3. tests/test_patients.py - Patient management tests
4. tests/test_studies.py - Study management tests
5. tests/test_measurements.py - Measurement calculation tests
6. tests/test_dicom_processor.py - DICOM processing tests
7. tests/conftest.py - Pytest fixtures

Using pytest framework:

- Fixtures for database setup/teardown
- Mock external dependencies
- Test both success and error cases
- Fixtures: app, client, test_user, test_patient, test_study, test_dicom_file

Test Coverage:

- Authentication (login, logout, token refresh)
- Authorization (role-based access control)
- CRUD operations (create, read, update, delete)
- Validations (data integrity)
- Error handling (400, 401, 403, 404, 500)
- Measurement calculations (distance, angle, area)

Run tests: pytest -v --cov=app

Include 80%+ code coverage.

```

### Prompt 23: API Documentation with Swagger

```

Create OpenAPI/Swagger documentation for FastAPI API.

Requirements:

- Automatic Swagger UI at /docs
- ReDoc documentation at /redoc
- All endpoints documented with:
  - Description
  - Request/response schemas
  - Status codes
  - Authentication requirements
  - Error responses

Features:

- Example request/response bodies
- Parameter descriptions
- Authentication scheme (Bearer JWT)
- Tag endpoints by resource (auth, patients, studies, etc)
- Version in title: "DICOM Reader Backend v1.0"

Use Pydantic for automatic schema generation.
Add custom descriptions to all endpoints via docstrings.

````

---

## 📋 IMPLEMENTATION CHECKLIST

Copy this checklist and check off each item as you implement:

### Phase 1: Setup

- [ ] Prompt 1: Project setup & dependencies
- [ ] Prompt 2: FastAPI main application
- [ ] Prompt 3: Database configuration & models

### Phase 2: Authentication & Security

- [ ] Prompt 4: JWT authentication system
- [ ] Prompt 5: Role-based access control

### Phase 3: Core Features

- [ ] Prompt 6: User management endpoints
- [ ] Prompt 7: Patient management endpoints
- [ ] Prompt 8: DICOM Study endpoints
- [ ] Prompt 9: DICOM Instance/image endpoints

### Phase 4: DICOM Processing

- [ ] Prompt 10: DICOM upload endpoints
- [ ] Prompt 11: DICOM processing service
- [ ] Prompt 12: Image rendering service

### Phase 5: Advanced Features

- [ ] Prompt 13: Measurements endpoints
- [ ] Prompt 14: Measurement calculation engine
- [ ] Prompt 15: Annotations endpoints
- [ ] Prompt 16: Report management endpoints
- [ ] Prompt 17: Audit logging endpoints
- [ ] Prompt 18: Audit service implementation
- [ ] Prompt 19: Worklist endpoints

### Phase 6: Async & Infrastructure

- [ ] Prompt 20: Celery async task configuration
- [ ] Prompt 21: Docker deployment configuration

### Phase 7: Quality & Documentation

- [ ] Prompt 22: Unit tests setup
- [ ] Prompt 23: API documentation with Swagger

---

## 🔗 Frontend Integration

After implementing backend, update your frontend:

1. **Replace mock contexts with API calls**:
   - useAuth: Call `/api/v1/auth/login`
   - usePatients: Call `/api/v1/patients`
   - useWorklist: Call `/api/v1/worklist`

2. **Image rendering**:
   - Change from `generateMockDICOMImage()` to `/api/v1/instances/{id}/image`

3. **API client setup**:

   ```typescript
   const apiClient = axios.create({
     baseURL: "http://localhost:8000/api/v1",
     headers: {
       Authorization: `Bearer ${token}`,
     },
   });
````

4. **Update environment variables**:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```

---

## ✅ Summary

You now have:

1. **Complete backend specification** with all data models
2. **23 AI prompts** for implementing each backend component
3. **Database schema** with SQL
4. **API endpoint specifications** with request/response formats
5. **Deployment configuration** with Docker
6. **Testing strategy** with pytest

Next steps:

1. Use each prompt with Claude/ChatGPT to generate backend code
2. Follow the implementation checklist
3. Test locally with docker-compose
4. Update frontend to use real API endpoints
5. Deploy to production

Good luck! 🚀
