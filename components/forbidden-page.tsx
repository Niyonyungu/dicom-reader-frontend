/**
 * Forbidden/403 Page
 * Shown when user lacks permission to access a resource
 */

"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ForbiddenPageProps {
    /** Custom message to display */
    message?: string;
    /** Show back button */
    showBackButton?: boolean;
}

export function ForbiddenPage({
    message = "You don't have permission to access this resource.",
    showBackButton = true,
}: ForbiddenPageProps) {
    const router = useRouter();

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-md border-destructive/50 bg-destructive/5">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                        <CardTitle className="text-2xl">Access Denied</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Error details */}
                    <div className="space-y-2">
                        <p className="text-foreground font-medium">HTTP 403 - Forbidden</p>
                        <p className="text-muted-foreground">{message}</p>
                    </div>

                    {/* Help text */}
                    <div className="rounded-md bg-muted p-4 text-sm">
                        <p className="text-muted-foreground">
                            If you believe you should have access to this resource, please contact your administrator.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        {showBackButton && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.back()}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Go Back
                            </Button>
                        )}
                        <Button
                            size="sm"
                            onClick={() => router.push("/dashboard")}
                            className="flex items-center gap-2"
                        >
                            <Home className="h-4 w-4" />
                            Dashboard
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
