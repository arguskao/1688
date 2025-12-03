/**
 * Admin product import API endpoint
 * POST /api/admin/products/import
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth, unauthorizedResponse, errorResponse, successResponse, getEnv } from '../../../../lib/apiAuth';
import { importProductsFromFile, generateSampleCSV, generateSampleJSON } from '../../../../lib/productImport';

// File size limit: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * POST - Import products from CSV or JSON file
 */
export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    // Get environment
    const env = getEnv(locals.runtime);
    const databaseUrl = env.DATABASE_URL;
    
    if (!databaseUrl) {
      return errorResponse('Database not configured', 500);
    }
    
    // Check authentication
    const auth = await checkAuth(cookies, databaseUrl);
    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }
    
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return errorResponse('No file provided', 400);
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(
        `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        400
      );
    }
    
    // Check file type
    const filename = file.name;
    const ext = filename.toLowerCase().split('.').pop();
    
    if (ext !== 'csv' && ext !== 'json') {
      return errorResponse('Invalid file type. Only CSV and JSON files are supported.', 400);
    }
    
    // Read file content
    const content = await file.text();
    
    if (!content || content.trim().length === 0) {
      return errorResponse('File is empty', 400);
    }
    
    // Import products
    const result = await importProductsFromFile(filename, content, databaseUrl);
    
    // Return result
    if (result.success) {
      return successResponse({
        message: 'Import completed successfully',
        result: {
          total: result.total,
          imported: result.imported,
          failed: result.failed,
          summary: result.summary
        }
      });
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Import completed with errors',
          result: {
            total: result.total,
            imported: result.imported,
            failed: result.failed,
            errors: result.errors,
            summary: result.summary
          }
        }),
        {
          status: 207, // Multi-Status
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
  } catch (error: any) {
    console.error('Error importing products:', error);
    return errorResponse(`Import failed: ${error.message}`);
  }
};

/**
 * GET - Download sample template
 */
export const GET: APIRoute = async ({ request, cookies, url, locals }) => {
  try {
    // Get environment
    const env = getEnv(locals.runtime);
    const databaseUrl = env.DATABASE_URL;
    
    if (!databaseUrl) {
      return errorResponse('Database not configured', 500);
    }
    
    // Check authentication
    const auth = await checkAuth(cookies, databaseUrl);
    if (!auth.authenticated) {
      return unauthorizedResponse(auth.error);
    }
    
    // Get format parameter
    const format = url.searchParams.get('format') || 'csv';
    
    if (format === 'csv') {
      const content = generateSampleCSV();
      return new Response(content, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="product-import-template.csv"'
        }
      });
    } else if (format === 'json') {
      const content = generateSampleJSON();
      return new Response(content, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="product-import-template.json"'
        }
      });
    } else {
      return errorResponse('Invalid format. Use "csv" or "json"', 400);
    }
    
  } catch (error: any) {
    console.error('Error generating template:', error);
    return errorResponse('Failed to generate template');
  }
};
