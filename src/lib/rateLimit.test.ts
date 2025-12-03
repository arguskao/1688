import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getClientIdentifier,
  checkRateLimit,
  createRateLimitHeaders,
  createRateLimitResponse
} from './rateLimit';

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Reset time mocks
    vi.restoreAllMocks();
  });

  describe('getClientIdentifier', () => {
    it('should use CF-Connecting-IP header if available', () => {
      const request = new Request('https://example.com', {
        headers: {
          'CF-Connecting-IP': '1.2.3.4',
          'X-Forwarded-For': '5.6.7.8'
        }
      });

      expect(getClientIdentifier(request)).toBe('1.2.3.4');
    });

    it('should fall back to X-Forwarded-For if CF-Connecting-IP not available', () => {
      const request = new Request('https://example.com', {
        headers: {
          'X-Forwarded-For': '5.6.7.8, 9.10.11.12'
        }
      });

      expect(getClientIdentifier(request)).toBe('5.6.7.8');
    });

    it('should return "unknown" if no IP headers available', () => {
      const request = new Request('https://example.com');
      expect(getClientIdentifier(request)).toBe('unknown');
    });
  });

  describe('checkRateLimit', () => {
    it('should allow first request', () => {
      const result = checkRateLimit('test-client-1', {
        maxRequests: 10,
        windowMs: 60000
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('should allow requests up to the limit', () => {
      const clientId = 'test-client-2';
      const config = { maxRequests: 3, windowMs: 60000 };

      // First request
      let result = checkRateLimit(clientId, config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);

      // Second request
      result = checkRateLimit(clientId, config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);

      // Third request
      result = checkRateLimit(clientId, config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('should block requests exceeding the limit', () => {
      const clientId = 'test-client-3';
      const config = { maxRequests: 2, windowMs: 60000 };

      // First two requests should succeed
      checkRateLimit(clientId, config);
      checkRateLimit(clientId, config);

      // Third request should be blocked
      const result = checkRateLimit(clientId, config);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.remaining).toBe(0);
    });

    it('should reset after window expires', () => {
      const clientId = 'test-client-4';
      const config = { maxRequests: 2, windowMs: 100 }; // 100ms window

      // Use up the limit
      checkRateLimit(clientId, config);
      checkRateLimit(clientId, config);

      // Should be blocked
      let result = checkRateLimit(clientId, config);
      expect(result.allowed).toBe(false);

      // Wait for window to expire
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // Should be allowed again
          result = checkRateLimit(clientId, config);
          expect(result.allowed).toBe(true);
          expect(result.remaining).toBe(1);
          resolve();
        }, 150);
      });
    });

    it('should handle different clients independently', () => {
      const config = { maxRequests: 2, windowMs: 60000 };

      // Client 1 uses up limit
      checkRateLimit('client-1', config);
      checkRateLimit('client-1', config);
      const result1 = checkRateLimit('client-1', config);
      expect(result1.allowed).toBe(false);

      // Client 2 should still be allowed
      const result2 = checkRateLimit('client-2', config);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('createRateLimitHeaders', () => {
    it('should create correct headers for allowed request', () => {
      const result = {
        allowed: true,
        remaining: 5,
        resetTime: Date.now() + 60000
      };

      const headers = createRateLimitHeaders(result, {
        maxRequests: 10,
        windowMs: 60000
      });

      expect(headers['X-RateLimit-Limit']).toBe('10');
      expect(headers['X-RateLimit-Remaining']).toBe('5');
      expect(headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('should include Retry-After for blocked request', () => {
      const result = {
        allowed: false,
        remaining: 0,
        retryAfter: 30,
        resetTime: Date.now() + 30000
      };

      const headers = createRateLimitHeaders(result, {
        maxRequests: 10,
        windowMs: 60000
      });

      expect(headers['X-RateLimit-Limit']).toBe('10');
      expect(headers['X-RateLimit-Remaining']).toBe('0');
      expect(headers['Retry-After']).toBe('30');
    });
  });

  describe('createRateLimitResponse', () => {
    it('should create 429 response with correct structure', async () => {
      const result = {
        allowed: false,
        remaining: 0,
        retryAfter: 45,
        resetTime: Date.now() + 45000
      };

      const response = createRateLimitResponse(result, {
        maxRequests: 10,
        windowMs: 60000
      });

      expect(response.status).toBe(429);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Retry-After')).toBe('45');

      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBe('Too many requests');
      expect(body.retryAfter).toBe(45);
    });
  });
});
