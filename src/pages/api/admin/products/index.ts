/**
 * Admin products API endpoint
 * GET /api/admin/products - List products with pagination
 * POST /api/admin/products - Create new product
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth, getEnv } from '../../../../lib/apiAuth';
import { ApiResponse } from '../../../../lib/apiResponse';
import { getProducts, createProduct } from '../../../../lib/productDb';
import { validateProduct } from '../../../../lib/productValidation';
import { uploadImage } from '../../../../lib/imageManagement';

/**
 * GET - List products with pagination
 */
export const GET: APIRoute = async ({ cookies, url, locals }) => {
  return ApiResponse.withErrorHandling(async () => {
    const env = getEnv(locals.runtime);
    const databaseUrl = env.DATABASE_URL;

    if (!databaseUrl) {
      return ApiResponse.error('Database not configured', 500);
    }

    const auth = await checkAuth(cookies, databaseUrl);
    if (!auth.authenticated) {
      return ApiResponse.unauthorized(auth.error);
    }

    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const category = url.searchParams.get('category') || undefined;
    const offset = (page - 1) * limit;

    const result = await getProducts(databaseUrl, { limit, offset, category });
    const totalPages = Math.ceil(result.total / limit);

    return ApiResponse.success({
      products: result.products,
      pagination: { page, limit, total: result.total, totalPages }
    });
  }, 'GET /api/admin/products');
};

/**
 * POST - Create new product
 */
export const POST: APIRoute = async ({ request, cookies, locals }) => {
  return ApiResponse.withErrorHandling(async () => {
    const env = getEnv(locals.runtime);
    const databaseUrl = env.DATABASE_URL;
    const r2Bucket = env.R2_BUCKET;

    if (!databaseUrl) {
      return ApiResponse.error('Database not configured', 500);
    }

    const auth = await checkAuth(cookies, databaseUrl);
    if (!auth.authenticated) {
      return ApiResponse.unauthorized(auth.error);
    }

    const formData = await request.formData();
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

    const validation = validateProduct(productData);
    if (!validation.valid) {
      return ApiResponse.validationError(validation.errors);
    }

    const imageFile = formData.get('image') as File | null;
    if (imageFile && r2Bucket) {
      const imageUrl = await uploadImage(imageFile, productData.product_id, r2Bucket);
      productData.image_url = imageUrl;
    }

    const newProduct = await createProduct(productData, databaseUrl);
    return ApiResponse.created({ message: 'Product created successfully', product: newProduct });
  }, 'POST /api/admin/products');
};
