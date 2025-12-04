/**
 * Unit tests for cache module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cache, CacheKeys, CacheTTL } from './cache';

describe('Memory Cache', () => {
    beforeEach(() => {
        cache.clear();
    });

    describe('get/set', () => {
        it('should store and retrieve values', () => {
            cache.set('test-key', { data: 'test-value' });

            const result = cache.get('test-key');

            expect(result).toEqual({ data: 'test-value' });
        });

        it('should return null for non-existent keys', () => {
            const result = cache.get('non-existent');

            expect(result).toBeNull();
        });

        it('should handle different data types', () => {
            cache.set('string', 'hello');
            cache.set('number', 42);
            cache.set('array', [1, 2, 3]);
            cache.set('object', { a: 1, b: 2 });

            expect(cache.get('string')).toBe('hello');
            expect(cache.get('number')).toBe(42);
            expect(cache.get('array')).toEqual([1, 2, 3]);
            expect(cache.get('object')).toEqual({ a: 1, b: 2 });
        });
    });

    describe('TTL expiration', () => {
        it('should expire entries after TTL', async () => {
            cache.set('short-lived', 'value', 50); // 50ms TTL

            expect(cache.get('short-lived')).toBe('value');

            await new Promise(resolve => setTimeout(resolve, 60));

            expect(cache.get('short-lived')).toBeNull();
        });

        it('should not expire entries before TTL', async () => {
            cache.set('long-lived', 'value', 1000); // 1s TTL

            await new Promise(resolve => setTimeout(resolve, 50));

            expect(cache.get('long-lived')).toBe('value');
        });
    });

    describe('delete', () => {
        it('should delete specific key', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');

            const deleted = cache.delete('key1');

            expect(deleted).toBe(true);
            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toBe('value2');
        });

        it('should return false for non-existent key', () => {
            const deleted = cache.delete('non-existent');

            expect(deleted).toBe(false);
        });
    });

    describe('deleteByPrefix', () => {
        it('should delete all keys with matching prefix', () => {
            cache.set('categories:all', 'data1');
            cache.set('categories:names', 'data2');
            cache.set('products:list', 'data3');

            cache.deleteByPrefix('categories:');

            expect(cache.get('categories:all')).toBeNull();
            expect(cache.get('categories:names')).toBeNull();
            expect(cache.get('products:list')).toBe('data3');
        });
    });

    describe('clear', () => {
        it('should remove all entries', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');

            cache.clear();

            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toBeNull();
        });
    });

    describe('getOrSet', () => {
        it('should return cached value if exists', async () => {
            cache.set('existing', 'cached-value');
            const fetcher = vi.fn().mockResolvedValue('new-value');

            const result = await cache.getOrSet('existing', fetcher);

            expect(result).toBe('cached-value');
            expect(fetcher).not.toHaveBeenCalled();
        });

        it('should fetch and cache value if not exists', async () => {
            const fetcher = vi.fn().mockResolvedValue('fetched-value');

            const result = await cache.getOrSet('new-key', fetcher);

            expect(result).toBe('fetched-value');
            expect(fetcher).toHaveBeenCalledTimes(1);
            expect(cache.get('new-key')).toBe('fetched-value');
        });

        it('should use custom TTL', async () => {
            const fetcher = vi.fn().mockResolvedValue('value');

            await cache.getOrSet('ttl-key', fetcher, 50);

            expect(cache.get('ttl-key')).toBe('value');

            await new Promise(resolve => setTimeout(resolve, 60));

            expect(cache.get('ttl-key')).toBeNull();
        });
    });
});

describe('CacheKeys', () => {
    it('should generate correct cache keys', () => {
        expect(CacheKeys.categories()).toBe('categories:all');
        expect(CacheKeys.categoryNames()).toBe('categories:names');
        expect(CacheKeys.specFields()).toBe('spec_fields:all');
        expect(CacheKeys.product('prod-001')).toBe('product:prod-001');
        expect(CacheKeys.productCount()).toBe('products:count:all');
        expect(CacheKeys.productCount('Electronics')).toBe('products:count:Electronics');
    });
});

describe('CacheTTL', () => {
    it('should have correct TTL values', () => {
        expect(CacheTTL.SHORT).toBe(30 * 1000);
        expect(CacheTTL.MEDIUM).toBe(60 * 1000);
        expect(CacheTTL.LONG).toBe(5 * 60 * 1000);
    });
});
