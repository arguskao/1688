/**
 * Test endpoint to check if products can be fetched from database
 */

import type { PagesFunction } from '@cloudflare/workers-types';
import { getProducts } from '../../src/lib/productDb';

export const onRequest: PagesFunction = async (context) => {
  try {
    const databaseUrl = context.env.DATABASE_URL as string;
    
    if (!databaseUrl) {
      return new Response(
        JSON.stringify({
          error: 'DATABASE_URL not configured',
          env: Object.keys(context.env),
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await getProducts(databaseUrl, { limit: 100 });

    return new Response(
      JSON.stringify({
        success: true,
        count: result.products.length,
        total: result.total,
        products: result.products,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
