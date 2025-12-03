/**
 * Unit tests for authentication utilities
 */

import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateSessionId,
  parseSessionFromCookie,
  createSessionCookie,
  clearSessionCookie,
} from './auth';

describe('Authentication Utilities', () => {
  describe('hashPassword', () => {
    it('should generate a consistent hash for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
    });

    it('should generate different hashes for different passwords', async () => {
      const hash1 = await hashPassword('password1');
      const hash2 = await hashPassword('password2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'mySecurePassword';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'mySecurePassword';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword('wrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('generateSessionId', () => {
    it('should generate a valid UUID', () => {
      const sessionId = generateSessionId();
      
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(sessionId).toMatch(uuidRegex);
    });

    it('should generate unique session IDs', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      
      expect(id1).not.toBe(id2);
    });
  });

  describe('parseSessionFromCookie', () => {
    it('should parse session ID from cookie header', () => {
      const sessionId = 'test-session-id-123';
      const cookieHeader = `admin_session=${sessionId}; Path=/`;
      
      const parsed = parseSessionFromCookie(cookieHeader);
      expect(parsed).toBe(sessionId);
    });

    it('should handle multiple cookies', () => {
      const sessionId = 'test-session-id-123';
      const cookieHeader = `other_cookie=value; admin_session=${sessionId}; another=test`;
      
      const parsed = parseSessionFromCookie(cookieHeader);
      expect(parsed).toBe(sessionId);
    });

    it('should return null for missing session cookie', () => {
      const cookieHeader = 'other_cookie=value; another=test';
      
      const parsed = parseSessionFromCookie(cookieHeader);
      expect(parsed).toBeNull();
    });

    it('should return null for null cookie header', () => {
      const parsed = parseSessionFromCookie(null);
      expect(parsed).toBeNull();
    });
  });

  describe('createSessionCookie', () => {
    it('should create a valid session cookie', () => {
      const sessionId = 'test-session-id';
      const cookie = createSessionCookie(sessionId, false);
      
      expect(cookie).toContain(`admin_session=${sessionId}`);
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Path=/');
      expect(cookie).toContain('SameSite=lax');
      expect(cookie).not.toContain('Secure');
    });

    it('should include Secure flag when secure is true', () => {
      const sessionId = 'test-session-id';
      const cookie = createSessionCookie(sessionId, true);
      
      expect(cookie).toContain('Secure');
    });
  });

  describe('clearSessionCookie', () => {
    it('should create a cookie that clears the session', () => {
      const cookie = clearSessionCookie();
      
      expect(cookie).toContain('admin_session=');
      expect(cookie).toContain('Max-Age=0');
      expect(cookie).toContain('Path=/');
    });
  });
});
