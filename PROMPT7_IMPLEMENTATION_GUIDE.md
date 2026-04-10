# Prompt 7: RBAC Matrix Viewer - Implementation Guide

## Overview

This document provides comprehensive details for implementing the read-only RBAC (Role-Based Access Control) Matrix Viewer - an admin-only page that displays the role → permission matrix from the backend database.

**Status**: ✅ Implementation Complete

## Requirements

### Functional Requirements

1. **API Contract**
   - Single endpoint: `GET /api/v1/auth/rbac/matrix`
   - Response: `{ roles: [{role, permissions[], description?, created_at, updated_at}], permission_catalog: [] }`
   - Auth: Bearer token (admin-only enforcement at backend)

2. **Read-Only Display**
   - Display all roles with their assigned permissions
   - Show permission catalog
   - No create/update/delete operations
   - Display metadata: created_at, updated_at, description

3. **Access Control**
   - Only visible to users with admin role
   - Route accessible at `/dashboard/settings/rbac`
   - Navigation link shows only for admin users
   - Non-admin users see "Permission Denied" message

4. **Filtering & Search**
   - Search across: role names, descriptions, permission names
   - Filter by role
   - Filter by permission
   - Display filtered results with match count
   - Clear filters option

5. **Display Modes**
   - Cards view: 2-column grid with role cards
   - Table view: Tabular display with all details
   - Toggle between modes
   - View all permissions in catalog

6. **Error Handling**
   - Display 403 Forbidden errors with explanation
   - Show network errors with retry button
   - Never expose detailed error messages to users
   - Loading states during fetch

## Architecture

### File Structure

```
components/
  └── rbac-matrix-viewer.tsx         # Main component
app/
  └── dashboard/
      └── settings/
          └── rbac/
              └── page.tsx            # Route page
types/
  └── rbac-api.ts                    # Type definitions
services/
  └── rbac-service.ts                # API calls & utilities
hooks/
  └── use-rbac-matrix.ts             # React hook with state
lib/
  └── sidebar.tsx                    # Updated with RBAC link
```

### Component Hierarchy

```
RbacPage (app/dashboard/settings/rbac/page.tsx)
  └── RbacMatrixViewer (components/rbac-matrix-viewer.tsx)
        ├── useRbacMatrix() hook
        ├── useRbacStats() hook
        └── rbacService utilities
```

## Implementation Details

### 1. Type Definitions (`types/rbac-api.ts`)

```typescript
interface RbacRole {
  role: string;
  permissions: string[];
  description?: string;
  created_at: string;
  updated_at: string;
}

interface RbacMatrixResponse {
  roles: RbacRole[];
  permission_catalog: string[];
}

interface PermissionEntry {
  name: string;
  roles: string[];
}

interface RbacFilterState {
  searchQuery: string;
  selectedRole?: string;
  selectedPermission?: string;
}
```

**Key Patterns**:

- Use snake_case for backend fields (converted automatically)
- Include ISO timestamps for audit trail
- Optional description field for role documentation
- Permission catalog for reference

### 2. Service Layer (`services/rbac-service.ts`)

**Main Functions**:

```typescript
// Fetch the RBAC matrix from backend
async function getMatrix(): Promise<RbacMatrixResponse>;

// Transform roles array into permission → roles map (inverted index)
function createPermissionMap(roles: RbacRole[]): Record<string, string[]>;

// Get statistics about the matrix
function getRbacStats(matrix: RbacMatrixResponse): {
  totalRoles: number;
  totalPermissions: number;
  rolesWithMostPermissions: string;
  rolesWithLeastPermissions: string;
};

// Filter roles by search query
function filterRoles(roles: RbacRole[], query: string): RbacRole[];

// Filter permissions by search query
function filterPermissions(permissions: string[], query: string): string[];

// Get human-readable description for a permission
function getPermissionDescription(permission: string): string;

// Get badge color class for a role
function getRoleColor(role: string): string;
```

**Usage Example**:

```typescript
import { rbacService } from "@/services/rbac-service";

// Fetch matrix
const matrix = await rbacService.getMatrix();

// Create permission map for quick lookup
const permMap = rbacService.createPermissionMap(matrix.roles);
console.log(permMap["study.read"]); // ["admin", "radiologist"]

// Get statistics
const stats = rbacService.getRbacStats(matrix);
console.log(stats.totalRoles); // 5

// Get descriptions
const desc = rbacService.getPermissionDescription("study.read");
console.log(desc); // "Read Studies"

// Get role color
const color = rbacService.getRoleColor("admin");
console.log(color); // "bg-red-100 text-red-800"
```

### 3. React Hook (`hooks/use-rbac-matrix.ts`)

**Main Hook**:

```typescript
function useRbacMatrix(skip?: boolean) {
  // State
  const matrix: RbacMatrixResponse | null;
  const loading: boolean;
  const error: ApiError | null;
  const isAdmin: boolean;

  // Filter state
  const filters: RbacFilterState;

  // Actions
  function retry(): void;
  function reset(): void;
  function search(query: string): void;
  function setSelectedRole(role?: string): void;
  function setSelectedPermission(permission?: string): void;
  function clearFilters(): void;

  // Computed
  function getFilteredRoles(): RbacRole[];
  function getFilteredPermissions(): string[];
}
```

**Additional Hook**:

```typescript
function useRbacStats(matrix?: RbacMatrixResponse) {
  return {
    totalRoles: number;
    totalPermissions: number;
    rolesWithMostPermissions: string;
    rolesWithLeastPermissions: string;
  };
}
```

**Usage Example**:

```typescript
function MyComponent() {
  const {
    matrix,
    loading,
    error,
    isAdmin,
    filters,
    search,
    setSelectedRole,
    getFilteredRoles,
  } = useRbacMatrix();

  // Check admin
  if (!isAdmin) return <PermissionDenied />;

  // Check loading/error
  if (loading) return <Skeleton />;
  if (error) return <ErrorAlert error={error} />;

  // Use filtered data
  const roles = getFilteredRoles();

  return (
    <div>
      <input
        onChange={(e) => search(e.target.value)}
        value={filters.searchQuery}
      />
      {roles.map((role) => (
        <div key={role.role}>{role.role}</div>
      ))}
    </div>
  );
}
```

### 4. Main Component (`components/rbac-matrix-viewer.tsx`)

**Features**:

- **Admin Guard**: Checks `useAuth().user.role === "admin"`
- **Loading State**: Shows skeleton while fetching
- **Error State**: Shows alert with retry button
- **Empty State**: Shows message if no roles found
- **Statistics**: Displays total roles, permissions, most/least powerful roles
- **Search Bar**: Real-time search across roles, descriptions, permissions
- **Filter Chips**: Visual indicators of active filters with clear buttons
- **View Modes**: Cards (2-column grid) and Table (full details)
- **Cards View**:
  - Role name with permission count badge
  - Description (if available)
  - Created/updated dates
  - Permission badges (clickable to filter)
- **Table View**:
  - Roles table with all details
  - Permissions catalog with reference
  - Permission badges (up to 3 shown + "+N more" indicator)

**Key Props**: None (self-contained, uses hooks)

**Return Values**: JSX component

### 5. Route Page (`app/dashboard/settings/rbac/page.tsx`)

```typescript
export default function RbacPage() {
  return (
    <div className="min-h-screen bg-background">
      <RbacMatrixViewer />
    </div>
  );
}
```

**Features**:

- Wraps `RbacMatrixViewer` component
- Sets page metadata (title, description)
- Provides background styling
- Component handles all access control

### 6. Navigation Update (`components/layout/sidebar.tsx`)

Added new navigation item:

```typescript
{
  href: '/dashboard/settings/rbac',
  label: 'RBAC Matrix',
  icon: Shield,
  roles: ['admin'], // Only admin can view
}
```

**Features**:

- Links to RBAC page
- Shows only for admin users
- Uses Shield icon for visual clarity
- Positioned after Settings in sidebar

## Error Handling

### Backend 403 Forbidden

When non-admin user tries to access:

```typescript
// useRbacMatrix hook detects non-admin:
if (!isAdmin) {
  return <PermissionDenied />; // Shows in component
}

// Or if backend returns 403:
if (error?.statusCode === 403) {
  return <Alert>Admin access required</Alert>;
}
```

### Network Errors

```typescript
if (error?.isNetworkError) {
  return (
    <div>
      <Alert>Failed to fetch RBAC matrix</Alert>
      <Button onClick={retry}>Retry</Button>
    </div>
  );
}
```

### Server Errors (5xx)

```typescript
if (error?.statusCode >= 500) {
  return <Alert>Server error occurred</Alert>;
}
```

## Permissions

This feature uses the following permissions:

- **No explicit permissions needed** - The feature itself is admin-only
- Backend enforces admin role check on `/api/v1/auth/rbac/matrix` endpoint
- Frontend checks `user.role === "admin"` before rendering

## Performance Considerations

1. **Data Loading**
   - Fetch happens on component mount (via hook)
   - No refetching unless user clicks retry or page refreshes
   - Consider caching if matrix changes infrequently

2. **Filtering**
   - Filter operations happen in-memory (no API calls)
   - Search uses simple string matching (fast for typical datasets)
   - For 1000+ roles, consider:
     - Debounced search
     - Pagination
     - Backend-side search

3. **Rendering**
   - Cards view: 2-column grid (responsive)
   - Table view: Scrollable with sticky headers
   - Both scale well up to 100+ roles

## Testing Checklist

- [ ] Admin user can access `/dashboard/settings/rbac`
- [ ] Non-admin user sees permission denied message
- [ ] Initial load shows loading skeleton
- [ ] Matrix data displays correctly
- [ ] Search filters across roles, descriptions, permissions
- [ ] Role filter updates results
- [ ] Permission filter updates results
- [ ] Clear filters button resets all filters
- [ ] View mode toggle between cards/table works
- [ ] Cards view shows role + permissions
- [ ] Table view shows detailed roleswith permissions
- [ ] Permission catalog displays all permissions
- [ ] Click on permission filters by that permission
- [ ] Statistics show correct counts
- [ ] Retry button works on error
- [ ] Timestamp display is correct
- [ ] Role colors are distinct and readable
- [ ] Mobile responsive (cards stack, table scrolls)
- [ ] Accessibility: keyboards, screen readers work

## Integration Checklist

- [x] Type definitions created and imported
- [x] Service layer created with utilities
- [x] React hook created with state management
- [x] Main component created with all features
- [x] Route page created at `/dashboard/settings/rbac`
- [x] Navigation link added to sidebar (admin-only)
- [ ] Backend endpoint tested and verified
- [ ] Documentation created (this file)
- [ ] Example/reference code provided
- [ ] User trained on usage and filters

## Common Use Cases

### Display all roles and their permissions

```typescript
function AllRolesView() {
  const { matrix, isAdmin } = useRbacMatrix();

  if (!isAdmin) return null;
  if (!matrix) return <Skeleton />;

  return (
    <div>
      {matrix.roles.map((role) => (
        <Card key={role.role}>
          <h3>{role.role}</h3>
          <ul>
            {role.permissions.map((perm) => (
              <li key={perm}>{perm}</li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
```

### Search for specific permission

```typescript
function FindPermissionView() {
  const { getFilteredRoles, search } = useRbacMatrix();

  return (
    <div>
      <input
        placeholder="Find permission..."
        onChange={(e) => search(e.target.value)}
      />
      {getFilteredRoles().map((role) => (
        <div key={role.role}>{role.role}</div>
      ))}
    </div>
  );
}
```

### Get statistics

```typescript
function StatsView() {
  const { matrix } = useRbacMatrix();
  const stats = useRbacStats(matrix);

  return (
    <div>
      <p>Total Roles: {stats.totalRoles}</p>
      <p>Total Permissions: {stats.totalPermissions}</p>
      <p>Most Powerful: {stats.rolesWithMostPermissions}</p>
    </div>
  );
}
```

## API Endpoint Reference

### Request

```http
GET /api/v1/auth/rbac/matrix
Authorization: Bearer <token>
```

### Response (200 OK)

```json
{
  "roles": [
    {
      "role": "admin",
      "permissions": [
        "user.read",
        "user.write",
        "user.delete",
        "study.read",
        "study.write",
        "study.delete"
      ],
      "description": "Full system access",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    },
    {
      "role": "radiologist",
      "permissions": ["study.read", "measurement.write", "report.write"],
      "description": "Can view studies and create reports",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "permission_catalog": [
    "user.read",
    "user.write",
    "user.delete",
    "study.read",
    "study.write",
    "study.delete",
    "measurement.read",
    "measurement.write",
    "measurement.delete",
    "report.read",
    "report.write",
    "report.delete"
  ]
}
```

### Error Response (403 Forbidden)

```json
{
  "code": "FORBIDDEN",
  "message": "Admin access required",
  "details": {
    "resource": "rbac-matrix",
    "required_role": "admin"
  }
}
```

## Troubleshooting

### RBAC page shows "Permission Denied"

**Cause**: User is not an admin
**Solution**:

- Verify user role in database: `SELECT role FROM users WHERE id = ?`
- Update user role to admin in database
- Clear browser cache and re-login

### Search not finding any results

**Cause**: Search query doesn't match any roles, descriptions, or permissions
**Solution**:

- Clear filters and try again
- Verify the permission/role name is spelled correctly
- Use partial match (e.g., "study" instead of "study.read.all")

### View only shows "No roles found"

**Cause**:

- Backend didn't return any roles
- All roles were filtered out
  **Solution**:
- Click "Clear All" to remove all filters
- Contact backend team to verify RBAC data is initialized

### Timestamp shows wrong date

**Cause**: Backend returns timestamp in different timezone
**Solution**:

- Timestamp is converted to user's local timezone by browser
- Verify backend sends ISO 8601 format (e.g., "2024-01-01T00:00:00Z")

### Performance is slow with many roles

**Cause**: Large number of roles (1000+) filtering in memory
**Solution**:

- Consider adding pagination (10 roles per page)
- Add debounce to search (300ms delay)
- Implement server-side search if possible
- Add caching if matrix data is static

## Production Deployment

1. **Ensure Backend RBAC Matrix Endpoint**
   - Endpoint: `GET /api/v1/auth/rbac/matrix`
   - Enforce admin-only via JWT token validation
   - Return proper error codes (403 for non-admin)

2. **Database Considerations**
   - Ensure `roles` table exists with: id, role, permissions (JSON), description, created_at, updated_at
   - Ensure sample data is seeded

3. **Security**
   - RBAC route is frontend protected (component checks role)
   - Backend should enforce admin-only (409 fallback)
   - No sensitive data is exposed in matrix response

4. **Monitoring**
   - Log RBAC matrix access attempts
   - Alert on 403 errors (permission denied)
   - Monitor endpoint performance (should be <100ms)

## Next Steps

1. Verify backend endpoint returns correct response format
2. Test with admin and non-admin users
3. Adjust filtering/search as needed
4. Monitor performance with actual data volume
5. Collect user feedback on UI/UX
6. Consider for future: audit log of RBAC matrix accesses
