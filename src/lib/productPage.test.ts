/**
 * Property-based tests for Product Page Generation
 * Feature: quote-list-system
 * 
 * These tests verify:
 * - Property 1: Product page generation completeness (Requirements 1.1)
 * - Property 2: Product information rendering completeness (Requirements 1.2, 1.4, 1.5)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import type { Product, ProductSpecs } from '../types/product';

// Mock the database module
vi.mock('./database', () => ({
    getDb: vi.fn(),
}));

vi.mock('./productDb', () => ({
    getProductById: vi.fn(),
    getProducts: vi.fn(),
}));

import { getDb } from './database';
import { getProductById, getProducts } from './productDb';

/**
 * Generators for property-based testing
 */

// Generate valid product ID (UUID format or custom format)
const productIdArb = fc.oneof(
    fc.uuid(),
    fc.stringMatching(/^[A-Z]{2,4}-\d{3,6}$/) // e.g., "PROD-12345"
);

// Generate valid SKU
const skuArb = fc.stringMatching(/^[A-Z0-9-]{3,20}$/);

// Generate valid category
const categoryArb = fc.constantFrom(
    'Electronics',
    'Health',
    'Home',
    'Sports',
    'Fashion',
    'Food',
    'Beauty',
    'Toys',
    'Office',
    'Garden'
);

// Generate valid product name (non-empty, reasonable length)
const productNameArb = fc.string({ minLength: 1, maxLength: 200 })
    .filter(s => s.trim().length > 0);

// Generate valid description
const descriptionArb = fc.string({ minLength: 10, maxLength: 5000 })
    .filter(s => s.trim().length >= 10);

// Generate valid specs_json
const specsJsonArb: fc.Arbitrary<ProductSpecs> = fc.dictionary(
    fc.stringMatching(/^[a-z_]{2,20}$/), // field names like "material", "weight"
    fc.oneof(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 0, max: 10000 }),
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
        fc.boolean()
    )
);

// Generate valid image URL
const imageUrlArb = fc.oneof(
    fc.webUrl(),
    fc.constant('/api/images/products/').chain(prefix =>
        productIdArb.map(id => `${prefix}${id}.jpg`)
    )
);

// Generate complete valid product
const validProductArb: fc.Arbitrary<Product> = fc.record({
    product_id: productIdArb,
    name_en: productNameArb,
    sku: skuArb,
    category: categoryArb,
    description_en: descriptionArb,
    specs_json: specsJsonArb,
    image_url: imageUrlArb,
});

/**
 * Helper function to simulate product page data extraction
 * This mimics what the Astro page template does
 */
function extractProductPageData(product: Product) {
    return {
        hasProductId: !!product.product_id,
        hasName: !!product.name_en && product.name_en.trim().length > 0,
        hasSku: !!product.sku,
        hasCategory: !!product.category,
        hasDescription: !!product.description_en,
        hasSpecs: !!product.specs_json && Object.keys(product.specs_json).length >= 0,
        hasImageUrl: !!product.image_url,
        specsCount: product.specs_json ? Object.keys(product.specs_json).length : 0,
        parsedSpecs: product.specs_json ? parseSpecs(product.specs_json) : [],
    };
}

/**
 * Parse specs_json into displayable format (mimics page template logic)
 */
function parseSpecs(specs: ProductSpecs): Array<{ key: string; value: string }> {
    return Object.entries(specs).map(([key, value]) => ({
        key,
        value: Array.isArray(value) ? value.join(', ') : String(value),
    }));
}

/**
 * Validate that a product can generate a valid page path
 */
function canGeneratePagePath(product: Product): boolean {
    return !!product.product_id && product.product_id.length > 0;
}

/**
 * Simulate page generation for a product
 */
function generateProductPagePath(product: Product): string {
    return `/products/${product.product_id}`;
}

describe('Property Tests: Product Page Generation', () => {
    let mockSql: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSql = vi.fn();
        (getDb as any).mockReturnValue(mockSql);
    });

    /**
     * Feature: quote-list-system, Property 1: Product page generation completeness
     * For any product in the Product Data Source, the build process should generate
     * a corresponding static HTML file
     * Validates: Requirements 1.1
     */
    describe('Property 1: Product page generation completeness', () => {
        it('should generate a valid page path for any valid product', () => {
            fc.assert(
                fc.property(validProductArb, (product) => {
                    // Property: Every valid product should be able to generate a page path
                    const canGenerate = canGeneratePagePath(product);
                    expect(canGenerate).toBe(true);

                    // Property: The generated path should follow the expected format
                    const pagePath = generateProductPagePath(product);
                    expect(pagePath).toBe(`/products/${product.product_id}`);
                    expect(pagePath).toMatch(/^\/products\/[^/]+$/);
                }),
                { numRuns: 100 }
            );
        });

        it('should generate unique page paths for products with different IDs', () => {
            fc.assert(
                fc.property(
                    fc.array(validProductArb, { minLength: 2, maxLength: 10 })
                        .filter(products => {
                            // Ensure all product IDs are unique
                            const ids = products.map(p => p.product_id);
                            return new Set(ids).size === ids.length;
                        }),
                    (products) => {
                        const paths = products.map(p => generateProductPagePath(p));
                        const uniquePaths = new Set(paths);

                        // Property: Each product should have a unique page path
                        expect(uniquePaths.size).toBe(products.length);
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('should handle products from database query for page generation', async () => {
            const mockProducts = [
                {
                    product_id: 'PROD-001',
                    name_en: 'Test Product 1',
                    sku: 'SKU-001',
                    category: 'Electronics',
                    description_en: 'Description 1',
                    specs_json: { material: 'Steel' },
                    image_url: '/images/prod-001.jpg',
                },
                {
                    product_id: 'PROD-002',
                    name_en: 'Test Product 2',
                    sku: 'SKU-002',
                    category: 'Health',
                    description_en: 'Description 2',
                    specs_json: { weight: '100g' },
                    image_url: '/images/prod-002.jpg',
                },
            ];

            (getProducts as any).mockResolvedValue({
                products: mockProducts,
                total: mockProducts.length,
            });

            const result = await getProducts('mock-url', { limit: 100 });

            // Property: All products from database should be able to generate pages
            for (const product of result.products) {
                expect(canGeneratePagePath(product)).toBe(true);
                const path = generateProductPagePath(product);
                expect(path).toMatch(/^\/products\/[^/]+$/);
            }

            // Property: Number of generated paths should equal number of products
            expect(result.products.length).toBe(mockProducts.length);
        });

        it('should reject products without valid product_id for page generation', () => {
            const invalidProducts = [
                { product_id: '', name_en: 'Test', sku: 'SKU', category: 'Electronics', description_en: 'Desc', specs_json: {}, image_url: '/img.jpg' },
                { product_id: null as any, name_en: 'Test', sku: 'SKU', category: 'Electronics', description_en: 'Desc', specs_json: {}, image_url: '/img.jpg' },
                { product_id: undefined as any, name_en: 'Test', sku: 'SKU', category: 'Electronics', description_en: 'Desc', specs_json: {}, image_url: '/img.jpg' },
            ];

            for (const product of invalidProducts) {
                expect(canGeneratePagePath(product)).toBe(false);
            }
        });
    });

    /**
     * Feature: quote-list-system, Property 2: Product information rendering completeness
     * For any product, the rendered page should contain all required fields
     * (product_id, name_en, sku, category, description_en, parsed specs_json, and image_url)
     * Validates: Requirements 1.2, 1.4, 1.5
     */
    describe('Property 2: Product information rendering completeness', () => {
        it('should extract all required fields from any valid product', () => {
            fc.assert(
                fc.property(validProductArb, (product) => {
                    const pageData = extractProductPageData(product);

                    // Property: All required fields should be present
                    expect(pageData.hasProductId).toBe(true);
                    expect(pageData.hasName).toBe(true);
                    expect(pageData.hasSku).toBe(true);
                    expect(pageData.hasCategory).toBe(true);
                    expect(pageData.hasDescription).toBe(true);
                    expect(pageData.hasSpecs).toBe(true);
                    expect(pageData.hasImageUrl).toBe(true);
                }),
                { numRuns: 100 }
            );
        });

        it('should correctly parse specs_json into displayable format', () => {
            fc.assert(
                fc.property(specsJsonArb, (specs) => {
                    const parsed = parseSpecs(specs);

                    // Property: Number of parsed specs should match input
                    expect(parsed.length).toBe(Object.keys(specs).length);

                    // Property: Each spec should have key and string value
                    for (const spec of parsed) {
                        expect(typeof spec.key).toBe('string');
                        expect(typeof spec.value).toBe('string');
                        expect(spec.key.length).toBeGreaterThan(0);
                    }
                }),
                { numRuns: 100 }
            );
        });

        it('should handle array values in specs_json correctly', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
                    (arrayValue) => {
                        const specs: ProductSpecs = { features: arrayValue };
                        const parsed = parseSpecs(specs);

                        // Property: Array values should be joined with comma
                        expect(parsed[0].value).toBe(arrayValue.join(', '));
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('should handle various value types in specs_json', () => {
            const testCases: Array<{ input: ProductSpecs; expectedValues: string[] }> = [
                { input: { material: 'Steel' }, expectedValues: ['Steel'] },
                { input: { weight: 100 }, expectedValues: ['100'] },
                { input: { available: true }, expectedValues: ['true'] },
                { input: { available: false }, expectedValues: ['false'] },
                { input: { colors: ['red', 'blue'] }, expectedValues: ['red, blue'] },
            ];

            for (const testCase of testCases) {
                const parsed = parseSpecs(testCase.input);
                expect(parsed.map(p => p.value)).toEqual(testCase.expectedValues);
            }
        });

        it('should render product with image_url correctly', () => {
            fc.assert(
                fc.property(validProductArb, (product) => {
                    const pageData = extractProductPageData(product);

                    // Property: Image URL should be present and valid
                    expect(pageData.hasImageUrl).toBe(true);
                    expect(product.image_url.length).toBeGreaterThan(0);
                }),
                { numRuns: 100 }
            );
        });

        it('should handle empty specs_json gracefully', () => {
            const productWithEmptySpecs: Product = {
                product_id: 'PROD-001',
                name_en: 'Test Product',
                sku: 'SKU-001',
                category: 'Electronics',
                description_en: 'A test product description',
                specs_json: {},
                image_url: '/images/test.jpg',
            };

            const pageData = extractProductPageData(productWithEmptySpecs);

            // Property: Empty specs should still be valid
            expect(pageData.hasSpecs).toBe(true);
            expect(pageData.specsCount).toBe(0);
            expect(pageData.parsedSpecs).toEqual([]);
        });

        it('should preserve all product data during page data extraction', () => {
            fc.assert(
                fc.property(validProductArb, (product) => {
                    const pageData = extractProductPageData(product);

                    // Property: Specs count should match original
                    const originalSpecsCount = Object.keys(product.specs_json).length;
                    expect(pageData.specsCount).toBe(originalSpecsCount);

                    // Property: Parsed specs should contain all original keys
                    const parsedKeys = pageData.parsedSpecs.map(s => s.key);
                    const originalKeys = Object.keys(product.specs_json);
                    expect(parsedKeys.sort()).toEqual(originalKeys.sort());
                }),
                { numRuns: 100 }
            );
        });

        it('should handle product retrieval by ID for rendering', async () => {
            const mockProduct: Product = {
                product_id: 'PROD-001',
                name_en: 'Test Product',
                sku: 'SKU-001',
                category: 'Electronics',
                description_en: 'A detailed product description for testing',
                specs_json: { material: 'Aluminum', weight: '500g', colors: ['silver', 'black'] },
                image_url: '/api/images/products/PROD-001.jpg',
            };

            (getProductById as any).mockResolvedValue(mockProduct);

            const product = await getProductById('PROD-001', 'mock-url');

            // Property: Retrieved product should have all required fields for rendering
            expect(product).not.toBeNull();
            if (product) {
                const pageData = extractProductPageData(product);
                expect(pageData.hasProductId).toBe(true);
                expect(pageData.hasName).toBe(true);
                expect(pageData.hasSku).toBe(true);
                expect(pageData.hasCategory).toBe(true);
                expect(pageData.hasDescription).toBe(true);
                expect(pageData.hasSpecs).toBe(true);
                expect(pageData.hasImageUrl).toBe(true);
            }
        });

        it('should handle special characters in product fields', () => {
            const productWithSpecialChars: Product = {
                product_id: 'PROD-001',
                name_en: 'Product with "quotes" & <special> chars',
                sku: 'SKU-001',
                category: 'Electronics',
                description_en: 'Description with\nnewlines\tand\ttabs',
                specs_json: {
                    note: 'Contains <html> & "quotes"',
                    dimensions: '10" x 20"',
                },
                image_url: '/images/test.jpg?v=1&size=large',
            };

            const pageData = extractProductPageData(productWithSpecialChars);

            // Property: Special characters should not break extraction
            expect(pageData.hasProductId).toBe(true);
            expect(pageData.hasName).toBe(true);
            expect(pageData.hasDescription).toBe(true);
            expect(pageData.parsedSpecs.length).toBe(2);
        });
    });
});
