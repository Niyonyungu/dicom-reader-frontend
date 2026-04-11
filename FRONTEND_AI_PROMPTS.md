# Frontend Implementation Prompts for AI - DICOM Viewer Integration

**Important:** These prompts assume you **already have a frontend app** (React, Vue, Next.js, etc.) that still uses **mock data, static JSON, or hard-coded responses**. Your job is to **replace those code paths** with real calls to the **dicom-reader-backend** (FastAPI) described in `BACKEND_AI_PROMPTS.md` and in the **Appendix** below.

**Pairing with the backend:**

- Backend runs locally (typical): `http://localhost:8000`
- API base path: **`/api/v1`**
- OpenAPI: `http://localhost:8000/openapi.json` (authoritative for paths and schemas as the backend grows)
- Interactive docs: `http://localhost:8000/docs` (when enabled)

**Prerequisites:**

- Node.js LTS and your framework’s toolchain installed
- Frontend project folder (existing SPA)
- Backend running per `DEVELOPMENT.md` / `BACKEND_LOCAL_SETUP.md` (e.g. `uvicorn app.main:app --reload`)
- PostgreSQL (and migrations) applied on the backend so auth and users work

**Development flow:**

1. Point the frontend at the backend using an env var (see Quick Start).
2. Ensure the backend **`ALLOWED_ORIGINS`** includes your frontend origin (e.g. `http://localhost:3000`).
3. For **each prompt below (1–7)**, copy the **entire code block** under that prompt.
4. Paste into Claude, ChatGPT, Cursor, or another AI assistant **with your frontend repo context**.
5. Apply generated changes; run the app and verify against the real API.
6. When the backend gains new endpoints, update **Appendix A** and add new prompts in the same style.

Use these prompts in order **1 → 2 → 3** first (foundation), then **4 / 5** by role, then **6** for clinical screens, **7** optional.

**Maintainer rule:** Whenever the backend API, auth rules, or permissions change, update **Appendix A** and the **Changelog** at the bottom of this file in the same change.

---

## ⚡ Quick Start

### 1. Backend must be reachable

- Start API: `uvicorn app.main:app --reload` (from backend repo, venv active).
- Check: open `http://localhost:8000/health`.

### 2. Frontend environment

Add a base URL **without** a trailing slash, for example:

```env
# Vite
VITE_API_BASE_URL=http://localhost:8000

# Next.js
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

In code, use: `const API_ROOT = \`${baseUrl}/api/v1\``(avoid`//`).

### 3. CORS

Backend `.env` must list your SPA origin in `ALLOWED_ORIGINS` (comma-separated). If the browser shows CORS errors, fix origins first—do not disable CORS in production.

### 4. For EACH prompt below

- Copy the **whole** triple-backtick block under the prompt heading.
- Paste into your AI tool; attach or paste **Appendix A** if the model cannot read this file.
- Implement and test before moving to the next prompt.

---

## 📋 AI PROMPTS (Use These in Order)

---

## 🌐 API CLIENT & ERROR HANDLING

### Prompt 1: API Client — Replace Mocks with Real Backend Calls

```
Wire the existing SPA to the FastAPI DICOM viewer backend. The app currently uses mock data, fake delays, or hard-coded fetch URLs.

**IMPORTANT:** Centralize HTTP logic. Do not leave scattered raw fetch() calls across components after this task.

Requirements:
- Environment variable for API host (e.g. VITE_API_BASE_URL or NEXT_PUBLIC_API_BASE_URL), no trailing slash
- Derived API root: {BASE}/api/v1
- JSON request bodies use Content-Type: application/json
- Attach Authorization: Bearer <access_token> when a token exists (token plumbing completed in Prompt 2; for Prompt 1 accept a getter/callback or placeholder injection)
- Parse JSON on success; on error responses parse the backend envelope when present

Endpoints (no auth yet for login — use client for public health check only if useful):
- GET http://localhost:8000/health — optional smoke test from the client

Error handling (backend envelope):
- Shape: { "error", "message", "details?", "request_id?" }
- 422: details is often an array of validation objects (loc, msg, type)
- 403: message may contain "Missing permission: resource.action"
- 401: invalid or expired token
- 429: login rate limit (handled in Prompt 2)

Implement:
1. apiClient.request(method, path, { body, authToken }) where path is relative to /api/v1 (e.g. "/auth/login")
2. getApiErrorMessage(parsedBody, status) — prefer message, then first 422 detail, then fallback text
3. Log request_id to console in development for support
4. Replace existing mock modules / setTimeout fakes for endpoints that exist on the backend with calls through apiClient
5. Thin service modules per domain (authService, userService) that call apiClient

Features:
- TypeScript types aligned with backend field names (camelCase vs snake_case: match API JSON — backend uses snake_case for many fields)
- Single place to change base URL for staging/production

NOTE: Full endpoint lists and JSON examples are in Appendix A of FRONTEND_AI_PROMPTS.md. Keep OpenAPI as the source of truth for routes not yet listed in the appendix.
```

---

## 🔐 AUTHENTICATION & SESSION

### Prompt 2: Authentication — Login, Refresh, Logout, Me, Route Guards

```
Implement full authentication against the DICOM viewer backend JWT API.

**IMPORTANT:** After login, store access_token, refresh_token, and user (including permissions) from the server response. Do not invent permissions client-side.

Endpoints:
POST /api/v1/auth/login — body: { "email", "password" } — returns access_token, refresh_token, token_type, user { id, email, full_name, role, permissions }
POST /api/v1/auth/refresh — body: { "refresh_token" } — same response shape as login
GET /api/v1/auth/me — Bearer access token — returns current user + permissions from database
POST /api/v1/auth/logout — Bearer access token — revokes current access token (jti); clear client storage after success
POST /api/v1/auth/register — Bearer admin only — optional UI for admin-created users; service accounts should use POST /users (Prompt 4)

Requirements:
- Normalize email on client: trim + lowercase (match backend validator)
- Persist tokens so reload can restore session (product choice: memory + sessionStorage vs localStorage; prefer safer patterns if already in the project)
- Attach Bearer access token to all protected requests (via apiClient from Prompt 1)
- On 401 from an API call: attempt refresh once with refresh_token; if refresh succeeds, retry original request once; if refresh fails, clear session and redirect to login
- Optional: proactive refresh when access token is near expiry (~30 min default server-side) or use decoded JWT exp if you decode for UX only
- Route guards: unauthenticated users cannot access authenticated layouts
- Login failures: show server message; 429 Too Many Requests for repeated failed logins same email
- Disabled user: backend returns 403 on login with appropriate message

Features:
- Auth context/provider (or equivalent) exposing user, role, permissions, login, logout, isAuthenticated
- Loading state during session bootstrap (me or token restore)

NOTE: Authorization decisions on the server always win; client state is for UX only.
```

---

## 🛡️ RBAC & PERMISSION-GATED UI

### Prompt 3: RBAC — Menus, Routes, and Buttons from Permissions

```
Drive navigation and primary actions from the backend permission list on the user object.

**IMPORTANT:** Permissions use dot notation (e.g. study.read, dicom.upload). The JWT/login/me payload includes an expanded list (wildcards like *.* already resolved server-side for admin).

Permission catalog (known backend strings — see Appendix A for full list):
- patient.*, study.*, instance.*, measurement.*, report.*, audit_log.*, dicom.*

Role strings (exact):
- admin, service, radiologist, imaging_technician, radiographer

UI rules:
- can(permission: string): true if user.permissions includes that exact string
- canAny([...permissions]): true if any match
- Hide or disable nav items based on can(); hide nav for missing access; use empty states for 403 from API
- User management screens (full /users CRUD): visible if role is admin OR service (backend parity)
- POST /auth/register UI: admin role only (not service)
- RBAC matrix page (Prompt 7): admin only

Implement:
1. Permission helper module + hook/usePermissions
2. Map each major route to required permission(s) or role
3. Forbidden route handler: redirect or dedicated “Not allowed” view
4. When API returns 403 with "Missing permission: ...", show a clear message

Features:
- No duplicate of full server matrix hard-coded; trust me/refresh permissions
- Direct URL entry to forbidden page does not crash; shows guard outcome

NOTE: Backend may audit permission denials; avoid spamming forbidden endpoints in loops.
```

---

## 👥 USER MANAGEMENT

### Prompt 4: User Management UI — Admin and Service Roles

```
Build or wire the Users admin section to the real REST API. Replace mock user tables and forms.

**IMPORTANT:** Roles admin and service have identical access to ALL /api/v1/users routes. Use POST /api/v1/users for provisioning (not /auth/register) when the actor is a service account.

Endpoints:
GET /api/v1/users?page=&page_size= — list (page default 1, page_size default 20, max 100)
POST /api/v1/users — create user
GET /api/v1/users/{id} — detail
PUT /api/v1/users/{id} — update (privileged: email, full_name, is_active, is_verified, role)
DELETE /api/v1/users/{id} — delete (cannot delete own account — backend 400)
PUT /api/v1/users/{id}/role — body { "role" }
PUT /api/v1/users/{id}/password — privileged reset others: { "new_password" } only; see Prompt 5 for self

Schemas (see Appendix A):
- UserCreate, UserUpdate, UserResponse, UserListResponse, ChangePasswordRequest, ChangeUserRoleRequest

Requirements:
- Pagination UI bound to total, page, page_size from UserListResponse
- Create/Edit forms with validation
- Password rules (create + reset): minimum 8 characters, uppercase, lowercase, digit, special character — show hints; surface backend 400 message if validation fails
- 409 conflict when email already exists — inline error
- Disable delete for current user’s id

Features:
- Loading and error states
- Optional dedicated “Change role” and “Reset password” actions using dedicated endpoints

Implement:
1. userService methods for each endpoint
2. Users list page + create/edit modal or routes
3. Role select with enum: admin, radiologist, imaging_technician, radiographer, service

NOTE: Self-service profile (non-privileged) is Prompt 5 — keep admin forms separate to avoid sending forbidden fields.
```

---

## 👤 PROFILE & SELF-SERVICE

### Prompt 5: Profile and Self-Service

```
Implement self-service profile management for the authenticated user.

Endpoints:
GET /api/v1/profile — Returns current user's profile
PUT /api/v1/profile — Update self (email, full_name only)
POST /api/v1/profile/change-password — Update own password: { "old_password", "new_password" }

Requirements:
- Profile page showing full_name, email, role (read-only), and active status
- Update form for full_name and email
- Password change form with old_password validation and new_password complexity check
- Inline success/error feedback

Features:
- Toast notifications on successful update
- Refetch user/me context after profile change to keep UI synchronized
```

### Prompt 6: Patient Management — CRUD and Search

```
Connect the patient management screens to the live backend.

Endpoints:
GET /api/v1/patients — List with pagination and filters (gender, status, min_age, max_age)
POST /api/v1/patients — Create patient (PatientCreate)
GET /api/v1/patients/{id} — Detailed patient info including study_count
PUT /api/v1/patients/{id} — Update patient (PatientUpdate)
DELETE /api/v1/patients/{id} — Soft delete (Admin only, only if study_count is 0)
GET /api/v1/patients/search?q={text} — Search by name, ID, or email

Requirements:
- Pagination UI (limit/offset)
- Advanced filtering sidebar (gender, age range)
- Real-time search or search-on-enter for patient discovery
- Display calculated 'age' from the response
- MRN and Patient ID uniqueness error handling (409 Conflict)

Features:
- Patient detail view showing associated study list (Prompt 7)
- Loading skeletons for patient list
```

### Prompt 7: Study Browser — List, Series, and Instances

```
Implement the clinical study browser to navigate DICOM hierarchy.

Endpoints:
GET /api/v1/studies — List with filters (modality, status, patient_id)
GET /api/v1/studies/{id} — Study details and statistics
GET /api/v1/studies/{id}/series — List series in study
GET /api/v1/studies/{id}/instances — List all instances in study
GET /api/v1/studies/{id}/audit — View study-specific audit history (audit_log.read permission)
DELETE /api/v1/studies/{id} — Archive study (Admin only)

Requirements:
- Study list with modality icons and status badges (new, ongoing, completed, archived)
- Deep navigation: Study -> Series -> Instance
- Display statistics: Total series, total images, and storage size
- Archive action for admins with confirmation

Features:
- Filter studies by modality (CT, MRI, XR, etc.) and date range
- Audit log modal/tab for clinical compliance tracking
```

### Prompt 8: DICOM Viewer — Rendering and Image Manipulation

```
Implement the image viewer using the backend's on-the-fly rendering service.

Endpoints:
GET /api/v1/instances/{id}/image — Main rendering route
GET /api/v1/instances/{id}/info — DICOM tag list (clinical info)
GET /api/v1/instances/{id}/dicom — Download original file

Render Parameters (Query String):
- format: png | jpeg | webp
- preset: lung | bone | brain | mediastinum
- window_center, window_width: custom HU values
- zoom: 1.0 to 4.0
- rotate: 0, 90, 180, 270
- flip_horizontal, flip_vertical: boolean
- filter: none, sharpen, smooth, edge_detect

Requirements:
- Viewer component that constructs rendering URLs dynamically based on UI controls
- Presets selector for quick windowing (Lung, Bone, etc.)
- Interactive controls for zoom, rotation, and flipping
- Display DICOM tags in a side panel or modal
- Implement ETag-based caching for rendered images

Features:
- Smooth loading transitions between images
- Download action for the original .dcm file
```

### Prompt 9: DICOM Upload — Async Upload and Progress

```
Implement the DICOM ingestion flow with real-time progress tracking.

Endpoints:
POST /api/v1/dicom/upload — Multipart upload (multiple files + form data)
GET /api/v1/dicom/upload-status/{upload_id}?task_id={task_id} — Progress tracking
POST /api/v1/dicom/validate — Quick file validation

Requirements:
- Multi-file dropzone for DICOM (.dcm) files
- Form for optional metadata (Patient ID, Study Description, etc.)
- Progress bar driven by the upload-status endpoint (polling)
- Handle "processing", "completed", and "failed" states
- Display processing results: files processed vs. failed

Features:
- Drag-and-drop support
- Validation feedback before starting large uploads
```

### Prompt 10: Audit Logs — Compliance Dashboard

```
Add an audit trail dashboard for administrators to monitor system activity.

Endpoints:
GET /api/v1/audit-logs — List with pagination and filters (user_id, action, entity_type)
GET /api/v1/audit-logs/{id} — Detailed log entry

Requirements:
- Paginated table of system events
- Filter by action (e.g., LOGIN, CREATE_STUDY, DELETE_PATIENT)
- Search by User ID or Entity Type
- Display metadata JSON in a readable format (e.g., code block or key-value list)

Features:
- Color-coded action types for better scannability
- Link to user profile or entity where applicable
```

### Prompt 11: RBAC Matrix Viewer (Optional)

```
Add a read-only admin page that displays the role → permission matrix from the database.

Endpoint:
GET /api/v1/auth/rbac/matrix — Bearer token, admin role only

Response (summary):
- roles: list of { role, permissions[], description?, created_at, updated_at }
- permission_catalog: sorted list of all known permission strings

Requirements:
- Hide route unless user.role === 'admin'
- Table or cards per role; show permissions as sorted tags or list
- Handle 403 if non-admin calls by mistake

Features:
- Search/filter within the page for role or permission string
- Friendly empty/error state

NOTE: Editing policies in UI may require future backend endpoints; this prompt is display-only.
```

---

## 📎 Appendix A — API contract reference

Use this section when an AI cannot read the repo. **Keep it synchronized** with the real backend.

### Quick facts

| Item            | Value                                  |
| --------------- | -------------------------------------- |
| API base path   | `/api/v1`                              |
| Auth            | `Authorization: Bearer <access_token>` |
| Typical dev URL | `http://localhost:8000`                |
| OpenAPI         | `/openapi.json`                        |
| Health          | `GET /health`, `GET /ready`            |

### JWT lifetimes (defaults)

- Access: 30 minutes
- Refresh: 7 days

### User roles (exact strings)

| Role                 | Notes                                                                               |
| -------------------- | ----------------------------------------------------------------------------------- |
| `admin`              | Full access; RBAC matrix; `/auth/register`                                          |
| `service`            | Same as admin for **all** `/api/v1/users/*`; use `POST /users` not `/auth/register` |
| `radiologist`        | Clinical read/write per DB policy                                                   |
| `imaging_technician` | Strong imaging/study/DICOM write per policy                                         |
| `radiographer`       | Narrower read + upload per policy                                                   |

### Permission catalog (dot notation)

`patient.read`, `patient.write`, `patient.delete`, `study.read`, `study.write`, `study.delete`, `instance.read`, `instance.write`, `instance.delete`, `measurement.read`, `measurement.write`, `measurement.delete`, `report.read`, `report.write`, `report.delete`, `audit_log.read`, `audit_log.write`, `dicom.read`, `dicom.write`, `dicom.upload`, `dicom.delete`

### Error envelope

```json
{
  "error": "HTTP_ERROR | VALIDATION_ERROR | INTERNAL_SERVER_ERROR",
  "message": "Human-readable message",
  "details": {},
  "request_id": "uuid-or-null"
}
```

### Password rules

Min 8 characters; at least one uppercase, lowercase, digit, special character.

### Authentication endpoints

| Method | Path                  | Auth               | Description                                 |
| ------ | --------------------- | ------------------ | ------------------------------------------- |
| POST   | `/auth/login`         | No                 | access + refresh + user                     |
| POST   | `/auth/register`      | Admin              | Create user                                 |
| POST   | `/auth/refresh`       | Body refresh_token | New tokens + user                           |
| POST   | `/auth/refresh-token` | Body               | Alias of refresh (may be hidden in OpenAPI) |
| GET    | `/auth/me`            | Bearer             | Current user + permissions                  |
| POST   | `/auth/logout`        | Bearer             | Revoke access jti                           |
| GET    | `/auth/rbac/matrix`   | Admin              | Matrix + catalog                            |

**Login response (TypeScript shape):**

```ts
{
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  user: {
    id: number;
    email: string;
    full_name: string;
    role: string;
    permissions: string[];
  };
}
```

### Profile endpoints

| Method | Path                       | Auth   | Description            |
| ------ | -------------------------- | ------ | ---------------------- |
| GET    | `/profile`                 | Bearer | Get self profile       |
| PUT    | `/profile`                 | Bearer | Update email/full_name |
| POST   | `/profile/change-password` | Bearer | Change own password    |

### Patients endpoints

| Method | Path               | Auth   | Description          |
| ------ | ------------------ | ------ | -------------------- |
| GET    | `/patients`        | Bearer | List + filters       |
| POST   | `/patients`        | Bearer | Create patient       |
| GET    | `/patients/{id}`   | Bearer | Detail + study_count |
| PUT    | `/patients/{id}`   | Bearer | Update info          |
| DELETE | `/patients/{id}`   | Admin  | Soft delete          |
| GET    | `/patients/search` | Bearer | Search query `q`     |

### Studies endpoints

| Method | Path                      | Auth   | Description                |
| ------ | ------------------------- | ------ | -------------------------- |
| GET    | `/studies`                | Bearer | List + filters             |
| POST   | `/studies`                | Bearer | Create (Tech/Radiographer) |
| GET    | `/studies/{id}`           | Bearer | Detail + stats             |
| PUT    | `/studies/{id}`           | Bearer | Update status/info         |
| GET    | `/studies/{id}/series`    | Bearer | List series                |
| GET    | `/studies/{id}/instances` | Bearer | List all instances         |
| GET    | `/studies/{id}/audit`     | Bearer | Study audit trail          |
| DELETE | `/studies/{id}`           | Admin  | Archive study              |

### Instances endpoints

| Method | Path                     | Auth   | Description           |
| ------ | ------------------------ | ------ | --------------------- |
| GET    | `/instances/{id}`        | Bearer | Metadata              |
| GET    | `/instances/{id}/image`  | Bearer | **Rendered image**    |
| GET    | `/instances/{id}/info`   | Bearer | DICOM tags            |
| GET    | `/instances/{id}/dicom`  | Bearer | Download .dcm         |
| POST   | `/instances/{id}/render` | Bearer | Custom render request |

### DICOM Upload endpoints

| Method | Path                        | Auth   | Description           |
| ------ | --------------------------- | ------ | --------------------- |
| POST   | `/dicom/upload`             | Bearer | Multipart ingestion   |
| GET    | `/dicom/upload-status/{id}` | Bearer | Progress (task-based) |
| POST   | `/dicom/validate`           | Bearer | File validation       |

### Audit Log endpoints

| Method | Path               | Auth  | Description    |
| ------ | ------------------ | ----- | -------------- |
| GET    | `/audit-logs`      | Admin | List + filters |
| GET    | `/audit-logs/{id}` | Admin | Detailed event |

### Users endpoints

Privileged = role `admin` OR `service` (same rights on all routes below).

| Method | Path                   | Who                                                     | Notes                        |
| ------ | ---------------------- | ------------------------------------------------------- | ---------------------------- |
| GET    | `/users`               | Privileged                                              | `page`, `page_size`          |
| POST   | `/users`               | Privileged                                              | UserCreate                   |
| GET    | `/users/{id}`          | Privileged or self                                      |                              |
| PUT    | `/users/{id}`          | Privileged (all fields) or self (email, full_name only) |                              |
| DELETE | `/users/{id}`          | Privileged                                              | No self-delete               |
| PUT    | `/users/{id}/role`     | Privileged                                              | `{ role }`                   |
| PUT    | `/users/{id}/password` | See Prompt 5                                            | Complexity on `new_password` |

**UserCreate (JSON):**

```json
{
  "email": "string",
  "full_name": "string",
  "password": "string",
  "role": "radiographer",
  "is_active": true,
  "is_verified": true
}
```

**UserUpdate (JSON)** — all optional:

```json
{
  "email": "string",
  "full_name": "string",
  "is_active": true,
  "is_verified": true,
  "role": "radiologist"
}
```

**UserResponse:** `id`, `email`, `full_name`, `role`, `is_active`, `is_verified`, `created_at`, `updated_at`

**UserListResponse:** `total`, `page`, `page_size`, `items: UserResponse[]`

**ChangePasswordRequest:** `new_password`, `old_password` optional

**ChangeUserRoleRequest:** `{ "role": "imaging_technician" }`

---

## Changelog

| Date       | Notes                                                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-08 | Initial API contract and prompts F1–F7.                                                                                                                                                                                   |
| 2026-04-08 | Restructured to match BACKEND_AI_PROMPTS.md style: Important/Prerequisites/Quick Start, emoji sections, Prompts 1–7 in copy-paste code blocks (Requirements/Endpoints/Features/Implement/NOTE), Appendix A for reference. |

---

_End of file — update Appendix A and Changelog when the backend changes._
