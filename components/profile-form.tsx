/**
 * Profile Form Component
 * Self-service profile editor for any authenticated user
 * Only allows editing email and full_name
 */

"use client";

import { useState, useEffect } from "react";
import { UserResponse } from "@/types/user";
import {
    validateEmail,
    validateFullName,
} from "@/lib/form-validation";
import { handleApiError } from "@/lib/api-error-handler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export interface ProfileFormProps {
    /** Current user data */
    user: UserResponse;
    /** Called when form is submitted */
    onSubmit: (data: { email?: string; full_name?: string }) => Promise<void>;
    /** Loading state */
    isLoading?: boolean;
}

export function ProfileForm({
    user,
    onSubmit,
    isLoading = false,
}: ProfileFormProps) {
    // Form state
    const [formData, setFormData] = useState({
        email: user.email,
        full_name: user.full_name,
    });

    // UI state
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    // Track if form has changes
    useEffect(() => {
        const hasChanges =
            formData.email !== user.email || formData.full_name !== user.full_name;
        setIsDirty(hasChanges);
    }, [formData, user]);

    /**
     * Validate form before submission
     */
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Validate email
        const emailError = validateEmail(formData.email);
        if (emailError) newErrors.email = emailError;

        // Validate full name
        const nameError = validateFullName(formData.full_name);
        if (nameError) newErrors.full_name = nameError;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Handle form submission
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError(null);

        if (!validateForm()) {
            return;
        }

        try {
            // Only send changed fields
            const updateData: any = {};
            if (formData.email !== user.email) {
                updateData.email = formData.email;
            }
            if (formData.full_name !== user.full_name) {
                updateData.full_name = formData.full_name;
            }

            await onSubmit(updateData);
        } catch (error) {
            const handled = handleApiError(error);

            if (handled.status === 409) {
                const message = "This email is already in use";
                setErrors({
                    ...errors,
                    email: message,
                });
                toast.error(message);
            } else if (handled.status === 400) {
                // Usually "trying to send forbidden fields"
                setApiError(handled.message);
                toast.error(handled.message);
            } else if (handled.isValidation && handled.fieldErrors) {
                setErrors(handled.fieldErrors);
                toast.error("Validation error. Please check your input.");
            } else {
                setApiError(handled.message);
                toast.error(handled.message);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* API Error Alert */}
            {apiError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{apiError}</AlertDescription>
                </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setApiError(null);
                    }}
                    disabled={isLoading}
                    aria-invalid={!!errors.email}
                    className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                )}
                <p className="text-xs text-muted-foreground">
                    This is the email address associated with your account
                </p>
            </div>

            {/* Full Name Field */}
            <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={(e) => {
                        setFormData({ ...formData, full_name: e.target.value });
                        setApiError(null);
                    }}
                    disabled={isLoading}
                    aria-invalid={!!errors.full_name}
                    className={errors.full_name ? "border-destructive" : ""}
                />
                {errors.full_name && (
                    <p className="text-sm text-destructive">{errors.full_name}</p>
                )}
                <p className="text-xs text-muted-foreground">
                    Your display name for the application
                </p>
            </div>

            {/* Role Display (Read-only) */}
            <div className="space-y-2">
                <Label>Role</Label>
                <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium capitalize">{user.role}</p>
                    </CardContent>
                </Card>
                <p className="text-xs text-muted-foreground">
                    Your role is managed by administrators
                </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-2">
                <Button
                    type="submit"
                    disabled={isLoading || !isDirty}
                    className="gap-2"
                >
                    {isLoading ? "Saving..." : "Save Changes"}
                </Button>
                {isDirty && (
                    <p className="text-xs text-amber-600 self-center">
                        You have unsaved changes
                    </p>
                )}
            </div>
        </form>
    );
}
