/**
 * Admin products API endpoint
 * GET /api/admin/products - List products with pagination
 * POST /api/admin/products - Create new product
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth, unauthorizedResponse, errorResponse, successResponse, getEnv } from '../../../../lib/apiAuth';
import { getProducts, createProduct } from '../../../../lib/productDb';
import { validateProduct } from '../../../../lib/productValidation';
import { uploadImage } from '../../../../lib/imageManagement';

/**
 * GET - List products with pagination
 */
export const GET: APIRoute = async ({ cookies, url, locals }) => {
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

    // Get pagination parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const category = url.searchParams.get('category') || undefined;

    // Calculate offset
    const offset = (page - 1) * limit;

    // Fetch products
    const result = await getProducts(databaseUrl, {
      limit,
      offset,
      category
    });

    // Calculate total pages
    const totalPages = Math.ceil(result.total / limit);

    return successResponse({
      products: result.products,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages
      }
    });

  } catch (error: any) {
    console.error('Error fetching products:', error);
    return errorResponse('Failed to fetch products');
  }
};

/**
 * POST - Create new product
 */
export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    // Get environment
    const env = getEnv(locals.runtime);
    const databaseUrl = env.DATABASE_URL;
    const r2Bucket = env.R2_BUCKET;

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

    // Extract product data
    const productData = {
      product_id: formData.get('product_id') as string,
      name_en: formData.get('name_en') as string,
      sku: formData.get('sku') as string,
      category: formData.get('category') as string,
      description_en: formData.get('description_en') as string,
      description_html: formData.get('description_html') as string || undefined,
      specs_json: JSON.parse(formData.get('specs_json') as string || '{}'),
      image_url: formData.get('image_url') as string || '',
    };

    // Validate product data
    const validation = validateProduct(productData);
    if (!validation.valid) {
      const errorMessages = validation.errors.map(e => e.message).join(', ');
      return errorResponse(errorMessages, 400);
    }

    // Handle image upload if provided
    const imageFile = formData.get('image') as File | null;
    if (imageFile && r2Bucket) {
      try {
        const imageUrl = await uploadImage(imageFile, productData.product_id, r2Bucket);
        productData.image_url = imageUrl;
      } catch (error: any) {
        return errorResponse(`Image upload failed: ${error.message}`, 400);
      }
    }

    // Create product in database
    const newProduct = await createProduct(productData, databaseUrl);

    return successResponse({
      message: 'Product created successfully',
      product: newProduct
    }, 201);

  } catch (error: any) {
    console.error('Error creating product:', error);

    if (error.message?.includes('duplicate key')) {
      return errorResponse('Product ID or SKU already exists', 409);
    }

    return errorResponse('Failed to create product');
  }
};
