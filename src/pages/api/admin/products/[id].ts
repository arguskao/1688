/**
 * Admin product detail API endpoint
 * PUT /api/admin/products/:id - Update product
 * DELETE /api/admin/products/:id - Delete product
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { checkAuth, unauthorizedResponse, errorResponse, successResponse, getEnv } from '../../../../lib/apiAuth';
import { getProductById, updateProduct, deleteProduct } from '../../../../lib/productDb';
import { validateProduct } from '../../../../lib/productValidation';
import { uploadImage, deleteImage } from '../../../../lib/imageManagement';

/**
 * PUT - Update product
 */
export const PUT: APIRoute = async ({ request, cookies, params, locals }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return errorResponse('Product ID is required', 400);
    }
    
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
    
    // Check if product exists
    const existingProduct = await getProductById(id, databaseUrl);
    if (!existingProduct) {
      return errorResponse('Product not found', 404);
    }
    
    // Parse multipart form data
    const formData = await request.formData();
    
    // Extract product data
    const productData = {
      name_en: formData.get('name_en') as string,
      sku: formData.get('sku') as string,
      category: formData.get('category') as string,
      description_en: formData.get('description_en') as string,
      description_html: formData.get('description_html') as string || undefined,
      specs_json: JSON.parse(formData.get('specs_json') as string || '{}'),
      image_url: formData.get('image_url') as string || existingProduct.image_url,
    };
    
    // Validate product data
    const validation = validateProduct({ ...productData, product_id: id });
    if (!validation.valid) {
      return errorResponse(validation.errors.join(', '), 400);
    }
    
    // Handle image replacement if new image provided
    const imageFile = formData.get('image') as File | null;
    if (imageFile && r2Bucket) {
      try {
        // Upload new image
        const newImageUrl = await uploadImage(imageFile, id, r2Bucket);
        
        // Delete old image if it exists and is from R2
        if (existingProduct.image_url && existingProduct.image_url.includes('r2.dev')) {
          try {
            await deleteImage(existingProduct.image_url, r2Bucket);
          } catch (error) {
            console.warn('Failed to delete old image:', error);
          }
        }
        
        productData.image_url = newImageUrl;
      } catch (error: any) {
        return errorResponse(`Image upload failed: ${error.message}`, 400);
      }
    }
    
    // Update product in database
    const updatedProduct = await updateProduct(id, productData, databaseUrl);
    
    if (!updatedProduct) {
      return errorResponse('Failed to update product', 500);
    }
    
    return successResponse({
      message: 'Product updated successfully',
      product: updatedProduct
    });
    
  } catch (error: any) {
    console.error('Error updating product:', error);
    
    if (error.message?.includes('duplicate key')) {
      return errorResponse('SKU already exists', 409);
    }
    
    return errorResponse('Failed to update product');
  }
};

/**
 * DELETE - Delete product
 */
export const DELETE: APIRoute = async ({ request, cookies, params, locals }) => {
  try {
    const { id } = params;
    
    if (!id) {
      return errorResponse('Product ID is required', 400);
    }
    
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
    
    // Get product to check if it exists and get image URL
    const product = await getProductById(id, databaseUrl);
    if (!product) {
      return errorResponse('Product not found', 404);
    }
    
    // Delete product from database
    const deleted = await deleteProduct(id, databaseUrl);
    
    if (!deleted) {
      return errorResponse('Failed to delete product', 500);
    }
    
    // Delete image from R2 if it exists
    if (product.image_url && product.image_url.includes('r2.dev') && r2Bucket) {
      try {
        await deleteImage(product.image_url, r2Bucket);
      } catch (error) {
        console.warn('Failed to delete product image:', error);
        // Don't fail the request if image deletion fails
      }
    }
    
    return successResponse({
      message: 'Product deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return errorResponse('Failed to delete product');
  }
};
