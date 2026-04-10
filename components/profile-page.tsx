/**
 * Profile Page
 * Self-service profile and password management
 * Available to all authenticated users
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { profileService } from "@/services/profile-service";
import { handleApiError } from "@/lib/api-error-handler";
import { ProfileForm } from "@/components/profile-form";
import { ChangePasswordForm } from "@/components/change-password-form";
import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export function ProfilePage() {
    const { user, refresh, isLoading: authLoading } = useAuth();
    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    if (!user) return null;

    /**
     * Handle profile update
     */
    const handleProfileSubmit = async (data: {
        email?: string;
        full_name?: string;
    }) => {
        try {
            setProfileLoading(true);
            await profileService.updateProfile(data);

            // Refresh user context to sync changes
            await refresh();

            setSuccessMessage("Profile updated successfully");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            throw error;
        } finally {
            setProfileLoading(false);
        }
    };

    /**
     * Handle password change
     */
    const handlePasswordSubmit = async (
        oldPassword: string,
        newPassword: string
    ) => {
        try {
            setPasswordLoading(true);
            await profileService.changePassword(oldPassword, newPassword);

            setSuccessMessage("Password changed successfully");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            throw error;
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <AuthGuard>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Account Settings</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your profile and account security
                    </p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            {successMessage}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Loading State */}
                {authLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Tabs defaultValue="profile" className="w-full">
                        {/* Tabs */}
                        <TabsList>
                            <TabsTrigger value="profile">Profile</TabsTrigger>
                            <TabsTrigger value="password">Password</TabsTrigger>
                        </TabsList>

                        {/* Profile Tab */}
                        <TabsContent value="profile">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profile Information</CardTitle>
                                    <CardDescription>
                                        Update your basic account information
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ProfileForm
                                        user={user}
                                        onSubmit={handleProfileSubmit}
                                        isLoading={profileLoading}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Password Tab */}
                        <TabsContent value="password">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Change Password</CardTitle>
                                    <CardDescription>
                                        Update your password to keep your account secure
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChangePasswordForm
                                        onSubmit={handlePasswordSubmit}
                                        isLoading={passwordLoading}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                )}

                {/* Account Summary Card */}
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="text-base">Account Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-medium">{user.email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Full Name:</span>
                            <span className="font-medium">{user.full_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Role:</span>
                            <span className="font-medium capitalize">{user.role}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span className="font-medium">
                                {user.is_active ? (
                                    <span className="text-green-600">Active</span>
                                ) : (
                                    <span className="text-red-600">Inactive</span>
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Email Verified:</span>
                            <span className="font-medium">
                                {user.is_verified ? (
                                    <span className="text-green-600">Yes</span>
                                ) : (
                                    <span className="text-amber-600">No</span>
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Member Since:</span>
                            <span className="font-medium">
                                {new Date(user.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthGuard>
    );
}
