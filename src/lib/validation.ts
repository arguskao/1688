/**
 * Validation utilities for form inputs
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns Validation result
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      error: 'Email 為必填欄位'
    };
  }

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Email 格式不正確'
    };
  }

  return { isValid: true };
}

/**
 * Validate phone number format
 * Accepts various formats: +886912345678, 0912345678, 02-12345678, etc.
 * @param phone - Phone number to validate
 * @returns Validation result
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone || phone.trim() === '') {
    return {
      isValid: false,
      error: '電話號碼為必填欄位'
    };
  }

  // Remove spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-()]/g, '');
  
  // Check if it contains only digits and optional leading +
  const phoneRegex = /^\+?\d{8,15}$/;
  
  if (!phoneRegex.test(cleanPhone)) {
    return {
      isValid: false,
      error: '電話號碼格式不正確'
    };
  }

  return { isValid: true };
}

/**
 * Validate required field
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message
 * @returns Validation result
 */
export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: `${fieldName}為必填欄位`
    };
  }

  return { isValid: true };
}

/**
 * Validate all form fields
 * @param formData - Form data to validate
 * @returns Object with validation results for each field
 */
export interface QuoteFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  message: string;
}

export interface FormValidationErrors {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  companyName?: string;
  message?: string;
}

export function validateQuoteForm(formData: QuoteFormData): {
  isValid: boolean;
  errors: FormValidationErrors;
} {
  const errors: FormValidationErrors = {};

  // Validate customer name
  const nameResult = validateRequired(formData.customerName, '姓名');
  if (!nameResult.isValid) {
    errors.customerName = nameResult.error;
  }

  // Validate email
  const emailResult = validateEmail(formData.customerEmail);
  if (!emailResult.isValid) {
    errors.customerEmail = emailResult.error;
  }

  // Validate phone
  const phoneResult = validatePhone(formData.customerPhone);
  if (!phoneResult.isValid) {
    errors.customerPhone = phoneResult.error;
  }

  // Validate company name
  const companyResult = validateRequired(formData.companyName, '公司名稱');
  if (!companyResult.isValid) {
    errors.companyName = companyResult.error;
  }

  // Message is optional, no validation needed

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
