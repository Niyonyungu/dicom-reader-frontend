'use client';

import { useState } from 'react';
import { useRealTimeClock } from '@/hooks/use-real-time-clock';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, User, Stethoscope, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { time, date } = useRealTimeClock();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (login(username, password)) {
        router.push('/dashboard');
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex">
      {/* Hero side for large screens with graphic */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center bg-primary/10 p-12 space-y-8">
        <img src="/placeholder-logo.svg" alt="DICOM graphic" className="w-32 h-32 mx-auto opacity-70" />
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-primary/20">
              <Stethoscope className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">DICOM Reader</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Professional medical imaging platform
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Features</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Upload and view DICOM studies</li>
            <li>Filter worklists by status and modality</li>
            <li>Generate and export radiology reports</li>
            <li>Manage patient records with demographics</li>
            <li>Responsive dashboard with quick stats</li>
          </ul>
        </div>
      </div>

      {/* Form side */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Clock at top-right of form container */}
          <div className="text-right text-2xl font-bold text-secondary">
            {date} {time}
          </div>

          {/* Login card */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      className="pl-10 bg-input border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="pl-10 pr-10 bg-input border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !username || !password}
                  className="w-full py-3 bg-linear-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>


          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            Professional DICOM Medical Imaging System
          </p>
        </div>
      </div>
    </div>
  );
}
