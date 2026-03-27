'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const saved = localStorage.getItem('sidebarVisible');
    if (saved !== null) {
      setSidebarVisible(JSON.parse(saved));
    } else if (window.innerWidth < 1024) {
      setSidebarVisible(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarVisible', JSON.stringify(sidebarVisible));
  }, [sidebarVisible]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative flex h-screen bg-background">
      <Sidebar visible={sidebarVisible} setSidebarVisible={setSidebarVisible} />
      {!sidebarVisible && (
        <button
          onClick={() => setSidebarVisible(true)}
          className="absolute left-0 top-4 z-50 -ml-2 h-10 w-10 rounded-r-lg border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-lg hover:bg-sidebar-accent"
          aria-label="Open sidebar"
        >
          ▶
        </button>
      )}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar sidebarVisible={sidebarVisible} setSidebarVisible={setSidebarVisible} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
