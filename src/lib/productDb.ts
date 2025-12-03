/**
 * Product database service
 * Handles all database operations for products
 */

import { getDb } from './database';
import type { Product } from '../types/product';

/**
 * Create a new product
 */
export async function createProduct(
  product: Omit<Product, 'created_at' | 'updated_at'>,
  databaseUrl: string
): Promise<Product> {
  const sql = getDb(databaseUrl);

  const result = await sql`
    INSERT INTO products (
      product_id, name_en, sku, category, description_en, specs_json, image_url
    )
    VALUES (
      ${product.product_id},
      ${product.name_en},
      ${product.sku},
      ${product.category},
      ${product.description_en},
      ${JSON.stringify(product.specs_json)},
      ${product.image_url || ''}
    )
    RETURNING *
  `;

  return result[0] as Product;
}

/**
 * Get all products with pagination
 */
export async function getProducts(
  databaseUrl: string,
  options: {
    limit?: number;
    offset?: number;
    category?: string;
  } = {}
): Promise<{ products: Product[]; total: number }> {
  const sql = getDb(databaseUrl);
  const { limit = 50, offset = 0, category } = options;

  // Get products
  let products;
  if (category) {
    products = await sql`
      SELECT * FROM products
      WHERE category = ${category}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  } else {
    products = await sql`
      SELECT * FROM products
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  }

  // Get total count
  let countResult;
  if (category) {
    countResult = await sql`
      SELECT COUNT(*) as count FROM products
      WHERE category = ${category}
    `;
  } else {
    countResult = await sql`
      SELECT COUNT(*) as count FROM products
    `;
  }
  const total = parseInt(countResult[0].count);

  return {
    products: products as Product[],
    total,
  };
}

/**
 * Get a single product by ID
 */
export async function getProductById(
  productId: string,
  databaseUrl: string
): Promise<Product | null> {
  const sql = getDb(databaseUrl);

  const result = await sql`
    SELECT * FROM products
    WHERE product_id = ${productId}
  `;

  return result.length > 0 ? (result[0] as Product) : null;
}

/**
 * Update a product
 */
export async function updateProduct(
  productId: string,
  updates: Partial<Omit<Product, 'product_id' | 'created_at' | 'updated_at'>>,
  databaseUrl: string
): Promise<Product | null> {
  const sql = getDb(databaseUrl);

  if (Object.keys(updates).length === 0) {
    // No updates provided
    return getProductById(productId, databaseUrl);
  }

  // Build update object
  const updateData: any = { ...updates };
  if (updates.specs_json !== undefined) {
    updateData.specs_json = JSON.stringify(updates.specs_json);
  }

  // Perform update using template literals
  const result = await sql`
    UPDATE products
    SET 
      name_en = COALESCE(${updates.name_en}, name_en),
      sku = COALESCE(${updates.sku}, sku),
      category = COALESCE(${updates.category}, category),
      description_en = COALESCE(${updates.description_en}, description_en),
      specs_json = COALESCE(${updateData.specs_json ? updateData.specs_json : null}::jsonb, specs_json),
      image_url = COALESCE(${updates.image_url}, image_url),
      updated_at = NOW()
    WHERE product_id = ${productId}
    RETURNING *
  `;

  return result.length > 0 ? (result[0] as Product) : null;
}

/**
 * Delete a product
 */
export async function deleteProduct(
  productId: string,
  databaseUrl: string
): Promise<boolean> {
  const sql = getDb(databaseUrl);

  const result = await sql`
    DELETE FROM products
    WHERE product_id = ${productId}
    RETURNING product_id
  `;

  return result.length > 0;
}

/**
 * Check if a product exists
 */
export async function productExists(
  productId: string,
  databaseUrl: string
): Promise<boolean> {
  const sql = getDb(databaseUrl);

  const result = await sql`
    SELECT 1 FROM products
    WHERE product_id = ${productId}
    LIMIT 1
  `;

  return result.length > 0;
}

/**
 * Check if SKU is already used by another product
 */
export async function isSkuTaken(
  sku: string,
  excludeProductId: string | null,
  databaseUrl: string
): Promise<boolean> {
  const sql = getDb(databaseUrl);

  let result;
  if (excludeProductId) {
    result = await sql`
      SELECT 1 FROM products
      WHERE sku = ${sku} AND product_id != ${excludeProductId}
      LIMIT 1
    `;
  } else {
    result = await sql`
      SELECT 1 FROM products
      WHERE sku = ${sku}
      LIMIT 1
    `;
  }

  return result.length > 0;
}

/**
 * Get all unique categories
 */
export async function getCategories(databaseUrl: string): Promise<string[]> {
  const sql = getDb(databaseUrl);

  const result = await sql`
    SELECT DISTINCT category
    FROM products
    ORDER BY category
  `;

  return result.map((row: any) => row.category);
}

/**
 * Search products by name or SKU
 */
export async function searchProducts(
  query: string,
  databaseUrl: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ products: Product[]; total: number }> {
  const sql = getDb(databaseUrl);
  const { limit = 50, offset = 0 } = options;

  const searchPattern = `%${query}%`;

  // Get products
  const products = await sql`
    SELECT * FROM products
    WHERE name_en ILIKE ${searchPattern}
       OR sku ILIKE ${searchPattern}
       OR description_en ILIKE ${searchPattern}
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  // Get total count
  const countResult = await sql`
    SELECT COUNT(*) as count FROM products
    WHERE name_en ILIKE ${searchPattern}
       OR sku ILIKE ${searchPattern}
       OR description_en ILIKE ${searchPattern}
  `;

  const total = parseInt(countResult[0].count);

  return {
    products: products as Product[],
    total,
  };
}
