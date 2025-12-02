/**
 * Database type definitions
 */

/**
 * Quote status enum
 */
export type QuoteStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

/**
 * Database row types (matching PostgreSQL schema)
 */
export interface QuoteRow {
  quote_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company_name: string;
  message: string | null;
  created_at: string; // ISO 8601 timestamp from DB
  status: QuoteStatus;
}

export interface QuoteItemRow {
  id: number;
  quote_id: string;
  product_id: string;
  quantity: number;
}

/**
 * Application types (with proper Date objects)
 */
export interface Quote {
  quote_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company_name: string;
  message: string | null;
  created_at: Date;
  status: QuoteStatus;
}

export interface QuoteItem {
  id: number;
  quote_id: string;
  product_id: string;
  quantity: number;
}

/**
 * Quote with items (for detailed views)
 */
export interface QuoteWithItems extends Quote {
  items: QuoteItem[];
}

/**
 * Quote request (for creating new quotes)
 */
export interface QuoteRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  message: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

/**
 * Quote response (API response format)
 */
export interface QuoteResponse {
  success: boolean;
  quoteId?: string;
  error?: string;
}
