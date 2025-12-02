import { describe, it, expect } from 'vitest';
import {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  getAllCategories,
  isValidProductId,
  validateProductIds
} from './products';

describe('Product utilities', () => {
  describe('getAllProducts', () => {
    it('should return an array of products', () => {
      const products = getAllProducts();
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
    });

    it('should return products with required fields', () => {
      const products = getAllProducts();
      const product = products[0];
      
      expect(product).toHaveProperty('product_id');
      expect(product).toHaveProperty('name_en');
      expect(product).toHaveProperty('sku');
      expect(product).toHaveProperty('category');
      expect(product).toHaveProperty('description_en');
      expect(product).toHaveProperty('specs_json');
      expect(product).toHaveProperty('image_url');
    });
  });

  describe('getProductById', () => {
    it('should return a product when ID exists', () => {
      const products = getAllProducts();
      const firstProduct = products[0];
      
      const result = getProductById(firstProduct.product_id);
      expect(result).toBeDefined();
      expect(result?.product_id).toBe(firstProduct.product_id);
    });

    it('should return undefined when ID does not exist', () => {
      const result = getProductById('non-existent-id');
      expect(result).toBeUndefined();
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products in the specified category', () => {
      const allProducts = getAllProducts();
      const firstCategory = allProducts[0].category;
      
      const results = getProductsByCategory(firstCategory);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      results.forEach(product => {
        expect(product.category).toBe(firstCategory);
      });
    });

    it('should return empty array for non-existent category', () => {
      const results = getProductsByCategory('NonExistentCategory');
      expect(results).toEqual([]);
    });
  });

  describe('getAllCategories', () => {
    it('should return an array of unique categories', () => {
      const categories = getAllCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      
      // Check uniqueness
      const uniqueCategories = Array.from(new Set(categories));
      expect(categories.length).toBe(uniqueCategories.length);
    });
  });

  describe('isValidProductId', () => {
    it('should return true for valid product ID', () => {
      const products = getAllProducts();
      const validId = products[0].product_id;
      
      expect(isValidProductId(validId)).toBe(true);
    });

    it('should return false for invalid product ID', () => {
      expect(isValidProductId('invalid-id')).toBe(false);
    });
  });

  describe('validateProductIds', () => {
    it('should return valid=true when all IDs are valid', () => {
      const products = getAllProducts();
      const validIds = products.slice(0, 2).map(p => p.product_id);
      
      const result = validateProductIds(validIds);
      expect(result.valid).toBe(true);
      expect(result.invalidIds).toEqual([]);
    });

    it('should return valid=false and list invalid IDs', () => {
      const products = getAllProducts();
      const mixedIds = [products[0].product_id, 'invalid-1', 'invalid-2'];
      
      const result = validateProductIds(mixedIds);
      expect(result.valid).toBe(false);
      expect(result.invalidIds).toEqual(['invalid-1', 'invalid-2']);
    });

    it('should handle empty array', () => {
      const result = validateProductIds([]);
      expect(result.valid).toBe(true);
      expect(result.invalidIds).toEqual([]);
    });
  });
});
