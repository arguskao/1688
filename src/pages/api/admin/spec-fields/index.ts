/**
 * Admin spec fields API endpoint
 * GET /api/admin/spec-fields - List all spec fields
 * POST /api/admin/spec-fields - Create new spec field
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth, unauthorizedResponse, errorResponse, successResponse, getEnv } from '../../../../lib/apiAuth';
import { getAllSpecFields, createSpecField, fieldNameExists } from '../../../../lib/specFieldDb';

export const GET: APIRoute = async ({ cookies, locals }) => {
    try {
        const env = getEnv(locals.runtime);
        const databaseUrl = env.DATABASE_URL;

        if (!databaseUrl) {
            return errorResponse('Database not configured', 500);
        }

        const auth = await checkAuth(cookies, databaseUrl);
        if (!auth.authenticated) {
            return unauthorizedResponse(auth.error);
        }

        const specFields = await getAllSpecFields(databaseUrl);
        return successResponse({ specFields });
    } catch (error: any) {
        console.error('Error fetching spec fields:', error);
        return errorResponse('Failed to fetch spec fields');
    }
};

export const POST: APIRoute = async ({ request, cookies, locals }) => {
    try {
        const env = getEnv(locals.runtime);
        const databaseUrl = env.DATABASE_URL;

        if (!databaseUrl) {
            return errorResponse('Database not configured', 500);
        }

        const auth = await checkAuth(cookies, databaseUrl);
        if (!auth.authenticated) {
            return unauthorizedResponse(auth.error);
        }

        const body = await request.json();
        const { field_name, field_label, field_type, options, display_order, is_required } = body;

        // Validation
        if (!field_name || !field_name.trim()) {
            return errorResponse('Field name is required', 400);
        }
        if (!field_label || !field_label.trim()) {
            return errorResponse('Field label is required', 400);
        }
        if (!field_type || !['text', 'number', 'select'].includes(field_type)) {
            return errorResponse('Field type must be text, number, or select', 400);
        }
        if (field_type === 'select' && (!options || !Array.isArray(options) || options.length === 0)) {
            return errorResponse('Select type requires options array', 400);
        }

        // Check unique field name
        const exists = await fieldNameExists(field_name, null, databaseUrl);
        if (exists) {
            return errorResponse('Field name already exists', 409);
        }

        const specField = await createSpecField({
            field_name: field_name.trim(),
            field_label: field_label.trim(),
            field_type,
            options: field_type === 'select' ? options : null,
            display_order: display_order || 0,
            is_required: is_required || false,
        }, databaseUrl);

        return successResponse({ specField }, 201);
    } catch (error: any) {
        console.error('Error creating spec field:', error);
        return errorResponse('Failed to create spec field');
    }
};
