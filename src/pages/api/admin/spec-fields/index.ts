/**
 * Admin spec fields API endpoint
 * GET /api/admin/spec-fields - List all spec fields
 * POST /api/admin/spec-fields - Create new spec field
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth, getEnv } from '../../../../lib/apiAuth';
import { ApiResponse } from '../../../../lib/apiResponse';
import { getAllSpecFields, createSpecField, fieldNameExists } from '../../../../lib/specFieldDb';

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

        const specFields = await getAllSpecFields(databaseUrl);
        return ApiResponse.success({ specFields });
    }, 'GET /api/admin/spec-fields');
};

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
        const { field_name, field_label, field_type, options, display_order, is_required } = body;

        // Validation
        const errors: Array<{ field: string; message: string }> = [];

        if (!field_name?.trim()) {
            errors.push({ field: 'field_name', message: 'Field name is required' });
        }
        if (!field_label?.trim()) {
            errors.push({ field: 'field_label', message: 'Field label is required' });
        }
        if (!field_type || !['text', 'number', 'select'].includes(field_type)) {
            errors.push({ field: 'field_type', message: 'Field type must be text, number, or select' });
        }
        if (field_type === 'select' && (!options || !Array.isArray(options) || options.length === 0)) {
            errors.push({ field: 'options', message: 'Select type requires options array' });
        }

        if (errors.length > 0) {
            return ApiResponse.validationError(errors);
        }

        // Check unique field name
        const exists = await fieldNameExists(field_name, null, databaseUrl);
        if (exists) {
            return ApiResponse.conflict('Field name already exists');
        }

        const specField = await createSpecField({
            field_name: field_name.trim(),
            field_label: field_label.trim(),
            field_type,
            options: field_type === 'select' ? options : null,
            display_order: display_order || 0,
            is_required: is_required || false,
        }, databaseUrl);

        return ApiResponse.created({ specField });
    }, 'POST /api/admin/spec-fields');
};
