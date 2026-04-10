# Prompt 7: RBAC Matrix Viewer - Quick Reference

## ⚡ 5-Minute Setup

### What Was Implemented

✅ Read-only admin page displaying role → permission matrix from database  
✅ Live search and filtering across roles and permissions  
✅ Two view modes: Cards and Table  
✅ Statistics and permission catalog  
✅ Admin-only access control

### File Checklist

```
✅ types/rbac-api.ts                        # Type definitions
✅ services/rbac-service.ts                 # API service + utilities
✅ hooks/use-rbac-matrix.ts                 # React hook with state
✅ components/rbac-matrix-viewer.tsx        # Main component
✅ app/dashboard/settings/rbac/page.tsx     # Route page
✅ components/layout/sidebar.tsx            # Updated navigation
```

## 🎯 Quick Start

### For Users

1. Navigate to **Settings → RBAC Matrix** (admin only)
2. Or visit `/dashboard/settings/rbac`
3. View all roles and their permissions
4. Use search bar to find roles/permissions
5. Toggle between Cards and Table views

### For Developers

**Import and use the hook:**

```typescript
import { useRbacMatrix, useRbacStats } from "@/hooks/use-rbac-matrix";

function MyComponent() {
  const { matrix, loading, error, isAdmin, search, getFilteredRoles } = useRbacMatrix();
  const stats = useRbacStats(matrix);

  if (!isAdmin) return <PermissionDenied />;
  if (loading) return <Skeleton />;
  if (error) return <ErrorAlert />;

  return (
    <div>
      <h2>{stats.totalRoles} roles</h2>
      {getFilteredRoles().map((role) => (
        <div key={role.role}>{role.role}</div>
      ))}
    </div>
  );
}
```

## 📚 API Reference

### Endpoint

`GET /api/v1/auth/rbac/matrix` (Admin only)

### Response Format

```typescript
{
  roles: [
    {
      role: "admin",
      permissions: ["user.read", "user.write", ...],
      description: "Full access",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z"
    },
    ...
  ],
  permission_catalog: ["user.read", "user.write", ...]
}
```

## 🔧 Service Functions

| Function                         | Returns                    | Purpose                            |
| -------------------------------- | -------------------------- | ---------------------------------- |
| `getMatrix()`                    | `RbacMatrixResponse`       | Fetch matrix from backend          |
| `createPermissionMap(roles)`     | `Record<string, string[]>` | Create permission→roles index      |
| `getRbacStats(matrix)`           | `StatsObject`              | Get role/permission statistics     |
| `filterRoles(roles, query)`      | `RbacRole[]`               | Filter roles by search             |
| `getPermissionDescription(perm)` | `string`                   | Get human-readable permission name |
| `getRoleColor(role)`             | `string`                   | Get badge color class for role     |

## 🪝 Hook Reference

### `useRbacMatrix(skip?)`

**State:**

```typescript
matrix: RbacMatrixResponse | null;
loading: boolean;
error: ApiError | null;
isAdmin: boolean;
filters: RbacFilterState;
```

**Actions:**

```typescript
retry(): void                              // Refetch matrix
reset(): void                              // Full reset
search(query: string): void                // Update search query
setSelectedRole(role?: string): void       // Filter by role
setSelectedPermission(permission?: string) // Filter by permission
clearFilters(): void                       // Clear all filters
```

**Computed:**

```typescript
getFilteredRoles(): RbacRole[]             // Get filtered roles
getFilteredPermissions(): string[]         // Get filtered permissions
```

## 💅 Component Props & Usage

### `RbacMatrixViewer`

Self-contained, read-only component. No props needed.

```typescript
import { RbacMatrixViewer } from "@/components/rbac-matrix-viewer";

<RbacMatrixViewer />
```

**Features:**

- Admin guard (shows "Permission Denied" if not admin)
- Loading skeleton
- Error with retry
- Search bar with filter chips
- Cards and Table view modes
- Statistics display
- Empty state messaging

## 🎨 View Modes

### Cards View (Default)

- 2-column responsive grid
- Shows: role name, description, permissions, dates
- Clickable permission badges to filter

### Table View

- Detailed tabular layout
- Roles table with all fields
- Permissions catalog below
- Better for large datasets (100+ roles)

## 🔐 Permissions & Access Control

| Component        | Who Can Access | Behavior                                |
| ---------------- | -------------- | --------------------------------------- |
| Route page       | Everyone       | Page exists but component guards        |
| RbacMatrixViewer | Admin only     | Shows "Permission Denied" for non-admin |
| Navigation link  | Admin only     | Shows only for admin users              |
| API endpoint     | Admin only     | Returns 403 if user not admin           |

**Auth Flow:**

1. User visits `/dashboard/settings/rbac`
2. `RbacMatrixViewer` checks `useAuth().user.role === "admin"`
3. If not admin → Show permission denied message
4. If admin → Fetch matrix and display

## 🔍 Search & Filtering

**Search** (real-time):

- Searches across: role names, descriptions, permission names
- Triggered by typing in search bar
- Results update instantly

**Filter by Role:**

- Click role name or use role selector
- Shows all permissions for that role
- Can combine with search

**Filter by Permission:**

- Click permission badge or use selector
- Shows all roles with that permission
- Can combine with search

**Clear Filters:**

- Click "Clear All" button
- Or click X on individual filter chips
- Resets search query, selected role, selected permission

## 📊 Statistics

Display shows:

- **Total Roles**: Count of all roles
- **Total Permissions**: Count of unique permissions
- **Most Powerful**: Role with most permissions
- **Most Restricted**: Role with least permissions

## ❌ Error Handling

| Error              | Display                      | Solution                       |
| ------------------ | ---------------------------- | ------------------------------ |
| 403 Forbidden      | "Admin access required"      | User must be admin             |
| Network Error      | "Failed to load RBAC matrix" | Check internet, click Retry    |
| Server Error (5xx) | "Server error occurred"      | Contact backend team           |
| No Data            | "No roles found"             | Backend may not be initialized |

## 🧪 Testing Checklist

```
[ ] Admin user can access page
[ ] Non-admin user sees permission denied
[ ] Page loads matrix data correctly
[ ] Search works across roles/permissions/descriptions
[ ] Role filter works
[ ] Permission filter works
[ ] Clear filters button works
[ ] Cards view displays correctly
[ ] Table view displays correctly
[ ] View toggle works (cards ↔ table)
[ ] Statistics show correct counts
[ ] Timestamps display correctly
[ ] Retry button works on error
[ ] Mobile layout is responsive
[ ] Keyboard navigation works
[ ] Required backend endpoint exists and returns correct format
```

## 🚀 Integration Checklist

```
[x] Types created
[x] Service layer created
[x] Hook created
[x] Component created
[x] Route page created
[x] Navigation updated
[ ] Backend endpoint verified
[ ] Tested with admin user
[ ] Tested with non-admin user
[ ] User trained
```

## ⚙️ Configuration

### Environment Variables

None required. Uses the existing:

- `NEXT_PUBLIC_API_URL` from .env.local
- Auth token from localStorage

### Backend Endpoint

Endpoint must exist and return the specified format:

```
GET /api/v1/auth/rbac/matrix
```

## 📦 Dependencies Used

All dependencies already in project:

- `next` - Framework
- `react` - UI library
- `@/components/ui/*` - shadcn/ui components
- `lucide-react` - Icons
- `@/context/auth-context` - Auth state
- `@/lib/api-client` - HTTP client

## 🎓 Common Patterns

### Getting admin check

```typescript
const { isAdmin } = useRbacMatrix();
if (!isAdmin) return <PermissionDenied />;
```

### Filtering by permission

```typescript
const { matrix, search } = useRbacMatrix();
const handleClick = (perm: string) => search(perm);
```

### Showing statistics

```typescript
const stats = useRbacStats(matrix);
<div>{stats.totalRoles} roles assigned</div>
```

## 🐛 Troubleshooting

| Issue               | Fix                                                  |
| ------------------- | ---------------------------------------------------- |
| "Permission Denied" | User must be admin role                              |
| No results          | Backend may be uninitialized or permission not found |
| Slow search         | Check browser DevTools - may be rendering too many   |
| Wrong timestamps    | Ensure backend sends ISO 8601 format                 |

## 📞 Support

- **Issue**: Refer to PROMPT7_IMPLEMENTATION_GUIDE.md for detailed docs
- **Feature Request**: Update RbacMatrixViewer component
- **Bug**: Check error in console + API response

## 📝 Next Steps

1. ✅ Verify backend endpoint and response format
2. ✅ Test with admin and non-admin users
3. ✅ Monitor performance with actual role/permission volume
4. ✅ Collect user feedback
5. ✅ Consider caching if RBAC matrix is static
6. ✅ Add audit logging of RBAC matrix accesses
