/**
 * Admin category detail API endpoint
 * PUT /api/admin/categories/:id - Update category
 * DELETE /api/admin/categories/:id - Delete category
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth, unauthorizedResponse, errorResponse, successResponse, getEnv } from '../../../../lib/apiAuth';
import { getCategoryById, updateCategory, deleteCategory, categoryNameExists, isCategoryInUse } from '../../../../lib/categoryDb';

/**
 * PUT - Update category
 */
export const PUT: APIRoute = async ({ request, cookies, params, locals }) => {
    try {
        const { id } = params;

        if (!id || isNaN(Number(id))) {
            return errorResponse('Valid category ID is required', 400);
        }

        const categoryId = Number(id);

        const env = getEnv(locals.runtime);
        const databaseUrl = env.DATABASE_URL;

        if (!databaseUrl) {
            return errorResponse('Database not configured', 500);
        }

        // Check authentication
        const auth = await checkAuth(cookies, databaseUrl);
        if (!auth.authenticated) {
            return unauthorizedResponse(auth.error);
        }

        // Check if category exists
        const existing = await getCategoryById(categoryId, databaseUrl);
        if (!existing) {
            return errorResponse('Category not found', 404);
        }

        const body = await request.json();
        const { name, display_order } = body;

        // Validate
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return errorResponse('Category name is required', 400);
        }

        if (name.length > 50) {
            return errorResponse('Category name must not exceed 50 characters', 400);
        }

        const displayOrder = typeof display_order === 'number' ? display_order : existing.display_order;

        // Check if name already exists (excluding current category)
        const exists = await categoryNameExists(name.trim(), categoryId, databaseUrl);
        if (exists) {
            return errorResponse('Category name already exists', 409);
        }

        const category = await updateCategory(categoryId, name.trim(), displayOrder, databaseUrl);

        return successResponse({ category });
    } catch (error: any) {
        console.error('Error updating category:', error);
        return errorResponse('Failed to update category');
    }
};

/**
 * DELETE - Delete category
 */
export const DELETE: APIRoute = async ({ cookies, params, locals }) => {
    try {
        const { id } = params;

        if (!id || isNaN(Number(id))) {
            return errorResponse('Valid category ID is required', 400);
        }

        const categoryId = Number(id);

        const env = getEnv(locals.runtime);
        const databaseUrl = env.DATABASE_URL;

        if (!databaseUrl) {
            return errorResponse('Database not configured', 500);
        }

        // Check authentication
        const auth = await checkAuth(cookies, databaseUrl);
        if (!auth.authenticated) {
            return unauthorizedResponse(auth.error);
        }

        // Check if category exists
        const existing = await getCategoryById(categoryId, databaseUrl);
        if (!existing) {
            return errorResponse('Category not found', 404);
        }

        // Check if category is in use
        const inUse = await isCategoryInUse(existing.name, databaseUrl);
        if (inUse) {
            return errorResponse('Cannot delete category that is in use by products', 400);
        }

        await deleteCategory(categoryId, databaseUrl);

        return successResponse({ message: 'Category deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting category:', error);
        return errorResponse('Failed to delete category');
    }
};
