/**
 * Astro Middleware
 * Adds security headers to all responses
 */
import { defineMiddleware, sequence } from 'astro:middleware';

// Security headers middleware
const securityHeaders = defineMiddleware(async (context, next) => {
    const response = await next();

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy - adjust as needed
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "font-src 'self' data:",
        "connect-src 'self' https:",
        "frame-ancestors 'self'",
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);

    return response;
});

export const onRequest = sequence(securityHeaders);
