/**
 * Authentication Context
 * Manages user authentication state, tokens, and session.
 * Provides login, logout, refresh, and automatic token refresh on 401.
 *
 * Usage:
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 *
 * In components:
 * ```tsx
 * const { user, login, logout, isLoading } = useAuth();
 * ```
 */

"use client";

import React, { createContext, useCallback, useEffect, useState } from "react";
import {
  saveTokens,
  getStoredTokens,
  getStoredUser,
  saveUser,
  clearStorage,
  isLoggedIn,
  getAccessToken,
  getRefreshToken,
} from "@/lib/token-storage";
import { authService } from "@/services/auth-service";
import { ApiError } from "@/lib/api-client";
import { LoginResponse, CurrentUserResponse } from "@/types/api";

export interface AuthContextType {
  // State
  user: CurrentUserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Methods
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  restoreSession: () => Promise<void>;

  // Helpers
  can: (permission: string) => boolean;
  canAny: (permissions: string[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Component
 * Wraps entire app to provide authentication context
 *
 * Handles:
 * - Session restoration on mount
 * - Token persistence
 * - Automatic refresh on 401
 * - User permissions from JWT
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Login with email and password
   */
  const login = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await authService.login(email, password);

      // Save tokens and user
      saveTokens(response.access_token, response.refresh_token);
      saveUser(response.user);
      setUser(response.user);
    } catch (err) {
      const apiError = err as ApiError;
      const message = apiError.message || "Login failed. Please try again.";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout - revoke token and clear session
   */
  const logout = useCallback(async () => {
    try {
      const accessToken = getAccessToken();
      if (accessToken) {
        await authService.logout(accessToken);
      }
    } catch (err) {
      // Even if logout fails on backend, clear local session
      console.error("[Auth] Logout failed:", err);
    } finally {
      clearStorage();
      setUser(null);
      setError(null);
    }
  }, []);

  /**
   * Refresh access token
   * Returns true if refresh succeeds, false otherwise
   */
  const refresh = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearStorage();
        setUser(null);
        return false;
      }

      const response = await authService.refresh(refreshToken);
      saveTokens(response.access_token, response.refresh_token);
      saveUser(response.user);
      setUser(response.user);
      setError(null);
      return true;
    } catch (err) {
      // Refresh failed - clear session
      clearStorage();
      setUser(null);
      setError("Session expired. Please log in again.");
      return false;
    }
  }, []);

  /**
   * Restore session from stored tokens on app load
   * Called once on mount
   */
  const restoreSession = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check if tokens exist
      if (!isLoggedIn()) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Try to get fresh user data
      const accessToken = getAccessToken();
      if (accessToken) {
        try {
          const currentUser = await authService.me(accessToken);
          saveUser(currentUser);
          setUser(currentUser);
        } catch (err) {
          // /me failed, probably token expired - try refresh
          const refreshSuccess = await refresh();
          if (!refreshSuccess) {
            setUser(null);
          }
        }
      }
    } catch (err) {
      console.error("[Auth] Session restore failed:", err);
      clearStorage();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [refresh]);

  /**
   * Check if user has permission
   */
  const can = useCallback(
    (permission: string): boolean => {
      return user?.permissions?.includes(permission) ?? false;
    },
    [user]
  );

  /**
   * Check if user has any of the given permissions
   */
  const canAny = useCallback(
    (permissions: string[]): boolean => {
      return permissions.some((p) => can(p));
    },
    [can]
  );

  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    refresh,
    restoreSession,
    can,
    canAny,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 * Must be used inside <AuthProvider>
 *
 * @throws Error if used outside AuthProvider
 * @returns Auth context object
 *
 * @example
 * ```tsx
 * function LoginPage() {
 *   const { login, isLoading, error } = useAuth();
 *   // ...
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
