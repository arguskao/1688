/**
 * API authentication helpers
 */
import type { AstroCookies } from 'astro';
import { validateSession } from './auth';
import {
  AppError,
  AuthenticationError,
  toAppError,
  createErrorResponse,
  errorToResponse
} from './errors';

/**
 * Get environment variables from runtime or process.env
 */
export function getEnv(runtime: any) {
  return {
    DATABASE_URL: runtime?.env?.DATABASE_URL || process.env.DATABASE_URL,
    ADMIN_PASSWORD_HASH: runtime?.env?.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD_HASH,
    SESSION_SECRET: runtime?.env?.SESSION_SECRET || process.env.SESSION_SECRET,
    R2_BUCKET: runtime?.env?.R2_BUCKET || undefined
  };
}

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
    return {
      authenticated: false,
      error: 'Not authenticated'
    };
  }

  const isValid = await validateSession(sessionId, databaseUrl);

  if (!isValid) {
    return {
      authenticated: false,
      error: 'Session expired or invalid'
    };
  }

  return {
    authenticated: true
  };
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): Response {
  return errorToResponse(new AuthenticationError(message));
}

/**
 * Create error response
 */
export function errorResponse(message: string, status: number = 500): Response {
  const error = new AppError(message, status);
  return errorToResponse(error);
}

/**
 * Create success response
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

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown, context?: string): Response {
  if (context) {
    console.error(`[${context}]`, error);
  }
  return errorToResponse(error);
}
