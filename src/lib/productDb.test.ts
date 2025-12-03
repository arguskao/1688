/**
 * Unit tests for product database service
 * Note: These tests use mocked database responses
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('./database', () => ({
  getDb: vi.fn(),
}));

import { getDb } from './database';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  productExists,
  isSkuTaken,
  getCategories,
  searchProducts,
} from './productDb';

describe('Product Database Service', () => {
  const mockDatabaseUrl = 'postgresql://test';
  let mockSql: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock SQL function
    mockSql = vi.fn();
    (getDb as any).mockReturnValue(mockSql);
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const newProduct = {
        product_id: 'test-001',
        name_en: 'Test Product',
        sku: 'TEST-001',
        category: 'Electronics',
        description_en: 'A test product',
        specs_json: { color: 'blue' },
        image_url: 'https://example.com/image.jpg',
      };

      mockSql.mockResolvedValue([
        { ...newProduct, created_at: new Date(), updated_at: new Date() },
      ]);

      const result = await createProduct(newProduct, mockDatabaseUrl);

      expect(result.product_id).toBe('test-001');
      expect(result.name_en).toBe('Test Product');
      expect(mockSql).toHaveBeenCalled();
    });
  });

  describe('getProducts', () => {
    it('should get all products with pagination', async () => {
      const mockProducts = [
        {
          product_id: 'prod-001',
          name_en: 'Product 1',
          sku: 'SKU-001',
          category: 'Electronics',
        },
        {
          product_id: 'prod-002',
          name_en: 'Product 2',
          sku: 'SKU-002',
          category: 'Electronics',
        },
      ];

      mockSql
        .mockResolvedValueOnce(mockProducts)
        .mockResolvedValueOnce([{ count: '2' }]);

      const result = await getProducts(mockDatabaseUrl, { limit: 10, offset: 0 });

      expect(result.products).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by category', async () => {
      mockSql
        .mockResolvedValueOnce([{ product_id: 'prod-001', category: 'Electronics' }])
        .mockResolvedValueOnce([{ count: '1' }]);

      const result = await getProducts(mockDatabaseUrl, { category: 'Electronics' });

      expect(result.products).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getProductById', () => {
    it('should return a product when found', async () => {
      const mockProduct = {
        product_id: 'test-001',
        name_en: 'Test Product',
      };

      mockSql.mockResolvedValue([mockProduct]);

      const result = await getProductById('test-001', mockDatabaseUrl);

      expect(result).not.toBeNull();
      expect(result?.product_id).toBe('test-001');
    });

    it('should return null when product not found', async () => {
      mockSql.mockResolvedValue([]);

      const result = await getProductById('nonexistent', mockDatabaseUrl);

      expect(result).toBeNull();
    });
  });

  describe('updateProduct', () => {
    it('should update product fields', async () => {
      const updates = {
        name_en: 'Updated Name',
        description_en: 'Updated description',
      };

      mockSql.mockResolvedValue([
        {
          product_id: 'test-001',
          ...updates,
          updated_at: new Date(),
        },
      ]);

      const result = await updateProduct('test-001', updates, mockDatabaseUrl);

      expect(result).not.toBeNull();
      expect(result?.name_en).toBe('Updated Name');
      expect(mockSql).toHaveBeenCalled();
    });

    it('should return existing product when no updates provided', async () => {
      mockSql.mockResolvedValue([{ product_id: 'test-001' }]);

      const result = await updateProduct('test-001', {}, mockDatabaseUrl);

      expect(result).not.toBeNull();
    });
  });

  describe('deleteProduct', () => {
    it('should return true when product is deleted', async () => {
      mockSql.mockResolvedValue([{ product_id: 'test-001' }]);

      const result = await deleteProduct('test-001', mockDatabaseUrl);

      expect(result).toBe(true);
    });

    it('should return false when product not found', async () => {
      mockSql.mockResolvedValue([]);

      const result = await deleteProduct('nonexistent', mockDatabaseUrl);

      expect(result).toBe(false);
    });
  });

  describe('productExists', () => {
    it('should return true when product exists', async () => {
      mockSql.mockResolvedValue([{ exists: 1 }]);

      const result = await productExists('test-001', mockDatabaseUrl);

      expect(result).toBe(true);
    });

    it('should return false when product does not exist', async () => {
      mockSql.mockResolvedValue([]);

      const result = await productExists('nonexistent', mockDatabaseUrl);

      expect(result).toBe(false);
    });
  });

  describe('isSkuTaken', () => {
    it('should return true when SKU is taken', async () => {
      mockSql.mockResolvedValue([{ exists: 1 }]);

      const result = await isSkuTaken('SKU-001', null, mockDatabaseUrl);

      expect(result).toBe(true);
    });

    it('should return false when SKU is available', async () => {
      mockSql.mockResolvedValue([]);

      const result = await isSkuTaken('SKU-NEW', null, mockDatabaseUrl);

      expect(result).toBe(false);
    });

    it('should exclude current product when checking SKU', async () => {
      mockSql.mockResolvedValue([]);

      const result = await isSkuTaken('SKU-001', 'test-001', mockDatabaseUrl);

      expect(result).toBe(false);
    });
  });

  describe('getCategories', () => {
    it('should return list of unique categories', async () => {
      mockSql.mockResolvedValue([
        { category: 'Electronics' },
        { category: 'Furniture' },
        { category: 'Office Supplies' },
      ]);

      const result = await getCategories(mockDatabaseUrl);

      expect(result).toHaveLength(3);
      expect(result).toContain('Electronics');
      expect(result).toContain('Furniture');
    });
  });

  describe('searchProducts', () => {
    it('should search products by name', async () => {
      const mockProducts = [
        { product_id: 'prod-001', name_en: 'Test Product' },
      ];

      mockSql
        .mockResolvedValueOnce(mockProducts)
        .mockResolvedValueOnce([{ count: '1' }]);

      const result = await searchProducts('Test', mockDatabaseUrl);

      expect(result.products).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle pagination in search', async () => {
      mockSql
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: '0' }]);

      const result = await searchProducts('query', mockDatabaseUrl, {
        limit: 10,
        offset: 20,
      });

      expect(result.products).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
