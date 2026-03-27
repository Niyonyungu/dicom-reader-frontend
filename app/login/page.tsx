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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="absolute inset-0 overflow-hidden -z-10">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="diagonal-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#diagonal-gradient)" />
          <circle cx="20" cy="20" r="14" fill="#2563eb" fillOpacity="0.12" className="animate-pulse" />
          <circle cx="80" cy="70" r="18" fill="#f43f5e" fillOpacity="0.10" className="animate-pulse delay-200" />
          <circle cx="55" cy="35" r="10" fill="#22c55e" fillOpacity="0.14" className="animate-pulse delay-500" />
        </svg>
      </div>

      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 py-20 space-y-8">
          <div className="max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl from-primary/70 to-secondary/70 p-3 text-white shadow-lg shadow-primary/40">
                <Stethoscope className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">DICOM Reader</h1>
                <p className="text-sm text-slate-300/90">Radiology workflow now in your browser</p>
              </div>
            </div>
            <p className="text-slate-200 leading-relaxed">
              Fast, secure DICOM viewing and reporting powered by modern UI and service workers.
              Explore annotated measurements, volume rendering, and zero-friction worklist management.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 text-sm text-slate-100">
              <span className="inline-flex items-center gap-2">✅ Live study synchronization</span>
              <span className="inline-flex items-center gap-2">✅ Smart hanging protocols</span>
              <span className="inline-flex items-center gap-2">✅ Offline access + audit logging</span>
            </div>
          </div>
        </aside>

        <main className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-lg space-y-6">
            <div className="flex justify-between text-sm text-slate-200">
              <span className="font-semibold">{date}</span>
              <span className="font-semibold">{time}</span>
            </div>

            <Card className="border-white/15 shadow-2xl shadow-slate-950/50">
              <CardHeader>
                <CardTitle className="text-3xl">Welcome Back</CardTitle>
                <CardDescription className="text-slate-300">
                  Log in to continue your clinical workflow and access patient studies.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="animate-pulse">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black ">Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                        className="pl-10 pr-3 bg-slate-900/60 border-white/20 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black ">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="pl-10 pr-10 bg-slate-900/60 border-white/20 text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white"
                        aria-label="Toggle password visibility"
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
                    className="w-full py-3 from-primary via-cyan-700 to-secondary text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="rounded-xl bg-white/5 p-4 text-xs text-slate-300">
              !: By logging in, you agree to the system usage  <span className="font-semibold text-white"> policies and patient privacy rules</span> .
            </div>

            {/* <p className="text-center text-xs text-slate-400">
              By logging in, you agree to the system usage policies and patient privacy rules.
            </p> */}
          </div>
        </main>
      </div>
    </div>
  );
}
