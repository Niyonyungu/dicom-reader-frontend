"use client";

/**
 * Backend Health Check & Debugging Tool
 * 
 * Usage in browser console:
 * ```
 * import { checkBackendHealth } from '@/lib/backend-debug';
 * await checkBackendHealth();
 * ```
 * 
 * Or add to any page:
 * ```tsx
 * <BackendHealthCheck />
 * ```
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";

interface HealthCheckResult {
  test: string;
  status: "success" | "warning" | "error";
  message: string;
  details?: any;
  timestamp: string;
}

/**
 * Test if backend is responding at all
 */
export async function testBackendHealth(): Promise<HealthCheckResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const response = await fetch(`${baseUrl}/api/v1/health`);
    
    if (response.ok) {
      const data = await response.json();
      return {
        test: "Backend Alive",
        status: "success",
        message: `Backend is responding (${response.status})`,
        details: data,
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        test: "Backend Alive",
        status: "error",
        message: `Backend returned ${response.status}`,
        details: await response.text(),
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    return {
      test: "Backend Alive",
      status: "error",
      message: `Cannot reach backend at ${process.env.NEXT_PUBLIC_API_BASE_URL}`,
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Test authentication token
 */
export async function testAuthToken(): Promise<HealthCheckResult> {
  try {
    const token = localStorage.getItem("accessToken");
    
    if (!token) {
      return {
        test: "Auth Token",
        status: "warning",
        message: "No accessToken in localStorage - user not logged in",
        timestamp: new Date().toISOString(),
      };
    }

    // Decode token to check expiry (JWT is base64)
    const parts = token.split(".");
    if (parts.length !== 3) {
      return {
        test: "Auth Token",
        status: "error",
        message: "Invalid JWT token format",
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const decoded = JSON.parse(atob(parts[1]));
      const expiryTime = decoded.exp * 1000;
      const timeLeft = expiryTime - Date.now();
      const minutesLeft = Math.round(timeLeft / 1000 / 60);

      if (timeLeft < 0) {
        return {
          test: "Auth Token",
          status: "warning",
          message: `Token expired ${Math.abs(minutesLeft)} minutes ago`,
          details: decoded,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        test: "Auth Token",
        status: "success",
        message: `Valid token (expires in ${minutesLeft} minutes)`,
        details: {
          user: decoded.sub,
          role: decoded.role,
          exp: new Date(expiryTime).toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (decodeError) {
      return {
        test: "Auth Token",
        status: "error",
        message: "Could not decode JWT token",
        details: decodeError instanceof Error ? decodeError.message : String(decodeError),
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    return {
      test: "Auth Token",
      status: "error",
      message: "Error checking token",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Test patients endpoint with auth
 */
export async function testPatientsEndpoint(): Promise<HealthCheckResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const token = localStorage.getItem("accessToken");

    const response = await fetch(`${baseUrl}/api/v1/patients?page=1&page_size=5`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        test: "Patients Endpoint",
        status: "success",
        message: `Patients endpoint working (${data.total} patients total)`,
        details: {
          returned: data.items?.length || 0,
          total: data.total,
          page: data.page,
          page_size: data.page_size,
        },
        timestamp: new Date().toISOString(),
      };
    } else {
      const errorText = await response.text();
      return {
        test: "Patients Endpoint",
        status: "error",
        message: `Endpoint returned ${response.status}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 200),
        },
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    return {
      test: "Patients Endpoint",
      status: "error",
      message: "Error calling patients endpoint",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Run all health checks
 */
export async function checkBackendHealth(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];
  
  console.log("🔍 Running backend health checks...");
  
  results.push(await testBackendHealth());
  results.push(await testAuthToken());
  results.push(await testPatientsEndpoint());

  results.forEach((result) => {
    const icon = result.status === "success" ? "✅" : result.status === "warning" ? "⚠️" : "❌";
    console.log(`${icon} ${result.test}: ${result.message}`);
    if (result.details) {
      console.log("   Details:", result.details);
    }
  });

  return results;
}

/**
 * React component for backend health check UI
 */
export function BackendHealthCheck() {
  const [results, setResults] = useState<HealthCheckResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCheckHealth = async () => {
    setLoading(true);
    try {
      const healthResults = await checkBackendHealth();
      setResults(healthResults);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏥 Backend Health Check
            <Button
              size="sm"
              variant="outline"
              onClick={handleCheckHealth}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {loading ? "Checking..." : "Run Check"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {results.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Click "Run Check" to test backend connection
              </AlertDescription>
            </Alert>
          ) : (
            results.map((result, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {result.status === "success" && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                  {result.status === "warning" && (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  )}
                  {result.status === "error" && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-semibold">{result.test}</span>
                  <Badge
                    variant={
                      result.status === "success"
                        ? "default"
                        : result.status === "warning"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700">{result.message}</p>
                {result.details && (
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
                <p className="text-xs text-gray-500">{result.timestamp}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
