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

### Prompt 5: Profile and Self-Service Password

```
Implement account/profile flows for any authenticated user. Remove mock profile data.

Endpoints:
GET /api/v1/users/{id} — use id from auth user (me/login); allowed for self or admin/service
PUT /api/v1/users/{id} — self may send ONLY email and/or full_name (sending role or is_active as self returns 400)
PUT /api/v1/users/{id}/password — self (non-privileged): { "old_password", "new_password" }; admin/service resetting another user: omit old_password; admin/service changing own password: old_password optional per backend

Requirements:
- Profile form: display full_name, email; optional read-only role for non-admins
- Separate admin user editor (Prompt 4) from this profile page
- Password change: require current password for radiologist/radiographer/etc.; validate new_password complexity before submit
- Clear errors for wrong old password (400)

Features:
- Success toasts or inline confirmation after save
- Refetch user/me after profile update so header/nav stays in sync

NOTE: If the app merges profile and admin into one screen, branch fields by role to avoid 400 responses.
```

---

## 🏥 CLINICAL SCREENS

### Prompt 6: Studies, DICOM, Measurements — Replace Clinical Mocks

```
Connect viewer, study list, upload, and measurement features to the live backend.

**IMPORTANT:** Use OpenAPI (/openapi.json) as the source of truth for exact paths, query parameters, and bodies. This prompt is structural; backend coverage grows over time.

Known route prefixes (require Bearer + permission checks on server):
- /api/v1/studies — e.g. study.read, study.delete (per route)
- /api/v1/dicom — e.g. dicom.upload, dicom.read
- /api/v1/measurements — e.g. measurement.read, measurement.write

Requirements:
- Before calling an endpoint, gate UI with can('permission') from Prompt 3
- Remove hard-coded study/instance/measurement arrays; use loading skeletons and empty states
- Handle 403 with a dedicated “no permission” message

Implement:
1. For each existing screen, map one primary backend call; implement service layer methods
2. Align types with API responses (snake_case in JSON)
3. File upload flows must use multipart if the endpoint specifies multipart (see OpenAPI)

Features:
- Retry or user messaging on network failure
- Dev-only logging of request_id on errors

NOTE: Update this prompt’s detail in Appendix A when new clinical endpoints are finalized on the backend.
```

---

## ⚙️ ADMIN TOOLS

### Prompt 7: RBAC Matrix Viewer (Optional)

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
