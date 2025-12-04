/**
 * Unit tests for base repository
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('./database', () => ({
    getDb: vi.fn(),
}));

import { getDb } from './database';
import { createRepository } from './baseRepository';

describe('Base Repository', () => {
    const mockDatabaseUrl = 'postgresql://test';
    let mockSql: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSql = vi.fn();
        // Add unsafe method to mock
        mockSql.unsafe = (str: string) => str;
        (getDb as any).mockReturnValue(mockSql);
    });

    // Create a test repository
    interface TestEntity {
        id?: number;
        name: string;
        value: number;
        created_at?: Date;
        updated_at?: Date;
    }

    const testRepo = createRepository<TestEntity>({
        tableName: 'test_table',
        primaryKey: 'id',
        columns: ['id', 'name', 'value', 'created_at', 'updated_at'],
    });

    describe('getAll', () => {
        it('should return all records', async () => {
            const mockData = [
                { id: 1, name: 'Item 1', value: 100 },
                { id: 2, name: 'Item 2', value: 200 },
            ];
            mockSql.mockResolvedValue(mockData);

            const result = await testRepo.getAll(mockDatabaseUrl);

            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('Item 1');
        });

        it('should support custom ordering', async () => {
            mockSql.mockResolvedValue([]);

            await testRepo.getAll(mockDatabaseUrl, 'name', 'DESC');

            expect(mockSql).toHaveBeenCalled();
        });

        it('should return empty array when no records', async () => {
            mockSql.mockResolvedValue([]);

            const result = await testRepo.getAll(mockDatabaseUrl);

            expect(result).toHaveLength(0);
        });
    });

    describe('getById', () => {
        it('should return record when found', async () => {
            const mockRecord = { id: 1, name: 'Test', value: 100 };
            mockSql.mockResolvedValue([mockRecord]);

            const result = await testRepo.getById(1, mockDatabaseUrl);

            expect(result).not.toBeNull();
            expect(result?.name).toBe('Test');
        });

        it('should return null when not found', async () => {
            mockSql.mockResolvedValue([]);

            const result = await testRepo.getById(999, mockDatabaseUrl);

            expect(result).toBeNull();
        });

        it('should work with string IDs', async () => {
            const mockRecord = { id: 'abc-123', name: 'Test', value: 100 };
            mockSql.mockResolvedValue([mockRecord]);

            const result = await testRepo.getById('abc-123', mockDatabaseUrl);

            expect(result).not.toBeNull();
        });
    });

    describe('deleteById', () => {
        it('should return true when record is deleted', async () => {
            mockSql.mockResolvedValue([{ id: 1 }]);

            const result = await testRepo.deleteById(1, mockDatabaseUrl);

            expect(result).toBe(true);
        });

        it('should return false when record not found', async () => {
            mockSql.mockResolvedValue([]);

            const result = await testRepo.deleteById(999, mockDatabaseUrl);

            expect(result).toBe(false);
        });
    });

    describe('exists', () => {
        it('should return true when record exists', async () => {
            mockSql.mockResolvedValue([{ exists: 1 }]);

            const result = await testRepo.exists(1, mockDatabaseUrl);

            expect(result).toBe(true);
        });

        it('should return false when record does not exist', async () => {
            mockSql.mockResolvedValue([]);

            const result = await testRepo.exists(999, mockDatabaseUrl);

            expect(result).toBe(false);
        });
    });

    describe('valueExists', () => {
        it('should return true when value exists', async () => {
            mockSql.mockResolvedValue([{ exists: 1 }]);

            const result = await testRepo.valueExists('name', 'Test', null, mockDatabaseUrl);

            expect(result).toBe(true);
        });

        it('should return false when value does not exist', async () => {
            mockSql.mockResolvedValue([]);

            const result = await testRepo.valueExists('name', 'NonExistent', null, mockDatabaseUrl);

            expect(result).toBe(false);
        });

        it('should exclude specified ID when checking', async () => {
            mockSql.mockResolvedValue([]);

            const result = await testRepo.valueExists('name', 'Test', 1, mockDatabaseUrl);

            expect(result).toBe(false);
        });
    });

    describe('count', () => {
        it('should return total count', async () => {
            mockSql.mockResolvedValue([{ count: '42' }]);

            const result = await testRepo.count(mockDatabaseUrl);

            expect(result).toBe(42);
        });

        it('should return 0 when no records', async () => {
            mockSql.mockResolvedValue([{ count: '0' }]);

            const result = await testRepo.count(mockDatabaseUrl);

            expect(result).toBe(0);
        });
    });

    describe('getConnection', () => {
        it('should return database connection', () => {
            const connection = testRepo.getConnection(mockDatabaseUrl);

            expect(connection).toBe(mockSql);
            expect(getDb).toHaveBeenCalledWith(mockDatabaseUrl);
        });
    });

    describe('custom parseRow', () => {
        it('should use custom parseRow function', async () => {
            const customRepo = createRepository<TestEntity>({
                tableName: 'test_table',
                primaryKey: 'id',
                columns: ['id', 'name', 'value'],
                parseRow: (row) => ({
                    ...row,
                    name: row.name.toUpperCase(),
                }),
            });

            mockSql.mockResolvedValue([{ id: 1, name: 'test', value: 100 }]);

            const result = await customRepo.getAll(mockDatabaseUrl);

            expect(result[0].name).toBe('TEST');
        });
    });
});
