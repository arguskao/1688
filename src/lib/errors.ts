/**
 * Custom Error Classes
 * Provides consistent error handling across the application
 */

/**
 * Base application error
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;

    constructor(
        message: string,
        statusCode: number = 500,
        code: string = 'INTERNAL_ERROR',
        isOperational: boolean = true
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
    public readonly field?: string;

    constructor(message: string, field?: string) {
        super(message, 400, 'VALIDATION_ERROR');
        this.field = field;
    }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends AppError {
    constructor(message: string = 'Access denied') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
    constructor(message: string) {
        super(message, 409, 'CONFLICT_ERROR');
    }
}

/**
 * Database error (500)
 */
export class DatabaseError extends AppError {
    constructor(message: string = 'Database operation failed') {
        super(message, 500, 'DATABASE_ERROR');
    }
}

/**
 * Configuration error (500)
 */
export class ConfigurationError extends AppError {
    constructor(message: string) {
        super(message, 500, 'CONFIGURATION_ERROR', false);
    }
}

/**
 * Convert unknown error to AppError
 */
export function toAppError(error: unknown): AppError {
    if (error instanceof AppError) {
        return error;
    }
    if (error instanceof Error) {
        return new AppError(error.message, 500, 'INTERNAL_ERROR');
    }
    return new AppError('An unexpected error occurred', 500, 'UNKNOWN_ERROR');
}

/**
 * Create error response object
 */
export function createErrorResponse(error: AppError) {
    return {
        success: false,
        error: error.message,
        code: error.code,
        ...(error instanceof ValidationError && error.field ? { field: error.field } : {}),
    };
}

/**
 * Create HTTP Response from error
 */
export function errorToResponse(error: unknown): Response {
    const appError = toAppError(error);
    return new Response(
        JSON.stringify(createErrorResponse(appError)),
        {
            status: appError.statusCode,
            headers: { 'Content-Type': 'application/json' },
        }
    );
}

/**
 * Log error (can be extended for external logging)
 */
export function logError(error: unknown, context?: string): void {
    const appError = toAppError(error);
    const prefix = context ? `[${context}]` : '';

    if (!appError.isOperational) {
        console.error(`${prefix} Critical Error:`, appError);
    } else {
        console.error(`${prefix} Error:`, appError.message);
    }
}
