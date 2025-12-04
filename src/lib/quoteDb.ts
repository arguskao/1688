/**
 * Quote database operations
 */
import { neon } from '@neondatabase/serverless';

export interface Quote {
    quote_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    company_name: string;
    customer_tax_id?: string;
    project_name?: string;
    project_address?: string;
    message: string;
    created_at: string;
    replied_at?: string;
    status: 'pending' | 'replied' | 'closed';
    admin_notes?: string;
}

export interface QuoteItem {
    id: number;
    quote_id: string;
    product_id: string;
    quantity: number;
    unit?: string;
    unit_price?: number;
    notes?: string;
    product_name?: string;
    sku?: string;
}

export interface QuoteWithItems extends Quote {
    items: QuoteItem[];
}

/**
 * Get all quotes with pagination
 */
export async function getQuotes(
    databaseUrl: string,
    options: { limit?: number; offset?: number; status?: string } = {}
): Promise<{ quotes: Quote[]; total: number }> {
    const sql = neon(databaseUrl);
    const { limit = 20, offset = 0, status } = options;

    let quotes: Quote[];
    let countResult: Array<{ count: string }>;

    if (status) {
        quotes = await sql`
      SELECT * FROM quotes 
      WHERE status = ${status}
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    ` as Quote[];
        countResult = await sql`SELECT COUNT(*) as count FROM quotes WHERE status = ${status}` as Array<{ count: string }>;
    } else {
        quotes = await sql`
      SELECT * FROM quotes 
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    ` as Quote[];
        countResult = await sql`SELECT COUNT(*) as count FROM quotes` as Array<{ count: string }>;
    }

    return {
        quotes,
        total: parseInt(countResult[0]?.count || '0', 10)
    };
}

/**
 * Get a single quote by ID with items
 */
export async function getQuoteById(
    quoteId: string,
    databaseUrl: string
): Promise<QuoteWithItems | null> {
    const sql = neon(databaseUrl);

    const quotes = await sql`
    SELECT * FROM quotes WHERE quote_id = ${quoteId}
  `;

    if (quotes.length === 0) {
        return null;
    }

    const quote = quotes[0] as Quote;

    // Get quote items with product info
    const items = await sql`
    SELECT qi.*, p.name_en as product_name, p.sku
    FROM quote_items qi
    LEFT JOIN products p ON qi.product_id = p.product_id
    WHERE qi.quote_id = ${quoteId}
  `;

    return {
        ...quote,
        items: items as QuoteItem[]
    };
}

/**
 * Update quote status
 */
export async function updateQuoteStatus(
    quoteId: string,
    status: 'pending' | 'replied' | 'closed',
    databaseUrl: string
): Promise<Quote | null> {
    const sql = neon(databaseUrl);

    const result = await sql`
    UPDATE quotes 
    SET status = ${status}
    WHERE quote_id = ${quoteId}
    RETURNING *
  `;

    return result.length > 0 ? (result[0] as Quote) : null;
}

/**
 * Delete a quote and its items
 */
export async function deleteQuote(
    quoteId: string,
    databaseUrl: string
): Promise<boolean> {
    const sql = neon(databaseUrl);

    // Delete items first (foreign key constraint)
    await sql`DELETE FROM quote_items WHERE quote_id = ${quoteId}`;

    const result = await sql`
    DELETE FROM quotes WHERE quote_id = ${quoteId} RETURNING quote_id
  `;

    return result.length > 0;
}

/**
 * Get quote statistics
 */
export async function getQuoteStats(databaseUrl: string): Promise<{
    total: number;
    pending: number;
    replied: number;
    closed: number;
}> {
    const sql = neon(databaseUrl);

    const stats = await sql`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'replied') as replied,
      COUNT(*) FILTER (WHERE status = 'closed') as closed
    FROM quotes
  `;

    return {
        total: parseInt(stats[0]?.total || '0', 10),
        pending: parseInt(stats[0]?.pending || '0', 10),
        replied: parseInt(stats[0]?.replied || '0', 10),
        closed: parseInt(stats[0]?.closed || '0', 10)
    };
}


/**
 * Update quote item prices
 */
export async function updateQuoteItemPrices(
    quoteId: string,
    items: Array<{ id: number; unit_price: number; notes?: string }>,
    adminNotes: string | undefined,
    databaseUrl: string
): Promise<boolean> {
    const sql = neon(databaseUrl);

    try {
        // Update each item's price
        for (const item of items) {
            await sql`
                UPDATE quote_items 
                SET unit_price = ${item.unit_price}, notes = ${item.notes || null}
                WHERE id = ${item.id} AND quote_id = ${quoteId}
            `;
        }

        // Update quote status and replied_at
        await sql`
            UPDATE quotes 
            SET status = 'replied', 
                replied_at = NOW(),
                admin_notes = ${adminNotes || null}
            WHERE quote_id = ${quoteId}
        `;

        return true;
    } catch (error) {
        console.error('Failed to update quote prices:', error);
        return false;
    }
}

/**
 * Send quote response email to customer
 */
export async function getQuoteForEmail(
    quoteId: string,
    databaseUrl: string
): Promise<QuoteWithItems | null> {
    const sql = neon(databaseUrl);

    const quotes = await sql`
        SELECT * FROM quotes WHERE quote_id = ${quoteId}
    `;

    if (quotes.length === 0) return null;

    const quote = quotes[0] as Quote;

    const items = await sql`
        SELECT qi.*, p.name_en as product_name, p.sku
        FROM quote_items qi
        LEFT JOIN products p ON qi.product_id = p.product_id
        WHERE qi.quote_id = ${quoteId}
    `;

    return {
        ...quote,
        items: items as QuoteItem[]
    };
}
