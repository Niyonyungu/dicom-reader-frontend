/**
 * User Service
 * API methods for user management (admin/service only)
 */

import {
  request,
  post,
  get,
  put,
  del,
  ApiError,
} from "@/lib/api-client";
import {
  UserCreate,
  UserUpdate,
  UserResponse,
  UserListResponse,
  ChangePasswordRequest,
  ChangeUserRoleRequest,
} from "@/types/user";

/**
 * List users with pagination
 *
 * @param page - Page number (default 1)
 * @param pageSize - Users per page (default 20, max 100)
 * @returns Paginated list of users
 *
 * @example
 * ```ts
 * const result = await userService.listUsers(1, 20);
 * console.log(result.total); // total count
 * console.log(result.items); // array of users
 * ```
 */
export async function listUsers(
  page: number = 1,
  pageSize: number = 20
): Promise<UserListResponse> {
  try {
    return await get<UserListResponse>("/users", {
      body: {
        page: Math.max(1, page),
        page_size: Math.min(100, Math.max(1, pageSize)),
      },
    });
  } catch (error) {
    const apiError = error as ApiError;
    throw apiError;
  }
}

/**
 * Get user by ID
 *
 * @param id - User ID
 * @returns User details
 *
 * @example
 * ```ts
 * const user = await userService.getUser(123);
 * ```
 */
export async function getUser(id: number): Promise<UserResponse> {
  try {
    return await get<UserResponse>(`/users/${id}`);
  } catch (error) {
    throw error;
  }
}

/**
 * Create new user
 *
 * @param userData - User data (email, full_name, password, role)
 * @returns Created user
 *
 * @throws ApiError with 409 if email already exists
 * @throws ApiError with 422 if password complexity fails
 *
 * @example
 * ```ts
 * const newUser = await userService.createUser({
 *   email: 'john@example.com',
 *   full_name: 'John Doe',
 *   password: 'SecurePass123!',
 *   role: 'radiologist',
 *   is_active: true,
 * });
 * ```
 */
export async function createUser(userData: UserCreate): Promise<UserResponse> {
  try {
    // Normalize email
    const normalized = {
      ...userData,
      email: userData.email.trim().toLowerCase(),
    };
    return await post<UserResponse>("/users", normalized);
  } catch (error) {
    throw error;
  }
}

/**
 * Update user
 * Privileged endpoint - can update email, full_name, is_active, is_verified, role
 *
 * @param id - User ID
 * @param userData - Fields to update (all optional)
 * @returns Updated user
 *
 * @throws ApiError with 409 if email already exists
 *
 * @example
 * ```ts
 * const updated = await userService.updateUser(123, {
 *   full_name: 'Jane Doe',
 *   is_active: false,
 * });
 * ```
 */
export async function updateUser(
  id: number,
  userData: UserUpdate
): Promise<UserResponse> {
  try {
    // Normalize email if provided
    const data: any = { ...userData };
    if (data.email) {
      data.email = data.email.trim().toLowerCase();
    }
    return await put<UserResponse>(`/users/${id}`, data);
  } catch (error) {
    throw error;
  }
}

/**
 * Delete user
 *
 * @param id - User ID
 * @returns void
 *
 * @throws ApiError with 400 if trying to delete own account
 *
 * @example
 * ```ts
 * await userService.deleteUser(123);
 * ```
 */
export async function deleteUser(id: number): Promise<void> {
  try {
    await del(`/users/${id}`);
  } catch (error) {
    throw error;
  }
}

/**
 * Change user role
 * Dedicated endpoint for role changes
 *
 * @param id - User ID
 * @param role - New role (admin, service, radiologist, imaging_technician, radiographer)
 * @returns Updated user
 *
 * @example
 * ```ts
 * const updated = await userService.changeUserRole(123, 'admin');
 * ```
 */
export async function changeUserRole(
  id: number,
  role: string
): Promise<UserResponse> {
  try {
    return await put<UserResponse>(`/users/${id}/role`, { role });
  } catch (error) {
    throw error;
  }
}

/**
 * Reset user password
 * Privileged endpoint - admin/service resetting another user's password
 *
 * @param id - User ID
 * @param newPassword - New password (must meet complexity requirements)
 * @returns Updated user
 *
 * @throws ApiError with 422 if password complexity fails
 *
 * @example
 * ```ts
 * const updated = await userService.resetUserPassword(123, 'NewPass123!');
 * ```
 */
export async function resetUserPassword(
  id: number,
  newPassword: string
): Promise<UserResponse> {
  try {
    return await put<UserResponse>(`/users/${id}/password`, {
      new_password: newPassword,
    });
  } catch (error) {
    throw error;
  }
}

// Export as service object for convenience
export const userService = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
  resetUserPassword,
};
