/**
 * Admin categories API endpoint
 * GET /api/admin/categories - List all categories
 * POST /api/admin/categories - Create new category
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth, getEnv } from '../../../../lib/apiAuth';
import { ApiResponse } from '../../../../lib/apiResponse';
import { getAllCategories, createCategory, categoryNameExists } from '../../../../lib/categoryDb';

/**
 * GET - List all categories
 */
export const GET: APIRoute = async ({ cookies, locals }) => {
    return ApiResponse.withErrorHandling(async () => {
        const env = getEnv(locals.runtime);
        const databaseUrl = env.DATABASE_URL;

        if (!databaseUrl) {
            return ApiResponse.error('Database not configured', 500);
        }

        const auth = await checkAuth(cookies, databaseUrl);
        if (!auth.authenticated) {
            return ApiResponse.unauthorized(auth.error);
        }

        const categories = await getAllCategories(databaseUrl);
        return ApiResponse.success({ categories });
    }, 'GET /api/admin/categories');
};

/**
 * POST - Create new category
 */
export const POST: APIRoute = async ({ request, cookies, locals }) => {
    return ApiResponse.withErrorHandling(async () => {
        const env = getEnv(locals.runtime);
        const databaseUrl = env.DATABASE_URL;

        if (!databaseUrl) {
            return ApiResponse.error('Database not configured', 500);
        }

        const auth = await checkAuth(cookies, databaseUrl);
        if (!auth.authenticated) {
            return ApiResponse.unauthorized(auth.error);
        }

        const body = await request.json();
        const { name, display_order } = body;

        const errors: Array<{ field: string; message: string }> = [];
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            errors.push({ field: 'name', message: 'Category name is required' });
        } else if (name.length > 50) {
            errors.push({ field: 'name', message: 'Category name must not exceed 50 characters' });
        }

        if (errors.length > 0) {
            return ApiResponse.validationError(errors);
        }

        const exists = await categoryNameExists(name.trim(), null, databaseUrl);
        if (exists) {
            return ApiResponse.conflict('Category name already exists');
        }

        const displayOrder = typeof display_order === 'number' ? display_order : 0;
        const category = await createCategory(name.trim(), displayOrder, databaseUrl);
        return ApiResponse.created({ category });
    }, 'POST /api/admin/categories');
};
