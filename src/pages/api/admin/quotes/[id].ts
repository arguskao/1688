/**
 * Admin single quote API endpoint
 * GET /api/admin/quotes/:id - Get quote details
 * PATCH /api/admin/quotes/:id - Update quote status
 * DELETE /api/admin/quotes/:id - Delete quote
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth, unauthorizedResponse, errorResponse, successResponse, getEnv } from '../../../../lib/apiAuth';
import { getQuoteById, updateQuoteStatus, deleteQuote, updateQuoteItemPrices, getQuoteForEmail } from '../../../../lib/quoteDb';

export const GET: APIRoute = async ({ params, cookies, locals }) => {
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

        const quoteId = params.id;
        if (!quoteId) {
            return errorResponse('Quote ID is required', 400);
        }

        const quote = await getQuoteById(quoteId, databaseUrl);
        if (!quote) {
            return errorResponse('Quote not found', 404);
        }

        return successResponse({ quote });
    } catch (error: any) {
        console.error('Error fetching quote:', error);
        return errorResponse(error.message);
    }
};

export const PATCH: APIRoute = async ({ params, request, cookies, locals }) => {
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

        const quoteId = params.id;
        if (!quoteId) {
            return errorResponse('Quote ID is required', 400);
        }

        const body = await request.json();

        // Handle pricing update
        if (body.items && Array.isArray(body.items)) {
            const success = await updateQuoteItemPrices(
                quoteId,
                body.items,
                body.adminNotes,
                databaseUrl
            );

            if (!success) {
                return errorResponse('Failed to update prices', 500);
            }

            // Send email to customer if requested
            if (body.sendEmail) {
                const quoteForEmail = await getQuoteForEmail(quoteId, databaseUrl);
                if (quoteForEmail) {
                    try {
                        const { sendQuoteResponseEmail } = await import('../../../../lib/email');
                        const emailApiKey = env.EMAIL_API_KEY;
                        if (emailApiKey) {
                            await sendQuoteResponseEmail({ EMAIL_API_KEY: emailApiKey }, quoteForEmail);
                        }
                    } catch (emailError) {
                        console.error('Failed to send quote email:', emailError);
                    }
                }
            }

            const updatedQuote = await getQuoteById(quoteId, databaseUrl);
            return successResponse({ quote: updatedQuote });
        }

        // Handle status update only
        const { status } = body;
        if (!status || !['pending', 'replied', 'closed'].includes(status)) {
            return errorResponse('Invalid status. Must be pending, replied, or closed', 400);
        }

        const quote = await updateQuoteStatus(quoteId, status, databaseUrl);
        if (!quote) {
            return errorResponse('Quote not found', 404);
        }

        return successResponse({ quote });
    } catch (error: any) {
        console.error('Error updating quote:', error);
        return errorResponse(error.message);
    }
};

export const DELETE: APIRoute = async ({ params, cookies, locals }) => {
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

        const quoteId = params.id;
        if (!quoteId) {
            return errorResponse('Quote ID is required', 400);
        }

        const deleted = await deleteQuote(quoteId, databaseUrl);
        if (!deleted) {
            return errorResponse('Quote not found', 404);
        }

        return successResponse({ message: 'Quote deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting quote:', error);
        return errorResponse(error.message);
    }
};
