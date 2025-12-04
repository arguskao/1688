/**
 * Simple in-memory cache for Cloudflare Workers
 * 
 * Note: In Cloudflare Workers, each request is isolated, so this cache
 * is primarily useful for caching data within a single request lifecycle.
 * For cross-request caching, consider using Cloudflare KV or Cache API.
 */

interface CacheEntry<T> {
    data: T;
    expiry: number;
}

class MemoryCache {
    private cache = new Map<string, CacheEntry<any>>();
    private defaultTTL = 60 * 1000; // 1 minute default

    /**
     * Get cached value
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set cached value with optional TTL (in milliseconds)
     */
    set<T>(key: string, data: T, ttl?: number): void {
        const expiry = Date.now() + (ttl || this.defaultTTL);
        this.cache.set(key, { data, expiry });
    }

    /**
     * Delete cached value
     */
    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    /**
     * Delete all cached values matching a prefix
     */
    deleteByPrefix(prefix: string): void {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear all cached values
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Get or set cached value
     */
    async getOrSet<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttl?: number
    ): Promise<T> {
        const cached = this.get<T>(key);

        if (cached !== null) {
            return cached;
        }

        const data = await fetcher();
        this.set(key, data, ttl);
        return data;
    }
}

// Singleton instance
export const cache = new MemoryCache();

// Cache key generators
export const CacheKeys = {
    categories: () => 'categories:all',
    categoryNames: () => 'categories:names',
    specFields: () => 'spec_fields:all',
    product: (id: string) => `product:${id}`,
    productCount: (category?: string) => `products:count:${category || 'all'}`,
};

// Cache TTL constants (in milliseconds)
export const CacheTTL = {
    SHORT: 30 * 1000,      // 30 seconds
    MEDIUM: 60 * 1000,     // 1 minute
    LONG: 5 * 60 * 1000,   // 5 minutes
};
