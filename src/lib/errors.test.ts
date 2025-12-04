/**
 * Unit tests for custom error classes
 */

import { describe, it, expect, vi } from 'vitest';
import {
    AppError,
    NotFoundError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    DatabaseError,
    ConfigurationError,
    toAppError,
    createErrorResponse,
    errorToResponse,
    logError,
} from './errors';

describe('Custom Error Classes', () => {
    describe('AppError', () => {
        it('should create error with default values', () => {
            const error = new AppError('Test error');

            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(500);
            expect(error.code).toBe('INTERNAL_ERROR');
            expect(error.isOperational).toBe(true);
        });

        it('should create error with custom values', () => {
            const error = new AppError('Custom error', 400, 'CUSTOM_CODE', false);

            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('CUSTOM_CODE');
            expect(error.isOperational).toBe(false);
        });

        it('should be instance of Error', () => {
            const error = new AppError('Test');

            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(AppError);
        });
    });

    describe('NotFoundError', () => {
        it('should create 404 error with default message', () => {
            const error = new NotFoundError();

            expect(error.statusCode).toBe(404);
            expect(error.code).toBe('NOT_FOUND');
            expect(error.message).toBe('Resource not found');
        });

        it('should create 404 error with custom resource name', () => {
            const error = new NotFoundError('Product');

            expect(error.message).toBe('Product not found');
        });
    });

    describe('ValidationError', () => {
        it('should create 400 error', () => {
            const error = new ValidationError('Invalid input');

            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.message).toBe('Invalid input');
        });

        it('should include field name when provided', () => {
            const error = new ValidationError('Name is required', 'name');

            expect(error.field).toBe('name');
        });
    });

    describe('AuthenticationError', () => {
        it('should create 401 error with default message', () => {
            const error = new AuthenticationError();

            expect(error.statusCode).toBe(401);
            expect(error.code).toBe('AUTHENTICATION_ERROR');
            expect(error.message).toBe('Authentication required');
        });

        it('should create 401 error with custom message', () => {
            const error = new AuthenticationError('Token expired');

            expect(error.message).toBe('Token expired');
        });
    });

    describe('AuthorizationError', () => {
        it('should create 403 error', () => {
            const error = new AuthorizationError();

            expect(error.statusCode).toBe(403);
            expect(error.code).toBe('AUTHORIZATION_ERROR');
            expect(error.message).toBe('Access denied');
        });
    });

    describe('ConflictError', () => {
        it('should create 409 error', () => {
            const error = new ConflictError('Resource already exists');

            expect(error.statusCode).toBe(409);
            expect(error.code).toBe('CONFLICT_ERROR');
        });
    });

    describe('DatabaseError', () => {
        it('should create 500 error with default message', () => {
            const error = new DatabaseError();

            expect(error.statusCode).toBe(500);
            expect(error.code).toBe('DATABASE_ERROR');
            expect(error.message).toBe('Database operation failed');
        });
    });

    describe('ConfigurationError', () => {
        it('should create non-operational 500 error', () => {
            const error = new ConfigurationError('Missing config');

            expect(error.statusCode).toBe(500);
            expect(error.code).toBe('CONFIGURATION_ERROR');
            expect(error.isOperational).toBe(false);
        });
    });

    describe('toAppError', () => {
        it('should return AppError as-is', () => {
            const original = new AppError('Test');
            const result = toAppError(original);

            expect(result).toBe(original);
        });

        it('should convert Error to AppError', () => {
            const original = new Error('Standard error');
            const result = toAppError(original);

            expect(result).toBeInstanceOf(AppError);
            expect(result.message).toBe('Standard error');
            expect(result.statusCode).toBe(500);
        });

        it('should handle non-Error values', () => {
            const result = toAppError('string error');

            expect(result).toBeInstanceOf(AppError);
            expect(result.message).toBe('An unexpected error occurred');
            expect(result.code).toBe('UNKNOWN_ERROR');
        });

        it('should handle null/undefined', () => {
            expect(toAppError(null).code).toBe('UNKNOWN_ERROR');
            expect(toAppError(undefined).code).toBe('UNKNOWN_ERROR');
        });
    });

    describe('createErrorResponse', () => {
        it('should create error response object', () => {
            const error = new AppError('Test error', 400, 'TEST_CODE');
            const response = createErrorResponse(error);

            expect(response.success).toBe(false);
            expect(response.error).toBe('Test error');
            expect(response.code).toBe('TEST_CODE');
        });

        it('should include field for ValidationError', () => {
            const error = new ValidationError('Invalid', 'email');
            const response = createErrorResponse(error);

            expect(response.field).toBe('email');
        });

        it('should not include field for other errors', () => {
            const error = new NotFoundError();
            const response = createErrorResponse(error);

            expect(response).not.toHaveProperty('field');
        });
    });

    describe('errorToResponse', () => {
        it('should create HTTP Response from AppError', async () => {
            const error = new NotFoundError('Product');
            const response = errorToResponse(error);

            expect(response.status).toBe(404);
            const body = await response.json();
            expect(body.success).toBe(false);
            expect(body.error).toBe('Product not found');
        });

        it('should convert unknown errors', async () => {
            const response = errorToResponse(new Error('Unknown'));

            expect(response.status).toBe(500);
        });

        it('should have JSON content type', () => {
            const response = errorToResponse(new AppError('Test'));

            expect(response.headers.get('Content-Type')).toBe('application/json');
        });
    });

    describe('logError', () => {
        it('should log operational errors', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const error = new AppError('Test error');

            logError(error, 'TestContext');

            expect(consoleSpy).toHaveBeenCalledWith('[TestContext] Error:', 'Test error');
            consoleSpy.mockRestore();
        });

        it('should log critical errors differently', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            const error = new ConfigurationError('Critical');

            logError(error, 'TestContext');

            expect(consoleSpy).toHaveBeenCalledWith('[TestContext] Critical Error:', error);
            consoleSpy.mockRestore();
        });

        it('should handle non-Error values', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            logError('string error');

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
