/**
 * Clinical UI Helpers
 * Reusable components for common patterns:
 * - Loading states with skeleton
 * - Empty states
 * - Permission denied message (403)
 * - Error states with retry
 */

"use client";

import React from "react";
import { AlertCircle, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ============================================================================
// LOADING STATES
// ============================================================================

/**
 * Loading skeleton for studies table
 */
export function StudiesLoadingSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
    );
}

/**
 * Loading skeleton for DICOM instances list
 */
export function DicomLoadingSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
            ))}
        </div>
    );
}

/**
 * Loading skeleton for measurements list
 */
export function MeasurementsLoadingSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
            ))}
        </div>
    );
}

/**
 * Generic loading skeleton
 */
export function LoadingSkeleton({ count = 5, height = "h-12" }: { count?: number; height?: string }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <Skeleton key={i} className={`w-full ${height}`} />
            ))}
        </div>
    );
}

// ============================================================================
// EMPTY STATES
// ============================================================================

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    action?: {
        label: string;
        onClick: () => void;
    };
}

/**
 * Generic empty state component
 */
export function EmptyState({
    title,
    description,
    icon,
    action,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 text-muted-foreground opacity-50">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description && (
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                    {description}
                </p>
            )}
            {action && (
                <Button onClick={action.onClick} className="mt-4" variant="outline">
                    {action.label}
                </Button>
            )}
        </div>
    );
}

/**
 * Empty state for studies list
 */
export function NoStudiesState({ onAddStudy }: { onAddStudy?: () => void }) {
    return (
        <EmptyState
            title="No studies found"
            description="Get started by creating a new study or uploading DICOM files."
            action={
                onAddStudy
                    ? { label: "Create Study", onClick: onAddStudy }
                    : undefined
            }
        />
    );
}

/**
 * Empty state for DICOM list
 */
export function NoDicomState({ onUpload }: { onUpload?: () => void }) {
    return (
        <EmptyState
            title="No DICOM files"
            description="Upload DICOM files to this study to get started."
            action={
                onUpload
                    ? { label: "Upload Files", onClick: onUpload }
                    : undefined
            }
        />
    );
}

/**
 * Empty state for measurements
 */
export function NoMeasurementsState() {
    return (
        <EmptyState
            title="No measurements"
            description="Create measurements on DICOM images to get started."
        />
    );
}

// ============================================================================
// ERROR STATES
// ============================================================================

interface ErrorStateProps {
    title?: string;
    message: string;
    onRetry?: () => void;
    onDismiss?: () => void;
}

/**
 * Generic error state component
 */
export function ErrorState({
    title = "Something went wrong",
    message,
    onRetry,
    onDismiss,
}: ErrorStateProps) {
    return (
        <Alert className="border-red-200 bg-red-50 mb-4">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <div className="ml-3">
                <h4 className="font-semibold text-red-800">{title}</h4>
                <AlertDescription className="text-red-700 text-sm mt-1">
                    {message}
                </AlertDescription>
                <div className="flex gap-2 mt-3">
                    {onRetry && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onRetry}
                            className="h-7 text-xs"
                        >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Retry
                        </Button>
                    )}
                    {onDismiss && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onDismiss}
                            className="h-7 text-xs"
                        >
                            Dismiss
                        </Button>
                    )}
                </div>
            </div>
        </Alert>
    );
}

/**
 * Network error state
 */
export function NetworkError({
    onRetry,
}: {
    onRetry?: () => void;
}) {
    return (
        <ErrorState
            title="Network Error"
            message="Unable to reach the server. Please check your internet connection and try again."
            onRetry={onRetry}
        />
    );
}

/**
 * Server error state
 */
export function ServerError({
    message = "The server encountered an error. Please contact support.",
    onRetry,
}: {
    message?: string;
    onRetry?: () => void;
}) {
    return (
        <ErrorState
            title="Server Error"
            message={message}
            onRetry={onRetry}
        />
    );
}

// ============================================================================
// PERMISSION DENIED (403)
// ============================================================================

interface PermissionDeniedProps {
    permission?: string;
    feature?: string;
    message?: string;
    returnTo?: {
        label: string;
        onClick: () => void;
    };
}

/**
 * Permission denied component (403)
 * Use when user lacks required permission
 */
export function PermissionDenied({
    permission,
    feature,
    message,
    returnTo,
}: PermissionDeniedProps) {
    const defaultMessage = permission
        ? `You don't have permission to access this resource (missing: ${permission})`
        : feature
            ? `You don't have permission to ${feature}`
            : message || "You don't have permission to access this resource.";

    return (
        <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900">
                    <Lock className="h-5 w-5" />
                    Access Denied
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-amber-800 text-sm mb-4">{defaultMessage}</p>
                {returnTo && (
                    <Button
                        onClick={returnTo.onClick}
                        variant="outline"
                        size="sm"
                        className="text-amber-900 border-amber-200"
                    >
                        {returnTo.label}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Banner-style permission denied (compact)
 */
export function PermissionDeniedBanner({
    permission,
}: {
    permission: string;
}) {
    return (
        <Alert className="border-amber-200 bg-amber-50 mb-4">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
                Missing permission: <code className="bg-amber-100 px-1 rounded text-xs">{permission}</code>
            </AlertDescription>
        </Alert>
    );
}

// ============================================================================
// REQUEST ID LOGGING (Development)
// ============================================================================

/**
 * Show request ID in development for troubleshooting
 */
export function RequestIdBadge({ requestId }: { requestId?: string }) {
    if (process.env.NODE_ENV !== "development" || !requestId) {
        return null;
    }

    return (
        <div className="mt-2 p-2 bg-slate-100 rounded text-xs font-mono text-slate-600">
            <span className="font-semibold">Request ID:</span> {requestId}
        </div>
    );
}

// ============================================================================
// FILE UPLOAD STATES
// ============================================================================

interface UploadProgressProps {
    progress: number;
    fileName?: string;
}

/**
 * Upload progress indicator
 */
export function UploadProgress({ progress, fileName }: UploadProgressProps) {
    return (
        <div className="space-y-2">
            {fileName && (
                <p className="text-sm text-muted-foreground">Uploading: {fileName}</p>
            )}
            <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <p className="text-xs text-muted-foreground text-right">{progress}%</p>
        </div>
    );
}

export const clinicalUiHelpers = {
    StudiesLoadingSkeleton,
    DicomLoadingSkeleton,
    MeasurementsLoadingSkeleton,
    LoadingSkeleton,
    EmptyState,
    NoStudiesState,
    NoDicomState,
    NoMeasurementsState,
    ErrorState,
    NetworkError,
    ServerError,
    PermissionDenied,
    PermissionDeniedBanner,
    RequestIdBadge,
    UploadProgress,
};
