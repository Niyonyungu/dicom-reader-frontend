/**
 * RBAC Matrix Viewer Component
 * Read-only admin page displaying role → permission matrix
 */

"use client";

import { useState } from "react";
import { useRbacMatrix, useRbacStats } from "@/hooks/use-rbac-matrix";
import { rbacService } from "@/services/rbac-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Lock,
    AlertCircle,
    RefreshCw,
    Search,
    X,
    Shield,
    Grid2x2,
    List,
} from "lucide-react";

/**
 * RBAC Matrix Viewer
 * Main component showing role → permission matrix
 */
export function RbacMatrixViewer() {
    const {
        matrix,
        loading,
        error,
        isAdmin,
        retry,
        filters,
        search,
        setSelectedRole,
        clearFilters,
        getFilteredRoles,
        getFilteredPermissions,
    } = useRbacMatrix();

    const stats = useRbacStats(matrix);
    const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

    // Not admin
    if (!isAdmin) {
        return (
            <div className="p-8">
                <Alert className="border-amber-200 bg-amber-50">
                    <Lock className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                        Admin access required to view RBAC matrix. Only authenticated users with admin role can access this page.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Loading
    if (loading) {
        return (
            <div className="p-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">RBAC Matrix</h1>
                    <p className="text-muted-foreground mt-1">
                        Role-based access control configuration
                    </p>
                </div>
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    // Error
    if (error) {
        return (
            <div className="p-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">RBAC Matrix</h1>
                </div>
                <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                        <strong>Failed to load RBAC matrix:</strong> {error.message}
                    </AlertDescription>
                </Alert>
                <Button onClick={retry} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Retry
                </Button>
            </div>
        );
    }

    // No data
    if (!matrix) {
        return (
            <div className="p-8">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        No RBAC matrix data available. The backend may not have initialized the matrix yet.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const filteredRoles = getFilteredRoles();
    const filteredPermissions = getFilteredPermissions();
    const hasActiveFilters =
        filters.searchQuery || filters.selectedRole || filters.selectedPermission;

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">RBAC Matrix</h1>
                    </div>
                    <p className="text-muted-foreground">
                        View role-based access control configuration from database
                    </p>
                </div>
                <Button
                    onClick={retry}
                    variant="outline"
                    size="icon"
                    title="Refresh"
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-3xl font-bold text-primary">
                                {stats.totalRoles}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Total Roles</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-3xl font-bold text-primary">
                                {stats.totalPermissions}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Total Permissions
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-lg font-bold text-primary">
                                {stats.rolesWithMostPermissions}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Most Powerful</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-lg font-bold text-primary">
                                {stats.rolesWithLeastPermissions}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Most Restricted</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Search and Controls */}
            <Card>
                <CardContent className="pt-6 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search roles, permissions, descriptions..."
                            value={filters.searchQuery}
                            onChange={(e) => search(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Filter Chips */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-sm text-muted-foreground">Active filters:</span>
                            {filters.searchQuery && (
                                <Badge
                                    variant="secondary"
                                    className="gap-2 cursor-pointer"
                                    onClick={() => search("")}
                                >
                                    Search: {filters.searchQuery}
                                    <X className="h-3 w-3" />
                                </Badge>
                            )}
                            {filters.selectedRole && (
                                <Badge
                                    variant="secondary"
                                    className="gap-2 cursor-pointer"
                                    onClick={() => setSelectedRole()}
                                >
                                    Role: {filters.selectedRole}
                                    <X className="h-3 w-3" />
                                </Badge>
                            )}
                            <Button
                                onClick={clearFilters}
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs"
                            >
                                Clear All
                            </Button>
                        </div>
                    )}

                    {/* View Mode Toggle */}
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setViewMode("cards")}
                            variant={viewMode === "cards" ? "default" : "outline"}
                            size="sm"
                            className="gap-2"
                        >
                            <Grid2x2 className="h-4 w-4" />
                            Cards
                        </Button>
                        <Button
                            onClick={() => setViewMode("table")}
                            variant={viewMode === "table" ? "default" : "outline"}
                            size="sm"
                            className="gap-2"
                        >
                            <List className="h-4 w-4" />
                            Table
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Results Info */}
            {hasActiveFilters && (
                <div className="text-sm text-muted-foreground">
                    Showing {filteredRoles.length} of {matrix.roles.length} roles, matches{" "}
                    {filteredPermissions.length} permissions
                </div>
            )}

            {/* Empty State */}
            {filteredRoles.length === 0 && (
                <Card>
                    <CardContent className="pt-12 pb-12 text-center">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-semibold">No roles found</p>
                        <p className="text-muted-foreground mt-2">
                            Try adjusting your filters or search query
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Cards View */}
            {viewMode === "cards" && filteredRoles.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredRoles.map((role) => (
                        <Card
                            key={role.role}
                            className="hover:shadow-md transition-shadow"
                        >
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">{role.role}</CardTitle>
                                    <Badge className={rbacService.getRoleColor(role.role)}>
                                        {role.permissions.length} perms
                                    </Badge>
                                </div>
                                {role.description && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {role.description}
                                    </p>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Timestamps */}
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <div>
                                        Created: {new Date(role.created_at).toLocaleDateString()}
                                    </div>
                                    <div>
                                        Updated: {new Date(role.updated_at).toLocaleDateString()}
                                    </div>
                                </div>

                                {/* Permissions */}
                                <div>
                                    <p className="text-sm font-semibold mb-2">Permissions:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {role.permissions.map((perm) => (
                                            <Badge
                                                key={perm}
                                                variant="outline"
                                                className="text-xs cursor-pointer hover:bg-primary/10"
                                                onClick={() => {
                                                    search(perm);
                                                    setSelectedRole(role.role);
                                                }}
                                                title={rbacService.getPermissionDescription(perm)}
                                            >
                                                {perm}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Table View */}
            {viewMode === "table" && filteredRoles.length > 0 && (
                <div className="space-y-4">
                    {/* Roles Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Roles & Permissions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-muted">
                                        <TableRow>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Permission Count</TableHead>
                                            <TableHead className="max-w-xs">Permissions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRoles.map((role) => (
                                            <TableRow key={role.role}>
                                                <TableCell>
                                                    <Badge className={rbacService.getRoleColor(role.role)}>
                                                        {role.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {role.description || "—"}
                                                </TableCell>
                                                <TableCell className="text-center font-semibold">
                                                    {role.permissions.length}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {role.permissions.slice(0, 3).map((perm) => (
                                                            <Badge
                                                                key={perm}
                                                                variant="secondary"
                                                                className="text-xs"
                                                            >
                                                                {perm}
                                                            </Badge>
                                                        ))}
                                                        {role.permissions.length > 3 && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                +{role.permissions.length - 3} more
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Permissions Catalog */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Permission Catalog</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {filteredPermissions.map((perm) => (
                                    <Badge
                                        key={perm}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-primary/10"
                                        onClick={() => search(perm)}
                                        title={rbacService.getPermissionDescription(perm)}
                                    >
                                        {perm}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
