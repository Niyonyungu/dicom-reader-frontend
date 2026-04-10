/**
 * Permission-Based Route Guard
 * Checks permissions/roles against defined route requirements
 * Automatically redirects to forbidden page or custom fallback
 *
 * Usage:
 * ```tsx
 * <PermissionRouteGuard path={pathname} fallback={<NotAllowed />}>
 *   <Page />
 * </PermissionRouteGuard>
 * ```
 */

"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getRouteRequirements, UserRole } from "@/lib/permissions";
import { ForbiddenPage } from "@/components/forbidden-page";
import { Spinner } from "@/components/ui/spinner";

export interface PermissionRouteGuardProps {
    /** Route path to check permissions for */
    path: string;
    /** Content to show if authorized */
    children: ReactNode;
    /** Fallback component when forbidden (default: ForbiddenPage) */
    fallback?: ReactNode;
}

/**
 * Route-based permission guard
 * Automatically checks if user has access to the current route
 *
 * @example
 * ```tsx
 * // In a page.tsx
 * export default function StudyPage() {
 *   const pathname = usePathname();
 *   return (
 *     <PermissionRouteGuard path={pathname}>
 *       <StudyList />
 *     </PermissionRouteGuard>
 *   );
 * }
 * ```
 */
export function PermissionRouteGuard({
    path,
    children,
    fallback,
}: PermissionRouteGuardProps) {
    const { isLoading, isAuthenticated, can, canAny, user } = useAuth();
    const [hasAccess, setHasAccess] = useState(true);

    useEffect(() => {
        // Still loading
        if (isLoading) return;

        // Not authenticated - access guard will handle redirect
        if (!isAuthenticated) {
            return;
        }

        // Get route requirements
        const requirements = getRouteRequirements(path);
        if (!requirements) {
            // No explicit requirements - allow access
            setHasAccess(true);
            return;
        }

        // Check permissions (all required)
        if (requirements.permissions && requirements.permissions.length > 0) {
            const hasAllPermissions = requirements.permissions.every((perm) => can(perm));
            if (!hasAllPermissions) {
                setHasAccess(false);
                return;
            }
        }

        // Check roles (any required)
        if (requirements.roles && requirements.roles.length > 0) {
            const userRole = (user?.role as UserRole) || null;
            const hasRole = requirements.roles.includes(userRole!);
            if (!hasRole) {
                setHasAccess(false);
                return;
            }
        }

        setHasAccess(true);
    }, [isLoading, isAuthenticated, path, can, user?.role]);

    // Still loading session
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Spinner className="mx-auto mb-4 h-8 w-8" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - access guard will handle
    if (!isAuthenticated) {
        return null;
    }

    // Access denied
    if (!hasAccess) {
        if (fallback) return <>{fallback}</>;
        return <ForbiddenPage />;
    }

    // Access granted
    return <>{children}</>;
}
