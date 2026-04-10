/**
 * Use RBAC Matrix Hook
 * Fetches and manages RBAC matrix data with admin check
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api-client";
import { RbacMatrixResponse, RbacFilterState } from "@/types/rbac-api";
import { rbacService } from "@/services/rbac-service";

/**
 * Hook to fetch and manage RBAC matrix
 * 
 * Handles:
 * - Permission checking (admin role only)
 * - Loading and error states
 * - Search/filter functionality
 * 
 * @param skip - If true, skip loading initially
 * 
 * @example
 * ```tsx
 * const { matrix, loading, error, isAdmin, retry, search, filters } = useRbacMatrix();
 * 
 * if (!isAdmin) return <div>Admin access required</div>;
 * if (loading) return <Skeleton />;
 * if (error) return <ErrorState onRetry={retry} />;
 * 
 * return (
 *   <div>
 *     <input onChange={(e) => search(e.target.value)} />
 *     {matrix?.roles.map(role => <RoleCard key={role.role} role={role} />)}
 *   </div>
 * );
 * ```
 */
export function useRbacMatrix(skip?: boolean) {
  const { user } = useAuth();
  const [matrix, setMatrix] = useState<RbacMatrixResponse | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<RbacFilterState>({
    searchQuery: "",
  });

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  /**
   * Fetch matrix from backend
   */
  const fetch = useCallback(async () => {
    if (!isAdmin) {
      setError(new Error("Admin access required"));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await rbacService.getMatrix();
      setMatrix(response);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 403) {
        setError(new Error("You don't have permission to view RBAC matrix"));
      } else if (apiError.status === 401) {
        setError(new Error("Session expired. Please log in again."));
      } else {
        setError(apiError);
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // Fetch on mount if not skipped
  useEffect(() => {
    if (!skip) {
      fetch();
    }
  }, [skip, fetch]);

  /**
   * Update search query
   */
  const search = useCallback((query: string) => {
    setFilters((prev) => ({
      ...prev,
      searchQuery: query,
    }));
  }, []);

  /**
   * Set selected role filter
   */
  const setSelectedRole = useCallback((role?: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedRole: role,
    }));
  }, []);

  /**
   * Set selected permission filter
   */
  const setSelectedPermission = useCallback((permission?: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedPermission: permission,
    }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      searchQuery: "",
    });
  }, []);

  /**
   * Get filtered roles based on current filters
   */
  const getFilteredRoles = useCallback(() => {
    if (!matrix) return [];

    let filtered = matrix.roles;

    // Filter by search query
    if (filters.searchQuery) {
      filtered = rbacService.filterRoles(filtered, filters.searchQuery);
    }

    // Filter by selected role
    if (filters.selectedRole) {
      filtered = filtered.filter((r) => r.role === filters.selectedRole);
    }

    // Filter by selected permission
    if (filters.selectedPermission) {
      filtered = filtered.filter((r) =>
        r.permissions.includes(filters.selectedPermission!)
      );
    }

    return filtered;
  }, [matrix, filters]);

  /**
   * Get filtered permissions
   */
  const getFilteredPermissions = useCallback(() => {
    if (!matrix) return [];

    let filtered = matrix.permission_catalog;

    // Filter by search query
    if (filters.searchQuery) {
      filtered = rbacService.filterPermissions(filtered, filters.searchQuery);
    }

    // Filter by selected role
    if (filters.selectedRole) {
      const rolePerms = matrix.roles
        .find((r) => r.role === filters.selectedRole)
        ?.permissions.filter((p) => p.includes(filters.searchQuery)) || [];
      filtered = rolePerms;
    }

    return filtered;
  }, [matrix, filters]);

  return {
    matrix,
    loading,
    error,
    isAdmin,
    retry: fetch,
    reset: () => {
      setMatrix(null);
      setError(null);
      setFilters({ searchQuery: "" });
    },
    filters,
    search,
    setSelectedRole,
    setSelectedPermission,
    clearFilters,
    getFilteredRoles,
    getFilteredPermissions,
  };
}

/**
 * Hook to get RBAC statistics
 * 
 * @param matrix - RBAC matrix response
 * @returns Statistics object
 * 
 * @example
 * ```tsx
 * const stats = useRbacStats(matrix);
 * console.log(stats.totalRoles, stats.totalPermissions);
 * ```
 */
export function useRbacStats(matrix: RbacMatrixResponse | null) {
  return matrix ? rbacService.getRbacStats(matrix) : null;
}
