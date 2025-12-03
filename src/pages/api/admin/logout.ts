/**
 * Admin logout API endpoint
 * POST /api/admin/logout
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { deleteSession, parseSessionFromCookie } from '../../../lib/auth';
import { getEnv } from '../../../lib/apiAuth';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    // Get session ID from cookie
    const cookieHeader = request.headers.get('Cookie');
    const sessionId = parseSessionFromCookie(cookieHeader);

    if (sessionId) {
      // Get environment
      const env = getEnv(locals.runtime);
      const databaseUrl = env.DATABASE_URL;

      if (databaseUrl) {
        // Delete session from database
        try {
          await deleteSession(sessionId, databaseUrl);
        } catch (error) {
          console.error('Error deleting session:', error);
          // Continue with logout even if session deletion fails
        }
      }
    }

    // Clear session cookie
    cookies.delete('admin_session', { path: '/' });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Logged out successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Logout error:', error);

    // Still clear the cookie even on error
    cookies.delete('admin_session', { path: '/' });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Logged out'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
