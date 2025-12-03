import { describe, it, expect } from 'vitest';
import {
  generateImageKey,
  getImageUrl,
  extractProductIdFromUrl,
  isValidImageUrl,
} from './r2';

describe('R2 Image URL Utilities', () => {
  describe('generateImageKey', () => {
    it('should generate correct key with default extension', () => {
      expect(generateImageKey('prod-001')).toBe('products/prod-001.jpg');
    });

    it('should generate correct key with custom extension', () => {
      expect(generateImageKey('prod-001', 'png')).toBe('products/prod-001.png');
    });

    it('should handle extension with leading dot', () => {
      expect(generateImageKey('prod-001', '.webp')).toBe('products/prod-001.webp');
    });

    it('should work with different product ID formats', () => {
      expect(generateImageKey('SSB-500-BLK')).toBe('products/SSB-500-BLK.jpg');
      expect(generateImageKey('12345')).toBe('products/12345.jpg');
    });
  });

  describe('getImageUrl', () => {
    it('should generate API endpoint URL', () => {
      expect(getImageUrl('prod-001')).toBe('/api/images/products/prod-001.jpg');
    });

    it('should generate URL with custom extension', () => {
      expect(getImageUrl('prod-002', 'png')).toBe('/api/images/products/prod-002.png');
    });
  });

  describe('extractProductIdFromUrl', () => {
    it('should extract product ID from API URL', () => {
      expect(extractProductIdFromUrl('/api/images/products/prod-001.jpg')).toBe('prod-001');
    });

    it('should extract product ID from full URL', () => {
      expect(extractProductIdFromUrl('https://example.com/products/prod-002.png')).toBe('prod-002');
    });

    it('should return null for invalid URL', () => {
      expect(extractProductIdFromUrl('https://example.com/invalid')).toBeNull();
    });

    it('should handle SKU-based product IDs', () => {
      expect(extractProductIdFromUrl('/api/images/products/SSB-500-BLK.jpg')).toBe('SSB-500-BLK');
    });
  });

  describe('isValidImageUrl', () => {
    it('should validate correct API URLs', () => {
      expect(isValidImageUrl('/api/images/products/prod-001.jpg')).toBe(true);
      expect(isValidImageUrl('/api/images/products/prod-002.png')).toBe(true);
    });

    it('should validate correct full URLs', () => {
      expect(isValidImageUrl('https://images.example.com/products/prod-001.jpg')).toBe(true);
      expect(isValidImageUrl('http://cdn.example.com/products/prod-002.webp')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidImageUrl('not-a-url')).toBe(false);
      expect(isValidImageUrl('https://example.com/wrong-path.jpg')).toBe(false);
      expect(isValidImageUrl('/api/images/prod-001.jpg')).toBe(false); // missing 'products/' path
    });

    it('should accept various image extensions', () => {
      expect(isValidImageUrl('/api/images/products/prod-001.jpg')).toBe(true);
      expect(isValidImageUrl('/api/images/products/prod-001.jpeg')).toBe(true);
      expect(isValidImageUrl('/api/images/products/prod-001.png')).toBe(true);
      expect(isValidImageUrl('/api/images/products/prod-001.gif')).toBe(true);
      expect(isValidImageUrl('/api/images/products/prod-001.webp')).toBe(true);
      expect(isValidImageUrl('/api/images/products/prod-001.svg')).toBe(true);
    });

    it('should reject unsupported extensions', () => {
      expect(isValidImageUrl('/api/images/products/prod-001.txt')).toBe(false);
      expect(isValidImageUrl('/api/images/products/prod-001.pdf')).toBe(false);
    });
  });
});
