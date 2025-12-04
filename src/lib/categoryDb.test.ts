/**
 * Unit tests for category database service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('./database', () => ({
    getDb: vi.fn(),
}));

import { getDb } from './database';
import { cache } from './cache';
import {
    getAllCategories,
    getCategoryNames,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    categoryNameExists,
    isCategoryInUse,
} from './categoryDb';

describe('Category Database Service', () => {
    const mockDatabaseUrl = 'postgresql://test';
    let mockSql: any;

    beforeEach(() => {
        vi.clearAllMocks();
        cache.clear(); // Clear cache before each test
        mockSql = vi.fn();
        mockSql.unsafe = (str: string) => str;
        (getDb as any).mockReturnValue(mockSql);
    });

    describe('getAllCategories', () => {
        it('should return all categories ordered by display_order', async () => {
            const mockCategories = [
                { id: 1, name: 'Electronics', display_order: 1 },
                { id: 2, name: 'Health', display_order: 2 },
                { id: 3, name: 'Office', display_order: 3 },
            ];

            mockSql.mockResolvedValue(mockCategories);

            const result = await getAllCategories(mockDatabaseUrl);

            expect(result).toHaveLength(3);
            expect(result[0].name).toBe('Electronics');
            expect(mockSql).toHaveBeenCalled();
        });

        it('should return empty array when no categories exist', async () => {
            mockSql.mockResolvedValue([]);

            const result = await getAllCategories(mockDatabaseUrl);

            expect(result).toHaveLength(0);
        });
    });

    describe('getCategoryNames', () => {
        it('should return only category names', async () => {
            mockSql.mockResolvedValue([
                { name: 'Electronics' },
                { name: 'Health' },
            ]);

            const result = await getCategoryNames(mockDatabaseUrl);

            expect(result).toEqual(['Electronics', 'Health']);
        });
    });

    describe('getCategoryById', () => {
        it('should return category when found', async () => {
            const mockCategory = { id: 1, name: 'Electronics', display_order: 1 };
            mockSql.mockResolvedValue([mockCategory]);

            const result = await getCategoryById(1, mockDatabaseUrl);

            expect(result).not.toBeNull();
            expect(result?.name).toBe('Electronics');
        });

        it('should return null when category not found', async () => {
            mockSql.mockResolvedValue([]);

            const result = await getCategoryById(999, mockDatabaseUrl);

            expect(result).toBeNull();
        });
    });

    describe('createCategory', () => {
        it('should create a new category', async () => {
            const newCategory = {
                id: 1,
                name: 'New Category',
                display_order: 5,
                created_at: new Date(),
                updated_at: new Date(),
            };

            mockSql.mockResolvedValue([newCategory]);

            const result = await createCategory('New Category', 5, mockDatabaseUrl);

            expect(result.name).toBe('New Category');
            expect(result.display_order).toBe(5);
        });
    });

    describe('updateCategory', () => {
        it('should update category name and display_order', async () => {
            const updatedCategory = {
                id: 1,
                name: 'Updated Name',
                display_order: 10,
                updated_at: new Date(),
            };

            mockSql.mockResolvedValue([updatedCategory]);

            const result = await updateCategory(1, 'Updated Name', 10, mockDatabaseUrl);

            expect(result?.name).toBe('Updated Name');
            expect(result?.display_order).toBe(10);
        });

        it('should return null when category not found', async () => {
            mockSql.mockResolvedValue([]);

            const result = await updateCategory(999, 'Name', 1, mockDatabaseUrl);

            expect(result).toBeNull();
        });
    });

    describe('deleteCategory', () => {
        it('should return true when category is deleted', async () => {
            mockSql.mockResolvedValue([{ id: 1 }]);

            const result = await deleteCategory(1, mockDatabaseUrl);

            expect(result).toBe(true);
        });

        it('should return false when category not found', async () => {
            mockSql.mockResolvedValue([]);

            const result = await deleteCategory(999, mockDatabaseUrl);

            expect(result).toBe(false);
        });
    });

    describe('categoryNameExists', () => {
        it('should return true when name exists', async () => {
            mockSql.mockResolvedValue([{ exists: 1 }]);

            const result = await categoryNameExists('Electronics', null, mockDatabaseUrl);

            expect(result).toBe(true);
        });

        it('should return false when name does not exist', async () => {
            mockSql.mockResolvedValue([]);

            const result = await categoryNameExists('NonExistent', null, mockDatabaseUrl);

            expect(result).toBe(false);
        });

        it('should exclude specified ID when checking', async () => {
            mockSql.mockResolvedValue([]);

            const result = await categoryNameExists('Electronics', 1, mockDatabaseUrl);

            expect(result).toBe(false);
        });
    });

    describe('isCategoryInUse', () => {
        it('should return true when category is used by products', async () => {
            mockSql.mockResolvedValue([{ exists: 1 }]);

            const result = await isCategoryInUse('Electronics', mockDatabaseUrl);

            expect(result).toBe(true);
        });

        it('should return false when category is not in use', async () => {
            mockSql.mockResolvedValue([]);

            const result = await isCategoryInUse('Unused', mockDatabaseUrl);

            expect(result).toBe(false);
        });
    });
});
