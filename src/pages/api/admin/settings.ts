/**
 * Admin settings API endpoint
 * GET /api/admin/settings - Get company settings
 * PUT /api/admin/settings - Update company settings
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth, unauthorizedResponse, errorResponse, successResponse, getEnv } from '../../../lib/apiAuth';
import { getCompanySettings, updateCompanySettings } from '../../../lib/settingsDb';

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

        const settings = await getCompanySettings(databaseUrl);
        return successResponse({ settings });
    } catch (error: any) {
        console.error('Error fetching settings:', error);
        return errorResponse(error.message);
    }
};

export const PUT: APIRoute = async ({ request, cookies, locals }) => {
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
        const settings = await updateCompanySettings(body, databaseUrl);
        return successResponse({ settings });
    } catch (error: any) {
        console.error('Error updating settings:', error);
        return errorResponse(error.message);
    }
};
