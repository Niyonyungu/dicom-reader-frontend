/**
 * Users Page - Ready to use
 * 
 * Copy this file to: app/dashboard/settings/users/page.tsx
 * Then the route /dashboard/settings/users will automatically work
 */

import { Metadata } from "next";
import { UsersPage } from "@/components/users-page";

export const metadata: Metadata = {
    title: "Users | DICOM Viewer",
    description: "Manage users and permissions",
};

export default function Page() {
    return <UsersPage />;
}
