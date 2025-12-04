/**
 * Property-based tests for Quote Submission
 * Feature: quote-list-system
 *
 * These tests verify:
 * - Property 8: Quote submission data completeness (Requirements 4.1)
 * - Property 9: Required field validation (Requirements 4.2)
 * - Property 11: Storage clearing after submission (Requirements 4.5)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import {
    validateQuoteForm,
    validateEmail,
    validatePhone,
    validateRequired,
    type QuoteFormData,
} from './validation';
import {
    getQuoteListFromStorage,
    saveQuoteListToStorage,
    clearQuoteListFromStorage,
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

// Generate valid customer name (non-empty string)
const customerNameArb = fc
    .string({ minLength: 1, maxLength: 100 })
    .filter((s) => s.trim().length > 0);

// Generate valid email
const validEmailArb = fc
    .tuple(
        fc.stringMatching(/^[a-z0-9]{1,20}$/),
        fc.stringMatching(/^[a-z0-9]{1,10}$/),
        fc.constantFrom('com', 'org', 'net', 'tw', 'io')
    )
    .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

// Generate invalid email formats
const invalidEmailArb = fc.oneof(
    fc.constant(''),
    fc.constant('   '),
    fc.constant('notanemail'),
    fc.constant('missing@domain'),
    fc.constant('@nodomain.com'),
    fc.constant('spaces in@email.com'),
    fc.stringMatching(/^[^@]+$/) // no @ symbol
);

// Generate valid phone number
const validPhoneArb = fc.oneof(
    fc.stringMatching(/^09\d{8}$/), // Taiwan mobile
    fc.stringMatching(/^0\d{1,2}-?\d{6,8}$/), // Taiwan landline
    fc.stringMatching(/^\+886\d{9}$/) // International format
);

// Generate invalid phone formats
const invalidPhoneArb = fc.oneof(
    fc.constant(''),
    fc.constant('   '),
    fc.constant('abc'),
    fc.constant('123'), // too short
    fc.stringMatching(/^[a-z]{5,10}$/) // letters only
);

// Generate valid company name
const companyNameArb = fc
    .string({ minLength: 1, maxLength: 200 })
    .filter((s) => s.trim().length > 0);

// Generate optional message
const messageArb = fc.string({ minLength: 0, maxLength: 1000 });

// Generate complete valid form data
const validFormDataArb: fc.Arbitrary<QuoteFormData> = fc.record({
    customerName: customerNameArb,
    customerEmail: validEmailArb,
    customerPhone: validPhoneArb,
    companyName: companyNameArb,
    message: messageArb,
});

// Generate form data with at least one empty required field
const formDataWithEmptyFieldArb = fc.oneof(
    // Empty customer name
    fc.record({
        customerName: fc.constant(''),
        customerEmail: validEmailArb,
        customerPhone: validPhoneArb,
        companyName: companyNameArb,
        message: messageArb,
    }),
    // Empty email
    fc.record({
        customerName: customerNameArb,
        customerEmail: fc.constant(''),
        customerPhone: validPhoneArb,
        companyName: companyNameArb,
        message: messageArb,
    }),
    // Empty phone
    fc.record({
        customerName: customerNameArb,
        customerEmail: validEmailArb,
        customerPhone: fc.constant(''),
        companyName: companyNameArb,
        message: messageArb,
    }),
    // Empty company name
    fc.record({
        customerName: customerNameArb,
        customerEmail: validEmailArb,
        customerPhone: validPhoneArb,
        companyName: fc.constant(''),
        message: messageArb,
    })
);

// Generate quote item
const quoteItemArb: fc.Arbitrary<StoredQuoteItem> = fc.record({
    productId: fc.uuid(),
    productName: fc.string({ minLength: 1, maxLength: 100 }),
    sku: fc.stringMatching(/^[A-Z0-9-]{3,20}$/),
    imageUrl: fc.webUrl(),
    quantity: fc.integer({ min: 1, max: 9999 }),
});

// Generate array of unique quote items
const uniqueQuoteItemsArb = fc
    .array(quoteItemArb, { minLength: 1, maxLength: 10 })
    .map((items) => {
        const seen = new Set<string>();
        return items.filter((item) => {
            if (seen.has(item.productId)) return false;
            seen.add(item.productId);
            return true;
        });
    })
    .filter((items) => items.length > 0);

/**
 * Helper to build quote request payload
 */
function buildQuoteRequestPayload(
    formData: QuoteFormData,
    items: StoredQuoteItem[]
) {
    return {
        ...formData,
        items: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity,
        })),
    };
}

describe('Property Tests: Quote Submission', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    /**
     * Feature: quote-list-system, Property 8: Quote submission data completeness
     * For any quote submission, the request payload should include all required fields
     * (customer name, email, phone, company name, message, and items array)
     * Validates: Requirements 4.1
     */
    describe('Property 8: Quote submission data completeness', () => {
        it('should include all required fields in submission payload', () => {
            fc.assert(
                fc.property(validFormDataArb, uniqueQuoteItemsArb, (formData, items) => {
                    const payload = buildQuoteRequestPayload(formData, items);

                    // Property: All required customer fields should be present
                    expect(payload).toHaveProperty('customerName');
                    expect(payload).toHaveProperty('customerEmail');
                    expect(payload).toHaveProperty('customerPhone');
                    expect(payload).toHaveProperty('companyName');
                    expect(payload).toHaveProperty('message');
                    expect(payload).toHaveProperty('items');

                    // Property: Customer fields should have correct values
                    expect(payload.customerName).toBe(formData.customerName);
                    expect(payload.customerEmail).toBe(formData.customerEmail);
                    expect(payload.customerPhone).toBe(formData.customerPhone);
                    expect(payload.companyName).toBe(formData.companyName);
                    expect(payload.message).toBe(formData.message);

                    // Property: Items array should be present and non-empty
                    expect(Array.isArray(payload.items)).toBe(true);
                    expect(payload.items.length).toBe(items.length);
                }),
                { numRuns: 100 }
            );
        });

        it('should include all required fields for each item', () => {
            fc.assert(
                fc.property(validFormDataArb, uniqueQuoteItemsArb, (formData, items) => {
                    const payload = buildQuoteRequestPayload(formData, items);

                    // Property: Each item should have required fields
                    for (let i = 0; i < payload.items.length; i++) {
                        const item = payload.items[i];
                        const original = items[i];

                        expect(item).toHaveProperty('productId');
                        expect(item).toHaveProperty('productName');
                        expect(item).toHaveProperty('sku');
                        expect(item).toHaveProperty('quantity');

                        expect(item.productId).toBe(original.productId);
                        expect(item.productName).toBe(original.productName);
                        expect(item.sku).toBe(original.sku);
                        expect(item.quantity).toBe(original.quantity);
                    }
                }),
                { numRuns: 100 }
            );
        });

        it('should preserve item quantities in payload', () => {
            fc.assert(
                fc.property(validFormDataArb, uniqueQuoteItemsArb, (formData, items) => {
                    const payload = buildQuoteRequestPayload(formData, items);

                    // Property: Total quantity should match
                    const originalTotal = items.reduce((sum, i) => sum + i.quantity, 0);
                    const payloadTotal = payload.items.reduce(
                        (sum, i) => sum + i.quantity,
                        0
                    );

                    expect(payloadTotal).toBe(originalTotal);
                }),
                { numRuns: 50 }
            );
        });
    });

    /**
     * Feature: quote-list-system, Property 9: Required field validation
     * For any quote request with one or more empty required fields,
     * the system should prevent submission and display validation errors
     * Validates: Requirements 4.2
     */
    describe('Property 9: Required field validation', () => {
        it('should reject form with empty required fields', () => {
            fc.assert(
                fc.property(formDataWithEmptyFieldArb, (formData) => {
                    const result = validateQuoteForm(formData);

                    // Property: Form with empty required field should be invalid
                    expect(result.isValid).toBe(false);
                    expect(Object.keys(result.errors).length).toBeGreaterThan(0);
                }),
                { numRuns: 100 }
            );
        });

        it('should accept form with all required fields filled', () => {
            fc.assert(
                fc.property(validFormDataArb, (formData) => {
                    const result = validateQuoteForm(formData);

                    // Property: Form with all required fields should be valid
                    expect(result.isValid).toBe(true);
                    expect(Object.keys(result.errors).length).toBe(0);
                }),
                { numRuns: 100 }
            );
        });

        it('should provide error message for each empty required field', () => {
            const testCases: Array<{
                formData: QuoteFormData;
                expectedErrorField: keyof QuoteFormData;
            }> = [
                    {
                        formData: {
                            customerName: '',
                            customerEmail: 'test@example.com',
                            customerPhone: '0912345678',
                            companyName: 'Test Co',
                            message: '',
                        },
                        expectedErrorField: 'customerName',
                    },
                    {
                        formData: {
                            customerName: 'Test User',
                            customerEmail: '',
                            customerPhone: '0912345678',
                            companyName: 'Test Co',
                            message: '',
                        },
                        expectedErrorField: 'customerEmail',
                    },
                    {
                        formData: {
                            customerName: 'Test User',
                            customerEmail: 'test@example.com',
                            customerPhone: '',
                            companyName: 'Test Co',
                            message: '',
                        },
                        expectedErrorField: 'customerPhone',
                    },
                    {
                        formData: {
                            customerName: 'Test User',
                            customerEmail: 'test@example.com',
                            customerPhone: '0912345678',
                            companyName: '',
                            message: '',
                        },
                        expectedErrorField: 'companyName',
                    },
                ];

            for (const testCase of testCases) {
                const result = validateQuoteForm(testCase.formData);

                expect(result.isValid).toBe(false);
                expect(result.errors[testCase.expectedErrorField]).toBeDefined();
                expect(result.errors[testCase.expectedErrorField]!.length).toBeGreaterThan(0);
            }
        });

        it('should validate email format correctly', () => {
            fc.assert(
                fc.property(invalidEmailArb, (invalidEmail) => {
                    const result = validateEmail(invalidEmail);

                    // Property: Invalid email should fail validation
                    expect(result.isValid).toBe(false);
                    expect(result.error).toBeDefined();
                }),
                { numRuns: 50 }
            );
        });

        it('should accept valid email formats', () => {
            fc.assert(
                fc.property(validEmailArb, (validEmail) => {
                    const result = validateEmail(validEmail);

                    // Property: Valid email should pass validation
                    expect(result.isValid).toBe(true);
                    expect(result.error).toBeUndefined();
                }),
                { numRuns: 100 }
            );
        });

        it('should validate phone format correctly', () => {
            fc.assert(
                fc.property(invalidPhoneArb, (invalidPhone) => {
                    const result = validatePhone(invalidPhone);

                    // Property: Invalid phone should fail validation
                    expect(result.isValid).toBe(false);
                    expect(result.error).toBeDefined();
                }),
                { numRuns: 50 }
            );
        });

        it('should accept valid phone formats', () => {
            fc.assert(
                fc.property(validPhoneArb, (validPhone) => {
                    const result = validatePhone(validPhone);

                    // Property: Valid phone should pass validation
                    expect(result.isValid).toBe(true);
                    expect(result.error).toBeUndefined();
                }),
                { numRuns: 100 }
            );
        });

        it('should validate required fields correctly', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('', '   ', '\t', '\n'),
                    fc.string({ minLength: 1, maxLength: 20 }),
                    (emptyValue, fieldName) => {
                        const result = validateRequired(emptyValue, fieldName);

                        // Property: Empty/whitespace values should fail required validation
                        expect(result.isValid).toBe(false);
                        expect(result.error).toContain('必填');
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    /**
     * Feature: quote-list-system, Property 11: Storage clearing after submission
     * For any successfully submitted quote request, the Browser Storage
     * should be cleared of all quote list items
     * Validates: Requirements 4.5
     */
    describe('Property 11: Storage clearing after submission', () => {
        it('should clear all items from storage after clearQuoteListFromStorage', () => {
            fc.assert(
                fc.property(uniqueQuoteItemsArb, (items) => {
                    // Setup: save items to storage
                    saveQuoteListToStorage(items);

                    // Verify items exist
                    const beforeClear = getQuoteListFromStorage();
                    expect(beforeClear.length).toBe(items.length);

                    // Action: clear storage (simulates successful submission)
                    clearQuoteListFromStorage();

                    // Assert: storage is empty
                    const afterClear = getQuoteListFromStorage();
                    expect(afterClear.length).toBe(0);
                }),
                { numRuns: 100 }
            );
        });

        it('should result in empty array when retrieving after clear', () => {
            fc.assert(
                fc.property(uniqueQuoteItemsArb, (items) => {
                    // Setup
                    saveQuoteListToStorage(items);
                    clearQuoteListFromStorage();

                    // Assert: getQuoteListFromStorage returns empty array
                    const result = getQuoteListFromStorage();
                    expect(result).toEqual([]);
                    expect(Array.isArray(result)).toBe(true);
                }),
                { numRuns: 50 }
            );
        });

        it('should handle clearing already empty storage gracefully', () => {
            // Setup: ensure storage is empty
            clearQuoteListFromStorage();

            // Action: clear again
            expect(() => clearQuoteListFromStorage()).not.toThrow();

            // Assert: still empty
            const result = getQuoteListFromStorage();
            expect(result).toEqual([]);
        });

        it('should allow adding new items after clearing', () => {
            fc.assert(
                fc.property(
                    uniqueQuoteItemsArb,
                    uniqueQuoteItemsArb,
                    (oldItems, newItems) => {
                        // Setup: save old items
                        saveQuoteListToStorage(oldItems);

                        // Action: clear and add new items
                        clearQuoteListFromStorage();
                        saveQuoteListToStorage(newItems);

                        // Assert: only new items exist
                        const result = getQuoteListFromStorage();
                        expect(result.length).toBe(newItems.length);

                        // Old items should not exist
                        for (const oldItem of oldItems) {
                            const found = result.find((i) => i.productId === oldItem.productId);
                            // Only check if the old item ID is not in new items
                            const isInNewItems = newItems.some(
                                (n) => n.productId === oldItem.productId
                            );
                            if (!isInNewItems) {
                                expect(found).toBeUndefined();
                            }
                        }
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('should simulate complete submission flow with storage clearing', () => {
            fc.assert(
                fc.property(validFormDataArb, uniqueQuoteItemsArb, (formData, items) => {
                    // Setup: save items to storage
                    saveQuoteListToStorage(items);

                    // Simulate form validation
                    const validation = validateQuoteForm(formData);
                    expect(validation.isValid).toBe(true);

                    // Simulate building payload
                    const payload = buildQuoteRequestPayload(formData, items);
                    expect(payload.items.length).toBe(items.length);

                    // Simulate successful submission - clear storage
                    clearQuoteListFromStorage();

                    // Assert: storage is cleared
                    const afterSubmission = getQuoteListFromStorage();
                    expect(afterSubmission.length).toBe(0);
                }),
                { numRuns: 50 }
            );
        });
    });
});
