# Profile Management - Quick Start (5 minutes)

## What's Included

✅ Complete self-service profile management system
✅ Password changing with validation
✅ Form validation with error handling
✅ Security features (AuthGuard, CSRF)
✅ Responsive UI with loading states
✅ Success/error messaging

## Quick Setup

### Step 1: Verify Files Exist

```
components/
├── profile-form.tsx
├── change-password-form.tsx
├── auth-guard.tsx
└── profile-page.tsx

services/
└── profile-service.ts

app/dashboard/profile/
└── page.tsx

lib/
└── api-error-handler.ts
```

### Step 2: Update Backend (3 endpoints needed)

```bash
# 1. GET /api/profile (fetch current user profile)
# 2. PUT /api/profile (update email/full_name)
# 3. POST /api/profile/change-password (validate old password, set new)
```

**Django example:**

```python
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    user.email = request.data.get('email', user.email)
    user.full_name = request.data.get('full_name', user.full_name)
    user.save()
    return JsonResponse({
        "success": True,
        "data": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            # ... return all user fields
        }
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    old_pwd = request.data.get('old_password')
    new_pwd = request.data.get('new_password')

    if not user.check_password(old_pwd):
        return JsonResponse(
            {"success": False, "error": "Old password incorrect"},
            status=400
        )

    user.set_password(new_pwd)
    user.save()
    return JsonResponse({
        "success": True,
        "message": "Password changed successfully"
    })
```

### Step 3: Test Navigation

1. Click your user avatar (top-right corner)
2. Click "Profile" in dropdown
3. You're on `/dashboard/profile`

### Step 4: Test Form Submission

1. Update email or full name
2. Click "Save Changes"
3. See success message
4. Refresh page - changes persist

## Key Concepts

### ProfileService

Handles all API communication:

```typescript
import { profileService } from "@/services/profile-service";

await profileService.updateProfile({ email: "new@example.com" });
await profileService.changePassword("old", "new");
```

### AuthGuard

Protects routes - automatically redirects to login if not authenticated:

```typescript
<AuthGuard requiredRole="admin">
  <Content />
</AuthGuard>
```

### useAuth Hook

Provides user data and refresh method:

```typescript
const { user, refresh, isLoading } = useAuth();
await refresh(); // Reload user from backend
```

## Common Tasks

### Add a New Profile Field

1. Edit `components/profile-form.tsx`:

```typescript
// In schema
const profileSchema = z.object({
  email: z.string().email(),
  full_name: z.string(),
  phone: z.string().optional(), // Add here
});

// In JSX
<input name="phone" placeholder="Phone number" />
```

2. Update backend API to accept phone field

### Customize Password Requirements

Edit `components/change-password-form.tsx`:

```typescript
const passwordSchema = z
  .object({
    oldPassword: z.string(),
    newPassword: z
      .string()
      .min(12, "Minimum 12 characters") // Change this
      .regex(/[A-Z]/, "Uppercase required")
      .regex(/[0-9]/, "Number required"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword);
```

### Show Profile Link in Sidebar

Edit `components/layout/sidebar.tsx`:

```typescript
const navItems: NavItem[] = [
  // ... existing items
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: User, // Import User from lucide-react
  },
];
```

## API Contract

### PUT /api/profile

**Request:**

```json
{
  "email": "new@example.com",
  "full_name": "John Doe"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "new@example.com",
    "full_name": "John Doe",
    "username": "johndoe",
    "role": "imaging-technician",
    "is_active": true,
    "is_verified": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error (400):**

```json
{
  "success": false,
  "error": "Invalid email format"
}
```

### POST /api/profile/change-password

**Request:**

```json
{
  "old_password": "currentpass123",
  "new_password": "newpass456!@#"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error (400):**

```json
{
  "success": false,
  "error": "Old password incorrect"
}
```

## Debugging

### Profile not updating?

- Check Network tab in DevTools
- Verify backend endpoint returns correct format
- Check that user object is received in response

### Form validation not showing?

- Check Zod schema in component
- Verify all required fields match backend

### Navigation broken?

- Verify `/dashboard/profile` route exists
- Check AuthGuard isn't blocking access
- Check auth context is initialized

## File Reference

| File                                  | Purpose             |
| ------------------------------------- | ------------------- |
| `services/profile-service.ts`         | API calls           |
| `components/profile-form.tsx`         | Update profile form |
| `components/change-password-form.tsx` | Password form       |
| `components/profile-page.tsx`         | Main page           |
| `components/auth-guard.tsx`           | Route protection    |
| `components/layout/top-bar.tsx`       | Navigation menu     |
| `lib/api-error-handler.ts`            | Error handling      |
| `app/dashboard/profile/page.tsx`      | Route page          |

## Next Steps

1. ✅ All files created
2. **TODO**: Implement backend endpoints
3. **TODO**: Test with your backend
4. **TODO**: Customize styling if needed
5. **TODO**: Add additional fields if needed

## Full Documentation

See [PROFILE_INTEGRATION_GUIDE.md](PROFILE_INTEGRATION_GUIDE.md) for:

- Complete API reference
- Advanced customization
- Testing guide
- Security details
- Troubleshooting
