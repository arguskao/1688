/**
 * Rate Limiting Utilities
 * 
 * Implements rate limiting for API endpoints using in-memory storage
 * For production, consider using Cloudflare KV or Durable Objects
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory storage for rate limiting
// Note: This will reset when the worker restarts
// For production, use Cloudflare KV or Durable Objects
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Get client identifier from request
 * Uses CF-Connecting-IP header if available, falls back to X-Forwarded-For
 */
export function getClientIdentifier(request: Request): string {
  // Try Cloudflare's connecting IP header
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) {
    return cfIp;
  }

  // Fall back to X-Forwarded-For
  const forwardedFor = request.headers.get('X-Forwarded-For');
  if (forwardedFor) {
    // Take the first IP in the list
    return forwardedFor.split(',')[0].trim();
  }

  // Last resort: use a default identifier
  return 'unknown';
}

/**
 * Check if request should be rate limited
 * Returns { allowed: true } if request is allowed
 * Returns { allowed: false, retryAfter: number } if rate limited
 */
export function checkRateLimit(
  clientId: string,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }
): { allowed: boolean; retryAfter?: number; remaining?: number; resetTime?: number } {
  // Clean up expired entries periodically
  if (Math.random() < 0.1) {
    cleanupExpiredEntries();
  }

  const now = Date.now();
  const entry = rateLimitStore.get(clientId);

  // No entry exists, create new one
  if (!entry) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    };
  }

  // Entry exists but window has expired, reset
  if (now > entry.resetTime) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    };
  }

  // Entry exists and window is still valid
  if (entry.count < config.maxRequests) {
    // Increment count
    entry.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  // Rate limit exceeded
  const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
  return {
    allowed: false,
    retryAfter,
    remaining: 0,
    resetTime: entry.resetTime
  };
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(
  result: ReturnType<typeof checkRateLimit>,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
  };

  if (result.remaining !== undefined) {
    headers['X-RateLimit-Remaining'] = result.remaining.toString();
  }

  if (result.resetTime !== undefined) {
    headers['X-RateLimit-Reset'] = Math.floor(result.resetTime / 1000).toString();
  }

  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Create rate limit error response
 */
export function createRateLimitResponse(
  result: ReturnType<typeof checkRateLimit>,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }
): Response {
  const headers = {
    'Content-Type': 'application/json',
    ...createRateLimitHeaders(result, config)
  };

  return new Response(
    JSON.stringify({
      success: false,
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter
    }),
    {
      status: 429,
      headers
    }
  );
}

/**
 * Rate limit middleware for Cloudflare Pages Functions
 */
export function withRateLimit(
  handler: (context: any) => Promise<Response>,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }
) {
  return async (context: any): Promise<Response> => {
    // Get client identifier
    const clientId = getClientIdentifier(context.request);

    // Check rate limit
    const result = checkRateLimit(clientId, config);

    // If rate limited, return 429 response
    if (!result.allowed) {
      return createRateLimitResponse(result, config);
    }

    // Call the original handler
    const response = await handler(context);

    // Add rate limit headers to response
    const rateLimitHeaders = createRateLimitHeaders(result, config);
    const newHeaders = new Headers(response.headers);
    
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      newHeaders.set(key, value);
    }

    // Return response with rate limit headers
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  };
}
