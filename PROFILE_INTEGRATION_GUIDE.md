# Profile Management System - Integration Guide

## Overview

The Profile Management System provides a complete, production-ready solution for user self-service profile and password management. It includes profile editing, password changing, API service layer, validation, error handling, and a responsive UI.

## Features

✅ **Profile Management**

- Update email and full name
- Real-time validation
- Success/error feedback
- Auto-sync of auth context

✅ **Password Management**

- Secure password changing
- Old password verification
- Password strength validation
- Confirmation password matching

✅ **Security**

- Protected routes (AuthGuard)
- CSRF token handling
- Secure API integration
- Proper error handling

✅ **UX**

- Responsive design
- Loading states
- Success messages
- Tab-based form organization
- Account summary display

## Architecture

### File Structure

```
services/
  └── profile-service.ts          # API layer for profile operations

components/
  ├── profile-form.tsx             # Profile editing form
  ├── change-password-form.tsx      # Password change form
  ├── auth-guard.tsx               # Route protection component
  └── profile-page.tsx             # Main profile container

app/dashboard/profile/
  └── page.tsx                      # Profile route page

lib/
  └── api-error-handler.ts          # Error handling utilities
```

### Data Flow

```
                    ┌─────────────────────┐
                    │  Top-Bar User Menu  │
                    │  (Navigation Entry) │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  /dashboard/profile │
                    │   (Route Page)      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  ProfilePage        │
                    │  (Main Container)   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
      ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
      │ ProfileForm  │  │ChangePassword│  │ AccountSummary│
      │              │  │Form          │  │Display        │
      └──────────┬───┘  └──────────┬───┘  └──────────────┘
                 │                 │
                 └────────┬────────┘
                          │
                          ▼
              ┌──────────────────────┐
              │ ProfileService       │
              │ (API Integration)    │
              └──────────┬───────────┘
                         │
                         ▼
             ┌───────────────────────┐
             │ Backend API            │
             │ /api/profile/*         │
             └───────────────────────┘
```

## Service Layer (ProfileService)

### Methods

#### `updateProfile(data)`

Updates user profile information.

```typescript
interface UpdateProfileData {
  email?: string;
  full_name?: string;
}

const result = await profileService.updateProfile({
  email: "new@example.com",
  full_name: "John Doe",
});
```

**Response:**

```typescript
{
  success: true,
  message: "Profile updated successfully",
  data: {
    id: string;
    email: string;
    full_name: string;
    // ... other user fields
  }
}
```

**Errors:**

- `400`: Invalid email format / Missing required fields
- `401`: Unauthorized (not authenticated)
- `409`: Email already exists
- `500`: Server error

#### `changePassword(oldPassword, newPassword)`

Changes user password.

```typescript
const result = await profileService.changePassword(
  "currentPassword123",
  "newPassword456",
);
```

**Response:**

```typescript
{
  success: true,
  message: "Password changed successfully"
}
```

**Errors:**

- `400`: Passwords don't meet requirements / Old password incorrect
- `401`: Unauthorized
- `500`: Server error

### API Endpoints Required

Your backend needs to implement:

```
PUT /api/profile
  Headers: Authorization: Bearer <token>, X-CSRF-Token: <token>
  Body: {
    email?: string,
    full_name?: string
  }
  Returns: { success: bool, data: User }

POST /api/profile/change-password
  Headers: Authorization: Bearer <token>, X-CSRF-Token: <token>
  Body: {
    old_password: string,
    new_password: string
  }
  Returns: { success: bool, message: string }
```

## Component API

### ProfileForm

```typescript
import { ProfileForm } from "@/components/profile-form";

<ProfileForm
  user={{
    email: "user@example.com",
    full_name: "John Doe"
  }}
  onSubmit={async (data) => {
    // Handle profile update
  }}
  isLoading={false}
/>
```

**Props:**

- `user`: Current user object with email and full_name
- `onSubmit`: Callback when form is submitted (data: {email?, full_name?})
- `isLoading`: Show loading state when updating

### ChangePasswordForm

```typescript
import { ChangePasswordForm } from "@/components/change-password-form";

<ChangePasswordForm
  onSubmit={async (oldPassword, newPassword) => {
    // Handle password change
  }}
  isLoading={false}
/>
```

**Props:**

- `onSubmit`: Callback when form is submitted (oldPassword, newPassword)
- `isLoading`: Show loading state when changing password

### AuthGuard

```typescript
import { AuthGuard } from "@/components/auth-guard";

<AuthGuard requiredRole="admin">
  <ProtectedContent />
</AuthGuard>
```

**Props:**

- `children`: Content to protect
- `requiredRole`: (Optional) Required role to access content
- `redirectTo`: (Optional) Redirect path if not authenticated (default: "/login")

## Integration Steps

### 1. Install Dependencies

The project already includes all necessary dependencies:

- `react` - UI framework
- `next` - Full-stack framework
- `zod` - Form validation
- `react-hook-form` - Form management
- `lucide-react` - Icons

### 2. Create Backend Endpoints

Implement these endpoints in your backend:

```python
# Django Example
from django.views import View
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update user profile"""
    user = request.user

    # Validate and update
    if 'email' in request.data:
        user.email = request.data['email']
    if 'full_name' in request.data:
        user.full_name = request.data['full_name']

    user.save()

    return Response({
        "success": True,
        "data": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            # ... other fields
        }
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change user password"""
    user = request.user

    # Verify old password
    if not user.check_password(request.data['old_password']):
        return Response(
            {"success": False, "error": "Old password incorrect"},
            status=400
        )

    # Set new password
    user.set_password(request.data['new_password'])
    user.save()

    return Response({
        "success": True,
        "message": "Password changed successfully"
    })
```

### 3. Configure API Base URL

Update `lib/api-error-handler.ts` if needed with your backend URL:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
```

### 4. Update Auth Context (if needed)

The auth context should provide:

- `user`: Current logged-in user object
- `refresh()`: Method to refresh user data from backend
- `isLoading`: Loading state

```typescript
// In useAuth hook
const { user, refresh, isLoading } = useAuth();
```

### 5. Connect Navigation

Navigation is pre-configured in:

- **Top Bar Dropdown** (User avatar menu) - Primary entry point
- **Sidebar** (Optional) - Can add if desired

User clicks their avatar → Dropdown menu → "Profile" → `/dashboard/profile`

## Form Validation

### ProfileForm Validation

```typescript
const profileSchema = z.object({
  email: z.string().email("Invalid email address"),
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
});
```

### ChangePasswordForm Validation

```typescript
const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
```

## Usage Examples

### Example 1: Basic Integration

```typescript
// app/dashboard/profile/page.tsx
import { ProfilePage } from "@/components/profile-page";

export default function ProfilePageRoute() {
  return (
    <div className="max-w-2xl mx-auto">
      <ProfilePage />
    </div>
  );
}
```

### Example 2: Custom Profile Form

```typescript
import { ProfileForm } from "@/components/profile-form";
import { profileService } from "@/services/profile-service";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";

export function CustomProfile() {
  const { user, refresh } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (data) => {
    try {
      setLoading(true);
      await profileService.updateProfile(data);
      await refresh();
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProfileForm
      user={user}
      onSubmit={handleUpdate}
      isLoading={loading}
    />
  );
}
```

### Example 3: Protected Route

```typescript
import { AuthGuard } from "@/components/auth-guard";

export function AdminOnlyProfile() {
  return (
    <AuthGuard requiredRole="admin">
      <div>This content is only visible to admins</div>
    </AuthGuard>
  );
}
```

## Customization

### Modify Form Fields

To add additional fields to the profile form:

1. Update the validation schema in `components/profile-form.tsx`
2. Add the field to the form JSX
3. Update the submission handler to include the new field
4. Update the backend API to accept the new field

```typescript
// In profile-form.tsx
const profileSchema = z.object({
  email: z.string().email(),
  full_name: z.string(),
  phone: z.string().optional(), // Add new field
  // ... other fields
});
```

### Change Password Requirements

Modify the password validation in `components/change-password-form.tsx`:

```typescript
const passwordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(12, "Minimum 12 characters") // Change minimum
    .regex(/[^A-Za-z0-9]/, "Must contain special character"),
  confirmPassword: z.string(),
});
```

### Custom Styling

The components use Tailwind CSS and shadcn/ui. Customize with:

```typescript
// Modify className props in components
<div className="max-w-2xl mx-auto">
  {/* Custom styling */}
</div>
```

### Reorder Form Sections

In `profile-page.tsx`, change the tab order:

```typescript
<Tabs defaultValue="password">  {/* Start on password tab */}
  <TabsList>
    <TabsTrigger value="password">Password</TabsTrigger>
    <TabsTrigger value="profile">Profile</TabsTrigger>
  </TabsList>
</Tabs>
```

## Error Handling

The system includes comprehensive error handling:

### Error Types

```typescript
// In handleApiError
- ValidationError: Form validation failures
- AuthenticationError: User not authenticated
- AuthorizationError: User lacks permission
- NetworkError: Backend unreachable
- ServerError: Backend returned 500
```

### Error Recovery

```typescript
const handleProfileSubmit = async (data) => {
  try {
    await profileService.updateProfile(data);
    // Success
  } catch (error) {
    // Error is automatically handled by form,
    // showing user-friendly message
    if (error instanceof ValidationError) {
      // Handle validation error
    } else if (error instanceof NetworkError) {
      // Handle network error
    }
  }
};
```

## Security Considerations

✅ **CSRF Protection**

- X-CSRF-Token header automatically included
- Backend must validate CSRF tokens

✅ **Authentication**

- AuthGuard protects routes
- Bearer token in Authorization header
- Automatic logout on 401 response

✅ **Password Security**

- Passwords never sent twice (only POST, not GET)
- Old password verification required
- Password strength validation

✅ **Validation**

- Server-side validation required (never trust client)
- Email format validated
- Password requirements enforced

## Troubleshooting

### Profile updates not persisting

1. Verify backend endpoint returns correct format
2. Check that `refresh()` is called after update
3. Verify auth context is updated with new data

### Password change fails with "Old password incorrect"

1. Verify old password is being sent correctly
2. Check backend password hashing/verification logic
3. Ensure user is authenticated (check token)

### Navigation not working

1. Verify routes exist: `/dashboard/profile` and `/dashboard`
2. Check AuthGuard is allowing navigation
3. Verify auth context is properly initialized

### Form validation not working

1. Check Zod schema definitions
2. Verify react-hook-form is properly integrated
3. Check that form JSX has required attributes

## Performance Considerations

- Forms are client-side rendered
- API calls are minimal (only on form submission)
- Password change doesn't require page reload
- Auth context refresh is efficient
- Component overhead is minimal

## Testing

### Unit Testing

```typescript
// Example with vitest
import { describe, it, expect, vi } from "vitest";
import { profileService } from "@/services/profile-service";

describe("profileService", () => {
  it("should update profile", async () => {
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { email: "test@example.com" },
          }),
      }),
    );

    global.fetch = mockFetch;

    const result = await profileService.updateProfile({
      email: "test@example.com",
    });

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalled();
  });
});
```

### E2E Testing

```typescript
// Example with Playwright
import { test, expect } from "@playwright/test";

test("update profile", async ({ page }) => {
  await page.goto("/dashboard/profile");

  // Fill form
  await page.fill('input[name="email"]', "newemail@example.com");
  await page.click('button:has-text("Save")');

  // Verify success
  await expect(page.locator("text=Profile updated successfully")).toBeVisible();
});
```

## Support & Maintenance

### Regular Updates Needed

- Monitor backend API changes
- Update validation rules if needed
- Keep dependencies updated
- Review auth context changes

### Monitoring

Track metrics:

- Profile update success rate
- Password change frequency
- Form abandonment rate
- Error rates by type

## Appendix: API Response Examples

### Successful Profile Update

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "full_name": "John Doe",
    "username": "johndoe",
    "role": "imaging-technician",
    "is_active": true,
    "is_verified": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:45:00Z"
  }
}
```

### Successful Password Change

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Email already exists",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "email",
    "message": "This email is already registered"
  }
}
```

## Version History

- **v1.0.0** (Current) - Initial release with full profile and password management
