/**
 * Profile Service
 * Self-service operations for any authenticated user
 */

import {
  request,
  get,
  put,
  post,
  ApiError,
} from "@/lib/api-client";
import {
  UserResponse,
  ChangePasswordRequest,
} from "@/types/user";

/**
 * Get current user profile
 * Requires Bearer token
 *
 * @returns Current user profile with metadata
 *
 * @example
 * ```ts
 * const profile = await profileService.getProfile();
 * console.log(`Welcome ${profile.full_name}`);
 * ```
 */
export async function getProfile(): Promise<UserResponse> {
  try {
    return await get<UserResponse>("/profile");
  } catch (error) {
    throw error;
  }
}

/**
 * Get current user (self) — DEPRECATED in favor of getProfile()
 * Requires Bearer token
 *
 * @returns Current user details with permissions
 *
 * @example
 * ```ts
 * const me = await profileService.getMe();
 * console.log(`Logged in as: ${me.full_name}`);
 * ```
 * @deprecated Use getProfile() instead
 */
export async function getMe(): Promise<UserResponse> {
  try {
    // Fallback to /profile endpoint per Prompt 5
    return await get<UserResponse>("/profile");
  } catch (error) {
    throw error;
  }
}

/**
 * Update self profile
 * Non-privileged: can only send email and/or full_name
 * Sending role or is_active as self returns 400
 *
 * Endpoint: PUT /profile
 *
 * @param data - Profile update data (email, full_name only)
 * @returns Updated user
 *
 * @throws ApiError with 400 if sending forbidden fields as non-admin
 * @throws ApiError with 409 if email already in use
 *
 * @example
 * ```ts
 * const updated = await profileService.updateProfile({
 *   email: 'newemail@example.com',
 *   full_name: 'Jane Doe',
 * });
 * ```
 */
export async function updateProfile(data: {
  email?: string;
  full_name?: string;
}): Promise<UserResponse> {
  try {
    // Normalize email if provided
    const payload: any = { ...data };
    if (payload.email) {
      payload.email = payload.email.trim().toLowerCase();
    }
    return await put<UserResponse>("/profile", payload);
  } catch (error) {
    throw error;
  }
}

/**
 * Change own password
 * For non-privileged users: old_password is required
 * Self-service endpoint that validates the old password first
 *
 * Endpoint: POST /profile/change-password
 *
 * @param oldPassword - Current password (required for non-admin)
 * @param newPassword - New password (must meet complexity requirements)
 * @returns Updated user
 *
 * @throws ApiError with 400 if old password is incorrect
 * @throws ApiError with 422 if new password doesn't meet complexity
 *
 * @example
 * ```ts
 * await profileService.changePassword('CurrentPass123!', 'NewPass456!');
 * ```
 */
export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<UserResponse> {
  try {
    const payload: ChangePasswordRequest = {
      old_password: oldPassword,
      new_password: newPassword,
    };
    return await post<UserResponse>("/profile/change-password", payload);
  } catch (error) {
    throw error;
  }
}

// Export as service object for convenience
export const profileService = {
  getMe,
  updateProfile,
  changePassword,
};
