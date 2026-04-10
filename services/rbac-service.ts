/**
 * RBAC Service
 * Handles RBAC matrix API calls
 * 
 * Endpoints:
 * - GET /auth/rbac/matrix — get role → permission matrix (admin only)
 * 
 * Permission requirement:
 * - Backend checks user.role === 'admin' and returns 403 otherwise
 */

import { get } from "@/lib/api-client";
import { RbacMatrixResponse } from "@/types/rbac-api";
import { getAccessToken } from "@/lib/token-storage";

/**
 * Fetch the complete RBAC matrix
 * Shows all roles and their permissions from the database
 * 
 * Requires admin role (backend checks)
 * 
 * @returns RbacMatrixResponse with roles and permission catalog
 * @throws ApiError on failure (403 if not admin, 500 if server error)
 * 
 * @example
 * ```ts
 * try {
 *   const matrix = await rbacService.getMatrix();
 *   console.log(matrix.roles); // List of roles with permissions
 *   console.log(matrix.permission_catalog); // All permission strings
 * } catch (error) {
 *   if (error.status === 403) {
 *     console.error('Admin access required');
 *   }
 * }
 * ```
 */
export async function getMatrix(): Promise<RbacMatrixResponse> {
  const token = getAccessToken();
  return get<RbacMatrixResponse>("/auth/rbac/matrix", { authToken: token ?? undefined });
}

/**
 * Create permission entry lookup from roles
 * Inverts role-based permissions to permission-based roles
 * 
 * @param roles - List of roles with permissions
 * @returns Map of permission → roles that have it
 * 
 * @example
 * ```ts
 * const permissionMap = createPermissionMap(matrix.roles);
 * console.log(permissionMap['study.read']); // ['admin', 'radiologist', ...]
 * ```
 */
export function createPermissionMap(
  roles: RbacMatrixResponse['roles']
): Record<string, string[]> {
  const map: Record<string, string[]> = {};

  roles.forEach((role) => {
    role.permissions.forEach((permission) => {
      if (!map[permission]) {
        map[permission] = [];
      }
      map[permission].push(role.role);
    });
  });

  return map;
}

/**
 * Get statistics about RBAC configuration
 * 
 * @param matrix - The RBAC matrix response
 * @returns Object with role and permission counts
 * 
 * @example
 * ```ts
 * const stats = getRbacStats(matrix);
 * console.log(stats.totalRoles); // 5
 * console.log(stats.totalPermissions); // 42
 * ```
 */
export function getRbacStats(matrix: RbacMatrixResponse) {
  return {
    totalRoles: matrix.roles.length,
    totalPermissions: matrix.permission_catalog.length,
    rolesWithMostPermissions: matrix.roles.reduce(
      (max, role) =>
        role.permissions.length > max.permissions.length ? role : max,
      matrix.roles[0]
    )?.role,
    rolesWithLeastPermissions: matrix.roles.reduce(
      (min, role) =>
        role.permissions.length < min.permissions.length ? role : min,
      matrix.roles[0]
    )?.role,
  };
}

/**
 * Filter roles based on search query
 * Searches in role name, description, and permissions
 * 
 * @param roles - List of roles to filter
 * @param query - Search query (case-insensitive)
 * @returns Filtered roles
 * 
 * @example
 * ```ts
 * const results = filterRoles(matrix.roles, 'read');
 * // Returns roles containing 'read' in permissions
 * ```
 */
export function filterRoles(
  roles: RbacMatrixResponse['roles'],
  query: string
): RbacMatrixResponse['roles'] {
  if (!query.trim()) return roles;

  const lower = query.toLowerCase();
  return roles.filter(
    (role) =>
      role.role.toLowerCase().includes(lower) ||
      role.description?.toLowerCase().includes(lower) ||
      role.permissions.some((p) => p.toLowerCase().includes(lower))
  );
}

/**
 * Filter permissions based on search query
 * 
 * @param permissions - List of permissions to filter
 * @param query - Search query (case-insensitive)
 * @returns Filtered permissions
 * 
 * @example
 * ```ts
 * const results = filterPermissions(catalog, 'study');
 * // Returns permissions containing 'study'
 * ```
 */
export function filterPermissions(
  permissions: string[],
  query: string
): string[] {
  if (!query.trim()) return permissions;

  const lower = query.toLowerCase();
  return permissions.filter((p) => p.toLowerCase().includes(lower));
}

/**
 * Get description for a permission
 * Parses the permission name to generate a human-readable description
 * 
 * @param permission - Permission string (e.g., 'study.read')
 * @returns Human-readable description
 * 
 * @example
 * ```ts
 * getPermissionDescription('study.read'); // "Read studies"
 * getPermissionDescription('dicom.upload'); // "Upload DICOM files"
 * ```
 */
export function getPermissionDescription(permission: string): string {
  const [resource, action] = permission.split('.');

  const actionLabels: Record<string, string> = {
    read: 'View',
    write: 'Create/Edit',
    delete: 'Delete',
    upload: 'Upload',
    download: 'Download',
  };

  const resourceLabels: Record<string, string> = {
    patient: 'Patients',
    study: 'Studies',
    instance: 'DICOM Instances',
    measurement: 'Measurements',
    report: 'Reports',
    audit_log: 'Audit Logs',
    dicom: 'DICOM Files',
  };

  const actionLabel = actionLabels[action] || action;
  const resourceLabel = resourceLabels[resource] || resource;

  return `${actionLabel} ${resourceLabel}`;
}

/**
 * Get color for role badge
 * Consistent coloring across the application
 * 
 * @param role - Role string
 * @returns Color class for badge
 * 
 * @example
 * ```tsx
 * <Badge className={getRoleColor('admin')}>admin</Badge>
 * // Returns 'bg-red-100 text-red-800'
 * ```
 */
export function getRoleColor(
  role: string
): string {
  const colors: Record<string, string> = {
    admin: 'bg-red-100 text-red-800',
    service: 'bg-purple-100 text-purple-800',
    radiologist: 'bg-blue-100 text-blue-800',
    imaging_technician: 'bg-green-100 text-green-800',
    radiographer: 'bg-amber-100 text-amber-800',
  };

  return colors[role] || 'bg-gray-100 text-gray-800';
}

export const rbacService = {
  getMatrix,
  createPermissionMap,
  getRbacStats,
  filterRoles,
  filterPermissions,
  getPermissionDescription,
  getRoleColor,
};
