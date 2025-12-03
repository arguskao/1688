/**
 * Quote API endpoint
 * Handles quote submission requests with rate limiting
 */

import type { PagesFunction } from '@cloudflare/workers-types';
import { neon } from '@neondatabase/serverless';
import { validateQuoteForm } from '../../src/lib/validation';
import { validateProductIds } from '../../src/lib/products';
import { withRateLimit } from '../../src/lib/rateLimit';

interface Env {
  DATABASE_URL: string;
  EMAIL_API_KEY: string;
  BUSINESS_EMAIL: string;
  RATE_LIMIT_PER_MINUTE?: string;
}

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

  // Validate product IDs
  const productIds = request.items.map(item => item.productId);
  const productValidation = validateProductIds(productIds);
  
  if (!productValidation.valid) {
    return {
      valid: false,
      error: `無效的產品 ID: ${productValidation.invalidIds.join(', ')}`
    };
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
  env: Env,
  quoteId: string,
  request: QuoteRequest
): Promise<void> {
  // Import email service
  const { sendEmailNotification: sendEmail } = await import('../../src/lib/email');
  
  await sendEmail(
    {
      EMAIL_API_KEY: env.EMAIL_API_KEY,
      BUSINESS_EMAIL: env.BUSINESS_EMAIL
    },
    quoteId,
    request
  );
}

/**
 * POST /api/quote
 * Handle quote submission (without rate limiting)
 */
const handleQuoteSubmission: PagesFunction<Env> = async (context) => {
  try {
    // Parse request body
    const request = await context.request.json() as QuoteRequest;

    // Validate request
    const validation = validateQuoteRequest(request);
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
    const databaseUrl = context.env.DATABASE_URL;
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
    const quoteId = await storeQuote(databaseUrl, request);

    // Send email notification (non-blocking)
    sendEmailNotification(context.env, quoteId, request)
      .catch(err => console.error('Email notification failed:', err));

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

/**
 * POST /api/quote
 * Handle quote submission with rate limiting
 * Default: 10 requests per minute per IP
 */
export const onRequestPost: PagesFunction<Env> = withRateLimit(
  handleQuoteSubmission,
  {
    maxRequests: 10,
    windowMs: 60000 // 1 minute
  }
);
