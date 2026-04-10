'use client';

import { ReactNode, useEffect } from 'react';
import { AuthProvider } from '@/context/auth-context';
import { WorklistProvider } from '@/context/worklist-context';
import { PatientsProvider } from '@/context/patients-context';
import { ReportsProvider } from '@/context/reports-context';
import { setupApiInterceptor } from '@/lib/api-interceptor';

function InterceptorSetup() {
  useEffect(() => {
    // Setup API interceptors for auth token attachment and 401 handling
    setupApiInterceptor();
  }, []);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  try {
    return (
      <AuthProvider>
        <InterceptorSetup />
        <WorklistProvider>
          <PatientsProvider>
            <ReportsProvider>
              {children}
            </ReportsProvider>
          </PatientsProvider>
        </WorklistProvider>
      </AuthProvider>
    );
  } catch (error) {
    console.error('[v0] Provider initialization error:', error);
    return <>{children}</>;
  }
}
