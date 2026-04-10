/**
 * User Form Component
 * Create and edit form for user management
 * Used by admins and service accounts only
 */

"use client";

import { useState, useEffect } from "react";
import { UserFormData, UserResponse } from "@/types/user";
import { validatePassword } from "@/lib/password-validation";
import { handleApiError } from "@/lib/api-error-handler";
import {
    validateEmail,
    validateFullName,
} from "@/lib/form-validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

export interface UserFormProps {
    /** Existing user for edit mode (leave empty for create) */
    initialUser?: UserResponse;
    /** Called when form is submitted */
    onSubmit: (data: UserFormData) => Promise<void>;
    /** Loading state */
    isLoading?: boolean;
}

export function UserForm({
    initialUser,
    onSubmit,
    isLoading = false,
}: UserFormProps) {
    const isEditMode = !!initialUser;

    // Form state
    const [formData, setFormData] = useState<UserFormData>({
        email: initialUser?.email || "",
        full_name: initialUser?.full_name || "",
        password: "",
        role: initialUser?.role || "radiologist",
        is_active: initialUser?.is_active ?? true,
        is_verified: initialUser?.is_verified ?? false,
    });

    // Validation state
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [passwordStrength, setPasswordStrength] = useState<any>(null);

    // Check password strength on change
    useEffect(() => {
        if (formData.password) {
            const strength = validatePassword(formData.password);
            setPasswordStrength(strength);
        } else {
            setPasswordStrength(null);
        }
    }, [formData.password]);

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

        // Validate password (required for create, optional for edit)
        if (!isEditMode || formData.password) {
            if (!formData.password && !isEditMode) {
                newErrors.password = "Password is required";
            } else if (formData.password) {
                const passError = validatePassword(formData.password);
                if (!passError.isValid) {
                    newErrors.password = passError.errors[0];
                }
            }
        }

        // Validate role
        if (!formData.role) {
            newErrors.role = "Role is required";
        }

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
            await onSubmit(formData);
        } catch (error) {
            const handled = handleApiError(error);

            // Handle specific error scenarios
            if (handled.isForbidden) {
                setApiError(`Permission denied: ${handled.message}`);
            } else if (handled.status === 409) {
                setErrors({
                    ...errors,
                    email: "This email is already in use",
                });
            } else if (handled.isValidation && handled.fieldErrors) {
                setErrors(handled.fieldErrors);
            } else {
                setApiError(handled.message);
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
                    onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={isLoading}
                    aria-invalid={!!errors.email}
                    className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                )}
            </div>

            {/* Full Name Field */}
            <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                    }
                    disabled={isLoading}
                    aria-invalid={!!errors.full_name}
                    className={errors.full_name ? "border-destructive" : ""}
                />
                {errors.full_name && (
                    <p className="text-sm text-destructive">{errors.full_name}</p>
                )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
                <Label htmlFor="password">
                    {isEditMode ? "New Password (leave empty to keep current)" : "Password"}
                </Label>
                <Input
                    id="password"
                    type="password"
                    placeholder={isEditMode ? "Leave empty to keep current" : "••••••••"}
                    value={formData.password}
                    onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                    }
                    disabled={isLoading}
                    aria-invalid={!!errors.password}
                    className={errors.password ? "border-destructive" : ""}
                />

                {/* Password Strength Indicator */}
                {formData.password && passwordStrength && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${passwordStrength.score === 0
                                            ? "w-0 bg-destructive"
                                            : passwordStrength.score === 1
                                                ? "w-1/5 bg-red-500"
                                                : passwordStrength.score === 2
                                                    ? "w-2/5 bg-orange-500"
                                                    : passwordStrength.score === 3
                                                        ? "w-3/5 bg-yellow-500"
                                                        : passwordStrength.score === 4
                                                            ? "w-4/5 bg-lime-500"
                                                            : "w-full bg-green-500"
                                        }`}
                                />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">
                                {passwordStrength.score}/5
                            </span>
                        </div>

                        {/* Password Requirements Checklist */}
                        <div className="space-y-1">
                            {passwordStrength.hints.map((hint: string, idx: number) => (
                                <div
                                    key={idx}
                                    className={`text-xs ${hint.startsWith("✓")
                                            ? "text-green-600"
                                            : "text-muted-foreground"
                                        }`}
                                >
                                    {hint}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                )}
            </div>

            {/* Role Field */}
            <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                    value={formData.role}
                    onValueChange={(value) =>
                        setFormData({ ...formData, role: value })
                    }
                    disabled={isLoading}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="radiologist">Radiologist</SelectItem>
                        <SelectItem value="imaging_technician">
                            Imaging Technician
                        </SelectItem>
                        <SelectItem value="radiographer">Radiographer</SelectItem>
                    </SelectContent>
                </Select>
                {errors.role && (
                    <p className="text-sm text-destructive">{errors.role}</p>
                )}
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 border-t pt-4">
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) =>
                            setFormData({ ...formData, is_active: checked as boolean })
                        }
                        disabled={isLoading}
                    />
                    <Label htmlFor="is_active" className="font-normal cursor-pointer">
                        Active
                    </Label>
                </div>

                <div className="flex items-center gap-2">
                    <Checkbox
                        id="is_verified"
                        checked={formData.is_verified}
                        onCheckedChange={(checked) =>
                            setFormData({ ...formData, is_verified: checked as boolean })
                        }
                        disabled={isLoading}
                    />
                    <Label htmlFor="is_verified" className="font-normal cursor-pointer">
                        Email Verified
                    </Label>
                </div>
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
            >
                {isLoading
                    ? isEditMode
                        ? "Updating..."
                        : "Creating..."
                    : isEditMode
                        ? "Update User"
                        : "Create User"}
            </Button>
        </form>
    );
}
