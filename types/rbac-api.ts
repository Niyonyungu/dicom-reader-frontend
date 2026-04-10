/**
 * RBAC API Types
 * Type definitions for the RBAC matrix endpoint
 */

/**
 * Role definition with permissions
 */
export interface RbacRole {
  role: string; // e.g., 'admin', 'radiologist'
  permissions: string[]; // e.g., ['study.read', 'study.write', ...]
  description?: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Complete RBAC matrix response from backend
 */
export interface RbacMatrixResponse {
  roles: RbacRole[];
  permission_catalog: string[]; // Sorted list of all permission strings
}

/**
 * Flattened permission entry for display/search
 */
export interface PermissionEntry {
  name: string;
  roles: string[]; // Which roles have this permission
}

/**
 * Search/filter state
 */
export interface RbacFilterState {
  searchQuery: string;
  selectedRole?: string;
  selectedPermission?: string;
}
