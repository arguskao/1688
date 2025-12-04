/**
 * Admin logout API endpoint
 * POST /api/admin/logout
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { deleteSession, parseSessionFromCookie } from '../../../lib/auth';
import { getEnv } from '../../../lib/apiAuth';
import { ApiResponse } from '../../../lib/apiResponse';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  // Always clear cookie, even on error
  const clearCookie = () => cookies.delete('admin_session', { path: '/' });

  try {
    const cookieHeader = request.headers.get('Cookie');
    const sessionId = parseSessionFromCookie(cookieHeader);

    if (sessionId) {
      const env = getEnv(locals.runtime);
      const databaseUrl = env.DATABASE_URL;

      if (databaseUrl) {
        try {
          await deleteSession(sessionId, databaseUrl);
        } catch (error) {
          console.error('Error deleting session:', error);
        }
      }
    }

    clearCookie();
    return ApiResponse.successMessage('Logged out successfully');
  } catch (error: any) {
    console.error('Logout error:', error);
    clearCookie();
    return ApiResponse.successMessage('Logged out');
  }
};
