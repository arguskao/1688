/**
 * Unit tests for image management service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  uploadImage,
  deleteImage,
  deleteImageByProductId,
  replaceImage,
  imageExists,
  validateImageFile,
  generateUniqueImageKey,
} from './imageManagement';

describe('Image Management Service', () => {
  let mockR2Bucket: any;

  beforeEach(() => {
    mockR2Bucket = {
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue(null),
      list: vi.fn().mockResolvedValue({ objects: [], truncated: false }),
    };
  });

  describe('uploadImage', () => {
    it('should upload image to R2', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      const url = await uploadImage(mockFile, 'prod-001', mockR2Bucket);
      
      expect(mockR2Bucket.put).toHaveBeenCalled();
      expect(url).toContain('prod-001');
      expect(url).toContain('.jpg');
    });

    it('should handle different file extensions', async () => {
      const mockFile = new File(['test'], 'test.png', { type: 'image/png' });
      
      const url = await uploadImage(mockFile, 'prod-002', mockR2Bucket);
      
      expect(url).toContain('.png');
    });
  });

  describe('deleteImage', () => {
    it('should delete image from R2', async () => {
      const imageUrl = '/api/images/products/prod-001.jpg';
      
      await deleteImage(imageUrl, mockR2Bucket);
      
      expect(mockR2Bucket.delete).toHaveBeenCalledWith('products/prod-001.jpg');
    });

    it('should throw error for invalid URL', async () => {
      await expect(deleteImage('invalid-url', mockR2Bucket)).rejects.toThrow('Invalid image URL');
    });
  });

  describe('deleteImageByProductId', () => {
    it('should attempt to delete images with common extensions', async () => {
      await deleteImageByProductId('prod-001', mockR2Bucket);
      
      // Should try multiple extensions
      expect(mockR2Bucket.delete).toHaveBeenCalledTimes(5); // jpg, jpeg, png, webp, gif
    });
  });

  describe('replaceImage', () => {
    it('should delete old image and upload new one', async () => {
      const oldUrl = '/api/images/products/prod-001.jpg';
      const newFile = new File(['new'], 'new.png', { type: 'image/png' });
      
      const url = await replaceImage(oldUrl, newFile, 'prod-001', mockR2Bucket);
      
      expect(mockR2Bucket.delete).toHaveBeenCalled();
      expect(mockR2Bucket.put).toHaveBeenCalled();
      expect(url).toContain('prod-001');
    });

    it('should continue even if old image deletion fails', async () => {
      mockR2Bucket.delete.mockRejectedValue(new Error('Not found'));
      const newFile = new File(['new'], 'new.jpg', { type: 'image/jpeg' });
      
      const url = await replaceImage('/api/images/products/old.jpg', newFile, 'prod-001', mockR2Bucket);
      
      expect(url).toBeTruthy();
      expect(mockR2Bucket.put).toHaveBeenCalled();
    });
  });

  describe('imageExists', () => {
    it('should return true when image exists', async () => {
      mockR2Bucket.get.mockResolvedValue({ key: 'products/prod-001.jpg' });
      
      const exists = await imageExists('/api/images/products/prod-001.jpg', mockR2Bucket);
      
      expect(exists).toBe(true);
    });

    it('should return false when image does not exist', async () => {
      mockR2Bucket.get.mockResolvedValue(null);
      
      const exists = await imageExists('/api/images/products/nonexistent.jpg', mockR2Bucket);
      
      expect(exists).toBe(false);
    });

    it('should return false for invalid URL', async () => {
      const exists = await imageExists('invalid-url', mockR2Bucket);
      
      expect(exists).toBe(false);
    });
  });

  describe('validateImageFile', () => {
    it('should validate correct image files', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      const result = validateImageFile(file);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files that are too large', () => {
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      
      const result = validateImageFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('size exceeds');
    });

    it('should reject invalid file types', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      const result = validateImageFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject invalid file extensions', () => {
      const file = new File(['test'], 'test.pdf', { type: 'image/jpeg' });
      
      const result = validateImageFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file extension');
    });

    it('should accept various valid image formats', () => {
      const formats = [
        { name: 'test.jpg', type: 'image/jpeg' },
        { name: 'test.jpeg', type: 'image/jpeg' },
        { name: 'test.png', type: 'image/png' },
        { name: 'test.webp', type: 'image/webp' },
        { name: 'test.gif', type: 'image/gif' },
      ];
      
      formats.forEach(format => {
        const file = new File(['test'], format.name, { type: format.type });
        const result = validateImageFile(file);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('generateUniqueImageKey', () => {
    it('should generate unique keys with timestamp', async () => {
      const key1 = generateUniqueImageKey('prod-001', 'jpg');
      
      // Wait 1ms to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const key2 = generateUniqueImageKey('prod-001', 'jpg');
      
      expect(key1).toContain('products/prod-001-');
      expect(key1).toContain('.jpg');
      expect(key1).not.toBe(key2); // Should be different due to timestamp
    });

    it('should handle extension with leading dot', () => {
      const key = generateUniqueImageKey('prod-001', '.png');
      
      expect(key).toContain('.png');
      expect(key).not.toContain('..'); // Should not have double dot
    });
  });
});
