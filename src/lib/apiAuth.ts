/**
 * API authentication helpers
 * Provides authentication utilities for API endpoints
 */
import type { AstroCookies } from 'astro';
import { validateSession } from './auth';

/**
 * Environment configuration interface
 */
export interface EnvConfig {
  DATABASE_URL: string | undefined;
  ADMIN_PASSWORD_HASH: string | undefined;
  SESSION_SECRET: string | undefined;
  R2_BUCKET: any | undefined;
  EMAIL_API_KEY: string | undefined;
  BUSINESS_EMAIL: string | undefined;
}

/**
 * Get environment variables from runtime or process.env
 */
export function getEnv(runtime: any): EnvConfig {
  return {
    DATABASE_URL: runtime?.env?.DATABASE_URL || process.env.DATABASE_URL,
    ADMIN_PASSWORD_HASH: runtime?.env?.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD_HASH,
    SESSION_SECRET: runtime?.env?.SESSION_SECRET || process.env.SESSION_SECRET,
    R2_BUCKET: runtime?.env?.R2_BUCKET || undefined,
    EMAIL_API_KEY: runtime?.env?.EMAIL_API_KEY || process.env.EMAIL_API_KEY,
    BUSINESS_EMAIL: runtime?.env?.BUSINESS_EMAIL || process.env.BUSINESS_EMAIL
  };
}

/**
 * Authentication result interface
 */
export interface AuthResult {
  authenticated: boolean;
  error?: string;
}

/**
 * Check if request is authenticated
 */
export async function checkAuth(
  cookies: AstroCookies,
  databaseUrl: string
): Promise<AuthResult> {
  const sessionId = cookies.get('admin_session')?.value;

  if (!sessionId) {
    return { authenticated: false, error: 'Not authenticated' };
  }

  const isValid = await validateSession(sessionId, databaseUrl);

  if (!isValid) {
    return { authenticated: false, error: 'Session expired or invalid' };
  }

  return { authenticated: true };
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(message?: string): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message || 'Unauthorized'
    }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Create an error response
 */
export function errorResponse(message: string, status: number = 500): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Create a success response
 */
export function successResponse(data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify({
      success: true,
      ...data
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
