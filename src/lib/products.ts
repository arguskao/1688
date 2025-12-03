import type { Product } from '../types/product';
import { getProducts as getProductsFromDb, getProductById as getProductByIdFromDb, getCategories as getCategoriesFromDb } from './productDb';

/**
 * Get database URL from environment
 * In Cloudflare Pages, environment variables are passed via the runtime context
 */
function getDatabaseUrl(runtime?: any): string {
  // Try to get from Cloudflare runtime first (for production)
  if (runtime?.env?.DATABASE_URL) {
    return runtime.env.DATABASE_URL;
  }
  
  // Fall back to import.meta.env (for build time) or process.env (for local dev)
  const url = import.meta.env.DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not configured');
  }
  return url;
}

/**
 * Get all products from the database
 */
export async function getAllProducts(runtime?: any): Promise<Product[]> {
  try {
    const databaseUrl = getDatabaseUrl(runtime);
    const result = await getProductsFromDb(databaseUrl, { limit: 1000 });
    return result.products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Get a single product by ID
 */
export async function getProductById(productId: string, runtime?: any): Promise<Product | null> {
  try {
    const databaseUrl = getDatabaseUrl(runtime);
    return await getProductByIdFromDb(productId, databaseUrl);
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

/**
 * Get products by category
 */
export async function getProductsByCategory(category: string, runtime?: any): Promise<Product[]> {
  try {
    const databaseUrl = getDatabaseUrl(runtime);
    const result = await getProductsFromDb(databaseUrl, { category, limit: 1000 });
    return result.products;
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return [];
  }
}

/**
 * Get all unique categories
 */
export async function getAllCategories(runtime?: any): Promise<string[]> {
  try {
    const databaseUrl = getDatabaseUrl(runtime);
    return await getCategoriesFromDb(databaseUrl);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Validate if a product ID exists
 */
export async function isValidProductId(productId: string, runtime?: any): Promise<boolean> {
  try {
    const product = await getProductById(productId, runtime);
    return product !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Validate multiple product IDs
 */
export async function validateProductIds(productIds: string[], runtime?: any): Promise<{
  valid: boolean;
  invalidIds: string[];
}> {
  const invalidIds: string[] = [];
  
  for (const id of productIds) {
    const isValid = await isValidProductId(id, runtime);
    if (!isValid) {
      invalidIds.push(id);
    }
  }
  
  return {
    valid: invalidIds.length === 0,
    invalidIds
  };
}
