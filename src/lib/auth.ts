/**
 * Authentication utilities for admin system
 * Handles password verification, session management, and authentication middleware
 */

import { getDb } from './database';

/**
 * Session configuration
 */
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_COOKIE_NAME = 'admin_session';

/**
 * Hash a password using Web Crypto API (SHA-256)
 * Note: In production, use bcrypt or similar. This is simplified for the MVP.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verify a password against the stored hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === storedHash;
}

/**
 * Generate a secure session ID
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Create a new session in the database
 */
export async function createSession(databaseUrl: string): Promise<string> {
  const sql = getDb(databaseUrl);
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await sql`
    INSERT INTO admin_sessions (session_id, expires_at)
    VALUES (${sessionId}, ${expiresAt.toISOString()})
  `;

  return sessionId;
}

/**
 * Validate a session ID
 */
export async function validateSession(
  sessionId: string,
  databaseUrl: string
): Promise<boolean> {
  const sql = getDb(databaseUrl);

  const result = await sql`
    SELECT session_id, expires_at
    FROM admin_sessions
    WHERE session_id = ${sessionId}
    AND expires_at > NOW()
  `;

  return result.length > 0;
}

/**
 * Delete a session from the database
 */
export async function deleteSession(
  sessionId: string,
  databaseUrl: string
): Promise<void> {
  const sql = getDb(databaseUrl);

  await sql`
    DELETE FROM admin_sessions
    WHERE session_id = ${sessionId}
  `;
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(databaseUrl: string): Promise<number> {
  const sql = getDb(databaseUrl);

  const result = await sql`
    DELETE FROM admin_sessions
    WHERE expires_at <= NOW()
    RETURNING session_id
  `;

  return result.length;
}

/**
 * Get session cookie options
 */
export function getSessionCookieOptions(secure: boolean = false) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure,
    sameSite: 'lax' as const,
    maxAge: SESSION_DURATION_MS / 1000, // Convert to seconds
    path: '/',
  };
}

/**
 * Create session cookie header
 */
export function createSessionCookie(sessionId: string, secure: boolean = false): string {
  const options = getSessionCookieOptions(secure);
  const cookieParts = [
    `${options.name}=${sessionId}`,
    `Max-Age=${options.maxAge}`,
    `Path=${options.path}`,
    `SameSite=${options.sameSite}`,
  ];

  if (options.httpOnly) {
    cookieParts.push('HttpOnly');
  }

  if (options.secure) {
    cookieParts.push('Secure');
  }

  return cookieParts.join('; ');
}

/**
 * Clear session cookie header
 */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Max-Age=0; Path=/`;
}

/**
 * Parse session ID from cookie header
 */
export function parseSessionFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith(`${SESSION_COOKIE_NAME}=`));

  if (!sessionCookie) return null;

  return sessionCookie.split('=')[1] || null;
}

/**
 * Authenticate admin user with password
 */
export async function authenticateAdmin(
  password: string,
  databaseUrl: string
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  // Get admin password hash from environment
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminPasswordHash) {
    return {
      success: false,
      error: 'Admin password not configured',
    };
  }

  // Verify password
  const isValid = await verifyPassword(password, adminPasswordHash);

  if (!isValid) {
    return {
      success: false,
      error: 'Invalid password',
    };
  }

  // Create session
  try {
    const sessionId = await createSession(databaseUrl);
    return {
      success: true,
      sessionId,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create session',
    };
  }
}

/**
 * Check if request is authenticated
 */
export async function isAuthenticated(
  request: Request,
  databaseUrl: string
): Promise<boolean> {
  const cookieHeader = request.headers.get('Cookie');
  const sessionId = parseSessionFromCookie(cookieHeader);

  if (!sessionId) return false;

  return await validateSession(sessionId, databaseUrl);
}

/**
 * Require authentication middleware
 * Returns a Response if not authenticated, null if authenticated
 */
export async function requireAuth(
  request: Request,
  databaseUrl: string
): Promise<Response | null> {
  const authenticated = await isAuthenticated(request, databaseUrl);

  if (!authenticated) {
    // Return 401 Unauthorized
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Authentication required',
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return null;
}
