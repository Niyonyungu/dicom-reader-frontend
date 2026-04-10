'use client';

import { useAuth } from '@/context/auth-context';
import { useRealTimeClock } from '@/hooks/use-real-time-clock';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Clock, LogOut, Settings, User } from 'lucide-react';

interface TopBarProps {
  sidebarVisible: boolean;
  setSidebarVisible: (visible: boolean) => void;
}

export function TopBar({ sidebarVisible, setSidebarVisible }: TopBarProps) {
  const { user, logout } = useAuth();
  const { time, date } = useRealTimeClock();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleProfile = () => {
    router.push('/dashboard/profile');
  };

  const handleSettings = () => {
    router.push('/dashboard/settings');
  };

  return (
    <header className="border-b border-sidebar-border bg-sidebar">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left Section - Title */}
        <div>
          <h1 className="text-lg font-semibold text-sidebar-foreground">
            DICOM Reader
          </h1>
        </div>

        {/* Center Section - Date/Time */}
        <div className="flex items-center gap-2 text-sm text-sidebar-foreground/70">
          <Clock className="h-4 w-4" />
          <span>{date}</span>
          <span className="font-mono">{time}</span>
        </div>

        {/* Right Section - User Menu */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-sidebar-foreground">
                  {user.name}
                </p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">
                  {user.role}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full bg-sidebar-accent hover:bg-sidebar-accent/80"
                  >
                    <User className="h-5 w-5 text-sidebar-accent-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                    {user.username}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleProfile}>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSettings}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
