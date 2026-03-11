'use client';

import { useAuth } from '@/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Settings, User, Shield, Info } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your account and system preferences
        </p>
      </div>

      {/* Account Settings */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Account Information</CardTitle>
          </div>
          <CardDescription>
            Your profile and account details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Full Name</p>
              <p className="font-semibold text-foreground">{user?.name}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Username</p>
              <p className="font-semibold text-foreground">{user?.username}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">User ID</p>
              <p className="font-semibold text-foreground">{user?.id}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Role</p>
              <p className="font-semibold text-foreground capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Security & Privacy</CardTitle>
          </div>
          <CardDescription>
            Manage your security preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-foreground">Password</p>
                <p className="text-sm text-muted-foreground">
                  Last changed on your first login
                </p>
              </div>
              <p className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                Secure
              </p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-foreground">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Not currently enabled
                </p>
              </div>
              <p className="text-xs bg-muted/20 text-muted-foreground px-2 py-1 rounded">
                Available
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <CardTitle>System Information</CardTitle>
          </div>
          <CardDescription>
            Application and system details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Application Version</p>
              <p className="font-semibold text-foreground">1.0.0</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">API Version</p>
              <p className="font-semibold text-foreground">1.0.0</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Build Date</p>
              <p className="font-semibold text-foreground">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help */}
      <Card className="border-border bg-card/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            For support and documentation, please contact your system administrator
            or visit the help center.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
