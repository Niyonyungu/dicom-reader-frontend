# Complete Backend Implementation Guide

**Last Updated:** March 21, 2026  
**Project:** DICOM Reader - Medical Imaging Viewer  
**Status:** Frontend 100% Complete | Backend 0% - Ready to Build

---

## 🎯 What You Have (Frontend Summary)

Your Next.js frontend is **production-ready** with:

### Features Implemented ✅

1. **Authentication UI** - Login page with error handling
2. **5 User Roles** - Admin, Radiologist, Tech, Radiographer, Service
3. **Patient Management** - Full CRUD interface
4. **Worklist System** - Study assignment and tracking UI
5. **DICOM Viewer** - Canvas-based image display (mock data)
6. **Measurement Tools** - Distance, angle, area, ROI, HU calculations
7. **Annotations** - On-image text and drawing
8. **Reports Generator** - Radiologist findings editor
9. **Audit Logger** - Event tracking (ready to sync to backend)
10. **Advanced Visualizations** - MPR, MIP, Fusion, 3D (UI ready)
11. **Clinical Workflows** - Protocols, comparison, hanging logic
12. **Mobile Optimization** - Responsive design for all screen sizes
13. **Offline Support** - Service Worker with caching
14. **Export Tools** - PDF export, measurements export

### What's Mock (Needs Backend)

- User authentication (hardcoded test users)
- Patient data (hardcoded arrays)
- Study/image data (generated randomly)
- DICOM file processing (shows message only)
- All persistent data storage

---

## 🔧 What Backend Needs to Provide

Your backend is responsible for:

| Component          | Purpose                 | Data Stored                   | Complexity |
| ------------------ | ----------------------- | ----------------------------- | ---------- |
| **Authentication** | Login, tokens, sessions | Users, passwords, sessions    | Medium     |
| **Patients**       | Medical records         | Demographics, medical history | Low        |
| **Studies**        | DICOM studies container | Metadata, references          | Medium     |
| **Series**         | Image groupings         | Series info, references       | Medium     |
| **Instances**      | Individual DICOM images | Pixels, metadata              | High       |
| **Measurements**   | User measurements       | Coordinates, calculations     | Medium     |
| **Annotations**    | User annotations        | Text, positions, colors       | Low        |
| **Reports**        | Radiologist findings    | Text, status, signatures      | Medium     |
| **Audit Logs**     | Compliance tracking     | All user actions              | Medium     |
| **Worklist**       | Study assignment        | Status, assignments           | Low        |
| **Roles & Perms**  | Access control          | Permissions matrix            | Medium     |

---

## 📦 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  Next.js Frontend (3000)                     │
│  (React + TypeScript + Tailwind + Shadcn UI)               │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST API
                      │ JWT Authentication
                      ↓
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (8000)                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  API Layer (23 endpoints)                          │   │
│  │  - Auth (login, refresh)                           │   │
│  │  - Patients (CRUD)                                 │   │
│  │  - Studies (CRUD + search)                         │   │
│  │  - Instances (metadata + rendering)                │   │
│  │  - Measurements (CRUD)                             │   │
│  │  - Annotations (CRUD)                              │   │
│  │  - Reports (workflow)                              │   │
│  │  - Audit Logs (search + export)                    │   │
│  │  - Worklist (assignment)                           │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Services Layer                                    │   │
│  │  - DICOM Processing (pydicom)                      │   │
│  │  - Image Rendering (windowing + transforms)       │   │
│  │  - Measurements (calculations)                     │   │
│  │  - Audit Service (logging)                         │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Data Layer (SQLAlchemy ORM)                       │   │
│  │  - Models (User, Patient, Study, etc)              │   │
│  │  - Relationships (FK, indexes)                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                      ↓
        ┌─────────────────┬─────────────────┐
        ↓                 ↓                 ↓
    PostgreSQL          Redis            S3/Storage
    (Data)            (Cache)            (DICOM Files)
```

---

## 🛠️ Technology Stack Decision

### Why FastAPI + Python?

**Proven DICOM Ecosystem**

```
Library          | Purpose
─────────────────┼──────────────────────────
pydicom          | DICOM parsing ⭐⭐⭐
NumPy + SciPy    | Image processing ⭐⭐⭐
Pillow           | Image conversion ⭐⭐⭐
SimpleITK        | Medical imaging ⭐⭐⭐
opencv-python    | Advanced transforms
```

**FastAPI Advantages**

- Automatic API documentation (Swagger UI)
- Type checking with Pydantic
- Async/await support
- Fast startup
- Easy CORS handling
- Great for streaming/file uploads

**PostgreSQL**

- HIPAA compliance support
- Complex queries for medical data
- ACID compliance
- Full-text search for reports
- JSON field support (flexibility)

---

## 📋 Complete Implementation Checklist

### Week 1: Core Setup (Days 1-2)

- [ ] Create FastAPI project structure
- [ ] Set up PostgreSQL database
- [ ] Create user model and JWT auth
- [ ] Create patient model and CRUD endpoints
- [ ] Set up basic error handling
- **Deliverable:** Login works, can create/list patients

### Week 1: File Upload (Days 3-5)

- [ ] Create study/series/instance models
- [ ] Implement DICOM upload endpoint
- [ ] Parse DICOM files (extract metadata)
- [ ] Store original files (S3 or local)
- **Deliverable:** Can upload DICOM files, files are parsed

### Week 2: Image Processing (Days 6-10)

- [ ] Extract pixel data from DICOM
- [ ] Implement windowing algorithm
- [ ] Render to PNG/JPEG
- [ ] Create image rendering endpoint
- [ ] Implement caching with Redis
- **Deliverable:** Frontend can display real DICOM images

### Week 2: Measurements (Days 11-14)

- [ ] Create measurements model
- [ ] Implement measurement CRUD
- [ ] Create calculation service (distance, angle, area)
- [ ] Create ROI statistics engine
- **Deliverable:** Can draw measurements, calculations work

### Week 3: Reports & Audit (Days 15-17)

- [ ] Create reports model
- [ ] Implement report workflow
- [ ] Create audit logging middleware
- [ ] Implement audit query endpoints
- **Deliverable:** Can create reports, audit trail recorded

### Week 3: Advanced Features (Days 18-19)

- [ ] Annotations endpoints
- [ ] Worklist endpoints
- [ ] Role-based access control
- [ ] Implement Celery for async tasks
- **Deliverable:** All endpoints working

### Week 4: Polish & Deployment (Days 20-21)

- [ ] Docker setup
- [ ] Unit tests
- [ ] API documentation
- [ ] Performance optimization
- [ ] Production deployment
- **Deliverable:** Production-ready backend

---

## 🚀 How to Get Started

### Step 1: Use the AI Prompts

We've created 23 AI prompts in `BACKEND_AI_PROMPTS.md`. Use them with Claude or ChatGPT:

```
1. Open BACKEND_AI_PROMPTS.md
2. Pick Prompt 1: "Project Setup & Dependencies"
3. Copy the entire prompt
4. Paste into Claude/ChatGPT
5. Get generated code
6. Copy to your backend project
7. Repeat for each prompt in order
```

### Step 2: Follow the Phases

**Phase 1 (Setup - Prompts 1-3)**

```powershell
# After getting code from prompts:
cd dicom-reader-backend
python -m venv venv
# Windows PowerShell activation
.\venv\Scripts\Activate.ps1
# If you use cmd.exe instead, run:
# .\venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m alembic upgrade head
uvicorn app.main:app --reload
```

**Phase 1b: Local-only backend setup (no Docker)**

This is the path to run your backend locally without Docker.

1. Install Python 3.11+ from https://www.python.org/downloads/ and enable "Add Python to PATH".
2. Open PowerShell and navigate to your backend project folder.
3. Create a Python virtual environment:

```powershell
cd dicom-reader-backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

4. Create your environment file and edit it:

```powershell
Copy-Item .env.example .env
notepad .env
```

5. If you want a simple local database, use SQLite by setting in `.env`:

```text
DATABASE_URL=sqlite:///./dev.db
```

6. Run database migrations:

```powershell
python -m alembic upgrade head
```

7. Start the backend server:

```powershell
uvicorn app.main:app --reload --port 8000
```

8. Open the API docs in a browser:

```text
http://localhost:8000/docs
```

9. If you use Celery tasks, run a second terminal:

```powershell
cd dicom-reader-backend
.\venv\Scripts\Activate.ps1
celery -A app.tasks.celery_app worker -l info
```

**Phase 2 (Auth & Users - Prompts 4-6)**

```bash
# Test endpoint:
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

**Phase 3 (Core Features - Prompts 7-9)**

- Implement patient, study, instance endpoints
- Test with Postman

**Phase 4 (DICOM Processing - Prompts 10-12)**

- Implement upload and image rendering
- Test with real DICOM files

**Continue through all prompts...**

### Step 3: Test Locally without Docker

```powershell
# Start the local backend
cd dicom-reader-backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000

# If you use Celery, open another terminal and run:
# cd dicom-reader-backend
# .\venv\Scripts\Activate.ps1
# celery -A app.tasks.celery_app worker -l info
```

# Backend available at: http://localhost:8000

# API docs at: http://localhost:8000/docs

### Optional: Docker only if you want containers

If you prefer Docker later, the existing docker-compose instructions remain available in the docs. For now, skip Docker and use the local Python environment above.

### Step 4: Connect Frontend

Update your frontend `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Replace mock contexts:

```typescript
// Before (mock):
const [users, setUsers] = useState(mockUsers);

// After (API):
const [users, setUsers] = useState([]);
useEffect(() => {
  fetch(process.env.NEXT_PUBLIC_API_URL + "/users")
    .then((r) => r.json())
    .then(setUsers);
}, []);
```

---

## 📊 Data Volume Expectations

### Storage Requirements

```
Per Study:
- CT: 100-300 MB (300-500 images)
- MRI: 50-150 MB (100-300 images)
- XR: 2-5 MB (1-4 images)
- US: 20-100 MB (50-100 images)

Total Storage:
100 studies × 150 MB average = 15 GB
Archive per year: 150-200 GB (with compression)
```

### Database Size

```
Users: ~100 records = 50 KB
Patients: ~1,000 records = 500 KB
Studies: ~10,000 records = 2 MB
Instances: ~500,000 records = 100 MB
Measurements: ~1,000,000 records = 200 MB
Audit Logs: ~10,000,000 records = 2 GB (7-year retention)

Total: ~2.3 GB (initially) → 10-20 GB (production)
```

### Performance Targets

```
Homepage load: < 2s (list studies + statistics)
Image load: < 1s (cached) / 3s (on-demand render)
Search: < 500ms (for 10,000 studies)
Upload: 45 DICOM files ≈ 2-5 minutes
```

---

## 🔒 Security Checklist

- [ ] JWT tokens use strong secret key (minimum 32 chars)
- [ ] Passwords hashed with bcrypt (not plain text)
- [ ] CORS whitelist only frontend domain
- [ ] HTTPS enforced in production
- [ ] SQL injection prevented (SQLAlchemy parameterized)
- [ ] DICOM files validate (magic number check)
- [ ] Permission checks on all endpoints
- [ ] Audit logging for sensitive operations
- [ ] File uploads scanned for malware
- [ ] Secrets in environment variables (never hardcoded)
- [ ] Rate limiting on login/upload endpoints
- [ ] HIPAA compliance (audit trail, encryption, retention)

---

## 📖 Documentation Structure

### You Have:

1. **BACKEND_SPECIFICATION.md** - Complete technical requirements
   - Database schema (SQL)
   - API endpoints (all 23)
   - Request/response formats
   - Roles and permissions
2. **BACKEND_AI_PROMPTS.md** - AI implementation prompts
   - 23 detailed prompts
   - Each generates code for one component
   - Follow in order for best results
3. **FRONTEND_TO_BACKEND_MAPPING.md** - Feature mapping
   - What frontend expects
   - What backend must provide
   - Implementation status per feature

### You'll Generate:

4. Backend code (from AI prompts)
5. Database schema (migrations)
6. API documentation (automatic from FastAPI)

---

## 🎓 Learning Resources

While building, reference:

**DICOM**

- pydicom documentation: https://pydicom.readthedocs.io/
- DICOM standard: https://www.dicomstandard.org/

**FastAPI**

- Official docs: https://fastapi.tiangolo.com/
- Tutorial: https://fastapi.tiangolo.com/tutorial/

**Medical Imaging**

- SimpleITK: https://simpleitk.org/
- NumPy/SciPy: https://numpy.org/, https://scipy.org/

**Backend Architecture**

- SQLAlchemy: https://www.sqlalchemy.org/
- Pydantic: https://docs.pydantic.dev/
- PostgreSQL: https://www.postgresql.org/docs/

---

## ✅ Success Criteria

### MVP (Minimum Viable Product)

- [ ] Login works with database users
- [ ] Can upload real DICOM files
- [ ] Can view uploaded images in frontend
- [ ] Can create measurements (persistent)
- [ ] Can create reports (draft/signed)
- [ ] Audit logs recorded

### Production Ready

- [ ] All 23 endpoints working
- [ ] Permission checks enforced
- [ ] Performance optimized (<2s page load)
- [ ] Unit tests (80%+ coverage)
- [ ] Error handling comprehensive
- [ ] Documentation complete
- [ ] Docker deployment working
- [ ] Security audit passed

---

## 📞 Troubleshooting Common Issues

### "No DICOM files uploaded"

- [ ] Check file format (must be .dcm)
- [ ] Validate with pydicom: `pydicom.dcmread(file)`
- [ ] Check file permissions
- [ ] Check storage path exists

### "Image not rendering"

- [ ] Verify pixel data extracted correctly
- [ ] Check windowing values (window_center, window_width)
- [ ] Verify image dimensions (rows, columns)
- [ ] Check for compressed pixel data

### "Measurements not persisting"

- [ ] Verify database connection
- [ ] Check user authentication
- [ ] Verify measurement table exists
- [ ] Check coordinates format

### "Permission denied on endpoint"

- [ ] Verify JWT token valid
- [ ] Check user role has permission
- [ ] Verify permission middleware installed
- [ ] Check endpoint decorator (@require_permission)

---

## 🚢 Deployment Checklist

### Before Production

- [ ] Database backups automated
- [ ] DICOM files backed up to S3
- [ ] SSL/HTTPS certificates configured
- [ ] Environment variables set securely
- [ ] Rate limiting configured
- [ ] Monitoring/logging set up
- [ ] Email notifications working
- [ ] Disaster recovery plan
- [ ] Security audit completed
- [ ] Performance load testing done

### Deployment Options

```
Development:   localhost:8000 (docker-compose)
Staging:       staging-api.hospital.com (Docker on VPS)
Production:    api.hospital.com (Kubernetes or Docker Swarm)
```

---

## 📈 Next 30 Days Roadmap

| Week   | Goal              | Milestones                   |
| ------ | ----------------- | ---------------------------- |
| Week 1 | Core Backend      | Auth working, patients CRUD  |
| Week 2 | DICOM Processing  | Upload & image rendering     |
| Week 3 | Advanced Features | Measurements, reports, audit |
| Week 4 | Production Ready  | Testing, docs, deployment    |

---

## 💡 Quick Reference

### API Version

All endpoints: `/api/v1/`

### Authentication

All requests need header: `Authorization: Bearer {token}`

### Response Format

```json
{
  "success": true,
  "data": {
    /* response object */
  },
  "error": null
}
```

### Error Responses

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Token expired"
  }
}
```

### Common Status Codes

```
200 OK                  - Success
201 Created            - Resource created
202 Accepted           - Async task started
400 Bad Request        - Invalid input
401 Unauthorized       - Missing/invalid token
403 Forbidden          - Permission denied
404 Not Found          - Resource not found
422 Unprocessable      - Validation error
500 Server Error       - Backend error
```

---

## 🎉 You're Ready!

Your frontend is complete and waiting for a backend. You now have:

✅ **Complete specification** - Know exactly what to build  
✅ **23 AI prompts** - Don't code from scratch  
✅ **Database schema** - SQL ready to use  
✅ **API documentation** - Know what the frontend expects  
✅ **Deployment guide** - Docker setup included  
✅ **Testing examples** - Know how to validate

**Next Step:** Start with BACKEND_AI_PROMPTS.md Prompt 1 and let's build! 🚀

---

## 📞 Support Resources

**For DICOM Questions:**

- DICOM standard: https://www.dicomstandard.org/
- pydicom issues: https://github.com/pydicom/pydicom/issues
- Medical imaging forums: https://discourse.itk.org/

**For FastAPI/Backend:**

- FastAPI community: https://github.com/tiangolo/fastapi/discussions
- Stack Overflow: Tag `fastapi` or `python`
- FastAPI Slack: https://join.slack.com/t/tiangolo-chat/shared_invite/

**For PostgreSQL/Database:**

- PostgreSQL documentation: https://www.postgresql.org/docs/
- SQL optimization: https://use-the-index-luke.com/

Good luck! 🎯
