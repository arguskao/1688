/**
 * Spec Field database service
 * Handles customizable product specification fields
 */

import { getDb } from './database';
import { createRepository } from './baseRepository';
import { cache, CacheKeys, CacheTTL } from './cache';
import type { SpecField } from '../types';

export type { SpecField };

// Parse row to handle JSON options
const parseSpecField = (row: any): SpecField => ({
    ...row,
    options: row.options ? JSON.parse(row.options) : null,
});

// Create base repository
const specFieldRepo = createRepository<SpecField>({
    tableName: 'spec_fields',
    primaryKey: 'id',
    columns: ['id', 'field_name', 'field_label', 'field_type', 'options', 'display_order', 'is_required', 'created_at', 'updated_at'],
    parseRow: parseSpecField,
});

/**
 * Invalidate spec fields cache
 */
export function invalidateSpecFieldCache(): void {
    cache.deleteByPrefix('spec_fields:');
}

/**
 * Get all spec fields ordered by display_order (with caching)
 */
export async function getAllSpecFields(databaseUrl: string): Promise<SpecField[]> {
    return cache.getOrSet(
        CacheKeys.specFields(),
        async () => {
            const sql = getDb(databaseUrl);
            const result = await sql`
                SELECT id, field_name, field_label, field_type, options, display_order, is_required, created_at, updated_at
                FROM spec_fields
                ORDER BY display_order ASC, field_name ASC
            `;
            return result.map(parseSpecField);
        },
        CacheTTL.MEDIUM
    );
}

/**
 * Get a single spec field by ID
 */
export async function getSpecFieldById(
    id: number,
    databaseUrl: string
): Promise<SpecField | null> {
    const sql = getDb(databaseUrl);
    const result = await sql`
        SELECT id, field_name, field_label, field_type, options, display_order, is_required
        FROM spec_fields
        WHERE id = ${id}
    `;
    return result.length > 0 ? parseSpecField(result[0]) : null;
}

/**
 * Create a new spec field
 */
export async function createSpecField(
    data: Omit<SpecField, 'id' | 'created_at' | 'updated_at'>,
    databaseUrl: string
): Promise<SpecField> {
    const sql = getDb(databaseUrl);
    const optionsJson = data.options ? JSON.stringify(data.options) : null;

    const result = await sql`
        INSERT INTO spec_fields (field_name, field_label, field_type, options, display_order, is_required)
        VALUES (${data.field_name}, ${data.field_label}, ${data.field_type}, ${optionsJson}, ${data.display_order}, ${data.is_required})
        RETURNING id, field_name, field_label, field_type, options, display_order, is_required
    `;
    invalidateSpecFieldCache();
    return parseSpecField(result[0]);
}

/**
 * Update a spec field
 */
export async function updateSpecField(
    id: number,
    data: Partial<Omit<SpecField, 'id' | 'created_at' | 'updated_at'>>,
    databaseUrl: string
): Promise<SpecField | null> {
    const sql = getDb(databaseUrl);
    const optionsJson = data.options !== undefined
        ? (data.options ? JSON.stringify(data.options) : null)
        : undefined;

    const result = await sql`
        UPDATE spec_fields
        SET 
            field_name = COALESCE(${data.field_name}, field_name),
            field_label = COALESCE(${data.field_label}, field_label),
            field_type = COALESCE(${data.field_type}, field_type),
            options = COALESCE(${optionsJson}, options),
            display_order = COALESCE(${data.display_order}, display_order),
            is_required = COALESCE(${data.is_required}, is_required),
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, field_name, field_label, field_type, options, display_order, is_required
    `;
    invalidateSpecFieldCache();
    return result.length > 0 ? parseSpecField(result[0]) : null;
}

/**
 * Delete a spec field
 */
export async function deleteSpecField(
    id: number,
    databaseUrl: string
): Promise<boolean> {
    const result = await specFieldRepo.deleteById(id, databaseUrl);
    invalidateSpecFieldCache();
    return result;
}

/**
 * Check if field name exists
 */
export async function fieldNameExists(
    fieldName: string,
    excludeId: number | null,
    databaseUrl: string
): Promise<boolean> {
    return specFieldRepo.valueExists('field_name', fieldName, excludeId, databaseUrl);
}
