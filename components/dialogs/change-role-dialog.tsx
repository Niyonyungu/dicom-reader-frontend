/**
 * Change Role Dialog
 * Modal for changing a user's role
 */

"use client";

import { useState } from "react";
import { UserResponse, UserRole } from "@/types/user";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export interface ChangeRoleDialogProps {
    user: UserResponse;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (userId: number, newRole: UserRole) => Promise<void>;
    isLoading?: boolean;
}

export function ChangeRoleDialog({
    user,
    isOpen,
    onOpenChange,
    onSubmit,
    isLoading = false,
}: ChangeRoleDialogProps) {
    const [newRole, setNewRole] = useState<UserRole>(user.role);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        setError(null);

        if (!newRole || newRole === user.role) {
            setError("Please select a different role");
            return;
        }

        try {
            await onSubmit(user.id, newRole);
            onOpenChange(false);
        } catch (err: any) {
            setError(err.message || "Failed to change role");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Change User Role</DialogTitle>
                    <DialogDescription>
                        Update role for {user.full_name} ({user.email})
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
                        <Label htmlFor="role">New Role</Label>
                        <Select
                            value={newRole}
                            onValueChange={(value) => setNewRole(value as UserRole)}
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
                        <p className="text-xs text-muted-foreground">
                            Current role: <strong>{user.role}</strong>
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? "Updating..." : "Update Role"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
