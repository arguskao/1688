import type { NeonQueryFunction } from '@neondatabase/serverless';
import type { Quote, QuoteItem, QuoteRequest, QuoteWithItems, QuoteStatus } from '../types/database';

// Re-export types for convenience
export type { Quote, QuoteItem, QuoteRequest, QuoteWithItems, QuoteStatus };

/**
 * Store a new quote with its items in the database
 * @param sql - Neon SQL query function
 * @param request - Quote request data
 * @returns The generated quote_id
 */
export async function storeQuote(
  sql: NeonQueryFunction<false, false>,
  request: QuoteRequest
): Promise<string> {
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
 * Get a quote by ID with its items
 * @param sql - Neon SQL query function
 * @param quoteId - The quote ID to retrieve
 * @returns The quote with its items, or null if not found
 */
export async function getQuoteById(
  sql: NeonQueryFunction<false, false>,
  quoteId: string
): Promise<QuoteWithItems | null> {
  try {
    const quotes = await sql`
      SELECT 
        q.*,
        json_agg(
          json_build_object(
            'id', qi.id,
            'quote_id', qi.quote_id,
            'product_id', qi.product_id,
            'quantity', qi.quantity
          )
        ) as items
      FROM quotes q
      LEFT JOIN quote_items qi ON q.quote_id = qi.quote_id
      WHERE q.quote_id = ${quoteId}
      GROUP BY q.quote_id
    `;

    if (quotes.length === 0) {
      return null;
    }

    const quote = quotes[0] as any;
    return {
      quote_id: quote.quote_id,
      customer_name: quote.customer_name,
      customer_email: quote.customer_email,
      customer_phone: quote.customer_phone,
      company_name: quote.company_name,
      message: quote.message,
      created_at: new Date(quote.created_at),
      status: quote.status,
      items: quote.items || []
    };
  } catch (error) {
    console.error('Failed to get quote:', error);
    throw new Error('Failed to retrieve quote from database');
  }
}

/**
 * Get all quotes with optional filtering
 * @param sql - Neon SQL query function
 * @param status - Optional status filter
 * @returns Array of quotes
 */
export async function getQuotes(
  sql: NeonQueryFunction<false, false>,
  status?: string
): Promise<Quote[]> {
  try {
    let quotes;
    
    if (status) {
      quotes = await sql`
        SELECT * FROM quotes
        WHERE status = ${status}
        ORDER BY created_at DESC
      `;
    } else {
      quotes = await sql`
        SELECT * FROM quotes
        ORDER BY created_at DESC
      `;
    }

    return quotes.map((q: any) => ({
      quote_id: q.quote_id,
      customer_name: q.customer_name,
      customer_email: q.customer_email,
      customer_phone: q.customer_phone,
      company_name: q.company_name,
      message: q.message,
      created_at: new Date(q.created_at),
      status: q.status
    }));
  } catch (error) {
    console.error('Failed to get quotes:', error);
    throw new Error('Failed to retrieve quotes from database');
  }
}

/**
 * Update quote status
 * @param sql - Neon SQL query function
 * @param quoteId - The quote ID to update
 * @param status - New status value
 */
export async function updateQuoteStatus(
  sql: NeonQueryFunction<false, false>,
  quoteId: string,
  status: string
): Promise<void> {
  try {
    await sql`
      UPDATE quotes
      SET status = ${status}
      WHERE quote_id = ${quoteId}
    `;
  } catch (error) {
    console.error('Failed to update quote status:', error);
    throw new Error('Failed to update quote status');
  }
}

/**
 * Delete a quote and its items
 * @param sql - Neon SQL query function
 * @param quoteId - The quote ID to delete
 */
export async function deleteQuote(
  sql: NeonQueryFunction<false, false>,
  quoteId: string
): Promise<void> {
  try {
    // Items will be deleted automatically due to CASCADE
    await sql`
      DELETE FROM quotes
      WHERE quote_id = ${quoteId}
    `;
  } catch (error) {
    console.error('Failed to delete quote:', error);
    throw new Error('Failed to delete quote');
  }
}
