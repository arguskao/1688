/**
 * Property-based tests for Quote Storage Service
 * Feature: quote-list-system
 *
 * These tests verify:
 * - Property 3: Add to quote list persistence (Requirements 2.2)
 * - Property 4: No duplicate entries in quote list (Requirements 2.3)
 * - Property 5: Quote list retrieval completeness (Requirements 3.1, 3.2)
 * - Property 6: Quantity update persistence (Requirements 3.3)
 * - Property 7: Item removal completeness (Requirements 3.4)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import {
    getQuoteListFromStorage,
    saveQuoteListToStorage,
    clearQuoteListFromStorage,
    addToQuoteList,
    updateQuantity,
    removeFromQuoteList,
    isInQuoteList,
    type StoredQuoteItem,
} from './quoteStorage';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

/**
 * Generators for property-based testing
 */

// Generate valid product ID
const productIdArb = fc.oneof(
    fc.uuid(),
    fc.stringMatching(/^[A-Z]{2,4}-\d{3,6}$/)
);

// Generate valid product name (non-empty)
const productNameArb = fc
    .string({ minLength: 1, maxLength: 200 })
    .filter((s) => s.trim().length > 0);

// Generate valid SKU
const skuArb = fc.stringMatching(/^[A-Z0-9-]{3,20}$/);

// Generate valid image URL
const imageUrlArb = fc.webUrl();

// Generate valid quantity (positive integer)
const quantityArb = fc.integer({ min: 1, max: 9999 });

// Generate a valid quote item (without quantity for addToQuoteList)
const quoteItemInputArb = fc.record({
    productId: productIdArb,
    productName: productNameArb,
    sku: skuArb,
    imageUrl: imageUrlArb,
});

// Generate a complete stored quote item
const storedQuoteItemArb: fc.Arbitrary<StoredQuoteItem> = fc.record({
    productId: productIdArb,
    productName: productNameArb,
    sku: skuArb,
    imageUrl: imageUrlArb,
    quantity: quantityArb,
});

// Generate array of unique quote items (by productId)
const uniqueQuoteItemsArb = fc
    .array(storedQuoteItemArb, { minLength: 1, maxLength: 20 })
    .map((items) => {
        const seen = new Set<string>();
        return items.filter((item) => {
            if (seen.has(item.productId)) return false;
            seen.add(item.productId);
            return true;
        });
    })
    .filter((items) => items.length > 0);

describe('Property Tests: Quote Storage Service', () => {
    beforeEach(() => {
        localStorageMock.clear();
    });

    /**
     * Feature: quote-list-system, Property 3: Add to quote list persistence
     * For any product, clicking the "Add to Quote List" button should result in
     * that product's ID and quantity being stored in Browser Storage
     * Validates: Requirements 2.2
     */
    describe('Property 3: Add to quote list persistence', () => {
        it('should persist product ID and quantity after adding to quote list', () => {
            fc.assert(
                fc.property(quoteItemInputArb, quantityArb, (item, quantity) => {
                    // Setup: clear storage
                    clearQuoteListFromStorage();

                    // Action: add product with quantity
                    addToQuoteList({ ...item, quantity });

                    // Assert: product exists in storage with correct data
                    const stored = getQuoteListFromStorage();
                    const found = stored.find((i) => i.productId === item.productId);

                    expect(found).toBeDefined();
                    expect(found?.productId).toBe(item.productId);
                    expect(found?.quantity).toBe(quantity);
                }),
                { numRuns: 100 }
            );
        });

        it('should persist all product fields after adding', () => {
            fc.assert(
                fc.property(storedQuoteItemArb, (item) => {
                    // Setup
                    clearQuoteListFromStorage();

                    // Action
                    addToQuoteList(item);

                    // Assert: all fields are preserved
                    const stored = getQuoteListFromStorage();
                    const found = stored.find((i) => i.productId === item.productId);

                    expect(found).toBeDefined();
                    expect(found?.productName).toBe(item.productName);
                    expect(found?.sku).toBe(item.sku);
                    expect(found?.imageUrl).toBe(item.imageUrl);
                    expect(found?.quantity).toBe(item.quantity);
                }),
                { numRuns: 100 }
            );
        });

        it('should default quantity to 1 when not specified', () => {
            fc.assert(
                fc.property(quoteItemInputArb, (item) => {
                    // Setup
                    clearQuoteListFromStorage();

                    // Action: add without quantity
                    addToQuoteList(item);

                    // Assert: quantity defaults to 1
                    const stored = getQuoteListFromStorage();
                    const found = stored.find((i) => i.productId === item.productId);

                    expect(found?.quantity).toBe(1);
                }),
                { numRuns: 100 }
            );
        });

        it('should persist multiple different products', () => {
            fc.assert(
                fc.property(uniqueQuoteItemsArb, (items) => {
                    // Setup
                    clearQuoteListFromStorage();

                    // Action: add all items
                    for (const item of items) {
                        addToQuoteList(item);
                    }

                    // Assert: all items are stored
                    const stored = getQuoteListFromStorage();
                    expect(stored.length).toBe(items.length);

                    for (const item of items) {
                        const found = stored.find((i) => i.productId === item.productId);
                        expect(found).toBeDefined();
                    }
                }),
                { numRuns: 50 }
            );
        });
    });

    /**
     * Feature: quote-list-system, Property 4: No duplicate entries in quote list
     * For any product already in the Quote List, adding it again should increment
     * the quantity rather than creating a duplicate entry
     * Validates: Requirements 2.3
     */
    describe('Property 4: No duplicate entries in quote list', () => {
        it('should increment quantity instead of creating duplicate when adding same product', () => {
            fc.assert(
                fc.property(
                    quoteItemInputArb,
                    quantityArb,
                    quantityArb,
                    (item, qty1, qty2) => {
                        // Setup
                        clearQuoteListFromStorage();

                        // Action: add same product twice
                        addToQuoteList({ ...item, quantity: qty1 });
                        addToQuoteList({ ...item, quantity: qty2 });

                        // Assert: only one entry with combined quantity
                        const stored = getQuoteListFromStorage();
                        const matching = stored.filter((i) => i.productId === item.productId);

                        expect(matching.length).toBe(1);
                        expect(matching[0].quantity).toBe(qty1 + qty2);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should never have duplicate productIds in storage', () => {
            fc.assert(
                fc.property(
                    fc.array(storedQuoteItemArb, { minLength: 2, maxLength: 10 }),
                    (items) => {
                        // Setup
                        clearQuoteListFromStorage();

                        // Action: add all items (may have duplicates)
                        for (const item of items) {
                            addToQuoteList(item);
                        }

                        // Assert: no duplicate productIds
                        const stored = getQuoteListFromStorage();
                        const productIds = stored.map((i) => i.productId);
                        const uniqueIds = new Set(productIds);

                        expect(productIds.length).toBe(uniqueIds.size);
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('should accumulate quantities correctly for multiple adds of same product', () => {
            fc.assert(
                fc.property(
                    quoteItemInputArb,
                    fc.array(quantityArb, { minLength: 2, maxLength: 10 }),
                    (item, quantities) => {
                        // Setup
                        clearQuoteListFromStorage();

                        // Action: add same product multiple times
                        for (const qty of quantities) {
                            addToQuoteList({ ...item, quantity: qty });
                        }

                        // Assert: total quantity is sum of all additions
                        const stored = getQuoteListFromStorage();
                        const found = stored.find((i) => i.productId === item.productId);
                        const expectedTotal = quantities.reduce((sum, q) => sum + q, 0);

                        expect(found?.quantity).toBe(expectedTotal);
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    /**
     * Feature: quote-list-system, Property 5: Quote list retrieval completeness
     * For any set of items stored in Browser Storage, retrieving the quote list
     * should return all items with their complete information
     * Validates: Requirements 3.1, 3.2
     */
    describe('Property 5: Quote list retrieval completeness', () => {
        it('should retrieve all stored items with complete information', () => {
            fc.assert(
                fc.property(uniqueQuoteItemsArb, (items) => {
                    // Setup: directly save items to storage
                    clearQuoteListFromStorage();
                    saveQuoteListToStorage(items);

                    // Action: retrieve items
                    const retrieved = getQuoteListFromStorage();

                    // Assert: all items retrieved with complete data
                    expect(retrieved.length).toBe(items.length);

                    for (const original of items) {
                        const found = retrieved.find(
                            (i) => i.productId === original.productId
                        );

                        expect(found).toBeDefined();
                        expect(found?.productName).toBe(original.productName);
                        expect(found?.sku).toBe(original.sku);
                        expect(found?.imageUrl).toBe(original.imageUrl);
                        expect(found?.quantity).toBe(original.quantity);
                    }
                }),
                { numRuns: 100 }
            );
        });

        it('should return empty array when storage is empty', () => {
            clearQuoteListFromStorage();
            const retrieved = getQuoteListFromStorage();
            expect(retrieved).toEqual([]);
        });

        it('should preserve item order during retrieval', () => {
            fc.assert(
                fc.property(uniqueQuoteItemsArb, (items) => {
                    // Setup
                    clearQuoteListFromStorage();
                    saveQuoteListToStorage(items);

                    // Action
                    const retrieved = getQuoteListFromStorage();

                    // Assert: order is preserved
                    for (let i = 0; i < items.length; i++) {
                        expect(retrieved[i].productId).toBe(items[i].productId);
                    }
                }),
                { numRuns: 50 }
            );
        });

        it('should retrieve items added via addToQuoteList with all fields', () => {
            fc.assert(
                fc.property(uniqueQuoteItemsArb, (items) => {
                    // Setup
                    clearQuoteListFromStorage();

                    // Action: add items one by one
                    for (const item of items) {
                        addToQuoteList(item);
                    }

                    // Assert: all items retrievable with complete info
                    const retrieved = getQuoteListFromStorage();

                    for (const original of items) {
                        const found = retrieved.find(
                            (i) => i.productId === original.productId
                        );

                        expect(found).toBeDefined();
                        // All required fields for display should be present
                        expect(found?.productName).toBeTruthy();
                        expect(found?.sku).toBeTruthy();
                        expect(found?.imageUrl).toBeTruthy();
                        expect(found?.quantity).toBeGreaterThan(0);
                    }
                }),
                { numRuns: 50 }
            );
        });
    });

    /**
     * Feature: quote-list-system, Property 6: Quantity update persistence
     * For any item in the quote list and any valid new quantity value,
     * updating the quantity should immediately persist the change to Browser Storage
     * Validates: Requirements 3.3
     */
    describe('Property 6: Quantity update persistence', () => {
        it('should persist quantity update immediately', () => {
            fc.assert(
                fc.property(storedQuoteItemArb, quantityArb, (item, newQuantity) => {
                    // Setup: add item first
                    clearQuoteListFromStorage();
                    addToQuoteList(item);

                    // Action: update quantity
                    updateQuantity(item.productId, newQuantity);

                    // Assert: new quantity is persisted
                    const stored = getQuoteListFromStorage();
                    const found = stored.find((i) => i.productId === item.productId);

                    expect(found?.quantity).toBe(newQuantity);
                }),
                { numRuns: 100 }
            );
        });

        it('should preserve other fields when updating quantity', () => {
            fc.assert(
                fc.property(storedQuoteItemArb, quantityArb, (item, newQuantity) => {
                    // Setup
                    clearQuoteListFromStorage();
                    addToQuoteList(item);

                    // Action
                    updateQuantity(item.productId, newQuantity);

                    // Assert: other fields unchanged
                    const stored = getQuoteListFromStorage();
                    const found = stored.find((i) => i.productId === item.productId);

                    expect(found?.productName).toBe(item.productName);
                    expect(found?.sku).toBe(item.sku);
                    expect(found?.imageUrl).toBe(item.imageUrl);
                }),
                { numRuns: 100 }
            );
        });

        it('should not affect other items when updating one item quantity', () => {
            fc.assert(
                fc.property(
                    uniqueQuoteItemsArb.filter((items) => items.length >= 2),
                    quantityArb,
                    (items, newQuantity) => {
                        // Setup
                        clearQuoteListFromStorage();
                        for (const item of items) {
                            addToQuoteList(item);
                        }

                        // Action: update first item's quantity
                        const targetId = items[0].productId;
                        updateQuantity(targetId, newQuantity);

                        // Assert: other items unchanged
                        const stored = getQuoteListFromStorage();
                        for (let i = 1; i < items.length; i++) {
                            const found = stored.find(
                                (s) => s.productId === items[i].productId
                            );
                            expect(found?.quantity).toBe(items[i].quantity);
                        }
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('should reject invalid quantities (zero or negative)', () => {
            fc.assert(
                fc.property(
                    storedQuoteItemArb,
                    fc.integer({ min: -1000, max: 0 }),
                    (item, invalidQuantity) => {
                        // Setup
                        clearQuoteListFromStorage();
                        addToQuoteList(item);

                        // Action & Assert: should throw error
                        expect(() => updateQuantity(item.productId, invalidQuantity)).toThrow(
                            '數量必須大於 0'
                        );

                        // Original quantity should be preserved
                        const stored = getQuoteListFromStorage();
                        const found = stored.find((i) => i.productId === item.productId);
                        expect(found?.quantity).toBe(item.quantity);
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    /**
     * Feature: quote-list-system, Property 7: Item removal completeness
     * For any item in the quote list, removing it should result in that item
     * no longer existing in Browser Storage
     * Validates: Requirements 3.4
     */
    describe('Property 7: Item removal completeness', () => {
        it('should completely remove item from storage', () => {
            fc.assert(
                fc.property(storedQuoteItemArb, (item) => {
                    // Setup
                    clearQuoteListFromStorage();
                    addToQuoteList(item);

                    // Verify item exists
                    expect(isInQuoteList(item.productId)).toBe(true);

                    // Action: remove item
                    removeFromQuoteList(item.productId);

                    // Assert: item no longer exists
                    expect(isInQuoteList(item.productId)).toBe(false);

                    const stored = getQuoteListFromStorage();
                    const found = stored.find((i) => i.productId === item.productId);
                    expect(found).toBeUndefined();
                }),
                { numRuns: 100 }
            );
        });

        it('should not affect other items when removing one item', () => {
            fc.assert(
                fc.property(
                    uniqueQuoteItemsArb.filter((items) => items.length >= 2),
                    (items) => {
                        // Setup
                        clearQuoteListFromStorage();
                        for (const item of items) {
                            addToQuoteList(item);
                        }

                        // Action: remove first item
                        const removedId = items[0].productId;
                        removeFromQuoteList(removedId);

                        // Assert: other items still exist
                        const stored = getQuoteListFromStorage();
                        expect(stored.length).toBe(items.length - 1);

                        for (let i = 1; i < items.length; i++) {
                            const found = stored.find(
                                (s) => s.productId === items[i].productId
                            );
                            expect(found).toBeDefined();
                            expect(found?.quantity).toBe(items[i].quantity);
                        }
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('should result in empty list when removing all items', () => {
            fc.assert(
                fc.property(uniqueQuoteItemsArb, (items) => {
                    // Setup
                    clearQuoteListFromStorage();
                    for (const item of items) {
                        addToQuoteList(item);
                    }

                    // Action: remove all items
                    for (const item of items) {
                        removeFromQuoteList(item.productId);
                    }

                    // Assert: list is empty
                    const stored = getQuoteListFromStorage();
                    expect(stored.length).toBe(0);
                }),
                { numRuns: 50 }
            );
        });

        it('should handle removal of non-existent item gracefully', () => {
            fc.assert(
                fc.property(uniqueQuoteItemsArb, productIdArb, (items, nonExistentId) => {
                    // Setup
                    clearQuoteListFromStorage();
                    for (const item of items) {
                        addToQuoteList(item);
                    }

                    // Ensure nonExistentId is not in the list
                    const existingIds = items.map((i) => i.productId);
                    if (existingIds.includes(nonExistentId)) return; // Skip this case

                    // Action: try to remove non-existent item
                    removeFromQuoteList(nonExistentId);

                    // Assert: original items unchanged
                    const stored = getQuoteListFromStorage();
                    expect(stored.length).toBe(items.length);
                }),
                { numRuns: 50 }
            );
        });

        it('should allow re-adding item after removal', () => {
            fc.assert(
                fc.property(storedQuoteItemArb, quantityArb, (item, newQuantity) => {
                    // Setup
                    clearQuoteListFromStorage();
                    addToQuoteList(item);

                    // Action: remove then re-add with different quantity
                    removeFromQuoteList(item.productId);
                    addToQuoteList({ ...item, quantity: newQuantity });

                    // Assert: item exists with new quantity (not accumulated)
                    const stored = getQuoteListFromStorage();
                    const found = stored.find((i) => i.productId === item.productId);

                    expect(found).toBeDefined();
                    expect(found?.quantity).toBe(newQuantity);
                }),
                { numRuns: 50 }
            );
        });
    });
});
