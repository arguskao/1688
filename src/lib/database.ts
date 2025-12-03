/**
 * Database connection manager
 * Provides cached database connections for better performance
 * 
 * In Cloudflare Workers, each request is isolated, but within a single request
 * we can reuse the same connection instance for multiple queries.
 */

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

// Cache for database connections within a request
const connectionCache = new Map<string, NeonQueryFunction<false, false>>();

/**
 * Get a cached database connection
 * Reuses existing connection for the same database URL within a request
 */
export function getDb(databaseUrl: string): NeonQueryFunction<false, false> {
    // Check if we already have a connection for this URL
    let sql = connectionCache.get(databaseUrl);

    if (!sql) {
        // Create new connection and cache it
        sql = neon(databaseUrl);
        connectionCache.set(databaseUrl, sql);
    }

    return sql;
}

/**
 * Clear the connection cache
 * Call this at the end of a request if needed
 */
export function clearConnectionCache(): void {
    connectionCache.clear();
}

/**
 * Execute a database query with automatic connection management
 */
export async function query<T = any>(
    databaseUrl: string,
    queryFn: (sql: NeonQueryFunction<false, false>) => Promise<T>
): Promise<T> {
    const sql = getDb(databaseUrl);
    return queryFn(sql);
}

/**
 * Execute multiple queries in a transaction-like manner
 * Note: Neon serverless doesn't support true transactions,
 * but this ensures all queries use the same connection
 */
export async function withConnection<T>(
    databaseUrl: string,
    operations: (sql: NeonQueryFunction<false, false>) => Promise<T>
): Promise<T> {
    const sql = getDb(databaseUrl);
    return operations(sql);
}
