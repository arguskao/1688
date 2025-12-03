/**
 * Category database service
 * Handles all database operations for categories
 */

import { getDb } from './database';
import { createRepository } from './baseRepository';
import type { Category } from '../types';

export type { Category };

// Create base repository with common operations
const categoryRepo = createRepository<Category>({
  tableName: 'categories',
  primaryKey: 'id',
  columns: ['id', 'name', 'display_order', 'created_at', 'updated_at'],
});

/**
 * Get all categories ordered by display_order
 */
export async function getAllCategories(databaseUrl: string): Promise<Category[]> {
  const sql = getDb(databaseUrl);
  const result = await sql`
        SELECT id, name, display_order, created_at, updated_at
        FROM categories
        ORDER BY display_order ASC, name ASC
    `;
  return result as Category[];
}

/**
 * Get category names only (for dropdowns)
 */
export async function getCategoryNames(databaseUrl: string): Promise<string[]> {
  const sql = getDb(databaseUrl);
  const result = await sql`
        SELECT name FROM categories
        ORDER BY display_order ASC, name ASC
    `;
  return result.map((row: any) => row.name);
}

/**
 * Get a single category by ID
 */
export async function getCategoryById(
  id: number,
  databaseUrl: string
): Promise<Category | null> {
  return categoryRepo.getById(id, databaseUrl);
}

/**
 * Create a new category
 */
export async function createCategory(
  name: string,
  displayOrder: number,
  databaseUrl: string
): Promise<Category> {
  const sql = getDb(databaseUrl);
  const result = await sql`
        INSERT INTO categories (name, display_order)
        VALUES (${name}, ${displayOrder})
        RETURNING id, name, display_order, created_at, updated_at
    `;
  return result[0] as Category;
}

/**
 * Update a category
 */
export async function updateCategory(
  id: number,
  name: string,
  displayOrder: number,
  databaseUrl: string
): Promise<Category | null> {
  const sql = getDb(databaseUrl);
  const result = await sql`
        UPDATE categories
        SET name = ${name}, display_order = ${displayOrder}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, name, display_order, created_at, updated_at
    `;
  return result.length > 0 ? (result[0] as Category) : null;
}

/**
 * Delete a category
 */
export async function deleteCategory(
  id: number,
  databaseUrl: string
): Promise<boolean> {
  return categoryRepo.deleteById(id, databaseUrl);
}

/**
 * Check if category name exists
 */
export async function categoryNameExists(
  name: string,
  excludeId: number | null,
  databaseUrl: string
): Promise<boolean> {
  return categoryRepo.valueExists('name', name, excludeId, databaseUrl);
}

/**
 * Check if category is in use by products
 */
export async function isCategoryInUse(
  categoryName: string,
  databaseUrl: string
): Promise<boolean> {
  const sql = getDb(databaseUrl);
  const result = await sql`
        SELECT 1 FROM products
        WHERE category = ${categoryName}
        LIMIT 1
    `;
  return result.length > 0;
}
