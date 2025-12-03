/**
 * Admin login API endpoint
 * POST /api/admin/login
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { verifyPassword, createSession } from '../../../lib/auth';
import { getEnv } from '../../../lib/apiAuth';

// Rate limiting: track login attempts by IP
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  
  if (!attempts || now > attempts.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (attempts.count >= MAX_ATTEMPTS) {
    return false;
  }
  
  attempts.count++;
  return true;
}

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('cf-connecting-ip') || 
                     request.headers.get('x-forwarded-for') || 
                     'unknown';
    
    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Too many login attempts. Please try again later.' 
        }),
        { 
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { password } = body;
    
    if (!password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Password is required' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get environment variables
    const env = getEnv(locals.runtime);
    const { adminPasswordHash, sessionSecret, databaseUrl } = {
      adminPasswordHash: env.ADMIN_PASSWORD_HASH,
      sessionSecret: env.SESSION_SECRET,
      databaseUrl: env.DATABASE_URL
    };
    
    if (!adminPasswordHash || !sessionSecret || !databaseUrl) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Verify password
    const isValid = await verifyPassword(password, adminPasswordHash);
    
    if (!isValid) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid password' 
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Create session
    const sessionId = await createSession(databaseUrl);
    
    // Set session cookie
    cookies.set('admin_session', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Login successful'
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error: any) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'An error occurred during login' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
