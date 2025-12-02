import type { Product, ProductDataSource } from '../types/product';
import productsData from '../data/products.json';

/**
 * Get all products from the data source
 */
export function getAllProducts(): Product[] {
  return (productsData as ProductDataSource).products;
}

/**
 * Get a single product by ID
 */
export function getProductById(productId: string): Product | undefined {
  return getAllProducts().find(p => p.product_id === productId);
}

/**
 * Get products by category
 */
export function getProductsByCategory(category: string): Product[] {
  return getAllProducts().filter(p => p.category === category);
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
  const categories = getAllProducts().map(p => p.category);
  return Array.from(new Set(categories));
}

/**
 * Validate if a product ID exists
 */
export function isValidProductId(productId: string): boolean {
  return getAllProducts().some(p => p.product_id === productId);
}

/**
 * Validate multiple product IDs
 */
export function validateProductIds(productIds: string[]): {
  valid: boolean;
  invalidIds: string[];
} {
  const allProductIds = getAllProducts().map(p => p.product_id);
  const invalidIds = productIds.filter(id => !allProductIds.includes(id));
  
  return {
    valid: invalidIds.length === 0,
    invalidIds
  };
}
