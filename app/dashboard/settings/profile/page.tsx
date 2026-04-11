/**
 * Profile Settings Page
 * Self-service profile and account management
 * Route: /dashboard/settings/profile
 */

import { ProfilePage } from "@/components/profile-page";

export const metadata = {
    title: "Profile Settings",
    description: "Manage your account and profile information",
};

export default function ProfileSettingsPage() {
    return (
        <div className="p-8">
            <ProfilePage />
        </div>
    );
}
