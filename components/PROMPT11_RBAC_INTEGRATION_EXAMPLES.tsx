'use client';

/**
 * Prompt 11: RBAC Matrix Viewer — Integration Examples
 *
 * This file demonstrates 5 real-world usage patterns for the RBAC matrix viewer
 * and RBAC service integration.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    getMatrix,
    createPermissionMap,
    getRbacStats,
    filterRoles,
    filterPermissions,
} from '@/services/rbac-service';
import { RbacMatrixResponse } from '@/types/rbac-api';
import RbacMatrixViewer from '@/components/rbac-matrix-viewer';

// ============================================================================
// Example 1: Full RBAC Dashboard Page (Admin Layout Integration)
// ============================================================================
/**
 * Example 1: Complete dashboard page that can be added to the admin layout
 * Route: /admin/rbac-matrix
 */
export function Example1_RbacDashboardPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <RbacMatrixViewer />
            </div>
        </div>
    );
}

// ============================================================================
// Example 2: RBAC Statistics Widget (Admin Dashboard Card)
// ============================================================================
/**
 * Example 2: Compact statistics widget for admin dashboard
 * Shows high-level RBAC configuration overview
 */
export function Example2_RbacStatsWidget() {
    const [stats, setStats] = React.useState<any>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const loadStats = async () => {
            try {
                setIsLoading(true);
                const matrix = await getMatrix();
                const statsData = getRbacStats(matrix);
                setStats(statsData);
            } catch (err) {
                console.error('Error loading RBAC stats:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadStats();
    }, []);

    if (isLoading) return <div className="text-center text-gray-500">Loading...</div>;
    if (!stats) return <Alert><AlertDescription>No RBAC data</AlertDescription></Alert>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>RBAC Configuration</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Total Roles</p>
                        <p className="text-2xl font-bold">{stats.totalRoles}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Total Permissions</p>
                        <p className="text-2xl font-bold">{stats.totalPermissions}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Most Constraints</p>
                        <Badge variant="outline" className="text-xs">
                            {stats.rolesWithLeastPermissions}
                        </Badge>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Most Privileges</p>
                        <Badge variant="outline" className="text-xs">
                            {stats.rolesWithMostPermissions}
                        </Badge>
                    </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4">
                    View Full Matrix
                </Button>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Example 3: Role Detail Card Component (User Management Page)
// ============================================================================
/**
 * Example 3: Display single role with all its permissions
 * Used in: User management, role profiles, access verification
 */
export function Example3_RoleDetailCard({ roleName }: { roleName: string }) {
    const [roleData, setRoleData] = React.useState<any>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const loadRole = async () => {
            try {
                setIsLoading(true);
                const matrix = await getMatrix();
                const role = matrix.roles.find((r) => r.role === roleName);
                setRoleData(role);
            } catch (err) {
                console.error('Error loading role details:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadRole();
    }, [roleName]);

    if (isLoading) return <div className="text-center text-gray-500">Loading...</div>;
    if (!roleData)
        return <Alert><AlertDescription>Role not found</AlertDescription></Alert>;

    return (
        <Card>
            <CardHeader>
                <div>
                    <CardTitle className="capitalize">{roleData.role}</CardTitle>
                    {roleData.description && (
                        <p className="text-sm text-gray-600 mt-1">{roleData.description}</p>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium mb-2">
                            Permissions ({roleData.permissions.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {roleData.permissions.map((perm: string) => (
                                <Badge key={perm} variant="secondary" className="text-xs">
                                    {perm}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">
                        Updated: {new Date(roleData.updated_at).toLocaleDateString()}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Example 4: Permission Checker Component (Permission Verification)
// ============================================================================
/**
 * Example 4: Check which roles have a specific permission
 * Used in: Permission auditing, access verification, compliance reports
 */
export function Example4_PermissionChecker({ permission }: { permission: string }) {
    const [matrix, setMatrix] = React.useState<RbacMatrixResponse | null>(null);
    const [rolesWithPermission, setRolesWithPermission] = React.useState<string[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const checkPermission = async () => {
            try {
                setIsLoading(true);
                const data = await getMatrix();
                setMatrix(data);

                // Find roles with this permission
                const rolesWithPerm = data.roles
                    .filter((role) => role.permissions.includes(permission))
                    .map((role) => role.role);

                setRolesWithPermission(rolesWithPerm);
            } catch (err) {
                console.error('Error checking permission:', err);
            } finally {
                setIsLoading(false);
            }
        };

        checkPermission();
    }, [permission]);

    if (isLoading) return <div className="text-center text-gray-500">Loading...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-mono">{permission}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium mb-2">
                            Roles with this permission ({rolesWithPermission.length})
                        </p>
                        {rolesWithPermission.length === 0 ? (
                            <p className="text-sm text-gray-500">No roles have this permission</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {rolesWithPermission.map((role) => (
                                    <Badge key={role} variant="default" className="capitalize">
                                        {role}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {matrix && (
                        <div className="pt-4 border-t">
                            <p className="text-xs text-gray-600">
                                Permission exists in catalog: {matrix.permission_catalog.includes(permission) ? '✓ Yes' : '✗ No'}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Example 5: RBAC Comparison Tool (Role Comparison)
// ============================================================================
/**
 * Example 5: Compare permissions between two roles
 * Used in: Access management, role alignment, audit trail
 */
export function Example5_RoleComparison({ role1, role2 }: { role1: string; role2: string }) {
    const [comparison, setComparison] = React.useState<{
        role1Perms: string[];
        role2Perms: string[];
        common: string[];
        unique1: string[];
        unique2: string[];
    } | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const compare = async () => {
            try {
                setIsLoading(true);
                const matrix = await getMatrix();

                const r1 = matrix.roles.find((r) => r.role === role1);
                const r2 = matrix.roles.find((r) => r.role === role2);

                if (!r1 || !r2) {
                    console.error('One or both roles not found');
                    return;
                }

                const set1 = new Set(r1.permissions);
                const set2 = new Set(r2.permissions);

                const common = r1.permissions.filter((p) => set2.has(p));
                const unique1 = r1.permissions.filter((p) => !set2.has(p));
                const unique2 = r2.permissions.filter((p) => !set1.has(p));

                setComparison({
                    role1Perms: r1.permissions,
                    role2Perms: r2.permissions,
                    common,
                    unique1,
                    unique2,
                });
            } catch (err) {
                console.error('Error comparing roles:', err);
            } finally {
                setIsLoading(false);
            }
        };

        compare();
    }, [role1, role2]);

    if (isLoading) return <div className="text-center text-gray-500">Loading...</div>;
    if (!comparison)
        return <Alert><AlertDescription>Could not compare roles</AlertDescription></Alert>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Role Comparison</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Common Permissions */}
                    <div>
                        <p className="text-sm font-medium mb-2">
                            Common Permissions ({comparison.common.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {comparison.common.length === 0 ? (
                                <p className="text-xs text-gray-500">No common permissions</p>
                            ) : (
                                comparison.common.map((perm) => (
                                    <Badge key={perm} variant="default" className="text-xs">
                                        {perm}
                                    </Badge>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Unique to Role 1 */}
                    <div>
                        <p className="text-sm font-medium mb-2 capitalize">
                            Only in {role1} ({comparison.unique1.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {comparison.unique1.length === 0 ? (
                                <p className="text-xs text-gray-500">No unique permissions</p>
                            ) : (
                                comparison.unique1.map((perm) => (
                                    <Badge key={perm} variant="secondary" className="text-xs">
                                        {perm}
                                    </Badge>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Unique to Role 2 */}
                    <div>
                        <p className="text-sm font-medium mb-2 capitalize">
                            Only in {role2} ({comparison.unique2.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {comparison.unique2.length === 0 ? (
                                <p className="text-xs text-gray-500">No unique permissions</p>
                            ) : (
                                comparison.unique2.map((perm) => (
                                    <Badge key={perm} variant="outline" className="text-xs">
                                        {perm}
                                    </Badge>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Example 6: Direct Service Usage (Programmatic Access)
// ============================================================================
/**
 * Example 6: Use RBAC service directly for custom logic
 * Shows how to access RBAC data programmatically
 */
export async function Example6_ProgrammaticAccess() {
    try {
        // Fetch matrix
        const matrix = await getMatrix();

        // Get statistics
        const stats = getRbacStats(matrix);
        console.log(`Total roles: ${stats.totalRoles}`);
        console.log(`Total permissions: ${stats.totalPermissions}`);

        // Create permission map (permission → roles)
        const permMap = createPermissionMap(matrix.roles);
        console.log('Roles with study.read:', permMap['study.read']);

        // Filter roles by name
        const radioRoles = filterRoles(matrix.roles, 'radio');
        console.log('Roles matching "radio":', radioRoles.map((r) => r.role));

        // Filter permissions
        const deletePerms = filterPermissions(matrix.permission_catalog, 'delete');
        console.log('Delete permissions:', deletePerms);

        return {
            success: true,
            stats,
            permMap,
            radioRoles,
            deletePerms,
        };
    } catch (error) {
        console.error('Direct access failed:', error);
        return { success: false, error };
    }
}

// ============================================================================
// Export all examples for demo/storybook usage
// ============================================================================
export const RBAC_EXAMPLES = {
    Example1_RbacDashboardPage,
    Example2_RbacStatsWidget,
    Example3_RoleDetailCard,
    Example4_PermissionChecker,
    Example5_RoleComparison,
    Example6_ProgrammaticAccess,
};

export default RBAC_EXAMPLES;
