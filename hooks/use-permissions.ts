/**
 * usePermissions Hook
 * Convenience hook for checking user permissions throughout the app
 *
 * Usage:
 * const { can, canAny, canCreate, canEdit, canDelete } = usePermissions();
 *
 * if (!can('study.read')) return <div>No access</div>;
 * if (canCreate('patient')) return <CreateButton />;
 */

"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { UserRole } from "@/lib/permissions";

export interface UsePermissionsReturn {
  /** Check single permission */
  can: (permission: string) => boolean;
  /** Check multiple permissions (any match) */
  canAny: (permissions: string[]) => boolean;
  /** Check all permissions (all required) */
  canAll: (permissions: string[]) => boolean;
  /** Check user role */
  hasRole: (role: UserRole | string) => boolean;
  /** Check any of multiple roles */
  hasAnyRole: (roles: (UserRole | string)[]) => boolean;
  /** Create permission shorthand - checks "resource.write" */
  canCreate: (resource: string) => boolean;
  /** Edit permission shorthand - checks "resource.write" */
  canEdit: (resource: string) => boolean;
  /** Delete permission shorthand - checks "resource.delete" */
  canDelete: (resource: string) => boolean;
  /** Read permission shorthand - checks "resource.read" */
  canRead: (resource: string) => boolean;
  /** Upload permission shorthand - checks "dicom.upload" */
  canUpload: () => boolean;
  /** User permissions array */
  permissions: string[];
  /** User role */
  userRole: string | null;
}

export function usePermissions(): UsePermissionsReturn {
  const { user, can, canAny } = useAuth();

  const permissions = useMemo(() => user?.permissions ?? [], [user?.permissions]);
  const userRole = useMemo(() => user?.role ?? null, [user?.role]);

  // Check all permissions (all required)
  const canAll = useCallback(
    (perms: string[]): boolean => {
      return perms.every((p) => can(p));
    },
    [can]
  );

  // Check user role
  const hasRole = useCallback(
    (role: UserRole | string): boolean => {
      return userRole === role;
    },
    [userRole]
  );

  // Check any of multiple roles
  const hasAnyRole = useCallback(
    (roles: (UserRole | string)[]): boolean => {
      return roles.includes(userRole ?? "");
    },
    [userRole]
  );

  // Create permission
  const canCreate = useCallback(
    (resource: string): boolean => {
      return can(`${resource}.write`);
    },
    [can]
  );

  // Edit permission
  const canEdit = useCallback(
    (resource: string): boolean => {
      return can(`${resource}.write`);
    },
    [can]
  );

  // Delete permission
  const canDelete = useCallback(
    (resource: string): boolean => {
      return can(`${resource}.delete`);
    },
    [can]
  );

  // Read permission
  const canRead = useCallback(
    (resource: string): boolean => {
      return can(`${resource}.read`);
    },
    [can]
  );

  // Upload permission
  const canUpload = useCallback((): boolean => {
    return can("dicom.upload");
  }, [can]);

  return {
    can,
    canAny,
    canAll,
    hasRole,
    hasAnyRole,
    canCreate,
    canEdit,
    canDelete,
    canRead,
    canUpload,
    permissions,
    userRole,
  };
}
