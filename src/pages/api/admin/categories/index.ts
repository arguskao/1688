/**
 * Admin categories API endpoint
 * GET /api/admin/categories - List all categories
 * POST /api/admin/categories - Create new category
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth, unauthorizedResponse, errorResponse, successResponse, getEnv } from '../../../../lib/apiAuth';
import { getAllCategories, createCategory, categoryNameExists } from '../../../../lib/categoryDb';

/**
 * GET - List all categories
 */
export const GET: APIRoute = async ({ cookies, locals }) => {
    try {
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

        const categories = await getAllCategories(databaseUrl);

        return successResponse({ categories });
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        return errorResponse('Failed to fetch categories');
    }
};

/**
 * POST - Create new category
 */
export const POST: APIRoute = async ({ request, cookies, locals }) => {
    try {
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

        const body = await request.json();
        const { name, display_order } = body;

        // Validate
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return errorResponse('Category name is required', 400);
        }

        if (name.length > 50) {
            return errorResponse('Category name must not exceed 50 characters', 400);
        }

        const displayOrder = typeof display_order === 'number' ? display_order : 0;

        // Check if name already exists
        const exists = await categoryNameExists(name.trim(), null, databaseUrl);
        if (exists) {
            return errorResponse('Category name already exists', 409);
        }

        const category = await createCategory(name.trim(), displayOrder, databaseUrl);

        return successResponse({ category }, 201);
    } catch (error: any) {
        console.error('Error creating category:', error);
        return errorResponse('Failed to create category');
    }
};
