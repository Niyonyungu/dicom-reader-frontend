'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/auth-context';
import { WorklistProvider } from '@/context/worklist-context';
import { PatientsProvider } from '@/context/patients-context';
import { ReportsProvider } from '@/context/reports-context';

export function Providers({ children }: { children: ReactNode }) {
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
}
