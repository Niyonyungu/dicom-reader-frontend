/**
 * Dashboard Profile Page
 * User profile management route
 */

import { ProfilePage } from "@/components/profile-page";

export const metadata = {
    title: "Profile | DICOM Viewer",
    description: "Manage your account settings and profile",
};

export default function Page() {
    return (
        <div className="max-w-2xl mx-auto">
            <ProfilePage />
        </div>
    );
}
