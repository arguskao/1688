/**
 * Admin logout API endpoint
 * POST /api/admin/logout
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { deleteSession } from '../../../lib/auth';
import { getEnv } from '../../../lib/apiAuth';

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    // Get session ID from cookie
    const sessionId = cookies.get('admin_session')?.value;
    
    if (sessionId) {
      // Get database URL
      const env = getEnv(locals.runtime);
      const databaseUrl = env.DATABASE_URL;
      
      if (databaseUrl) {
        // Destroy session in database
        await deleteSession(sessionId, databaseUrl);
      }
    }
    
    // Clear session cookie
    cookies.delete('admin_session', {
      path: '/'
    });
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Logout successful'
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error: any) {
    console.error('Logout error:', error);
    
    // Even if there's an error, clear the cookie
    cookies.delete('admin_session', {
      path: '/'
    });
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Logout successful'
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
