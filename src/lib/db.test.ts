import { describe, it, expect, vi } from 'vitest';
import { storeQuote, getQuoteById, getQuotes, updateQuoteStatus, deleteQuote } from './db';
import type { QuoteRequest } from './db';

// Mock Neon SQL function
const createMockSql = () => {
  const mockSql = vi.fn() as any;
  mockSql.mockImplementation((_strings: TemplateStringsArray, ..._values: any[]) => {
    return Promise.resolve([]);
  });
  return mockSql;
};

describe('Database operations', () => {
  describe('storeQuote', () => {
    it('should store a quote with items', async () => {
      const mockSql = createMockSql();
      
      const request: QuoteRequest = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '1234567890',
        companyName: 'Acme Corp',
        message: 'Test message',
        items: [
          { productId: 'prod-1', quantity: 2 },
          { productId: 'prod-2', quantity: 1 }
        ]
      };

      const quoteId = await storeQuote(mockSql, request);

      expect(quoteId).toBeDefined();
      expect(typeof quoteId).toBe('string');
      expect(quoteId.length).toBeGreaterThan(0);
      
      // Should call SQL for quote insert and item inserts
      expect(mockSql).toHaveBeenCalledTimes(3); // 1 quote + 2 items
    });

    it('should generate unique quote IDs', async () => {
      const mockSql = createMockSql();
      
      const request: QuoteRequest = {
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        customerPhone: '0987654321',
        companyName: 'Test Inc',
        message: 'Another test',
        items: [{ productId: 'prod-3', quantity: 5 }]
      };

      const quoteId1 = await storeQuote(mockSql, request);
      const quoteId2 = await storeQuote(mockSql, request);

      expect(quoteId1).not.toBe(quoteId2);
    });

    it('should handle empty message', async () => {
      const mockSql = createMockSql();
      
      const request: QuoteRequest = {
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '1111111111',
        companyName: 'Test Company',
        message: '',
        items: [{ productId: 'prod-1', quantity: 1 }]
      };

      const quoteId = await storeQuote(mockSql, request);
      expect(quoteId).toBeDefined();
    });
  });

  describe('getQuoteById', () => {
    it('should return null for non-existent quote', async () => {
      const mockSql = createMockSql();
      mockSql.mockResolvedValueOnce([]);

      const result = await getQuoteById(mockSql, 'non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getQuotes', () => {
    it('should retrieve all quotes when no status filter', async () => {
      const mockSql = createMockSql();
      mockSql.mockResolvedValueOnce([
        {
          quote_id: 'quote-1',
          customer_name: 'John',
          customer_email: 'john@example.com',
          customer_phone: '123',
          company_name: 'Acme',
          message: 'Test',
          created_at: new Date().toISOString(),
          status: 'pending'
        }
      ]);

      const quotes = await getQuotes(mockSql);
      expect(quotes).toHaveLength(1);
      expect(quotes[0].quote_id).toBe('quote-1');
    });

    it('should filter quotes by status', async () => {
      const mockSql = createMockSql();
      mockSql.mockResolvedValueOnce([]);

      await getQuotes(mockSql, 'completed');
      expect(mockSql).toHaveBeenCalled();
    });
  });

  describe('updateQuoteStatus', () => {
    it('should update quote status', async () => {
      const mockSql = createMockSql();

      await updateQuoteStatus(mockSql, 'quote-1', 'completed');
      expect(mockSql).toHaveBeenCalled();
    });
  });

  describe('deleteQuote', () => {
    it('should delete a quote', async () => {
      const mockSql = createMockSql();

      await deleteQuote(mockSql, 'quote-1');
      expect(mockSql).toHaveBeenCalled();
    });
  });
});
