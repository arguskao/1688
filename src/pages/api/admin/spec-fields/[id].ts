/**
 * Admin spec field detail API endpoint
 * PUT /api/admin/spec-fields/:id - Update spec field
 * DELETE /api/admin/spec-fields/:id - Delete spec field
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth, getEnv } from '../../../../lib/apiAuth';
import { ApiResponse } from '../../../../lib/apiResponse';
import { getSpecFieldById, updateSpecField, deleteSpecField, fieldNameExists } from '../../../../lib/specFieldDb';

export const PUT: APIRoute = async ({ request, cookies, params, locals }) => {
    return ApiResponse.withErrorHandling(async () => {
        const { id } = params;
        if (!id || isNaN(Number(id))) {
            return ApiResponse.badRequest('Valid ID is required');
        }

        const env = getEnv(locals.runtime);
        const databaseUrl = env.DATABASE_URL;

        if (!databaseUrl) {
            return ApiResponse.error('Database not configured', 500);
        }

        const auth = await checkAuth(cookies, databaseUrl);
        if (!auth.authenticated) {
            return ApiResponse.unauthorized(auth.error);
        }

        const existing = await getSpecFieldById(Number(id), databaseUrl);
        if (!existing) {
            return ApiResponse.notFound('Spec field not found');
        }

        const body = await request.json();
        const { field_name, field_label, field_type, options, display_order, is_required } = body;

        if (field_name && field_name !== existing.field_name) {
            const exists = await fieldNameExists(field_name, Number(id), databaseUrl);
            if (exists) {
                return ApiResponse.conflict('Field name already exists');
            }
        }

        const specField = await updateSpecField(Number(id), {
            field_name, field_label, field_type, options, display_order, is_required,
        }, databaseUrl);

        return ApiResponse.success({ specField });
    }, 'PUT /api/admin/spec-fields/:id');
};

export const DELETE: APIRoute = async ({ cookies, params, locals }) => {
    return ApiResponse.withErrorHandling(async () => {
        const { id } = params;
        if (!id || isNaN(Number(id))) {
            return ApiResponse.badRequest('Valid ID is required');
        }

        const env = getEnv(locals.runtime);
        const databaseUrl = env.DATABASE_URL;

        if (!databaseUrl) {
            return ApiResponse.error('Database not configured', 500);
        }

        const auth = await checkAuth(cookies, databaseUrl);
        if (!auth.authenticated) {
            return ApiResponse.unauthorized(auth.error);
        }

        await deleteSpecField(Number(id), databaseUrl);
        return ApiResponse.success({ message: 'Spec field deleted' });
    }, 'DELETE /api/admin/spec-fields/:id');
};
