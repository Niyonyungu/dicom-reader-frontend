/**
 * Users Management Page
 * Complete user CRUD interface for admin and service roles
 *
 * Features:
 * - List users with pagination
 * - Create new users
 * - Edit user details
 * - Change user role
 * - Reset user password
 * - Delete users (except self)
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { userService } from "@/services/user-service";
import { UserResponse, UserListResponse, UserFormData, UserCreate, UserUpdate, UserRole } from "@/types/user";
import { handleApiError } from "@/lib/api-error-handler";
import { PermissionRouteGuard } from "@/components/permission-route-guard";
import { ChangeRoleDialog } from "@/components/dialogs/change-role-dialog";
import { ResetPasswordDialog } from "@/components/dialogs/reset-password-dialog";
import { UserForm } from "@/components/user-form";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    MoreHorizontal,
    Plus,
    Edit,
    Shield,
    Lock,
    Trash2,
    AlertCircle,
    Loader2,
} from "lucide-react";

export function UsersPage() {
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const [pathname, setPathname] = useState("");

    useEffect(() => {
        setPathname("/dashboard/settings/users");
    }, []);

    // List state
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 20,
        total: 0,
    });

    // Create/Edit dialog state
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    // Change Role dialog state
    const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false);
    const [roleChangeUser, setRoleChangeUser] = useState<UserResponse | null>(null);
    const [roleChangeLoading, setRoleChangeLoading] = useState(false);

    // Reset Password dialog state
    const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
    const [resetPasswordUser, setResetPasswordUser] = useState<UserResponse | null>(null);
    const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteUser, setDeleteUser] = useState<UserResponse | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Success message
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    /**
     * Fetch users list
     */
    const fetchUsers = async (page: number = 1) => {
        try {
            setListError(null);
            setListLoading(true);
            const response = await userService.listUsers(page, pagination.pageSize);
            setUsers(response.items);
            setPagination({
                page: response.page,
                pageSize: response.page_size,
                total: response.total,
            });
        } catch (error) {
            const handled = handleApiError(error);
            setListError(handled.message);
        } finally {
            setListLoading(false);
        }
    };

    /**
     * Load users on mount
     */
    useEffect(() => {
        fetchUsers();
    }, []);

    /**
     * Handle create user
     */
    const handleCreateUser = async (data: UserFormData) => {
        try {
            setFormLoading(true);
            const createData: UserCreate = {
                email: data.email,
                full_name: data.full_name,
                password: data.password || "",
                role: data.role,
                is_active: data.is_active,
                is_verified: data.is_verified,
            };
            await userService.createUser(createData);
            setShowCreateDialog(false);
            setSuccessMessage("User created successfully");
            fetchUsers(pagination.page);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            throw error;
        } finally {
            setFormLoading(false);
        }
    };

    /**
     * Handle edit user
     */
    const handleEditUser = async (data: UserFormData) => {
        if (!editingUser) return;

        try {
            setFormLoading(true);
            const updateData: UserUpdate = {
                email: data.email,
                full_name: data.full_name,
                role: data.role,
                is_active: data.is_active,
                is_verified: data.is_verified,
            };

            // Only include password if provided
            if (data.password) {
                // For password changes, need to use the password endpoint
                // This is handled separately in Prompt 5
                updateData;
            }

            await userService.updateUser(editingUser.id, updateData);
            setEditingUser(null);
            setSuccessMessage("User updated successfully");
            fetchUsers(pagination.page);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            throw error;
        } finally {
            setFormLoading(false);
        }
    };

    /**
     * Handle change role
     */
    const handleChangeRole = async (userId: number, newRole: UserRole) => {
        try {
            setRoleChangeLoading(true);
            await userService.changeUserRole(userId, newRole);
            setShowChangeRoleDialog(false);
            setRoleChangeUser(null);
            setSuccessMessage("User role updated successfully");
            fetchUsers(pagination.page);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            throw error;
        } finally {
            setRoleChangeLoading(false);
        }
    };

    /**
     * Handle reset password
     */
    const handleResetPassword = async (userId: number, newPassword: string) => {
        try {
            setResetPasswordLoading(true);
            await userService.resetUserPassword(userId, newPassword);
            setShowResetPasswordDialog(false);
            setResetPasswordUser(null);
            setSuccessMessage("Password reset successfully");
            fetchUsers(pagination.page);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            throw error;
        } finally {
            setResetPasswordLoading(false);
        }
    };

    /**
     * Handle delete user
     */
    const handleDeleteUser = async () => {
        if (!deleteUser) return;

        try {
            setDeleteLoading(true);
            await userService.deleteUser(deleteUser.id);
            setShowDeleteConfirm(false);
            setDeleteUser(null);
            setSuccessMessage("User deleted successfully");
            fetchUsers(pagination.page);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error) {
            const handled = handleApiError(error);
            if (handled.status === 400) {
                setListError("Cannot delete your own account");
            } else {
                setListError(handled.message);
            }
        } finally {
            setDeleteLoading(false);
        }
    };

    /**
     * Get total pages
     */
    const totalPages = Math.ceil(pagination.total / pagination.pageSize);

    /**
     * Check if user is own account
     */
    const isOwnAccount = (userId: number) => currentUser?.id === userId;

    if (!pathname) return null;

    return (
        <PermissionRouteGuard path={pathname}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Users</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage users and permissions
                        </p>
                    </div>
                    <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create User
                    </Button>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <Alert className="border-green-200 bg-green-50">
                        <AlertDescription className="text-green-800">
                            {successMessage}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Error Message */}
                {listError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{listError}</AlertDescription>
                    </Alert>
                )}

                {/* Users Table Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Users List</CardTitle>
                        <CardDescription>
                            Total: {pagination.total} users
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {listLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No users found
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell className="font-medium">
                                                        {user.email}
                                                        {isOwnAccount(user.id) && (
                                                            <Badge variant="secondary" className="ml-2">
                                                                You
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{user.full_name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">
                                                            {user.role}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-1">
                                                            {user.is_active && (
                                                                <Badge variant="default" className="bg-green-600">
                                                                    Active
                                                                </Badge>
                                                            )}
                                                            {!user.is_active && (
                                                                <Badge variant="secondary">Inactive</Badge>
                                                            )}
                                                            {user.is_verified && (
                                                                <Badge variant="secondary">Verified</Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() => setEditingUser(user)}
                                                                >
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Edit
                                                                </DropdownMenuItem>

                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setRoleChangeUser(user);
                                                                        setShowChangeRoleDialog(true);
                                                                    }}
                                                                >
                                                                    <Shield className="h-4 w-4 mr-2" />
                                                                    Change Role
                                                                </DropdownMenuItem>

                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setResetPasswordUser(user);
                                                                        setShowResetPasswordDialog(true);
                                                                    }}
                                                                >
                                                                    <Lock className="h-4 w-4 mr-2" />
                                                                    Reset Password
                                                                </DropdownMenuItem>

                                                                <DropdownMenuSeparator />

                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setDeleteUser(user);
                                                                        setShowDeleteConfirm(true);
                                                                    }}
                                                                    disabled={isOwnAccount(user.id)}
                                                                    className="text-destructive"
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center mt-6">
                                        <Pagination>
                                            <PaginationContent>
                                                {pagination.page > 1 && (
                                                    <PaginationItem>
                                                        <PaginationPrevious
                                                            onClick={() => fetchUsers(pagination.page - 1)}
                                                        />
                                                    </PaginationItem>
                                                )}

                                                {Array.from({ length: Math.min(5, totalPages) }).map(
                                                    (_, i) => {
                                                        const pageNum = i + 1;
                                                        return (
                                                            <PaginationItem key={pageNum}>
                                                                <PaginationLink
                                                                    onClick={() => fetchUsers(pageNum)}
                                                                    isActive={pagination.page === pageNum}
                                                                >
                                                                    {pageNum}
                                                                </PaginationLink>
                                                            </PaginationItem>
                                                        );
                                                    }
                                                )}

                                                {totalPages > 5 && (
                                                    <PaginationItem>
                                                        <PaginationEllipsis />
                                                    </PaginationItem>
                                                )}

                                                {pagination.page < totalPages && (
                                                    <PaginationItem>
                                                        <PaginationNext
                                                            onClick={() => fetchUsers(pagination.page + 1)}
                                                        />
                                                    </PaginationItem>
                                                )}
                                            </PaginationContent>
                                        </Pagination>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Create/Edit Dialog */}
                <Dialog open={showCreateDialog || !!editingUser} onOpenChange={(open) => {
                    if (!open) {
                        setShowCreateDialog(false);
                        setEditingUser(null);
                    }
                }}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingUser ? "Edit User" : "Create New User"}
                            </DialogTitle>
                            <DialogDescription>
                                {editingUser
                                    ? `Update details for ${editingUser.email}`
                                    : "Add a new user to the system"}
                            </DialogDescription>
                        </DialogHeader>

                        <UserForm
                            initialUser={editingUser || undefined}
                            onSubmit={editingUser ? handleEditUser : handleCreateUser}
                            isLoading={formLoading}
                        />
                    </DialogContent>
                </Dialog>

                {/* Change Role Dialog */}
                {roleChangeUser && (
                    <ChangeRoleDialog
                        user={roleChangeUser}
                        isOpen={showChangeRoleDialog}
                        onOpenChange={setShowChangeRoleDialog}
                        onSubmit={handleChangeRole}
                        isLoading={roleChangeLoading}
                    />
                )}

                {/* Reset Password Dialog */}
                {resetPasswordUser && (
                    <ResetPasswordDialog
                        user={resetPasswordUser}
                        isOpen={showResetPasswordDialog}
                        onOpenChange={setShowResetPasswordDialog}
                        onSubmit={handleResetPassword}
                        isLoading={resetPasswordLoading}
                    />
                )}

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete {deleteUser?.full_name} (
                                {deleteUser?.email})? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleteLoading}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteUser}
                                disabled={deleteLoading}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {deleteLoading ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </PermissionRouteGuard>
    );
}
