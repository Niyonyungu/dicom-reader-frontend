'use client';

import { useAuth } from '@/context/auth-context';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  ListTodo,
  Users,
  Upload,
  FileText,
  Settings,
  BarChart3,
  ChevronLeft,
  Menu,
  Shield,
  Layers,
  FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('user' | 'admin' | 'service' | 'imaging-technician' | 'radiographer')[];
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: BarChart3,
  },
  {
    href: '/dashboard/worklist',
    label: 'Worklist',
    icon: ListTodo,
  },
  {
    href: '/dashboard/studies',
    label: 'Studies',
    icon: Layers,
    roles: ['user', 'admin', 'service', 'imaging-technician', 'radiologist'],
  },
  {
    href: '/dashboard/patients',
    label: 'Patients',
    icon: Users,
    roles: ['admin', 'service', 'imaging-technician'],
  },
  {
    href: '/dashboard/upload',
    label: 'Upload DICOM',
    icon: Upload,
    roles: ['admin', 'service', 'imaging-technician', 'radiographer'],
  },
  {
    href: '/dashboard/reports',
    label: 'Reports',
    icon: FileText,
    roles: ['user', 'admin', 'service', 'radiographer', 'radiologist'],
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: Settings,
    roles: ['admin', 'service'],
  },
  {
    href: '/dashboard/settings/rbac',
    label: 'RBAC Matrix',
    icon: Shield,
    roles: ['admin'],
  },
  {
    href: '/dashboard/settings/users',
    label: 'Manage Users',
    icon: Users,
    roles: ['admin'],
  },
  {
    href: '/dashboard/settings/audit-logs',
    label: 'Audit Logs',
    icon: FileCheck,
    roles: ['admin'],
  },
];

export function Sidebar({ visible, setSidebarVisible }: { visible: boolean; setSidebarVisible: (visible: boolean) => void }) {
  const { user } = useAuth();
  const pathname = usePathname();

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  return (
    <aside className={`border-r border-sidebar-border bg-sidebar flex flex-col h-full transition-all duration-300 ease-in-out ${visible ? 'w-64' : 'w-0 overflow-hidden'}`}>
      {/* Logo + toggle */}
      <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sidebar-primary">
            <BarChart3 className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-sidebar-foreground">DICOM</h2>
            <p className="text-xs text-sidebar-foreground/60">Medical Imaging</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarVisible(!visible)}
          className="h-8 w-8 rounded-full bg-sidebar-accent hover:bg-sidebar-accent/80"
        >
          {visible ? (
            <ChevronLeft className="h-4 w-4 text-sidebar-accent-foreground" />
          ) : (
            <Menu className="h-4 w-4 text-sidebar-accent-foreground" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          // Exact match or direct child, but not parent of nested routes
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/60 text-center">
          Version 1.0.0
        </p>
      </div>
    </aside>
  );
}
