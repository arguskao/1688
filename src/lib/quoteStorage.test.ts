import { describe, it, expect, beforeEach } from 'vitest';
import {
  getQuoteListFromStorage,
  saveQuoteListToStorage,
  clearQuoteListFromStorage,
  addToQuoteList,
  updateQuantity,
  removeFromQuoteList,
  getQuoteListCount,
  isInQuoteList,
  isStorageAvailable,
  type StoredQuoteItem
} from './quoteStorage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('Quote Storage Service', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('getQuoteListFromStorage', () => {
    it('should return empty array when no data exists', () => {
      const result = getQuoteListFromStorage();
      expect(result).toEqual([]);
    });

    it('should return stored items', () => {
      const items: StoredQuoteItem[] = [
        {
          productId: 'prod-001',
          productName: 'Test Product',
          sku: 'TEST-001',
          imageUrl: 'https://example.com/image.jpg',
          quantity: 2
        }
      ];
      
      localStorage.setItem('quote_list', JSON.stringify(items));
      
      const result = getQuoteListFromStorage();
      expect(result).toEqual(items);
    });

    it('should return empty array on parse error', () => {
      localStorage.setItem('quote_list', 'invalid json');
      
      const result = getQuoteListFromStorage();
      expect(result).toEqual([]);
    });
  });

  describe('saveQuoteListToStorage', () => {
    it('should save items to localStorage', () => {
      const items: StoredQuoteItem[] = [
        {
          productId: 'prod-001',
          productName: 'Test Product',
          sku: 'TEST-001',
          imageUrl: 'https://example.com/image.jpg',
          quantity: 1
        }
      ];
      
      saveQuoteListToStorage(items);
      
      const stored = localStorage.getItem('quote_list');
      expect(stored).toBe(JSON.stringify(items));
    });
  });

  describe('clearQuoteListFromStorage', () => {
    it('should remove quote list from storage', () => {
      localStorage.setItem('quote_list', JSON.stringify([{ productId: 'test' }]));
      
      clearQuoteListFromStorage();
      
      expect(localStorage.getItem('quote_list')).toBeNull();
    });
  });

  describe('addToQuoteList', () => {
    it('should add new item to empty list', () => {
      addToQuoteList({
        productId: 'prod-001',
        productName: 'Test Product',
        sku: 'TEST-001',
        imageUrl: 'https://example.com/image.jpg'
      });
      
      const items = getQuoteListFromStorage();
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe('prod-001');
      expect(items[0].quantity).toBe(1);
    });

    it('should add item with specified quantity', () => {
      addToQuoteList({
        productId: 'prod-001',
        productName: 'Test Product',
        sku: 'TEST-001',
        imageUrl: 'https://example.com/image.jpg',
        quantity: 5
      });
      
      const items = getQuoteListFromStorage();
      expect(items[0].quantity).toBe(5);
    });

    it('should increment quantity if product already exists', () => {
      addToQuoteList({
        productId: 'prod-001',
        productName: 'Test Product',
        sku: 'TEST-001',
        imageUrl: 'https://example.com/image.jpg',
        quantity: 2
      });
      
      addToQuoteList({
        productId: 'prod-001',
        productName: 'Test Product',
        sku: 'TEST-001',
        imageUrl: 'https://example.com/image.jpg',
        quantity: 3
      });
      
      const items = getQuoteListFromStorage();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(5);
    });
  });

  describe('updateQuantity', () => {
    beforeEach(() => {
      addToQuoteList({
        productId: 'prod-001',
        productName: 'Test Product',
        sku: 'TEST-001',
        imageUrl: 'https://example.com/image.jpg',
        quantity: 2
      });
    });

    it('should update quantity of existing item', () => {
      updateQuantity('prod-001', 5);
      
      const items = getQuoteListFromStorage();
      expect(items[0].quantity).toBe(5);
    });

    it('should throw error for quantity <= 0', () => {
      expect(() => updateQuantity('prod-001', 0)).toThrow('數量必須大於 0');
      expect(() => updateQuantity('prod-001', -1)).toThrow('數量必須大於 0');
    });

    it('should do nothing if product not found', () => {
      updateQuantity('non-existent', 5);
      
      const items = getQuoteListFromStorage();
      expect(items[0].quantity).toBe(2); // unchanged
    });
  });

  describe('removeFromQuoteList', () => {
    beforeEach(() => {
      addToQuoteList({
        productId: 'prod-001',
        productName: 'Product 1',
        sku: 'TEST-001',
        imageUrl: 'https://example.com/1.jpg'
      });
      addToQuoteList({
        productId: 'prod-002',
        productName: 'Product 2',
        sku: 'TEST-002',
        imageUrl: 'https://example.com/2.jpg'
      });
    });

    it('should remove item from list', () => {
      removeFromQuoteList('prod-001');
      
      const items = getQuoteListFromStorage();
      expect(items).toHaveLength(1);
      expect(items[0].productId).toBe('prod-002');
    });

    it('should do nothing if product not found', () => {
      removeFromQuoteList('non-existent');
      
      const items = getQuoteListFromStorage();
      expect(items).toHaveLength(2);
    });
  });

  describe('getQuoteListCount', () => {
    it('should return 0 for empty list', () => {
      expect(getQuoteListCount()).toBe(0);
    });

    it('should return total quantity of all items', () => {
      addToQuoteList({
        productId: 'prod-001',
        productName: 'Product 1',
        sku: 'TEST-001',
        imageUrl: 'https://example.com/1.jpg',
        quantity: 2
      });
      addToQuoteList({
        productId: 'prod-002',
        productName: 'Product 2',
        sku: 'TEST-002',
        imageUrl: 'https://example.com/2.jpg',
        quantity: 3
      });
      
      expect(getQuoteListCount()).toBe(5);
    });
  });

  describe('isInQuoteList', () => {
    beforeEach(() => {
      addToQuoteList({
        productId: 'prod-001',
        productName: 'Test Product',
        sku: 'TEST-001',
        imageUrl: 'https://example.com/image.jpg'
      });
    });

    it('should return true if product is in list', () => {
      expect(isInQuoteList('prod-001')).toBe(true);
    });

    it('should return false if product is not in list', () => {
      expect(isInQuoteList('prod-999')).toBe(false);
    });
  });

  describe('isStorageAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(isStorageAvailable()).toBe(true);
    });
  });
});
