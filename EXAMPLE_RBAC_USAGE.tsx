/**
 * Example RBAC Usage Patterns
 * Shows how to use RBAC matrix and service functions in other components
 */

"use client";

import { useRbacMatrix, useRbacStats } from "@/hooks/use-rbac-matrix";
import { rbacService } from "@/services/rbac-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Users, Shield, Lock } from "lucide-react";

/**
 * Example 1: Role Access Dashboard
 * Display which users have which permissions
 */
export function RoleAccessDashboard() {
    const { matrix, isAdmin } = useRbacMatrix();

    if (!isAdmin) return null;
    if (!matrix) return <div>Loading...</div>;

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Role Access Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matrix.roles.map((role) => (
                    <Card key={role.role}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                {role.role}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    {role.description || "No description"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2">
                                    {role.permissions.length} permissions
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {role.permissions.slice(0, 5).map((perm) => (
                                        <Badge key={perm} variant="secondary" className="text-xs">
                                            {perm.split(".")[1] || perm}
                                        </Badge>
                                    ))}
                                    {role.permissions.length > 5 && (
                                        <Badge variant="secondary" className="text-xs">
                                            +{role.permissions.length - 5}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

/**
 * Example 2: Permission Verification Component
 * Show which roles have a specific permission
 */
export function PermissionVerifier({ permissionName }: { permissionName: string }) {
    const { matrix } = useRbacMatrix();

    if (!matrix) return null;

    const rolesWithPermission = matrix.roles.filter((role) =>
        role.permissions.includes(permissionName)
    );

    const description = rbacService.getPermissionDescription(permissionName);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Permission: {permissionName}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{description}</p>
                <div>
                    <p className="text-sm font-semibold mb-2">
                        Assigned to {rolesWithPermission.length} role(s):
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {rolesWithPermission.length > 0 ? (
                            rolesWithPermission.map((role) => (
                                <Badge
                                    key={role.role}
                                    className={rbacService.getRoleColor(role.role)}
                                >
                                    {role.role}
                                </Badge>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground italic">
                                No roles have this permission
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Example 3: Role Comparison Component
 * Compare permissions between two roles
 */
export function RoleComparison({ role1: r1, role2: r2 }: { role1: string; role2: string }) {
    const { matrix } = useRbacMatrix();

    if (!matrix) return null;

    const roleA = matrix.roles.find((r) => r.role === r1);
    const roleB = matrix.roles.find((r) => r.role === r2);

    if (!roleA || !roleB) return <div>Roles not found</div>;

    const permissionMap = rbacService.createPermissionMap(matrix.roles);
    const permsInBoth = roleA.permissions.filter((p) => roleB.permissions.includes(p));
    const permsOnlyInA = roleA.permissions.filter((p) => !roleB.permissions.includes(p));
    const permsOnlyInB = roleB.permissions.filter((p) => !roleA.permissions.includes(p));

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Compare {r1} vs {r2}</h2>

            <Tabs defaultValue="both" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="both">
                        Both ({permsInBoth.length})
                    </TabsTrigger>
                    <TabsTrigger value="only-a">
                        Only {r1} ({permsOnlyInA.length})
                    </TabsTrigger>
                    <TabsTrigger value="only-b">
                        Only {r2} ({permsOnlyInB.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="both" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Shared Permissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {permsInBoth.map((perm) => (
                                    <Badge key={perm} variant="default">
                                        {perm}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="only-a" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{r1} Only</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {permsOnlyInA.map((perm) => (
                                    <Badge key={perm} variant="secondary">
                                        {perm}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="only-b" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{r2} Only</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {permsOnlyInB.map((perm) => (
                                    <Badge key={perm} variant="secondary">
                                        {perm}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

/**
 * Example 4: Statistics Card
 * Display RBAC statistics in a widget
 */
export function RbacStatsCard() {
    const { matrix } = useRbacMatrix();
    const stats = useRbacStats(matrix);

    if (!matrix || !stats) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    RBAC Statistics
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-2xl font-bold text-primary">{stats.totalRoles}</p>
                    <p className="text-xs text-muted-foreground">Total Roles</p>
                </div>
                <div>
                    <p className="text-2xl font-bold text-primary">
                        {stats.totalPermissions}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Permissions</p>
                </div>
                <div className="col-span-2">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">
                        Most Powerful Role:
                    </p>
                    <Badge className={rbacService.getRoleColor(stats.rolesWithMostPermissions)}>
                        {stats.rolesWithMostPermissions}
                    </Badge>
                </div>
                <div className="col-span-2">
                    <p className="text-sm font-semibold text-muted-foreground mb-1">
                        Most Restricted Role:
                    </p>
                    <Badge className={rbacService.getRoleColor(stats.rolesWithLeastPermissions)}>
                        {stats.rolesWithLeastPermissions}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Example 5: Audit Log Visualizer
 * Show role definitions in user-friendly format
 */
export function RoleDefinitions() {
    const { matrix } = useRbacMatrix();

    if (!matrix) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Role Definitions</h2>

            <div className="space-y-3">
                {matrix.roles.map((role) => (
                    <Card key={role.role}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{role.role}</CardTitle>
                                <Badge className={rbacService.getRoleColor(role.role)}>
                                    {role.permissions.length} perms
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {role.description && (
                                <p className="text-sm text-muted-foreground">
                                    {role.description}
                                </p>
                            )}

                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <div>
                                    Created:{" "}
                                    {new Date(role.created_at).toLocaleDateString()}
                                </div>
                                <div>
                                    Updated:{" "}
                                    {new Date(role.updated_at).toLocaleDateString()}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-semibold mb-2 uppercase">
                                    Permissions:
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {role.permissions.map((perm) => (
                                        <Badge key={perm} variant="outline" className="justify-center">
                                            {perm}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

/**
 * Example 6: Permission Audit Trail
 * Show which roles have specific permission categories
 */
export function PermissionAuditTrail() {
    const { matrix } = useRbacMatrix();

    if (!matrix) return null;

    // Group permissions by category (study.*, user.*, etc.)
    const permissionsByCategory: Record<string, string[]> = {};
    matrix.permission_catalog.forEach((perm) => {
        const category = perm.split(".")[0] || "other";
        if (!permissionsByCategory[category]) {
            permissionsByCategory[category] = [];
        }
        permissionsByCategory[category].push(perm);
    });

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Permission Categories</h2>

            {Object.entries(permissionsByCategory).map(([category, perms]) => (
                <Card key={category}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base capitalize">{category}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {perms.map((perm) => {
                            const rolesWithPerm = matrix.roles.filter((r) =>
                                r.permissions.includes(perm)
                            );

                            return (
                                <div key={perm} className="text-sm">
                                    <p className="font-mono font-semibold mb-1">{perm}</p>
                                    <div className="flex flex-wrap gap-1">
                                        {rolesWithPerm.map((role) => (
                                            <Badge
                                                key={role.role}
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {role.role}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

/**
 * Example 7: Complete Integration Example
 * Shows all patterns together in one dashboard
 */
export function FullRbacDashboard() {
    return (
        <div className="p-8 space-y-8 max-w-7xl">
            <div>
                <h1 className="text-4xl font-bold mb-2">RBAC Dashboard</h1>
                <p className="text-muted-foreground">
                    Complete view of roles, permissions, and access control
                </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <RbacStatsCard />
            </div>

            {/* Main Content */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="definitions">Definitions</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="compare">Compare</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                    <RoleAccessDashboard />
                </TabsContent>

                <TabsContent value="definitions" className="space-y-4 mt-4">
                    <RoleDefinitions />
                </TabsContent>

                <TabsContent value="categories" className="space-y-4 mt-4">
                    <PermissionAuditTrail />
                </TabsContent>

                <TabsContent value="compare" className="space-y-4 mt-4">
                    <div className="space-y-6">
                        <RoleComparison role1="admin" role2="user" />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

/**
 * Export all example patterns
 */
export const ExamplePatterns = {
    RoleAccessDashboard,
    PermissionVerifier,
    RoleComparison,
    RbacStatsCard,
    RoleDefinitions,
    PermissionAuditTrail,
    FullRbacDashboard,
};
