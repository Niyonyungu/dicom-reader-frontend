/**
 * RBAC Matrix Settings Page
 * Admin-only page for viewing role-based access control configuration
 * Route: /dashboard/settings/rbac
 */

import { Metadata } from "next";
import { RbacMatrixViewer } from "@/components/rbac-matrix-viewer";

export const metadata: Metadata = {
    title: "RBAC Matrix | Settings",
    description: "View role-based access control configuration",
};

/**
 * RBAC Settings Page
 * Displays the role → permission matrix from database
 * 
 * Access Control:
 * - Route is visible to all authenticated users
 * - Component checks admin role before rendering
 * - Non-admin users see permission denied message
 */
export default function RbacPage() {
    return (
        <div className="min-h-screen bg-background">
            <RbacMatrixViewer />
        </div>
    );
}
