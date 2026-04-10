/**
 * User Management Integration Guide
 * Complete examples and setup for Prompt 4
 */

/**
 * SETUP CHECKLIST
 *
 * ✓ 1. Created user service with all endpoints
 *     - listUsers(page, pageSize)
 *     - getUser(id)
 *     - createUser(userData)
 *     - updateUser(id, userData)
 *     - deleteUser(id)
 *     - changeUserRole(id, role)
 *     - resetUserPassword(id, newPassword)
 *
 * ✓ 2. Created form components
 *     - UserForm (create/edit with password validation)
 *     - ChangeRoleDialog (quick role change)
 *     - ResetPasswordDialog (password reset with strength indicator)
 *
 * ✓ 3. Created UsersPage component
 *     - Auto-protected route (admin/service only)
 *     - Paginated user list
 *     - All CRUD operations
 *
 * ✓ 4. Password validation
 *     - Min 8 chars, uppercase, lowercase, digit, special char
 *     - Real-time strength indicator
 *     - Hint display
 *
 * ✓ 5. Error handling
 *     - 409 Conflict (duplicate email) → inline error
 *     - 400 Bad Request (delete self) → error message
 *     - 422 Validation errors → field errors
 *
 * INTEGRATION STEPS:
 */

/**
 * STEP 1: Add route to app/dashboard/settings/users/page.tsx
 *
 * ────────────────────────────────────────────────────────────
 *
 * Create file: app/dashboard/settings/users/page.tsx
 *
 * ```tsx
 * import { UsersPage } from '@/components/users-page';
 *
 * export const metadata = {
 *   title: 'Users | DICOM Viewer',
 *   description: 'Manage users and permissions',
 * };
 *
 * export default function Page() {
 *   return <UsersPage />;
 * }
 * ```
 */

/**
 * STEP 2: Verify route is in ROUTE_PERMISSIONS (lib/permissions.ts)
 *
 * ────────────────────────────────────────────────────────────
 *
 * Already added in Prompt 3:
 * "/dashboard/settings/users": {
 *   roles: [UserRole.ADMIN, UserRole.SERVICE],
 *   description: "User management",
 * }
 *
 * This automatically:
 * - Hides nav item if user doesn't have admin/service role
 * - Prevents access to /dashboard/settings/users without proper role
 * - Shows ForbiddenPage if accessed directly
 */

/**
 * STEP 3: Update sidebar navigation (components/layout/sidebar.tsx)
 *
 * ────────────────────────────────────────────────────────────
 *
 * Already set up via NAV_ITEMS + FilteredNav:
 *
 * The "Users" link in Settings section will auto-appear for admins/service
 * and auto-hide for others. Just use:
 *
 * ```tsx
 * import { FilteredNav } from '@/components/filtered-nav';
 * import { NAV_ITEMS } from '@/lib/permissions';
 *
 * <FilteredNav items={NAV_ITEMS} />
 * ```
 */

/**
 * EXAMPLE 1: Basic user listing
 *
 * ────────────────────────────────────────────────────────────
 *
 * ```tsx
 * import { userService } from '@/services/user-service';
 *
 * async function getUsers() {
 *   try {
 *     const result = await userService.listUsers(1, 20);
 *     console.log(`Total users: ${result.total}`);
 *     result.items.forEach(user => {
 *       console.log(`${user.full_name} (${user.role})`);
 *     });
 *   } catch (error) {
 *     console.error('Failed to load users:', error);
 *   }
 * }
 * ```
 */

/**
 * EXAMPLE 2: Create new user with password validation
 *
 * ────────────────────────────────────────────────────────────
 *
 * ```tsx
 * import { userService } from '@/services/user-service';
 * import { validatePassword } from '@/lib/password-validation';
 *
 * async function createNewUser() {
 *   const password = 'MySecurePass123!';
 *
 *   // Validate password first
 *   const validation = validatePassword(password);
 *   if (!validation.isValid) {
 *     console.error('Password errors:', validation.errors);
 *     return;
 *   }
 *
 *   try {
 *     const newUser = await userService.createUser({
 *       email: 'john@example.com',
 *       full_name: 'John Doe',
 *       password: password,
 *       role: 'radiologist',
 *       is_active: true,
 *       is_verified: true,
 *     });
 *     console.log('Created user:', newUser);
 *   } catch (error) {
 *     // Check for 409 conflict (duplicate email)
 *     if (error.status === 409) {
 *       console.error('Email already exists');
 *     }
 *   }
 * }
 * ```
 */

/**
 * EXAMPLE 3: Handle API errors (409, 422, etc.)
 *
 * ────────────────────────────────────────────────────────────
 *
 * ```tsx
 * import { userService } from '@/services/user-service';
 * import { handleApiError } from '@/lib/api-error-handler';
 *
 * try {
 *   const user = await userService.createUser({...});
 * } catch (error) {
 *   const handled = handleApiError(error, {
 *     context: 'Failed to create user',
 *   });
 *
 *   // Check for specific errors
 *   if (handled.status === 409) {
 *     // Duplicate email
 *     console.error('Email already registered');
 *   } else if (handled.isValidation) {
 *     // Password complexity, etc.
 *     console.error('Validation failed:', handled.fieldErrors);
 *   } else {
 *     // General error
 *     console.error(handled.message);
 *   }
 * }
 * ```
 */

/**
 * EXAMPLE 4: Change user role
 *
 * ────────────────────────────────────────────────────────────
 *
 * ```tsx
 * import { userService } from '@/services/user-service';
 *
 * // Quick role change via dedicated endpoint
 * const updatedUser = await userService.changeUserRole(userId, 'admin');
 * console.log(`${updatedUser.full_name} is now ${updatedUser.role}`);
 * ```
 */

/**
 * EXAMPLE 5: Reset user password
 *
 * ────────────────────────────────────────────────────────────
 *
 * ```tsx
 * import { userService } from '@/services/user-service';
 * import { validatePassword } from '@/lib/password-validation';
 *
 * const newPassword = 'TempPassword123!';
 *
 * // Validate first
 * const validation = validatePassword(newPassword);
 * if (!validation.isValid) {
 *   console.error(validation.errors);
 *   return;
 * }
 *
 * // Reset password
 * const updatedUser = await userService.resetUserPassword(userId, newPassword);
 * console.log('Password reset successfully');
 * ```
 */

/**
 * EXAMPLE 6: Delete user with confirmation
 *
 * ────────────────────────────────────────────────────────────
 *
 * ```tsx
 * import { userService } from '@/services/user-service';
 * import { useAuth } from '@/context/auth-context';
 *
 * async function deleteUserWithCheck(userId: number) {
 *   const { user: currentUser } = useAuth();
 *
 *   // Prevent self-delete
 *   if (currentUser?.id === userId) {
 *     console.error('Cannot delete your own account');
 *     return;
 *   }
 *
 *   // Confirm
 *   if (!confirm('Delete this user? This cannot be undone.')) {
 *     return;
 *   }
 *
 *   try {
 *     await userService.deleteUser(userId);
 *     console.log('User deleted');
 *   } catch (error) {
 *     // Backend returns 400 if trying to delete self
 *     console.error('Failed to delete:', error.message);
 *   }
 * }
 * ```
 */

/**
 * EXAMPLE 7: Edit user details
 *
 * ────────────────────────────────────────────────────────────
 *
 * ```tsx
 * import { userService } from '@/services/user-service';
 * import { UserUpdate } from '@/types/user';
 *
 * // Update privileged fields (email, full_name, is_active, is_verified, role)
 * const updates: UserUpdate = {
 *   full_name: 'Jane Smith',
 *   is_active: false,
 *   // Note: Password changes use resetUserPassword(), not updateUser()
 * };
 *
 * const updatedUser = await userService.updateUser(userId, updates);
 * console.log('User updated:', updatedUser);
 * ```
 */

/**
 * EXAMPLE 8: Password strength feedback
 *
 * ────────────────────────────────────────────────────────────
 *
 * ```tsx
 * import {
 *   validatePassword,
 *   getPasswordStrengthLabel,
 *   getPasswordStrengthColor,
 * } from '@/lib/password-validation';
 *
 * const password = 'Test123!';
 * const result = validatePassword(password);
 *
 * console.log('Valid:', result.isValid); // true/false
 * console.log('Score:', result.score); // 0-5
 * console.log('Label:', getPasswordStrengthLabel(result.score)); // "Strong", etc.
 * console.log('Color:', getPasswordStrengthColor(result.score)); // CSS class
 *
 * // Show requirements
 * result.hints.forEach(hint => console.log(hint));
 * // ✓ At least 8 characters
 * // ✓ Uppercase letter (A-Z)
 * // ✓ Lowercase letter (a-z)
 * // ✓ Number (0-9)
 * // ✗ Special character (!@#$%^&*)
 * ```
 */

/**
 * EXAMPLE 9: Pagination
 *
 * ────────────────────────────────────────────────────────────
 *
 * ```tsx
 * import { userService } from '@/services/user-service';
 *
 * // Get page 2 with 50 items per page
 * const result = await userService.listUsers(2, 50);
 *
 * console.log(`Page ${result.page} of ${Math.ceil(result.total / result.page_size)}`);
 * console.log(`Showing ${result.items.length} of ${result.total} users`);
 *
 * // Calculate total pages
 * const totalPages = Math.ceil(result.total / result.page_size);
 * ```
 */

/**
 * EXAMPLE 10: Integration with UsersPage component
 *
 * ────────────────────────────────────────────────────────────
 *
 * The UsersPage component handles everything:
 *
 * ```tsx
 * import { UsersPage } from '@/components/users-page';
 *
 * export default function Page() {
 *   return <UsersPage />;
 * }
 * ```
 *
 * Features included:
 * ✓ Auto-protected (admin/service only)
 * ✓ List users with pagination
 * ✓ Create new users
 * ✓ Edit user details
 * ✓ Change user role (dedicated dialog)
 * ✓ Reset password (dedicated dialog)
 * ✓ Delete users (with confirmation)
 * ✓ Error handling (409 for duplicate email, etc.)
 * ✓ Loading states
 * ✓ Success notifications
 */

/**
 * PASSWORD REQUIREMENTS (from backend)
 *
 * ────────────────────────────────────────────────────────────
 *
 * Enforced client-side and on backend:
 * - Minimum 8 characters
 * - At least ONE uppercase letter (A-Z)
 * - At least ONE lowercase letter (a-z)
 * - At least ONE number (0-9)
 * - At least ONE special character (!@#$%^&* etc.)
 *
 * The UI provides real-time feedback with:
 * ✓ Visual strength indicator (0-5)
 * ✓ Live checklist of requirements
 * ✓ Color coding (red → green)
 * ✓ Strength label (Weak → Strong)
 */

/**
 * ROUTE PROTECTION FLOW
 *
 * ────────────────────────────────────────────────────────────
 *
 * 1. User navigates to /dashboard/settings/users
 *
 * 2. PermissionRouteGuard checks:
 *    - Is user authenticated? (redirects to /login if not)
 *    - Does user have admin OR service role? (shows ForbiddenPage if not)
 *
 * 3. UsersPage component mounts and:
 *    - Fetches user list from /api/v1/users?page=1&page_size=20
 *    - Displays paginated table
 *    - Handles all CRUD operations
 *
 * 4. All API calls automatically:
 *    - Include Bearer token (via api-interceptor.ts from Prompt 2)
 *    - Handle 401 refresh (auto retry)
 *    - Parse 403 permission errors
 *    - Show user-friendly error messages
 */

/**
 * ERROR SCENARIOS & HANDLING
 *
 * ────────────────────────────────────────────────────────────
 *
 * 409 Conflict (Email already exists):
 * - handleApiError() detects status 409
 * - Message: "This email is already in use"
 * - Shown as inline error on email field
 *
 * 422 Validation (Password doesn't meet requirements):
 * - Backend returns field errors: { password: "Must contain uppercase" }
 * - UI shows these as form field errors
 * - Client-side validation also prevents submission
 *
 * 400 Bad Request (Trying to delete own account):
 * - Backend returns: "Cannot delete current user"
 * - UI shows error message in alert
 * - Delete button is disabled for own account (preventative)
 *
 * 403 Forbidden (User lacks permission):
 * - PermissionRouteGuard shows ForbiddenPage
 * - Nav item is hidden for non-admins
 * - Direct URL entry is caught and shows "Access Denied"
 *
 * 401 Unauthorized (Token expired):
 * - API interceptor auto-refreshes token
 * - Original request retried
 * - No user interaction needed (transparent)
 */

/**
 * TESTING CHECKLIST
 *
 * ────────────────────────────────────────────────────────────
 *
 * Admin User:
 * ✓ Can access /dashboard/settings/users
 * ✓ Can create users with all roles
 * ✓ Can edit user details (email, full_name, is_active, is_verified, role)
 * ✓ Can change roles via dedicated button
 * ✓ Can reset passwords via dedicated button
 * ✓ Can delete other users (not own account)
 * ✓ Sees "You" badge on own account
 * ✓ Delete button disabled on own account
 *
 * Service User:
 * ✓ Can access /dashboard/settings/users (same as admin)
 * ✓ All operations identical to admin
 *
 * Radiologist:
 * ✗ Cannot access /dashboard/settings/users
 * ✗ "Users" nav item hidden
 * ✗ Shows ForbiddenPage if accessed directly
 *
 * Password Validation:
 * ✓ Shows real-time strength (0-5)
 * ✓ Checklist updates as user types
 * ✓ Submit button disabled until valid
 * ✓ Shows all 5 requirements
 *
 * Error Handling:
 * ✓ Duplicate email shows inline error
 * ✓ Invalid password shows validation errors
 * ✓ Delete self shows error message
 * ✓ Expired token auto-refreshes
 * ✓ Network errors show friendly message
 *
 * Pagination:
 * ✓ Shows "Page X of Y" correctly
 * ✓ Prev/Next buttons work
 * ✓ Page links navigate correctly
 * ✓ Reloads data on page change
 *
 * UI/UX:
 * ✓ Loading spinner shows during fetch
 * ✓ Success message appears briefly
 * ✓ Form clears after create/edit
 * ✓ Dialogs close on success
 * ✓ Confirmation needed before delete
 */

/**
 * NOTES
 *
 * ────────────────────────────────────────────────────────────
 *
 * - Password is required for create, optional for edit
 * - Email normalization (trim + lowercase) happens on both client and server
 * - Backend is source of truth for all validation
 * - Client validation is for UX feedback only
 * - Self-delete is prevented both UI (disabled button) and backend (400)
 * - All operations are atomic (full error or full success)
 * - Service accounts use POST /users, not /auth/register (Prompt 2)
 * - Password changes for other users use PUT /users/{id}/password
 * - Self-service password is in Prompt 5
 */

// This file is for documentation only - no exports
export {};
