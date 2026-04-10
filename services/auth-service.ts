/**
 * Authentication Service
 * Example service showing how to use the API client
 * Handles auth-related API calls (login, refresh, me, logout)
 *
 * NOTE: Full token persistence and refresh logic comes in Prompt 2
 * This is just the API layer
 */

import { post, get, ApiError } from "@/lib/api-client";
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  CurrentUserResponse,
} from "@/types/api";

/**
 * Login with email and password
 *
 * @param email - User email (will be trimmed + lowercased by backend)
 * @param password - User password
 * @returns Login response with tokens and user info
 * @throws ApiError on 401 (invalid credentials), 429 (rate limit), 400 (validation)
 *
 * @example
 * ```ts
 * try {
 *   const response = await authService.login('user@example.com', 'password123');
 *   console.log(response.access_token);
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     if (error.status === 429) {
 *       console.error('Too many login attempts');
 *     } else if (error.status === 401) {
 *       console.error('Invalid credentials');
 *     }
 *   }
 * }
 * ```
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const body: LoginRequest = {
    email: email.trim().toLowerCase(),
    password,
  };

  return post<LoginResponse>("/auth/login", body);
}

/**
 * Refresh access token using refresh token
 *
 * @param refreshToken - Valid refresh token from login response
 * @returns New tokens and updated user info
 * @throws ApiError on 401 (invalid refresh token), 400 (missing token)
 *
 * @example
 * ```ts
 * const response = await authService.refresh(storedRefreshToken);
 * localStorage.setItem('accessToken', response.access_token);
 * localStorage.setItem('refreshToken', response.refresh_token);
 * ```
 */
export async function refresh(refreshToken: string): Promise<LoginResponse> {
  const body: RefreshTokenRequest = {
    refresh_token: refreshToken,
  };

  return post<LoginResponse>("/auth/refresh", body);
}

/**
 * Get current user info and permissions
 * Requires valid access token in Authorization header
 *
 * @param accessToken - Valid JWT access token
 * @returns Current user object with id, email, role, permissions
 * @throws ApiError on 401 (expired/invalid token)
 *
 * @example
 * ```ts
 * const user = await authService.me(accessToken);
 * console.log(user.role, user.permissions);
 * ```
 */
export async function me(accessToken: string): Promise<CurrentUserResponse> {
  return get<CurrentUserResponse>("/auth/me", { authToken: accessToken });
}

/**
 * Logout (revoke access token)
 * Requires valid access token
 *
 * @param accessToken - Current access token to revoke
 * @throws ApiError on 401 (already expired)
 *
 * @example
 * ```ts
 * try {
 *   await authService.logout(accessToken);
 *   localStorage.removeItem('accessToken');
 * } catch (error) {
 *   // Token may already be expired, clear anyway
 *   localStorage.removeItem('accessToken');
 * }
 * ```
 */
export async function logout(accessToken: string): Promise<void> {
  await post<void>("/auth/logout", {}, { authToken: accessToken });
}

/**
 * Check if backend is reachable (health check)
 * No auth required
 *
 * @returns true if backend responds OK
 *
 * @example
 * ```ts
 * const isBackendReady = await authService.checkBackendHealth();
 * if (!isBackendReady) {
 *   console.error('Backend is down');
 * }
 * ```
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await get<{ status: string }>("/health");
    return response?.status === "ok";
  } catch {
    return false;
  }
}

export const authService = {
  login,
  refresh,
  me,
  logout,
  checkBackendHealth,
};
