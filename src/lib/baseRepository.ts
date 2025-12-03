/**
 * Base Repository
 * Provides common CRUD operations for database entities
 */

import { getDb } from './database';
import type { NeonQueryFunction } from '@neondatabase/serverless';

export interface BaseEntity {
    id?: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface RepositoryConfig<T> {
    tableName: string;
    primaryKey: string;
    columns: string[];
    parseRow?: (row: any) => T;
}

/**
 * Create a base repository with common CRUD operations
 */
export function createRepository<T extends BaseEntity>(config: RepositoryConfig<T>) {
    const { tableName, primaryKey, columns, parseRow = (row) => row as T } = config;
    const columnList = columns.join(', ');

    return {
        /**
         * Get all records ordered by a column
         */
        async getAll(
            databaseUrl: string,
            orderBy: string = primaryKey,
            orderDir: 'ASC' | 'DESC' = 'ASC'
        ): Promise<T[]> {
            const sql = getDb(databaseUrl);
            const result = await sql`
                SELECT ${sql.unsafe(columnList)}
                FROM ${sql.unsafe(tableName)}
                ORDER BY ${sql.unsafe(orderBy)} ${sql.unsafe(orderDir)}
            `;
            return result.map(parseRow);
        },

        /**
         * Get a single record by primary key
         */
        async getById(
            id: number | string,
            databaseUrl: string
        ): Promise<T | null> {
            const sql = getDb(databaseUrl);
            const result = await sql`
                SELECT ${sql.unsafe(columnList)}
                FROM ${sql.unsafe(tableName)}
                WHERE ${sql.unsafe(primaryKey)} = ${id}
            `;
            return result.length > 0 ? parseRow(result[0]) : null;
        },

        /**
         * Delete a record by primary key
         */
        async deleteById(
            id: number | string,
            databaseUrl: string
        ): Promise<boolean> {
            const sql = getDb(databaseUrl);
            const result = await sql`
                DELETE FROM ${sql.unsafe(tableName)}
                WHERE ${sql.unsafe(primaryKey)} = ${id}
                RETURNING ${sql.unsafe(primaryKey)}
            `;
            return result.length > 0;
        },

        /**
         * Check if a record exists by primary key
         */
        async exists(
            id: number | string,
            databaseUrl: string
        ): Promise<boolean> {
            const sql = getDb(databaseUrl);
            const result = await sql`
                SELECT 1 FROM ${sql.unsafe(tableName)}
                WHERE ${sql.unsafe(primaryKey)} = ${id}
                LIMIT 1
            `;
            return result.length > 0;
        },

        /**
         * Check if a value exists in a column (for uniqueness checks)
         */
        async valueExists(
            column: string,
            value: string,
            excludeId: number | string | null,
            databaseUrl: string
        ): Promise<boolean> {
            const sql = getDb(databaseUrl);
            let result;
            if (excludeId !== null) {
                result = await sql`
                    SELECT 1 FROM ${sql.unsafe(tableName)}
                    WHERE ${sql.unsafe(column)} = ${value} 
                    AND ${sql.unsafe(primaryKey)} != ${excludeId}
                    LIMIT 1
                `;
            } else {
                result = await sql`
                    SELECT 1 FROM ${sql.unsafe(tableName)}
                    WHERE ${sql.unsafe(column)} = ${value}
                    LIMIT 1
                `;
            }
            return result.length > 0;
        },

        /**
         * Count all records
         */
        async count(databaseUrl: string): Promise<number> {
            const sql = getDb(databaseUrl);
            const result = await sql`
                SELECT COUNT(*) as count FROM ${sql.unsafe(tableName)}
            `;
            return parseInt(result[0].count);
        },

        /**
         * Get the SQL connection for custom queries
         */
        getConnection(databaseUrl: string): NeonQueryFunction<false, false> {
            return getDb(databaseUrl);
        }
    };
}
