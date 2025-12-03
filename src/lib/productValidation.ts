/**
 * Product validation utilities
 * Validates product data for admin product management
 */

import type { Product } from '../types/product';

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Predefined valid categories
 */
export const VALID_CATEGORIES = [
  'Drinkware',
  'Kitchenware',
  'Office Supplies',
  'Electronics',
  'Furniture',
  'Home Decor',
  'Textiles',
  'Toys',
  'Sports',
  'Beauty',
  'Health',
  'Automotive',
  'Garden',
  'Pet Supplies',
  'Other',
] as const;

/**
 * Valid image MIME types
 */
export const VALID_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

/**
 * Valid image file extensions
 */
export const VALID_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

/**
 * Maximum file size for images (5MB)
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Validate product name
 */
export function validateProductName(name: string): ValidationError | null {
  if (!name || name.trim().length === 0) {
    return {
      field: 'name_en',
      message: 'Product name is required',
    };
  }

  if (name.length > 200) {
    return {
      field: 'name_en',
      message: 'Product name must not exceed 200 characters',
    };
  }

  return null;
}

/**
 * Validate product SKU
 */
export function validateSKU(sku: string): ValidationError | null {
  if (!sku || sku.trim().length === 0) {
    return {
      field: 'sku',
      message: 'SKU is required',
    };
  }

  if (sku.length > 50) {
    return {
      field: 'sku',
      message: 'SKU must not exceed 50 characters',
    };
  }

  // SKU should only contain alphanumeric characters, hyphens, and underscores
  const skuRegex = /^[A-Za-z0-9\-_]+$/;
  if (!skuRegex.test(sku)) {
    return {
      field: 'sku',
      message: 'SKU can only contain letters, numbers, hyphens, and underscores',
    };
  }

  return null;
}

/**
 * Validate product category
 */
export function validateCategory(category: string): ValidationError | null {
  if (!category || category.trim().length === 0) {
    return {
      field: 'category',
      message: 'Category is required',
    };
  }

  if (!VALID_CATEGORIES.includes(category as any)) {
    return {
      field: 'category',
      message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
    };
  }

  return null;
}

/**
 * Validate product description
 */
export function validateDescription(description: string): ValidationError | null {
  if (!description || description.trim().length === 0) {
    return {
      field: 'description_en',
      message: 'Description is required',
    };
  }

  if (description.length > 2000) {
    return {
      field: 'description_en',
      message: 'Description must not exceed 2000 characters',
    };
  }

  return null;
}

/**
 * Validate product ID
 */
export function validateProductId(productId: string): ValidationError | null {
  if (!productId || productId.trim().length === 0) {
    return {
      field: 'product_id',
      message: 'Product ID is required',
    };
  }

  if (productId.length > 50) {
    return {
      field: 'product_id',
      message: 'Product ID must not exceed 50 characters',
    };
  }

  // Product ID should only contain alphanumeric characters, hyphens, and underscores
  const idRegex = /^[A-Za-z0-9\-_]+$/;
  if (!idRegex.test(productId)) {
    return {
      field: 'product_id',
      message: 'Product ID can only contain letters, numbers, hyphens, and underscores',
    };
  }

  return null;
}

/**
 * Validate specs JSON
 */
export function validateSpecsJson(specs: any): ValidationError | null {
  if (!specs) {
    return {
      field: 'specs_json',
      message: 'Product specifications are required',
    };
  }

  if (typeof specs !== 'object' || Array.isArray(specs)) {
    return {
      field: 'specs_json',
      message: 'Product specifications must be a valid object',
    };
  }

  // Check if specs is empty
  if (Object.keys(specs).length === 0) {
    return {
      field: 'specs_json',
      message: 'Product specifications cannot be empty',
    };
  }

  return null;
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): ValidationError | null {
  // Check if file exists
  if (!file) {
    return {
      field: 'image',
      message: 'Image file is required',
    };
  }

  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      field: 'image',
      message: `Image file size must not exceed ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check MIME type
  if (!VALID_IMAGE_TYPES.includes(file.type as any)) {
    return {
      field: 'image',
      message: `Image must be one of the following formats: ${VALID_IMAGE_TYPES.join(', ')}`,
    };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = VALID_IMAGE_EXTENSIONS.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      field: 'image',
      message: `Image file must have one of the following extensions: ${VALID_IMAGE_EXTENSIONS.join(', ')}`,
    };
  }

  return null;
}

/**
 * Validate complete product data
 */
export function validateProduct(
  product: Partial<Product>,
  imageFile?: File,
  requireImage: boolean = false
): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate product ID
  if (product.product_id !== undefined) {
    const idError = validateProductId(product.product_id);
    if (idError) errors.push(idError);
  } else {
    errors.push({
      field: 'product_id',
      message: 'Product ID is required',
    });
  }

  // Validate name
  if (product.name_en !== undefined) {
    const nameError = validateProductName(product.name_en);
    if (nameError) errors.push(nameError);
  } else {
    errors.push({
      field: 'name_en',
      message: 'Product name is required',
    });
  }

  // Validate SKU
  if (product.sku !== undefined) {
    const skuError = validateSKU(product.sku);
    if (skuError) errors.push(skuError);
  } else {
    errors.push({
      field: 'sku',
      message: 'SKU is required',
    });
  }

  // Validate category
  if (product.category !== undefined) {
    const categoryError = validateCategory(product.category);
    if (categoryError) errors.push(categoryError);
  } else {
    errors.push({
      field: 'category',
      message: 'Category is required',
    });
  }

  // Validate description
  if (product.description_en !== undefined) {
    const descError = validateDescription(product.description_en);
    if (descError) errors.push(descError);
  } else {
    errors.push({
      field: 'description_en',
      message: 'Description is required',
    });
  }

  // Validate specs
  if (product.specs_json !== undefined) {
    const specsError = validateSpecsJson(product.specs_json);
    if (specsError) errors.push(specsError);
  } else {
    errors.push({
      field: 'specs_json',
      message: 'Product specifications are required',
    });
  }

  // Validate image if provided or required
  if (imageFile) {
    const imageError = validateImageFile(imageFile);
    if (imageError) errors.push(imageError);
  } else if (requireImage) {
    errors.push({
      field: 'image',
      message: 'Product image is required',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format validation errors into a user-friendly message
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  
  return errors.map(err => `${err.field}: ${err.message}`).join('; ');
}

/**
 * Get validation error for a specific field
 */
export function getFieldError(
  errors: ValidationError[],
  field: string
): string | null {
  const error = errors.find(err => err.field === field);
  return error ? error.message : null;
}
