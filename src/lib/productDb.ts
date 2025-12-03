/**
 * Product database service
 * Handles all database operations for products
 */

import { neon } from '@neondatabase/serverless';
import type { Product } from '../types/product';

/**
 * Create a new product
 */
export async function createProduct(
  product: Omit<Product, 'created_at' | 'updated_at'>,
  databaseUrl: string
): Promise<Product> {
  const sql = neon(databaseUrl);

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
  const sql = neon(databaseUrl);
  const { limit = 50, offset = 0, category } = options;

  // Build query
  let query = 'SELECT * FROM products';
  const params: any[] = [];

  if (category) {
    query += ' WHERE category = $1';
    params.push(category);
  }

  query += ' ORDER BY created_at DESC';

  if (limit) {
    query += ` LIMIT $${params.length + 1}`;
    params.push(limit);
  }

  if (offset) {
    query += ` OFFSET $${params.length + 1}`;
    params.push(offset);
  }

  // Get products
  const products = await sql(query, params);

  // Get total count
  let countQuery = 'SELECT COUNT(*) as count FROM products';
  const countParams: any[] = [];

  if (category) {
    countQuery += ' WHERE category = $1';
    countParams.push(category);
  }

  const countResult = await sql(countQuery, countParams);
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
  const sql = neon(databaseUrl);

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
  const sql = neon(databaseUrl);

  // Build update query dynamically
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.name_en !== undefined) {
    fields.push(`name_en = $${paramIndex++}`);
    values.push(updates.name_en);
  }

  if (updates.sku !== undefined) {
    fields.push(`sku = $${paramIndex++}`);
    values.push(updates.sku);
  }

  if (updates.category !== undefined) {
    fields.push(`category = $${paramIndex++}`);
    values.push(updates.category);
  }

  if (updates.description_en !== undefined) {
    fields.push(`description_en = $${paramIndex++}`);
    values.push(updates.description_en);
  }

  if (updates.specs_json !== undefined) {
    fields.push(`specs_json = $${paramIndex++}`);
    values.push(JSON.stringify(updates.specs_json));
  }

  if (updates.image_url !== undefined) {
    fields.push(`image_url = $${paramIndex++}`);
    values.push(updates.image_url);
  }

  if (fields.length === 0) {
    // No updates provided
    return getProductById(productId, databaseUrl);
  }

  // Add updated_at
  fields.push('updated_at = NOW()');

  // Add product_id to values
  values.push(productId);

  const query = `
    UPDATE products
    SET ${fields.join(', ')}
    WHERE product_id = $${paramIndex}
    RETURNING *
  `;

  const result = await sql(query, values);

  return result.length > 0 ? (result[0] as Product) : null;
}

/**
 * Delete a product
 */
export async function deleteProduct(
  productId: string,
  databaseUrl: string
): Promise<boolean> {
  const sql = neon(databaseUrl);

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
  const sql = neon(databaseUrl);

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
  const sql = neon(databaseUrl);

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
  const sql = neon(databaseUrl);

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
  const sql = neon(databaseUrl);
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
