/**
 * Admin spec field detail API endpoint
 * PUT /api/admin/spec-fields/:id - Update spec field
 * DELETE /api/admin/spec-fields/:id - Delete spec field
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth, unauthorizedResponse, errorResponse, successResponse, getEnv } from '../../../../lib/apiAuth';
import { getSpecFieldById, updateSpecField, deleteSpecField, fieldNameExists } from '../../../../lib/specFieldDb';

export const PUT: APIRoute = async ({ request, cookies, params, locals }) => {
    try {
        const { id } = params;
        if (!id || isNaN(Number(id))) {
            return errorResponse('Valid ID is required', 400);
        }

        const env = getEnv(locals.runtime);
        const databaseUrl = env.DATABASE_URL;

        if (!databaseUrl) {
            return errorResponse('Database not configured', 500);
        }

        const auth = await checkAuth(cookies, databaseUrl);
        if (!auth.authenticated) {
            return unauthorizedResponse(auth.error);
        }

        const existing = await getSpecFieldById(Number(id), databaseUrl);
        if (!existing) {
            return errorResponse('Spec field not found', 404);
        }

        const body = await request.json();
        const { field_name, field_label, field_type, options, display_order, is_required } = body;

        if (field_name && field_name !== existing.field_name) {
            const exists = await fieldNameExists(field_name, Number(id), databaseUrl);
            if (exists) {
                return errorResponse('Field name already exists', 409);
            }
        }

        const specField = await updateSpecField(Number(id), {
            field_name,
            field_label,
            field_type,
            options,
            display_order,
            is_required,
        }, databaseUrl);

        return successResponse({ specField });
    } catch (error: any) {
        console.error('Error updating spec field:', error);
        return errorResponse('Failed to update spec field');
    }
};

export const DELETE: APIRoute = async ({ cookies, params, locals }) => {
    try {
        const { id } = params;
        if (!id || isNaN(Number(id))) {
            return errorResponse('Valid ID is required', 400);
        }

        const env = getEnv(locals.runtime);
        const databaseUrl = env.DATABASE_URL;

        if (!databaseUrl) {
            return errorResponse('Database not configured', 500);
        }

        const auth = await checkAuth(cookies, databaseUrl);
        if (!auth.authenticated) {
            return unauthorizedResponse(auth.error);
        }

        await deleteSpecField(Number(id), databaseUrl);
        return successResponse({ message: 'Spec field deleted' });
    } catch (error: any) {
        console.error('Error deleting spec field:', error);
        return errorResponse('Failed to delete spec field');
    }
};
