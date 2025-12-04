/**
 * Quote API endpoint (Astro format)
 * Handles quote submission requests
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';
import { validateQuoteForm } from '../../lib/validation';

interface QuoteRequestItem {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
}

interface QuoteRequest {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    companyName: string;
    message: string;
    items: QuoteRequestItem[];
}

/**
 * Validate quote request data
 */
function validateQuoteRequest(request: QuoteRequest): { valid: boolean; error?: string } {
    // Validate customer information
    const formValidation = validateQuoteForm({
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone,
        companyName: request.companyName,
        message: request.message
    });

    if (!formValidation.isValid) {
        const firstError = Object.values(formValidation.errors)[0];
        return { valid: false, error: firstError };
    }

    // Validate items
    if (!request.items || request.items.length === 0) {
        return { valid: false, error: '詢價清單不能為空' };
    }

    // Validate quantities
    for (const item of request.items) {
        if (!item.quantity || item.quantity < 1) {
            return { valid: false, error: '產品數量必須大於 0' };
        }
    }

    return { valid: true };
}

/**
 * Store quote in database
 */
async function storeQuote(databaseUrl: string, request: QuoteRequest): Promise<string> {
    const sql = neon(databaseUrl);
    const quoteId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    try {
        // Insert quote
        await sql`
      INSERT INTO quotes (
        quote_id, customer_name, customer_email, customer_phone,
        company_name, message, created_at, status
      ) VALUES (
        ${quoteId}, ${request.customerName}, ${request.customerEmail},
        ${request.customerPhone}, ${request.companyName}, ${request.message},
        ${createdAt}, 'pending'
      )
    `;

        // Insert quote items
        for (const item of request.items) {
            await sql`
        INSERT INTO quote_items (quote_id, product_id, quantity)
        VALUES (${quoteId}, ${item.productId}, ${item.quantity})
      `;
        }

        return quoteId;
    } catch (error) {
        console.error('Failed to store quote:', error);
        throw new Error('Failed to store quote in database');
    }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
    env: { EMAIL_API_KEY: string; BUSINESS_EMAIL: string },
    quoteId: string,
    request: QuoteRequest
): Promise<void> {
    try {
        const { sendEmailNotification: sendEmail } = await import('../../lib/email');
        await sendEmail(env, quoteId, request);
    } catch (error) {
        console.error('Email notification failed:', error);
    }
}

export const POST: APIRoute = async ({ request, locals }) => {
    try {
        // Parse request body
        const body = await request.json() as QuoteRequest;

        // Validate request
        const validation = validateQuoteRequest(body);
        if (!validation.valid) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: validation.error
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Get database URL from environment
        const runtime = (locals as any).runtime;
        const databaseUrl = runtime?.env?.DATABASE_URL || import.meta.env.DATABASE_URL;

        if (!databaseUrl) {
            console.error('DATABASE_URL not configured');
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'Database configuration error'
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Store quote in database
        const quoteId = await storeQuote(databaseUrl, body);

        // Send email notification (non-blocking)
        const emailApiKey = runtime?.env?.EMAIL_API_KEY || import.meta.env.EMAIL_API_KEY;
        const businessEmail = runtime?.env?.BUSINESS_EMAIL || import.meta.env.BUSINESS_EMAIL;

        if (emailApiKey && businessEmail) {
            sendEmailNotification(
                { EMAIL_API_KEY: emailApiKey, BUSINESS_EMAIL: businessEmail },
                quoteId,
                body
            ).catch(err => console.error('Email notification failed:', err));
        }

        // Return success response
        return new Response(
            JSON.stringify({
                success: true,
                quoteId
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Quote API error:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: 'Internal server error'
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};
