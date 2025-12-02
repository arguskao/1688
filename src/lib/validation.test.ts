import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePhone,
  validateRequired,
  validateQuoteForm,
  type QuoteFormData
} from './validation';

describe('Validation utilities', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'test123@test-domain.com'
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@example.com',
        'invalid@.com',
        'invalid@domain',
        'invalid @domain.com'
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email 為必填欄位');
    });
  });

  describe('validatePhone', () => {
    it('should accept valid phone numbers', () => {
      const validPhones = [
        '0912345678',
        '+886912345678',
        '02-12345678',
        '(02) 1234-5678',
        '+1 234 567 8900'
      ];

      validPhones.forEach(phone => {
        const result = validatePhone(phone);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123',           // Too short
        'abcdefghij',    // Contains letters
        '12345',         // Too short
        '+886-abc-def'   // Contains letters
      ];

      invalidPhones.forEach(phone => {
        const result = validatePhone(phone);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should reject empty phone', () => {
      const result = validatePhone('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('電話號碼為必填欄位');
    });
  });

  describe('validateRequired', () => {
    it('should accept non-empty values', () => {
      const result = validateRequired('Some value', 'Field');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty values', () => {
      const result = validateRequired('', 'Field');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Field為必填欄位');
    });

    it('should reject whitespace-only values', () => {
      const result = validateRequired('   ', 'Field');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Field為必填欄位');
    });
  });

  describe('validateQuoteForm', () => {
    it('should validate a complete valid form', () => {
      const formData: QuoteFormData = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '0912345678',
        companyName: 'Acme Corp',
        message: 'Test message'
      };

      const result = validateQuoteForm(formData);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should allow empty message', () => {
      const formData: QuoteFormData = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '0912345678',
        companyName: 'Acme Corp',
        message: ''
      };

      const result = validateQuoteForm(formData);
      expect(result.isValid).toBe(true);
    });

    it('should return errors for all invalid fields', () => {
      const formData: QuoteFormData = {
        customerName: '',
        customerEmail: 'invalid-email',
        customerPhone: '123',
        companyName: '',
        message: ''
      };

      const result = validateQuoteForm(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.customerName).toBeDefined();
      expect(result.errors.customerEmail).toBeDefined();
      expect(result.errors.customerPhone).toBeDefined();
      expect(result.errors.companyName).toBeDefined();
      expect(result.errors.message).toBeUndefined(); // Message is optional
    });

    it('should return specific error for invalid email', () => {
      const formData: QuoteFormData = {
        customerName: 'John Doe',
        customerEmail: 'invalid',
        customerPhone: '0912345678',
        companyName: 'Acme Corp',
        message: ''
      };

      const result = validateQuoteForm(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.customerEmail).toBe('Email 格式不正確');
    });
  });
});
