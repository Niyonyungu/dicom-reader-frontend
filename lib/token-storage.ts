/**
 * Token Storage
 * Handles persistent storage of JWT tokens and user info
 * Uses localStorage for client-side persistence
 */

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number; // Unix timestamp for token expiry
}

export interface StoredUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  permissions: string[];
}

const TOKENS_KEY = "dicom_tokens";
const USER_KEY = "dicom_user";

/**
 * Save tokens to localStorage
 * @param accessToken - JWT access token
 * @param refreshToken - JWT refresh token (7 day expiry)
 * @param expiresInSeconds - Optional: seconds until access token expires (default 30 min = 1800)
 */
export function saveTokens(
  accessToken: string,
  refreshToken: string,
  expiresInSeconds: number = 1800
): void {
  const tokens: StoredTokens = {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  };
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

/**
 * Get stored tokens from localStorage
 * @returns Stored tokens or null if not found
 */
export function getStoredTokens(): StoredTokens | null {
  try {
    const stored = localStorage.getItem(TOKENS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("[TokenStorage] Failed to parse stored tokens", error);
    return null;
  }
}

/**
 * Get access token only
 * @returns Access token string or null
 */
export function getAccessToken(): string | null {
  const tokens = getStoredTokens();
  return tokens?.accessToken || null;
}

/**
 * Get refresh token only
 * @returns Refresh token string or null
 */
export function getRefreshToken(): string | null {
  const tokens = getStoredTokens();
  return tokens?.refreshToken || null;
}

/**
 * Check if access token is expired or near expiry (5 min buffer)
 * @returns true if expired or missing
 */
export function isAccessTokenExpired(): boolean {
  const tokens = getStoredTokens();
  if (!tokens || !tokens.expiresAt) {
    return true;
  }

  // Consider expired if within 5 minutes of expiry (buffer for network latency)
  const buffer = 5 * 60 * 1000; // 5 minutes
  return Date.now() >= tokens.expiresAt - buffer;
}

/**
 * Save user info to localStorage
 * @param user - User object from login/me response
 */
export function saveUser(user: StoredUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get stored user info
 * @returns User object or null
 */
export function getStoredUser(): StoredUser | null {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("[TokenStorage] Failed to parse stored user", error);
    return null;
  }
}

/**
 * Clear all stored tokens and user
 * Called on logout or when refresh fails
 */
export function clearStorage(): void {
  localStorage.removeItem(TOKENS_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Check if user is logged in
 * @returns true if tokens exist
 */
export function isLoggedIn(): boolean {
  return getAccessToken() !== null;
}

/**
 * Decode JWT payload (client-side only for UX, not for trust)
 * IMPORTANT: Never trust decoded JWT client-side for security decisions
 * @param token - JWT token
 * @returns Decoded payload or null if invalid
 */
export function decodeJwt(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Get token expiry timestamp from JWT
 * @param token - JWT token
 * @returns Unix timestamp or null
 */
export function getTokenExpiry(token: string): number | null {
  const decoded = decodeJwt(token);
  return decoded?.exp ? decoded.exp * 1000 : null;
}
