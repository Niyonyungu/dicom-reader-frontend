'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/auth-context';
import { WorklistProvider } from '@/context/worklist-context';
import { PatientsProvider } from '@/context/patients-context';
import { ReportsProvider } from '@/context/reports-context';

export function Providers({ children }: { children: ReactNode }) {
  try {
    return (
      <AuthProvider>
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
