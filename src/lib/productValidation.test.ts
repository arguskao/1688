/**
 * Unit tests for product validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateProductName,
  validateSKU,
  validateCategory,
  validateDescription,
  validateProductId,
  validateSpecsJson,
  validateProduct,
  formatValidationErrors,
  getFieldError,
  VALID_CATEGORIES,
} from './productValidation';

describe('Product Validation', () => {
  describe('validateProductName', () => {
    it('should accept valid product names', () => {
      expect(validateProductName('Valid Product Name')).toBeNull();
      expect(validateProductName('A')).toBeNull();
      expect(validateProductName('Product with 123 numbers')).toBeNull();
    });

    it('should reject empty names', () => {
      const error = validateProductName('');
      expect(error).not.toBeNull();
      expect(error?.field).toBe('name_en');
      expect(error?.message).toContain('required');
    });

    it('should reject names exceeding 200 characters', () => {
      const longName = 'A'.repeat(201);
      const error = validateProductName(longName);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('200 characters');
    });

    it('should accept names with exactly 200 characters', () => {
      const name = 'A'.repeat(200);
      expect(validateProductName(name)).toBeNull();
    });
  });

  describe('validateSKU', () => {
    it('should accept valid SKUs', () => {
      expect(validateSKU('SKU-123')).toBeNull();
      expect(validateSKU('PROD_001')).toBeNull();
      expect(validateSKU('ABC123XYZ')).toBeNull();
    });

    it('should reject empty SKUs', () => {
      const error = validateSKU('');
      expect(error).not.toBeNull();
      expect(error?.field).toBe('sku');
    });

    it('should reject SKUs with invalid characters', () => {
      expect(validateSKU('SKU 123')).not.toBeNull(); // space
      expect(validateSKU('SKU@123')).not.toBeNull(); // special char
      expect(validateSKU('SKU.123')).not.toBeNull(); // dot
    });

    it('should reject SKUs exceeding 50 characters', () => {
      const longSKU = 'A'.repeat(51);
      const error = validateSKU(longSKU);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('50 characters');
    });
  });

  describe('validateCategory', () => {
    it('should accept valid categories', () => {
      VALID_CATEGORIES.forEach(category => {
        expect(validateCategory(category)).toBeNull();
      });
    });

    it('should reject invalid categories', () => {
      const error = validateCategory('InvalidCategory');
      expect(error).not.toBeNull();
      expect(error?.field).toBe('category');
      expect(error?.message).toContain('must be one of');
    });

    it('should reject empty categories', () => {
      const error = validateCategory('');
      expect(error).not.toBeNull();
      expect(error?.message).toContain('required');
    });
  });

  describe('validateDescription', () => {
    it('should accept valid descriptions', () => {
      expect(validateDescription('A valid description')).toBeNull();
      expect(validateDescription('Short')).toBeNull();
    });

    it('should reject empty descriptions', () => {
      const error = validateDescription('');
      expect(error).not.toBeNull();
      expect(error?.field).toBe('description_en');
    });

    it('should reject descriptions exceeding 2000 characters', () => {
      const longDesc = 'A'.repeat(2001);
      const error = validateDescription(longDesc);
      expect(error).not.toBeNull();
      expect(error?.message).toContain('2000 characters');
    });
  });

  describe('validateProductId', () => {
    it('should accept valid product IDs', () => {
      expect(validateProductId('prod-001')).toBeNull();
      expect(validateProductId('PROD_123')).toBeNull();
      expect(validateProductId('item-ABC-123')).toBeNull();
    });

    it('should reject empty product IDs', () => {
      const error = validateProductId('');
      expect(error).not.toBeNull();
      expect(error?.field).toBe('product_id');
    });

    it('should reject product IDs with invalid characters', () => {
      expect(validateProductId('prod 001')).not.toBeNull(); // space
      expect(validateProductId('prod@001')).not.toBeNull(); // special char
    });
  });

  describe('validateSpecsJson', () => {
    it('should accept valid specs objects', () => {
      expect(validateSpecsJson({ material: 'Steel', weight: '100g' })).toBeNull();
      expect(validateSpecsJson({ key: 'value' })).toBeNull();
    });

    it('should reject null or undefined specs', () => {
      expect(validateSpecsJson(null)).not.toBeNull();
      expect(validateSpecsJson(undefined)).not.toBeNull();
    });

    it('should reject non-object specs', () => {
      expect(validateSpecsJson('string')).not.toBeNull();
      expect(validateSpecsJson(123)).not.toBeNull();
      expect(validateSpecsJson([])).not.toBeNull();
    });

    it('should reject empty specs objects', () => {
      const error = validateSpecsJson({});
      expect(error).not.toBeNull();
      expect(error?.message).toContain('cannot be empty');
    });
  });

  describe('validateProduct', () => {
    const validProduct = {
      product_id: 'prod-001',
      name_en: 'Test Product',
      sku: 'TEST-001',
      category: 'Electronics',
      description_en: 'A test product description',
      specs_json: { material: 'Plastic', weight: '100g' },
    };

    it('should validate a complete valid product', () => {
      const result = validateProduct(validProduct);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect multiple validation errors', () => {
      const invalidProduct = {
        product_id: '',
        name_en: '',
        sku: 'invalid sku',
        category: 'InvalidCategory',
        description_en: '',
        specs_json: {},
      };

      const result = validateProduct(invalidProduct);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should report missing required fields', () => {
      const result = validateProduct({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(6);
    });

    it('should validate with image file when provided', () => {
      const mockImageFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = validateProduct(validProduct, mockImageFile);
      expect(result.valid).toBe(true);
    });

    it('should require image when requireImage is true', () => {
      const result = validateProduct(validProduct, undefined, true);
      expect(result.valid).toBe(false);
      const imageError = result.errors.find(e => e.field === 'image');
      expect(imageError).toBeDefined();
    });
  });

  describe('formatValidationErrors', () => {
    it('should format multiple errors into a string', () => {
      const errors = [
        { field: 'name_en', message: 'Name is required' },
        { field: 'sku', message: 'SKU is invalid' },
      ];

      const formatted = formatValidationErrors(errors);
      expect(formatted).toContain('name_en: Name is required');
      expect(formatted).toContain('sku: SKU is invalid');
    });

    it('should return empty string for no errors', () => {
      expect(formatValidationErrors([])).toBe('');
    });
  });

  describe('getFieldError', () => {
    const errors = [
      { field: 'name_en', message: 'Name is required' },
      { field: 'sku', message: 'SKU is invalid' },
    ];

    it('should return error message for existing field', () => {
      expect(getFieldError(errors, 'name_en')).toBe('Name is required');
      expect(getFieldError(errors, 'sku')).toBe('SKU is invalid');
    });

    it('should return null for non-existing field', () => {
      expect(getFieldError(errors, 'category')).toBeNull();
    });
  });
});
