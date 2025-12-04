/**
 * Admin category detail API endpoint
 * PUT /api/admin/categories/:id - Update category
 * DELETE /api/admin/categories/:id - Delete category
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth, getEnv } from '../../../../lib/apiAuth';
import { ApiResponse } from '../../../../lib/apiResponse';
import { getCategoryById, updateCategory, deleteCategory, categoryNameExists, isCategoryInUse } from '../../../../lib/categoryDb';

/**
 * PUT - Update category
 */
export const PUT: APIRoute = async ({ request, cookies, params, locals }) => {
    return ApiResponse.withErrorHandling(async () => {
        const { id } = params;
        if (!id || isNaN(Number(id))) {
            return ApiResponse.badRequest('Valid category ID is required');
        }

        const categoryId = Number(id);
        const env = getEnv(locals.runtime);
        const databaseUrl = env.DATABASE_URL;

        if (!databaseUrl) {
            return ApiResponse.error('Database not configured', 500);
        }

        const auth = await checkAuth(cookies, databaseUrl);
        if (!auth.authenticated) {
            return ApiResponse.unauthorized(auth.error);
        }

        const existing = await getCategoryById(categoryId, databaseUrl);
        if (!existing) {
            return ApiResponse.notFound('Category not found');
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

        const exists = await categoryNameExists(name.trim(), categoryId, databaseUrl);
        if (exists) {
            return ApiResponse.conflict('Category name already exists');
        }

        const displayOrder = typeof display_order === 'number' ? display_order : existing.display_order;
        const category = await updateCategory(categoryId, name.trim(), displayOrder, databaseUrl);
        return ApiResponse.success({ category });
    }, 'PUT /api/admin/categories/:id');
};

/**
 * DELETE - Delete category
 */
export const DELETE: APIRoute = async ({ cookies, params, locals }) => {
    return ApiResponse.withErrorHandling(async () => {
        const { id } = params;
        if (!id || isNaN(Number(id))) {
            return ApiResponse.badRequest('Valid category ID is required');
        }

        const categoryId = Number(id);
        const env = getEnv(locals.runtime);
        const databaseUrl = env.DATABASE_URL;

        if (!databaseUrl) {
            return ApiResponse.error('Database not configured', 500);
        }

        const auth = await checkAuth(cookies, databaseUrl);
        if (!auth.authenticated) {
            return ApiResponse.unauthorized(auth.error);
        }

        const existing = await getCategoryById(categoryId, databaseUrl);
        if (!existing) {
            return ApiResponse.notFound('Category not found');
        }

        const inUse = await isCategoryInUse(existing.name, databaseUrl);
        if (inUse) {
            return ApiResponse.badRequest('Cannot delete category that is in use by products');
        }

        await deleteCategory(categoryId, databaseUrl);
        return ApiResponse.success({ message: 'Category deleted successfully' });
    }, 'DELETE /api/admin/categories/:id');
};
