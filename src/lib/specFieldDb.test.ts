/**
 * Unit tests for spec field database service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('./database', () => ({
    getDb: vi.fn(),
}));

import { getDb } from './database';
import { cache } from './cache';
import {
    getAllSpecFields,
    getSpecFieldById,
    createSpecField,
    updateSpecField,
    deleteSpecField,
    fieldNameExists,
} from './specFieldDb';

describe('Spec Field Database Service', () => {
    const mockDatabaseUrl = 'postgresql://test';
    let mockSql: any;

    beforeEach(() => {
        vi.clearAllMocks();
        cache.clear(); // Clear cache before each test
        mockSql = vi.fn();
        mockSql.unsafe = (str: string) => str;
        (getDb as any).mockReturnValue(mockSql);
    });

    describe('getAllSpecFields', () => {
        it('should return all spec fields ordered by display_order', async () => {
            const mockFields = [
                { id: 1, field_name: 'material', field_label: 'Material', field_type: 'text', options: null, display_order: 1, is_required: true },
                { id: 2, field_name: 'color', field_label: 'Color', field_type: 'select', options: '["red","blue"]', display_order: 2, is_required: false },
            ];

            mockSql.mockResolvedValue(mockFields);

            const result = await getAllSpecFields(mockDatabaseUrl);

            expect(result).toHaveLength(2);
            expect(result[0].field_name).toBe('material');
            expect(result[1].options).toEqual(['red', 'blue']);
        });

        it('should return empty array when no spec fields exist', async () => {
            mockSql.mockResolvedValue([]);

            const result = await getAllSpecFields(mockDatabaseUrl);

            expect(result).toHaveLength(0);
        });
    });

    describe('getSpecFieldById', () => {
        it('should return spec field when found', async () => {
            const mockField = {
                id: 1,
                field_name: 'material',
                field_label: 'Material',
                field_type: 'text',
                options: null,
                display_order: 1,
                is_required: true,
            };

            mockSql.mockResolvedValue([mockField]);

            const result = await getSpecFieldById(1, mockDatabaseUrl);

            expect(result).not.toBeNull();
            expect(result?.field_name).toBe('material');
        });

        it('should return null when spec field not found', async () => {
            mockSql.mockResolvedValue([]);

            const result = await getSpecFieldById(999, mockDatabaseUrl);

            expect(result).toBeNull();
        });

        it('should parse JSON options correctly', async () => {
            const mockField = {
                id: 2,
                field_name: 'size',
                field_label: 'Size',
                field_type: 'select',
                options: '["S","M","L","XL"]',
                display_order: 1,
                is_required: false,
            };

            mockSql.mockResolvedValue([mockField]);

            const result = await getSpecFieldById(2, mockDatabaseUrl);

            expect(result?.options).toEqual(['S', 'M', 'L', 'XL']);
        });
    });

    describe('createSpecField', () => {
        it('should create a text spec field', async () => {
            const newField = {
                id: 1,
                field_name: 'weight',
                field_label: 'Weight',
                field_type: 'text',
                options: null,
                display_order: 1,
                is_required: true,
            };

            mockSql.mockResolvedValue([newField]);

            const result = await createSpecField({
                field_name: 'weight',
                field_label: 'Weight',
                field_type: 'text',
                options: null,
                display_order: 1,
                is_required: true,
            }, mockDatabaseUrl);

            expect(result.field_name).toBe('weight');
            expect(result.field_type).toBe('text');
        });

        it('should create a select spec field with options', async () => {
            const newField = {
                id: 2,
                field_name: 'color',
                field_label: 'Color',
                field_type: 'select',
                options: '["red","green","blue"]',
                display_order: 2,
                is_required: false,
            };

            mockSql.mockResolvedValue([newField]);

            const result = await createSpecField({
                field_name: 'color',
                field_label: 'Color',
                field_type: 'select',
                options: ['red', 'green', 'blue'],
                display_order: 2,
                is_required: false,
            }, mockDatabaseUrl);

            expect(result.field_type).toBe('select');
            expect(result.options).toEqual(['red', 'green', 'blue']);
        });
    });

    describe('updateSpecField', () => {
        it('should update spec field properties', async () => {
            const updatedField = {
                id: 1,
                field_name: 'updated_name',
                field_label: 'Updated Label',
                field_type: 'number',
                options: null,
                display_order: 5,
                is_required: false,
            };

            mockSql.mockResolvedValue([updatedField]);

            const result = await updateSpecField(1, {
                field_name: 'updated_name',
                field_label: 'Updated Label',
                field_type: 'number',
                display_order: 5,
                is_required: false,
            }, mockDatabaseUrl);

            expect(result?.field_name).toBe('updated_name');
            expect(result?.field_type).toBe('number');
        });

        it('should return null when spec field not found', async () => {
            mockSql.mockResolvedValue([]);

            const result = await updateSpecField(999, { field_label: 'New Label' }, mockDatabaseUrl);

            expect(result).toBeNull();
        });
    });

    describe('deleteSpecField', () => {
        it('should return true when spec field is deleted', async () => {
            mockSql.mockResolvedValue([{ id: 1 }]);

            const result = await deleteSpecField(1, mockDatabaseUrl);

            expect(result).toBe(true);
        });

        it('should return false when spec field not found', async () => {
            mockSql.mockResolvedValue([]);

            const result = await deleteSpecField(999, mockDatabaseUrl);

            expect(result).toBe(false);
        });
    });

    describe('fieldNameExists', () => {
        it('should return true when field name exists', async () => {
            mockSql.mockResolvedValue([{ exists: 1 }]);

            const result = await fieldNameExists('material', null, mockDatabaseUrl);

            expect(result).toBe(true);
        });

        it('should return false when field name does not exist', async () => {
            mockSql.mockResolvedValue([]);

            const result = await fieldNameExists('nonexistent', null, mockDatabaseUrl);

            expect(result).toBe(false);
        });

        it('should exclude specified ID when checking', async () => {
            mockSql.mockResolvedValue([]);

            const result = await fieldNameExists('material', 1, mockDatabaseUrl);

            expect(result).toBe(false);
        });
    });
});
