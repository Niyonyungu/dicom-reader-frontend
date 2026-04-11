"use client";

/**
 * Backend Health Check Page
 * Quick diagnostic page to test backend connection and debug 500 errors
 * 
 * Route: /debug/backend or /dashboard/debug
 */

import { BackendHealthCheck } from "@/lib/backend-debug";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function BackendDebugPage() {
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Backend Debug Dashboard</h1>
                    <p className="text-gray-600 mt-2">
                        Diagnose connection issues, authentication problems, and API errors
                    </p>
                </div>

                {/* Health Check */}
                <BackendHealthCheck />

                {/* Troubleshooting Guide */}
                <Card>
                    <CardHeader>
                        <CardTitle>🔧 Troubleshooting Guide</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <h3 className="font-semibold">If Backend is not responding:</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>Check backend is running (should be on port 8000)</li>
                                <li>Verify <code className="bg-gray-100 px-1">NEXT_PUBLIC_API_BASE_URL</code> in <code className="bg-gray-100 px-1">.env</code></li>
                                <li>Check firewall isn't blocking port 8000</li>
                                <li>Try: <code className="bg-gray-100 px-1">curl http://localhost:8000/api/v1/health</code></li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-semibold">If token is expired:</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>Logout and login again from the Login page</li>
                                <li>Clear browser localStorage: <code className="bg-gray-100 px-1">localStorage.clear()</code></li>
                                <li>Close DevTools and refresh page</li>
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-semibold">If patients endpoint returns 500:</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                <li>Check backend terminal for error message</li>
                                <li>Verify database is running (PostgreSQL)</li>
                                <li>Check backend .env file has DATABASE_URL</li>
                                <li>Look at Network tab response body for details</li>
                            </ul>
                        </div>

                        <Alert>
                            <AlertTitle>💡 Pro Tip</AlertTitle>
                            <AlertDescription>
                                Open DevTools (F12) → Network tab, then reload. Click the failed request to see full response body - this usually contains the actual backend error.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                {/* Common Errors */}
                <Card>
                    <CardHeader>
                        <CardTitle>Common Error Codes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-sm">
                            <div className="border-b pb-2">
                                <p className="font-semibold text-red-600">500 Internal Server Error</p>
                                <p className="text-gray-600">Backend has an error. Check backend logs and database connection.</p>
                            </div>
                            <div className="border-b pb-2">
                                <p className="font-semibold text-orange-600">401 Unauthorized</p>
                                <p className="text-gray-600">Token invalid or expired. Clear localStorage and login again.</p>
                            </div>
                            <div className="border-b pb-2">
                                <p className="font-semibold text-blue-600">403 Forbidden</p>
                                <p className="text-gray-600">You don't have permission. Check user role and permissions.</p>
                            </div>
                            <div className="border-b pb-2">
                                <p className="font-semibold text-purple-600">422 Unprocessable Entity</p>
                                <p className="text-gray-600">Validation error. Check request format and required fields.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
