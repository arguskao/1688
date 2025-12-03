/**
 * Unified API Response utilities
 * Provides consistent response format across all API endpoints
 */

import type { ApiResponse as ApiResponseType, PaginatedResponse } from '../types';

// Response headers
const JSON_HEADERS = {
    'Content-Type': 'application/json',
};

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Create a success response
 */
export function success<T>(data: T, status: number = 200): Response {
    const body: ApiResponseType<T> = {
        success: true,
        data,
    };
    return new Response(JSON.stringify(body), {
        status,
        headers: JSON_HEADERS,
    });
}

/**
 * Create a success response with a message
 */
export function successMessage(message: string, status: number = 200): Response {
    const body: ApiResponseType = {
        success: true,
        message,
    };
    return new Response(JSON.stringify(body), {
        status,
        headers: JSON_HEADERS,
    });
}

/**
 * Create a paginated response
 */
export function paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
): Response {
    const body: PaginatedResponse<T> = {
        success: true,
        data,
        total,
        page,
        limit,
        hasMore: page * limit < total,
    };
    return new Response(JSON.stringify(body), {
        status: 200,
        headers: JSON_HEADERS,
    });
}

/**
 * Create an error response
 */
export function error(message: string, status: number = 500): Response {
    const body: ApiResponseType = {
        success: false,
        error: message,
    };
    return new Response(JSON.stringify(body), {
        status,
        headers: JSON_HEADERS,
    });
}

/**
 * Create a validation error response
 */
export function validationError(
    errors: Array<{ field: string; message: string }>
): Response {
    const body = {
        success: false,
        error: 'Validation failed',
        validationErrors: errors,
    };
    return new Response(JSON.stringify(body), {
        status: 400,
        headers: JSON_HEADERS,
    });
}

/**
 * Create an unauthorized response
 */
export function unauthorized(message: string = 'Unauthorized'): Response {
    return error(message, 401);
}

/**
 * Create a forbidden response
 */
export function forbidden(message: string = 'Forbidden'): Response {
    return error(message, 403);
}

/**
 * Create a not found response
 */
export function notFound(message: string = 'Not found'): Response {
    return error(message, 404);
}

/**
 * Create a conflict response (e.g., duplicate entry)
 */
export function conflict(message: string = 'Conflict'): Response {
    return error(message, 409);
}

/**
 * Create a bad request response
 */
export function badRequest(message: string = 'Bad request'): Response {
    return error(message, 400);
}

/**
 * Create a created response (201)
 */
export function created<T>(data: T): Response {
    return success(data, 201);
}

/**
 * Create a no content response (204)
 */
export function noContent(): Response {
    return new Response(null, { status: 204 });
}

/**
 * Handle OPTIONS request for CORS
 */
export function cors(): Response {
    return new Response(null, {
        status: 204,
        headers: { ...JSON_HEADERS, ...CORS_HEADERS },
    });
}

/**
 * Wrap handler with error handling
 */
export async function withErrorHandling(
    handler: () => Promise<Response>,
    context?: string
): Promise<Response> {
    try {
        return await handler();
    } catch (err) {
        if (context) {
            console.error(`[${context}]`, err);
        }
        const message = err instanceof Error ? err.message : 'Internal server error';
        return error(message, 500);
    }
}

// Re-export for backward compatibility
export const ApiResponse = {
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
};
