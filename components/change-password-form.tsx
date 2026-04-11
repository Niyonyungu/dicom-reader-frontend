/**
 * Change Password Form Component
 * Self-service password change for authenticated users
 * Requires current password for security
 */

"use client";

import { useState } from "react";
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthLabel } from "@/lib/password-validation";
import { handleApiError } from "@/lib/api-error-handler";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

export interface ChangePasswordFormProps {
    /** Called when form is submitted */
    onSubmit: (oldPassword: string, newPassword: string) => Promise<void>;
    /** Loading state */
    isLoading?: boolean;
}

export function ChangePasswordForm({
    onSubmit,
    isLoading = false,
}: ChangePasswordFormProps) {
    // Form state
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // UI state
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [showNewPasswordStrength, setShowNewPasswordStrength] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<any>(null);

    // Check password strength on change
    const handleNewPasswordChange = (value: string) => {
        setNewPassword(value);
        setShowNewPasswordStrength(value.length > 0);
        if (value) {
            const strength = validatePassword(value);
            setPasswordStrength(strength);
        } else {
            setPasswordStrength(null);
        }
    };

    /**
     * Validate form before submission
     */
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Validate old password
        if (!oldPassword) {
            newErrors.oldPassword = "Enter your current password";
        }

        // Validate new password is not empty
        if (!newPassword) {
            newErrors.newPassword = "Enter a new password";
        } else {
            // Validate complexity
            const validation = validatePassword(newPassword);
            if (!validation.isValid) {
                newErrors.newPassword = validation.errors[0];
            }
        }

        // Validate confirmation
        if (!confirmPassword) {
            newErrors.confirmPassword = "Confirm your new password";
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
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

        // Prevent submitting same password
        if (oldPassword === newPassword) {
            setApiError("New password must be different from current password");
            return;
        }

        try {
            await onSubmit(oldPassword, newPassword);
            // Clear form after success
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setShowNewPasswordStrength(false);
            setPasswordStrength(null);
        } catch (error) {
            const handled = handleApiError(error);

            if (handled.status === 400) {
                // Wrong old password
                const message = "Your current password is incorrect";
                setErrors({
                    ...errors,
                    oldPassword: message,
                });
                toast.error(message);
            } else if (handled.isValidation && handled.fieldErrors) {
                setErrors(handled.fieldErrors);
                toast.error("Password validation failed. Please check requirements.");
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

            {/* Current Password Field */}
            <div className="space-y-2">
                <Label htmlFor="oldPassword">Current Password</Label>
                <Input
                    id="oldPassword"
                    type="password"
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => {
                        setOldPassword(e.target.value);
                        setApiError(null);
                    }}
                    disabled={isLoading}
                    aria-invalid={!!errors.oldPassword}
                    className={errors.oldPassword ? "border-destructive" : ""}
                />
                {errors.oldPassword && (
                    <p className="text-sm text-destructive">{errors.oldPassword}</p>
                )}
            </div>

            {/* New Password Field */}
            <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => handleNewPasswordChange(e.target.value)}
                    disabled={isLoading}
                    aria-invalid={!!errors.newPassword}
                    className={errors.newPassword ? "border-destructive" : ""}
                />

                {/* Password Strength Indicator */}
                {showNewPasswordStrength && newPassword && passwordStrength && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${getPasswordStrengthColor(passwordStrength.score)}`}
                                    style={{
                                        width: `${(passwordStrength.score / 5) * 100}%`,
                                    }}
                                />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">
                                {getPasswordStrengthLabel(passwordStrength.score)}
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

                {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword}</p>
                )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    aria-invalid={!!errors.confirmPassword}
                    className={errors.confirmPassword ? "border-destructive" : ""}
                />
                {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
            </div>

            {/* Requirements Info */}
            <div className="rounded-md bg-blue-50 p-4 text-sm">
                <p className="font-medium text-blue-900">Password Requirements:</p>
                <ul className="mt-2 ml-4 list-disc text-blue-800 space-y-1 text-xs">
                    <li>Minimum 8 characters</li>
                    <li>At least one uppercase letter (A-Z)</li>
                    <li>At least one lowercase letter (a-z)</li>
                    <li>At least one number (0-9)</li>
                    <li>At least one special character (!@#$%^&*)</li>
                    <li>Different from your current password</li>
                </ul>
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                disabled={isLoading || !oldPassword || !newPassword || !confirmPassword}
            >
                {isLoading ? "Changing..." : "Change Password"}
            </Button>
        </form>
    );
}
