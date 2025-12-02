import { describe, it, expect } from 'vitest';
import { generateEmailTemplate } from './email';

describe('Email service', () => {
  describe('generateEmailTemplate', () => {
    it('should generate HTML email with all customer information', () => {
      const quoteId = 'test-quote-123';
      const request = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '0912345678',
        companyName: 'Acme Corp',
        message: 'Test message',
        items: [
          {
            productId: 'prod-001',
            productName: 'Test Product 1',
            sku: 'SKU-001',
            quantity: 2
          },
          {
            productId: 'prod-002',
            productName: 'Test Product 2',
            sku: 'SKU-002',
            quantity: 1
          }
        ]
      };

      const html = generateEmailTemplate(quoteId, request);

      // Check quote ID
      expect(html).toContain(quoteId);

      // Check customer information
      expect(html).toContain('John Doe');
      expect(html).toContain('john@example.com');
      expect(html).toContain('0912345678');
      expect(html).toContain('Acme Corp');

      // Check message
      expect(html).toContain('Test message');

      // Check products
      expect(html).toContain('Test Product 1');
      expect(html).toContain('SKU-001');
      expect(html).toContain('Test Product 2');
      expect(html).toContain('SKU-002');

      // Check quantities
      expect(html).toContain('2');
      expect(html).toContain('1');
    });

    it('should handle empty message', () => {
      const quoteId = 'test-quote-456';
      const request = {
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        customerPhone: '0987654321',
        companyName: 'Test Inc',
        message: '',
        items: [
          {
            productId: 'prod-003',
            productName: 'Test Product 3',
            sku: 'SKU-003',
            quantity: 5
          }
        ]
      };

      const html = generateEmailTemplate(quoteId, request);

      // Should still generate valid HTML
      expect(html).toContain('Jane Doe');
      expect(html).toContain('Test Product 3');
      
      // Message section should not be present
      expect(html).not.toContain('客戶留言');
    });

    it('should escape HTML in user input', () => {
      const quoteId = 'test-quote-789';
      const request = {
        customerName: '<script>alert("xss")</script>',
        customerEmail: 'test@example.com',
        customerPhone: '1234567890',
        companyName: 'Test & Co',
        message: '<b>Bold message</b>',
        items: [
          {
            productId: 'prod-004',
            productName: 'Product <script>',
            sku: 'SKU-004',
            quantity: 1
          }
        ]
      };

      const html = generateEmailTemplate(quoteId, request);

      // Should escape HTML entities
      expect(html).not.toContain('<script>alert("xss")</script>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('Test &amp; Co');
      expect(html).not.toContain('<b>Bold message</b>');
      expect(html).toContain('&lt;b&gt;Bold message&lt;/b&gt;');
    });

    it('should calculate total items and quantity', () => {
      const quoteId = 'test-quote-total';
      const request = {
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        customerPhone: '1234567890',
        companyName: 'Test Company',
        message: '',
        items: [
          { productId: 'p1', productName: 'Product 1', sku: 'S1', quantity: 2 },
          { productId: 'p2', productName: 'Product 2', sku: 'S2', quantity: 3 },
          { productId: 'p3', productName: 'Product 3', sku: 'S3', quantity: 5 }
        ]
      };

      const html = generateEmailTemplate(quoteId, request);

      // Should show 3 types of products
      expect(html).toContain('3');
      
      // Should show total quantity of 10 (2+3+5)
      expect(html).toContain('10');
    });

    it('should generate valid HTML structure', () => {
      const quoteId = 'test-quote-html';
      const request = {
        customerName: 'Test',
        customerEmail: 'test@test.com',
        customerPhone: '123',
        companyName: 'Test',
        message: '',
        items: [
          { productId: 'p1', productName: 'P1', sku: 'S1', quantity: 1 }
        ]
      };

      const html = generateEmailTemplate(quoteId, request);

      // Check for basic HTML structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('</head>');
      expect(html).toContain('<body');
      expect(html).toContain('</body>');
    });
  });
});
