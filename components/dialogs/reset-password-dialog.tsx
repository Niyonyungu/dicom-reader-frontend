/**
 * Reset Password Dialog
 * Modal for resetting a user's password
 */

"use client";

import { useState } from "react";
import { UserResponse } from "@/types/user";
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthLabel } from "@/lib/password-validation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export interface ResetPasswordDialogProps {
    user: UserResponse;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (userId: number, newPassword: string) => Promise<void>;
    isLoading?: boolean;
}

export function ResetPasswordDialog({
    user,
    isOpen,
    onOpenChange,
    onSubmit,
    isLoading = false,
}: ResetPasswordDialogProps) {
    const [newPassword, setNewPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [passwordStrength, setPasswordStrength] = useState<any>(null);

    const handlePasswordChange = (value: string) => {
        setNewPassword(value);
        if (value) {
            const strength = validatePassword(value);
            setPasswordStrength(strength);
        } else {
            setPasswordStrength(null);
        }
    };

    const handleSubmit = async () => {
        setError(null);

        if (!newPassword) {
            setError("Please enter a new password");
            return;
        }

        const validation = validatePassword(newPassword);
        if (!validation.isValid) {
            setError(validation.errors[0]);
            return;
        }

        try {
            await onSubmit(user.id, newPassword);
            setNewPassword("");
            onOpenChange(false);
        } catch (err: any) {
            setError(err.message || "Failed to reset password");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                        Set a new password for {user.full_name} ({user.email})
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => handlePasswordChange(e.target.value)}
                            disabled={isLoading}
                            aria-invalid={!!error}
                            className={error ? "border-destructive" : ""}
                        />

                        {/* Password Strength Indicator */}
                        {newPassword && passwordStrength && (
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
                                <div className="space-y-1 max-h-48 overflow-y-auto">
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
                    </div>

                    <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
                        <p className="font-medium">Password Requirements:</p>
                        <ul className="mt-1 ml-4 list-disc text-xs space-y-0.5">
                            <li>Minimum 8 characters</li>
                            <li>At least one uppercase letter (A-Z)</li>
                            <li>At least one lowercase letter (a-z)</li>
                            <li>At least one number (0-9)</li>
                            <li>At least one special character (!@#$%^&*)</li>
                        </ul>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setNewPassword("");
                            onOpenChange(false);
                        }}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || !newPassword || (passwordStrength && !passwordStrength.isValid)}
                    >
                        {isLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
