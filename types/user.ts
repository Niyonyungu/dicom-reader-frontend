/**
 * User Management Types
 * Types for user CRUD operations and forms
 */

/**
 * Create user request
 */
export interface UserCreate {
  email: string;
  full_name: string;
  password: string;
  role: "admin" | "service" | "radiologist" | "imaging_technician" | "radiographer";
  is_active?: boolean;
  is_verified?: boolean;
}

/**
 * Update user request (privileged fields)
 */
export interface UserUpdate {
  email?: string;
  full_name?: string;
  is_active?: boolean;
  is_verified?: boolean;
  role?: string;
}

/**
 * User response from API
 */
export interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Paginated user list response
 */
export interface UserListResponse {
  total: number;
  page: number;
  page_size: number;
  items: UserResponse[];
}

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  new_password: string;
  old_password?: string; // Optional for admin resetting others
}

/**
 * Change user role request
 */
export interface ChangeUserRoleRequest {
  role: string;
}

/**
 * Form validation error for a field
 */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * User form data
 */
export interface UserFormData {
  email: string;
  full_name: string;
  password?: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
}
