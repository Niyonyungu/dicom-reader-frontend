/**
 * Auth Guard Component
 * Protects routes by requiring authentication
 * Redirects unauthenticated users to /login
 * Shows loading state during session restoration
 * Displays permission denied message for unauthorized access
 *
 * Usage - Wrap protected routes:
 * ```tsx
 * <AuthGuard requiredPermissions={["study.read"]}>
 *   <StudyViewer />
 * </AuthGuard>
 * ```
 *
 * Or as a condition:
 * ```tsx
 * function ProtectedPage() {
 *   const { isAuthenticated, isLoading } = useAuth();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (!isAuthenticated) return <Navigate to="/login" />;
 *
 *   return <Dashboard />;
 * }
 * ```
 */

"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Spinner } from "@/components/ui/spinner";

export interface AuthGuardProps {
    children: ReactNode;
    /** Optional - required single permission to access */
    requiredPermission?: string;
    /** Optional - required any of these permissions to access */
    requiredPermissions?: string[];
    /** Optional - fallback component when permission denied */
    fallback?: ReactNode;
    /** Optional - route to redirect if not authenticated */
    redirectTo?: string;
}

/**
 * Auth Guard Component
 *
 * Example usage with required permissions:
 * ```tsx
 * <AuthGuard requiredPermission="study.read">
 *   <StudyList />
 * </AuthGuard>
 * ```
 *
 * Example for permission denied fallback:
 * ```tsx
 * <AuthGuard
 *   requiredPermission="admin.view"
 *   fallback={<div>You don't have access to this section</div>}
 * >
 *   <AdminPanel />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({
    children,
    requiredPermission,
    requiredPermissions,
    fallback,
    redirectTo = "/login",
}: AuthGuardProps) {
    const router = useRouter();
    const { isAuthenticated, isLoading, can, canAny } = useAuth();
    const [hasPermission, setHasPermission] = useState(true);

    // Check permissions and handle redirects
    useEffect(() => {
        // Still loading session
        if (isLoading) return;

        // Not authenticated - redirect to login
        if (!isAuthenticated) {
            router.push(redirectTo);
            return;
        }

        // Check for permission requirements
        if (requiredPermission) {
            const allowed = can(requiredPermission);
            setHasPermission(allowed);
            if (!allowed) {
                console.warn(
                    `[AuthGuard] User lacks required permission: ${requiredPermission}`
                );
            }
        } else if (requiredPermissions && requiredPermissions.length > 0) {
            const allowed = canAny(requiredPermissions);
            setHasPermission(allowed);
            if (!allowed) {
                console.warn(
                    `[AuthGuard] User lacks required permissions:`,
                    requiredPermissions
                );
            }
        }
    }, [isLoading, isAuthenticated, router, requiredPermission, requiredPermissions, can, canAny, redirectTo]);

    // Show loading state while session is being restored
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

    // Not authenticated - will be redirected by useEffect
    if (!isAuthenticated) {
        return null;
    }

    // Permission denied
    if (!hasPermission) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold">Access Denied</h1>
                        <p className="text-muted-foreground">
                            You don't have permission to access this page.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/")}
                        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // All checks passed - render children
    return <>{children}</>;
}
