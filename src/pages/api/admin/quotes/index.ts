/**
 * Admin quotes API endpoint
 * GET /api/admin/quotes - List all quotes
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth, unauthorizedResponse, errorResponse, successResponse, getEnv } from '../../../../lib/apiAuth';
import { getQuotes, getQuoteStats } from '../../../../lib/quoteDb';

export const GET: APIRoute = async ({ cookies, url, locals }) => {
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

        // Parse query params
        const limit = parseInt(url.searchParams.get('limit') || '20', 10);
        const offset = parseInt(url.searchParams.get('offset') || '0', 10);
        const status = url.searchParams.get('status') || undefined;

        const { quotes, total } = await getQuotes(databaseUrl, { limit, offset, status });
        const stats = await getQuoteStats(databaseUrl);

        return successResponse({ quotes, total, stats });
    } catch (error: any) {
        console.error('Error fetching quotes:', error);
        return errorResponse(error.message);
    }
};
