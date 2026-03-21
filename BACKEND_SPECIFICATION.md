# DICOM Reader Backend Specification

## 📋 Executive Summary

Complete backend architecture for a medical imaging DICOM viewer with role-based access, audit logging, DICOM processing, and clinical workflows.

---

## 🏗️ Architecture Overview

```
Frontend (Next.js)
    ↓ (HTTP REST API)
Backend (FastAPI + Python)
    ├── Authentication & Authorization
    ├── DICOM Processing Service
    ├── Database (PostgreSQL)
    ├── File Storage (S3/Local)
    ├── Cache Layer (Redis)
    └── Message Queue (Celery/RabbitMQ for async tasks)
```

---

## 🛠️ Technology Stack

### Backend Framework

- **Framework**: FastAPI (Python 3.11+)
- **ASGI Server**: Uvicorn
- **ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL 14+
- **Cache**: Redis 7+
- **Task Queue**: Celery 5+ with RabbitMQ
- **File Storage**: AWS S3 or MinIO (or local for dev)
- **Auth**: JWT (PyJWT) + bcrypt

### DICOM Processing Libraries

- **pydicom**: DICOM file parsing
- **Pillow (PIL)**: Image manipulation
- **NumPy**: Array operations
- **SciPy**: Scientific computing
- **opencv-python**: Advanced image processing
- **SimpleITK**: Medical image processing

### Additional Libraries

- **pydantic**: Data validation
- **python-multipart**: File uploads
- **python-jose**: JWT tokens
- **passlib**: Password hashing
- **pytest**: Testing
- **black**: Code formatting
- **flake8**: Linting

---

## 📦 Project Structure

```
dicom-reader-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                          # FastAPI app entry point
│   ├── config.py                        # Configuration settings
│   ├── database.py                      # Database connection
│   ├── core/
│   │   ├── security.py                  # JWT, password hashing
│   │   ├── permissions.py               # Role-based access control
│   │   └── exceptions.py                # Custom exceptions
│   ├── models/
│   │   ├── user.py                      # User model
│   │   ├── patient.py                   # Patient model
│   │   ├── study.py                     # Study (DICOM study)
│   │   ├── series.py                    # Series (DICOM series)
│   │   ├── instance.py                  # Instance (DICOM image)
│   │   ├── measurement.py               # Measurement model
│   │   ├── annotation.py                # Annotation model
│   │   ├── audit_log.py                 # Audit log model
│   │   ├── report.py                    # Report model
│   │   └── worklist_item.py             # Worklist item model
│   ├── schemas/
│   │   ├── user.py                      # User schemas (Pydantic)
│   │   ├── patient.py                   # Patient schemas
│   │   ├── study.py                     # Study schemas
│   │   ├── measurement.py               # Measurement schemas
│   │   ├── annotation.py                # Annotation schemas
│   │   ├── audit_log.py                 # Audit log schemas
│   │   └── report.py                    # Report schemas
│   ├── crud/
│   │   ├── user.py                      # User CRUD operations
│   │   ├── patient.py                   # Patient CRUD operations
│   │   ├── study.py                     # Study CRUD operations
│   │   ├── measurement.py               # Measurement CRUD operations
│   │   ├── annotation.py                # Annotation CRUD operations
│   │   ├── audit_log.py                 # Audit log CRUD operations
│   │   └── report.py                    # Report CRUD operations
│   ├── api/
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py                # Main router
│   │   │   ├── auth.py                  # Authentication endpoints
│   │   │   ├── users.py                 # User management
│   │   │   ├── patients.py              # Patient endpoints
│   │   │   ├── studies.py               # Study endpoints
│   │   │   ├── instances.py             # Instance/image endpoints
│   │   │   ├── measurements.py          # Measurement endpoints
│   │   │   ├── annotations.py           # Annotation endpoints
│   │   │   ├── audit_logs.py            # Audit log endpoints
│   │   │   ├── reports.py               # Report endpoints
│   │   │   ├── worklist.py              # Worklist endpoints
│   │   │   ├── dicom_upload.py          # DICOM file upload
│   │   │   └── image_render.py          # Image rendering
│   ├── services/
│   │   ├── dicom_processor.py           # DICOM file processing
│   │   ├── image_renderer.py            # Image rendering (windowing, etc)
│   │   ├── measurement_engine.py        # Measurement calculations
│   │   ├── audit_service.py             # Audit logging service
│   │   ├── storage_service.py           # File storage operations
│   │   └── notification_service.py      # Email/notifications
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── celery_app.py                # Celery configuration
│   │   ├── dicom_processing_tasks.py    # Async DICOM tasks
│   │   └── notification_tasks.py        # Async notifications
│   └── utils/
│       ├── logging.py                   # Logging configuration
│       ├── constants.py                 # Constants
│       └── helpers.py                   # Helper functions
├── tests/
│   ├── conftest.py                      # Pytest configuration
│   ├── test_auth.py
│   ├── test_patients.py
│   ├── test_studies.py
│   ├── test_dicom_processor.py
│   └── test_measurements.py
├── migrations/                          # Alembic migrations
├── .env.example                         # Example environment file
├── requirements.txt                     # Python dependencies
├── docker-compose.yml                   # Docker composition
├── Dockerfile                           # Docker image
├── pytest.ini
├── pyproject.toml                       # Project metadata
└── README.md
```

---

## 👥 User Roles & Permissions

```python
ROLES = {
    'admin': {
        'permissions': [
            'user.create', 'user.read', 'user.update', 'user.delete',
            'patient.create', 'patient.read', 'patient.update', 'patient.delete',
            'study.create', 'study.read', 'study.update', 'study.delete',
            'audit_log.read',
            'report.approve', 'report.sign',
        ]
    },
    'radiologist': {
        'permissions': [
            'patient.read',
            'study.read', 'study.update',
            'instance.read',
            'measurement.create', 'measurement.read', 'measurement.update',
            'annotation.create', 'annotation.read', 'annotation.update',
            'report.create', 'report.update', 'report.read',
            'audit_log.read_own',
        ]
    },
    'imaging_technician': {
        'permissions': [
            'patient.create', 'patient.read', 'patient.update',
            'study.create', 'study.read', 'study.update',
            'dicom.upload',
            'audit_log.read_own',
        ]
    },
    'radiographer': {
        'permissions': [
            'patient.read',
            'study.read',
            'dicom.upload',
            'audit_log.read_own',
        ]
    },
    'service': {
        'permissions': [
            'dicom.upload',
            'study.read',
            'worklist.read',
        ]
    },
    'user': {
        'permissions': [
            'patient.read_own',
            'study.read_own',
            'report.read_own',
        ]
    },
}
```

---

## 📚 Database Schema

### Table: users

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,  -- admin, radiologist, technician, etc
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: patients

```sql
CREATE TABLE patients (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender CHAR(1),  -- M, F, O
    age INT,
    contact_info VARCHAR(20),
    email VARCHAR(100),
    weight_kg DECIMAL(5,2),
    height_cm INT,
    medical_record_number VARCHAR(50) UNIQUE,
    created_by_id INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Table: studies (DICOM Study)

```sql
CREATE TABLE studies (
    id VARCHAR(50) PRIMARY KEY,  -- DICOM Study UID
    patient_id VARCHAR(20) REFERENCES patients(id),
    study_date DATE NOT NULL,
    study_time TIME,
    modality VARCHAR(10),  -- MRI, CT, XR, US, etc
    study_description VARCHAR(255),
    referring_physician VARCHAR(100),
    accession_number VARCHAR(50) UNIQUE,
    total_series INT DEFAULT 0,
    total_instances INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'new',  -- new, ongoing, completed, archived
    created_by_id INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_studies_patient_id ON studies(patient_id);
CREATE INDEX idx_studies_study_date ON studies(study_date);
CREATE INDEX idx_studies_modality ON studies(modality);
```

### Table: series (DICOM Series)

```sql
CREATE TABLE series (
    id VARCHAR(50) PRIMARY KEY,  -- DICOM Series UID
    study_id VARCHAR(50) REFERENCES studies(id),
    series_number INT,
    series_description VARCHAR(255),
    modality VARCHAR(10),
    body_part_examined VARCHAR(100),
    protocol_name VARCHAR(255),
    series_date DATE,
    total_instances INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_series_study_id ON series(study_id);
```

### Table: instances (DICOM Instance/Image)

```sql
CREATE TABLE instances (
    id VARCHAR(50) PRIMARY KEY,  -- DICOM SOP Instance UID
    series_id VARCHAR(50) REFERENCES series(id),
    study_id VARCHAR(50) REFERENCES studies(id),
    sop_class_uid VARCHAR(100),
    instance_number INT,
    filename VARCHAR(255),
    file_path VARCHAR(500),  -- S3 or local path
    file_size_bytes INT,
    rows INT,
    columns INT,
    slice_thickness DECIMAL(10,4),
    slice_location DECIMAL(10,4),
    window_center DECIMAL(10,2),
    window_width DECIMAL(10,2),
    bits_allocated INT,
    bits_stored INT,
    high_bit INT,
    pixel_representation INT,
    image_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_instances_series_id ON instances(series_id);
CREATE INDEX idx_instances_study_id ON instances(study_id);
```

### Table: measurements

```sql
CREATE TABLE measurements (
    id VARCHAR(50) PRIMARY KEY,
    instance_id VARCHAR(50) REFERENCES instances(id),
    user_id INT REFERENCES users(id),
    measurement_type VARCHAR(20),  -- distance, angle, area, roi, hu
    value DECIMAL(15,4),
    unit VARCHAR(20),
    label VARCHAR(255),
    coordinates JSON,  -- Array of points: [{x: 100, y: 200}, ...]
    metadata JSON,  -- Additional data (HU values, statistics, etc)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_measurements_instance_id ON measurements(instance_id);
CREATE INDEX idx_measurements_user_id ON measurements(user_id);
```

### Table: annotations

```sql
CREATE TABLE annotations (
    id VARCHAR(50) PRIMARY KEY,
    instance_id VARCHAR(50) REFERENCES instances(id),
    user_id INT REFERENCES users(id),
    text VARCHAR(500),
    x INT,
    y INT,
    color VARCHAR(7),  -- Hex color code
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_annotations_instance_id ON annotations(instance_id);
```

### Table: reports

```sql
CREATE TABLE reports (
    id VARCHAR(50) PRIMARY KEY,
    study_id VARCHAR(50) REFERENCES studies(id),
    patient_id VARCHAR(20) REFERENCES patients(id),
    radiologist_id INT REFERENCES users(id),
    findings TEXT,
    impression TEXT,
    recommendations TEXT,
    status VARCHAR(20) DEFAULT 'draft',  -- draft, completed, signed, approved
    signed_by_id INT REFERENCES users(id),
    signed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_study_id ON reports(study_id);
CREATE INDEX idx_reports_radiologist_id ON reports(radiologist_id);
```

### Table: audit_logs

```sql
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    user_role VARCHAR(50),
    action VARCHAR(100),  -- STUDY_VIEWED, MEASUREMENT_CREATED, REPORT_SIGNED, etc
    resource_type VARCHAR(50),  -- study, measurement, annotation, report
    resource_id VARCHAR(50),
    study_id VARCHAR(50),
    details JSON,  -- Additional context
    severity VARCHAR(20),  -- info, warning, critical
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_study_id ON audit_logs(study_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

### Table: worklist_items

```sql
CREATE TABLE worklist_items (
    id VARCHAR(50) PRIMARY KEY,
    study_id VARCHAR(50) REFERENCES studies(id),
    patient_id VARCHAR(20) REFERENCES patients(id),
    status VARCHAR(20),  -- new, ongoing, completed
    priority VARCHAR(20),  -- low, normal, high, urgent
    assigned_to_id INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_worklist_items_assigned_to ON worklist_items(assigned_to_id);
CREATE INDEX idx_worklist_items_status ON worklist_items(status);
```

---

## 🔌 API Endpoints

### Authentication

```
POST   /api/v1/auth/login               - Login with username/password
POST   /api/v1/auth/logout              - Logout
POST   /api/v1/auth/refresh             - Refresh JWT token
GET    /api/v1/auth/me                  - Get current user info
```

### Users Management

```
GET    /api/v1/users                    - List all users (admin only)
POST   /api/v1/users                    - Create user (admin only)
GET    /api/v1/users/{id}               - Get user details
PUT    /api/v1/users/{id}               - Update user (admin/self)
DELETE /api/v1/users/{id}               - Delete user (admin only)
```

### Patients

```
GET    /api/v1/patients                 - List patients with filters
POST   /api/v1/patients                 - Create new patient
GET    /api/v1/patients/{id}            - Get patient details
PUT    /api/v1/patients/{id}            - Update patient
DELETE /api/v1/patients/{id}            - Delete patient (admin)
GET    /api/v1/patients/search?q={text} - Search patients
```

### Studies (DICOM Studies)

```
GET    /api/v1/studies                  - List studies with filters
POST   /api/v1/studies                  - Create new study
GET    /api/v1/studies/{id}             - Get study details + metadata
PUT    /api/v1/studies/{id}             - Update study status
GET    /api/v1/studies/{id}/series      - Get all series in study
GET    /api/v1/studies/{id}/instances   - Get all instances in study
GET    /api/v1/studies/{id}/worklist    - Get worklist item
```

### Instances (DICOM Images)

```
GET    /api/v1/instances/{id}           - Get instance metadata
GET    /api/v1/instances/{id}/image     - Get rendered image (PNG/JPEG)
GET    /api/v1/instances/{id}/frames    - Get multi-frame image list
GET    /api/v1/instances/{id}/pixels    - Get raw pixel data
GET    /api/v1/instances/{id}/dicom     - Get original DICOM file
POST   /api/v1/instances/{id}/window    - Apply windowing/leveling
POST   /api/v1/instances/{id}/render    - Custom rendering request
```

### DICOM Upload

```
POST   /api/v1/dicom/upload             - Upload DICOM files (multipart)
POST   /api/v1/dicom/upload-batch       - Batch upload
GET    /api/v1/dicom/upload-status/{id} - Get upload progress
```

### Measurements

```
GET    /api/v1/measurements             - List measurements
POST   /api/v1/measurements             - Create measurement
GET    /api/v1/measurements/{id}        - Get measurement details
PUT    /api/v1/measurements/{id}        - Update measurement
DELETE /api/v1/measurements/{id}        - Delete measurement
GET    /api/v1/measurements/instance/{instance_id} - Get instance measurements
```

### Annotations

```
GET    /api/v1/annotations              - List annotations
POST   /api/v1/annotations              - Create annotation
GET    /api/v1/annotations/{id}         - Get annotation
PUT    /api/v1/annotations/{id}         - Update annotation
DELETE /api/v1/annotations/{id}         - Delete annotation
GET    /api/v1/annotations/instance/{instance_id} - Get instance annotations
```

### Reports

```
GET    /api/v1/reports                  - List reports
POST   /api/v1/reports                  - Create report
GET    /api/v1/reports/{id}             - Get report
PUT    /api/v1/reports/{id}             - Update report
DELETE /api/v1/reports/{id}             - Delete report (draft only)
POST   /api/v1/reports/{id}/approve     - Approve report (senior radiologist)
POST   /api/v1/reports/{id}/sign        - Sign/finalize report
GET    /api/v1/reports/study/{study_id} - Get study reports
```

### Audit Logs

```
GET    /api/v1/audit-logs               - List audit logs (admin)
GET    /api/v1/audit-logs/user/{user_id} - Get user's audit logs
GET    /api/v1/audit-logs/study/{study_id} - Get study audit logs
GET    /api/v1/audit-logs/export        - Export audit logs (CSV)
```

### Worklist

```
GET    /api/v1/worklist                 - Get user's worklist
GET    /api/v1/worklist/filters         - Get available filter options
PUT    /api/v1/worklist/{id}            - Update worklist item status
```

---

## 🔐 Authentication & Authorization

### Login Request

```json
POST /api/v1/auth/login
{
  "username": "user1",
  "password": "pass123"
}

Response (200):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "user1",
    "full_name": "Dr. John Smith",
    "role": "radiologist",
    "email": "john@hospital.com"
  }
}
```

### JWT Token Structure

```json
{
  "sub": "1",
  "username": "user1",
  "role": "radiologist",
  "permissions": ["study.read", "measurement.create", ...],
  "iat": 1679000000,
  "exp": 1679086400
}
```

---

## 📤 DICOM Upload & Processing

### Upload Endpoint

```
POST /api/v1/dicom/upload
Content-Type: multipart/form-data

Parameters:
- files: DICOM files
- patient_id: Target patient ID
- study_description: (optional)
- study_date: (optional)
- modality: (optional)

Response (202 Accepted):
{
  "upload_id": "upload_123abc",
  "status": "processing",
  "files_received": 45,
  "files_processed": 0,
  "files_failed": 0,
  "task_id": "celery_task_12345"
}
```

### Processing Pipeline

```
1. File validation (DICOM format check)
2. Extract DICOM metadata (UIDs, patient info, etc)
3. Create study/series/instance records
4. Convert to PNG/JPEG for web viewing
5. Extract windowing presets
6. Calculate image statistics
7. Index for search
8. Send completion notification
```

---

## 🎨 Image Rendering

### Render Endpoint with Windowing

```
GET /api/v1/instances/{id}/image?width=512&height=512&window_center=40&window_width=400&format=png

Response:
- Content-Type: image/png
- Binary PNG image data with applied windowing
```

### Supported Rendering Options

```json
{
  "width": 512, // Output width
  "height": 512, // Output height
  "window_center": 40, // Window center (HU)
  "window_width": 400, // Window width (HU)
  "reset": false, // Reset to default windowing
  "preset": "lung", // lung, bone, brain, mediastinum, etc
  "flip_horizontal": false,
  "flip_vertical": false,
  "rotate": 0, // 0, 90, 180, 270
  "zoom": 1.0,
  "pan_x": 0,
  "pan_y": 0,
  "filter": "none", // none, sharpen, smooth, edge_detect
  "format": "png" // png, jpeg, webp
}
```

---

## 📊 What Needs Backend Support

### From Your Frontend, These Need Backend:

| Feature                | Frontend                                                  | Backend Needed                                | Status |
| ---------------------- | --------------------------------------------------------- | --------------------------------------------- | ------ |
| **Authentication**     | Login form                                                | JWT auth, user DB, password hashing           | ✅     |
| **User Roles**         | 5 roles (admin, radiologist, tech, radiographer, service) | Role DB, permission checks, middleware        | ✅     |
| **Patient Management** | Patient table, add/edit/delete                            | Patient CRUD, database, validation            | ✅     |
| **Worklist**           | Worklist table, filters                                   | Worklist DB, study queries, assignments       | ✅     |
| **DICOM Upload**       | Upload area component                                     | File validation, DICOM parser, storage        | ✅     |
| **Image Rendering**    | Canvas viewer                                             | DICOM pixel conversion, windowing, PNG export | ✅     |
| **Measurements**       | Measurement tools UI                                      | Store measurements, calculation engine        | ✅     |
| **Annotations**        | Annotation canvas                                         | Store annotations with coordinates            | ✅     |
| **ROI Statistics**     | ROI display                                               | Calculate HU, mean, std dev, area             | ✅     |
| **Audit Logging**      | Audit logger service                                      | Database logging, export, filtering           | ✅     |
| **Reports**            | Report generator                                          | Report CRUD, signing, approval workflow       | ✅     |
| **Advanced Viz**       | MPR, MIP, Fusion, 3D                                      | Volume rendering, 3D reconstruction           | ✅     |
| **Clinical Workflow**  | Hanging protocols, comparison                             | Protocol DB, case comparison logic            | ✅     |
| **Offline Sync**       | Service Worker                                            | API endpoints for sync on reconnect           | ✅     |
| **Mobile**             | Mobile wrapper                                            | Responsive API, optimized endpoints           | ✅     |

---

## 🗂️ File Storage Strategy

### Storage Paths

```
S3 or Local Storage:
/studies/{patient_id}/{study_uid}/
  ├── {series_uid}/
  │   ├── {instance_uid}.dcm          # Original DICOM
  │   ├── {instance_uid}.png          # Rendered @ 512x512
  │   ├── {instance_uid}_thumb.jpg    # Thumbnail @ 128x128
  │   └── {instance_uid}_metadata.json
  └── study_metadata.json

Total per study: 30-100 MB (depending on modality and frames)
```

### Cache Strategy (Redis)

```
- Rendered images: Cache for 1 hour
- Patient data: Cache for 24 hours
- Study metadata: Cache for 24 hours
- User sessions: Cache for 8 hours
- Worklist: Cache for 1 hour
```

---

## ⚙️ Configuration (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dicom_db

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# File Storage
STORAGE_TYPE=local  # or s3
STORAGE_PATH=/data/dicom_files
MAX_FILE_SIZE_MB=500

# AWS S3 (if using S3)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_BUCKET_NAME=dicom-files
AWS_REGION=us-east-1

# DICOM Processing
TEMP_DICOM_PATH=/tmp/dicom
RENDER_OUTPUT_FORMAT=png
IMAGE_QUALITY=95

# Email
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@hospital.com

# Celery
CELERY_BROKER_URL=amqp://user:password@localhost:5672/
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# CORS
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/dicom-backend.log
```

---

## 📝 API Request/Response Examples

### Create Patient

```json
POST /api/v1/patients
Authorization: Bearer {token}

{
  "id": "P006",
  "name": "Sarah Johnson",
  "date_of_birth": "1995-06-15",
  "gender": "F",
  "contact_info": "555-0106",
  "email": "sarah@email.com",
  "weight_kg": 62,
  "height_cm": 164
}

Response (201):
{
  "id": "P006",
  "name": "Sarah Johnson",
  "created_at": "2026-03-21T10:30:00Z"
}
```

### Upload DICOM Files

```
POST /api/v1/dicom/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- files: [file1.dcm, file2.dcm, ..., file45.dcm]
- patient_id: P001
- study_description: Brain MRI with Contrast

Response (202):
{
  "upload_id": "up_123456",
  "status": "processing",
  "files_received": 45,
  "task_id": "celery_abc123def456"
}
```

### Create Measurement

```json
POST /api/v1/measurements
Authorization: Bearer {token}

{
  "instance_id": "1.2.3.4.5.6.7.8",
  "type": "distance",
  "value": 45.5,
  "unit": "mm",
  "label": "Lesion Width",
  "coordinates": [
    {"x": 100, "y": 150},
    {"x": 200, "y": 150}
  ]
}

Response (201):
{
  "id": "m_123456",
  "instance_id": "1.2.3.4.5.6.7.8",
  "type": "distance",
  "value": 45.5,
  "created_by": "Dr. John Smith",
  "created_at": "2026-03-21T10:35:00Z"
}
```

---

## 🔄 Async Task Processing (Celery)

### Available Tasks

```python
# dicom_processing_tasks.py
@celery_app.task(bind=True)
def process_dicom_upload(self, upload_id, file_paths, patient_id):
    """Process uploaded DICOM files"""

@celery_app.task(bind=True)
def render_image(self, instance_id, options):
    """Render DICOM image with options"""

@celery_app.task
def generate_volume_data(instance_ids, output_path):
    """Generate 3D volume from series"""

@celery_app.task
def export_audit_logs(self, start_date, end_date, format):
    """Export audit logs to CSV/PDF"""
```

---

## 🧪 Testing Endpoints

### User Login Test

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user1",
    "password": "pass123"
  }'
```

### Get Current User

```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer {token}"
```

### List Patients

```bash
curl -X GET http://localhost:8000/api/v1/patients \
  -H "Authorization: Bearer {token}"
```

### List Studies with Filters

```bash
curl -X GET 'http://localhost:8000/api/v1/studies?modality=MRI&status=completed' \
  -H "Authorization: Bearer {token}"
```

---

## 🚀 Deployment

### Docker Compose

```yaml
version: "3.8"
services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pwd@db:5432/dicom_db
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=dicom_db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pwd
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7

  celery:
    build: .
    command: celery -A app.tasks.celery_app worker -l info
    depends_on:
      - redis
      - db

volumes:
  postgres_data:
```

---

## 📖 Development Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env

# Run migrations
alembic upgrade head

# Start backend
uvicorn app.main:app --reload --port 8000

# In another terminal, start Celery
celery -A app.tasks.celery_app worker -l info
```

---

## 🔗 Frontend Integration Points

Your frontend expects these backend services:

1. **Authentication**: `/api/v1/auth/login` → Sets JWT token in localStorage
2. **Patient Management**: `/api/v1/patients` → usePatients context
3. **Worklist**: `/api/v1/worklist` → useWorklist context
4. **Studies**: `/api/v1/studies` → Study list and details
5. **Image Rendering**: `/api/v1/instances/{id}/image` → Canvas viewer
6. **Measurements**: `/api/v1/measurements` → Measurement tools
7. **Annotations**: `/api/v1/annotations` → Annotation panel
8. **Reports**: `/api/v1/reports` → Report generator
9. **Audit Logs**: `/api/v1/audit-logs` → Compliance/audit trail
10. **DICOM Upload**: `/api/v1/dicom/upload` → Upload area

---

## ✅ Summary

Your backend needs to handle:

- ✅ User authentication & role-based access
- ✅ DICOM file parsing and processing
- ✅ Medical image rendering with windowing
- ✅ Measurement calculations (distance, angle, area, ROI, HU)
- ✅ Annotation storage with coordinates
- ✅ Report generation and signing workflows
- ✅ Comprehensive audit logging for compliance
- ✅ Patient and study management
- ✅ Worklist assignment and tracking
- ✅ Offline sync support (queue system)
- ✅ 3D visualization data preparation

All with enterprise-grade security, performance, and reliability.
