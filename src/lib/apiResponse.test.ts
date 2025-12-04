/**
 * Unit tests for API response utilities
 */

import { describe, it, expect } from 'vitest';
import {
    success,
    successMessage,
    paginated,
    error,
    validationError,
    unauthorized,
    forbidden,
    notFound,
    conflict,
    badRequest,
    created,
    noContent,
    cors,
    withErrorHandling,
    ApiResponse,
} from './apiResponse';

describe('API Response Utilities', () => {
    describe('success', () => {
        it('should create a success response with data', async () => {
            const data = { id: 1, name: 'Test' };
            const response = success(data);

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body.success).toBe(true);
            expect(body.data).toEqual(data);
        });

        it('should allow custom status code', async () => {
            const response = success({ test: true }, 201);

            expect(response.status).toBe(201);
        });
    });

    describe('successMessage', () => {
        it('should create a success response with message', async () => {
            const response = successMessage('Operation completed');

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body.success).toBe(true);
            expect(body.message).toBe('Operation completed');
        });
    });

    describe('paginated', () => {
        it('should create a paginated response', async () => {
            const data = [{ id: 1 }, { id: 2 }];
            const response = paginated(data, 10, 1, 2);

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body.success).toBe(true);
            expect(body.data).toEqual(data);
            expect(body.total).toBe(10);
            expect(body.page).toBe(1);
            expect(body.limit).toBe(2);
            expect(body.hasMore).toBe(true);
        });

        it('should set hasMore to false on last page', async () => {
            const data = [{ id: 9 }, { id: 10 }];
            const response = paginated(data, 10, 5, 2);

            const body = await response.json();
            expect(body.hasMore).toBe(false);
        });
    });

    describe('error', () => {
        it('should create an error response', async () => {
            const response = error('Something went wrong');

            expect(response.status).toBe(500);
            const body = await response.json();
            expect(body.success).toBe(false);
            expect(body.error).toBe('Something went wrong');
        });

        it('should allow custom status code', async () => {
            const response = error('Bad request', 400);

            expect(response.status).toBe(400);
        });
    });

    describe('validationError', () => {
        it('should create a validation error response', async () => {
            const errors = [
                { field: 'name', message: 'Name is required' },
                { field: 'email', message: 'Invalid email format' },
            ];
            const response = validationError(errors);

            expect(response.status).toBe(400);
            const body = await response.json();
            expect(body.success).toBe(false);
            expect(body.error).toBe('Validation failed');
            expect(body.validationErrors).toEqual(errors);
        });
    });

    describe('unauthorized', () => {
        it('should create an unauthorized response', async () => {
            const response = unauthorized();

            expect(response.status).toBe(401);
            const body = await response.json();
            expect(body.success).toBe(false);
            expect(body.error).toBe('Unauthorized');
        });

        it('should allow custom message', async () => {
            const response = unauthorized('Token expired');

            const body = await response.json();
            expect(body.error).toBe('Token expired');
        });
    });

    describe('forbidden', () => {
        it('should create a forbidden response', async () => {
            const response = forbidden();

            expect(response.status).toBe(403);
            const body = await response.json();
            expect(body.error).toBe('Forbidden');
        });
    });

    describe('notFound', () => {
        it('should create a not found response', async () => {
            const response = notFound();

            expect(response.status).toBe(404);
            const body = await response.json();
            expect(body.error).toBe('Not found');
        });

        it('should allow custom message', async () => {
            const response = notFound('Product not found');

            const body = await response.json();
            expect(body.error).toBe('Product not found');
        });
    });

    describe('conflict', () => {
        it('should create a conflict response', async () => {
            const response = conflict('Resource already exists');

            expect(response.status).toBe(409);
            const body = await response.json();
            expect(body.error).toBe('Resource already exists');
        });
    });

    describe('badRequest', () => {
        it('should create a bad request response', async () => {
            const response = badRequest('Invalid input');

            expect(response.status).toBe(400);
            const body = await response.json();
            expect(body.error).toBe('Invalid input');
        });
    });

    describe('created', () => {
        it('should create a 201 response with data', async () => {
            const data = { id: 1, name: 'New Item' };
            const response = created(data);

            expect(response.status).toBe(201);
            const body = await response.json();
            expect(body.success).toBe(true);
            expect(body.data).toEqual(data);
        });
    });

    describe('noContent', () => {
        it('should create a 204 response with no body', async () => {
            const response = noContent();

            expect(response.status).toBe(204);
            expect(response.body).toBeNull();
        });
    });

    describe('cors', () => {
        it('should create a CORS preflight response', () => {
            const response = cors();

            expect(response.status).toBe(204);
            expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
            expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
        });
    });

    describe('withErrorHandling', () => {
        it('should return handler result on success', async () => {
            const handler = async () => success({ test: true });
            const response = await withErrorHandling(handler);

            expect(response.status).toBe(200);
        });

        it('should catch errors and return error response', async () => {
            const handler = async () => {
                throw new Error('Test error');
            };
            const response = await withErrorHandling(handler);

            expect(response.status).toBe(500);
            const body = await response.json();
            expect(body.error).toBe('Test error');
        });

        it('should handle non-Error throws', async () => {
            const handler = async () => {
                throw 'string error';
            };
            const response = await withErrorHandling(handler);

            expect(response.status).toBe(500);
            const body = await response.json();
            expect(body.error).toBe('Internal server error');
        });
    });

    describe('ApiResponse object', () => {
        it('should export all functions', () => {
            expect(ApiResponse.success).toBe(success);
            expect(ApiResponse.error).toBe(error);
            expect(ApiResponse.notFound).toBe(notFound);
            expect(ApiResponse.unauthorized).toBe(unauthorized);
            expect(ApiResponse.validationError).toBe(validationError);
            expect(ApiResponse.withErrorHandling).toBe(withErrorHandling);
        });
    });
});
