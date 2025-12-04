/**
 * Admin product detail API endpoint
 * PUT /api/admin/products/:id - Update product
 * DELETE /api/admin/products/:id - Delete product
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth, getEnv } from '../../../../lib/apiAuth';
import { ApiResponse } from '../../../../lib/apiResponse';
import { getProductById, updateProduct, deleteProduct } from '../../../../lib/productDb';
import { validateProduct } from '../../../../lib/productValidation';
import { uploadImage, deleteImage } from '../../../../lib/imageManagement';

/**
 * PUT - Update product
 */
export const PUT: APIRoute = async ({ request, cookies, params, locals }) => {
  return ApiResponse.withErrorHandling(async () => {
    const { id } = params;
    if (!id) {
      return ApiResponse.badRequest('Product ID is required');
    }

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

    const existingProduct = await getProductById(id, databaseUrl);
    if (!existingProduct) {
      return ApiResponse.notFound('Product not found');
    }

    const formData = await request.formData();
    const productData = {
      name_en: formData.get('name_en') as string,
      sku: formData.get('sku') as string,
      category: formData.get('category') as string,
      description_en: formData.get('description_en') as string,
      description_html: formData.get('description_html') as string || undefined,
      specs_json: JSON.parse(formData.get('specs_json') as string || '{}'),
      image_url: formData.get('image_url') as string || existingProduct.image_url,
    };

    const validation = validateProduct({ ...productData, product_id: id });
    if (!validation.valid) {
      return ApiResponse.validationError(validation.errors);
    }

    const imageFile = formData.get('image') as File | null;
    if (imageFile && r2Bucket) {
      const newImageUrl = await uploadImage(imageFile, id, r2Bucket);
      if (existingProduct.image_url?.includes('r2.dev')) {
        try { await deleteImage(existingProduct.image_url, r2Bucket); } catch { }
      }
      productData.image_url = newImageUrl;
    }

    const updatedProduct = await updateProduct(id, productData, databaseUrl);
    if (!updatedProduct) {
      return ApiResponse.error('Failed to update product', 500);
    }

    return ApiResponse.success({ message: 'Product updated successfully', product: updatedProduct });
  }, 'PUT /api/admin/products/:id');
};

/**
 * DELETE - Delete product
 */
export const DELETE: APIRoute = async ({ cookies, params, locals }) => {
  return ApiResponse.withErrorHandling(async () => {
    const { id } = params;
    if (!id) {
      return ApiResponse.badRequest('Product ID is required');
    }

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

    const product = await getProductById(id, databaseUrl);
    if (!product) {
      return ApiResponse.notFound('Product not found');
    }

    const deleted = await deleteProduct(id, databaseUrl);
    if (!deleted) {
      return ApiResponse.error('Failed to delete product', 500);
    }

    if (product.image_url?.includes('r2.dev') && r2Bucket) {
      try { await deleteImage(product.image_url, r2Bucket); } catch { }
    }

    return ApiResponse.success({ message: 'Product deleted successfully' });
  }, 'DELETE /api/admin/products/:id');
};
