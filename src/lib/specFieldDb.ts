/**
 * Spec Field database service
 * Handles customizable product specification fields
 */

import { getDb } from './database';

export interface SpecField {
    id: number;
    field_name: string;
    field_label: string;
    field_type: 'text' | 'number' | 'select';
    options: string[] | null;
    display_order: number;
    is_required: boolean;
    created_at?: Date;
    updated_at?: Date;
}

/**
 * Get all spec fields ordered by display_order
 */
export async function getAllSpecFields(databaseUrl: string): Promise<SpecField[]> {
    const sql = getDb(databaseUrl);

    const result = await sql`
    SELECT id, field_name, field_label, field_type, options, display_order, is_required, created_at, updated_at
    FROM spec_fields
    ORDER BY display_order ASC, field_name ASC
  `;

    return result.map((row: any) => ({
        ...row,
        options: row.options ? JSON.parse(row.options) : null,
    })) as SpecField[];
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

    if (result.length === 0) return null;

    const row = result[0];
    return {
        ...row,
        options: row.options ? JSON.parse(row.options) : null,
    } as SpecField;
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

    const row = result[0];
    return {
        ...row,
        options: row.options ? JSON.parse(row.options) : null,
    } as SpecField;
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

    if (result.length === 0) return null;

    const row = result[0];
    return {
        ...row,
        options: row.options ? JSON.parse(row.options) : null,
    } as SpecField;
}

/**
 * Delete a spec field
 */
export async function deleteSpecField(
    id: number,
    databaseUrl: string
): Promise<boolean> {
    const sql = getDb(databaseUrl);

    const result = await sql`
    DELETE FROM spec_fields
    WHERE id = ${id}
    RETURNING id
  `;

    return result.length > 0;
}

/**
 * Check if field name exists
 */
export async function fieldNameExists(
    fieldName: string,
    excludeId: number | null,
    databaseUrl: string
): Promise<boolean> {
    const sql = getDb(databaseUrl);

    let result;
    if (excludeId) {
        result = await sql`
      SELECT 1 FROM spec_fields
      WHERE field_name = ${fieldName} AND id != ${excludeId}
      LIMIT 1
    `;
    } else {
        result = await sql`
      SELECT 1 FROM spec_fields
      WHERE field_name = ${fieldName}
      LIMIT 1
    `;
    }

    return result.length > 0;
}
