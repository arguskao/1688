/**
 * Image management service for R2
 * Handles image upload, deletion, and URL generation
 */

import { generateImageKey, getImageUrl } from './r2';

export interface R2Bucket {
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: any): Promise<void>;
  delete(key: string): Promise<void>;
  get(key: string): Promise<any>;
  list(options?: any): Promise<any>;
}

/**
 * Upload image to R2
 */
export async function uploadImage(
  file: File,
  productId: string,
  r2Bucket: R2Bucket
): Promise<string> {
  // Get file extension
  const extension = file.name.split('.').pop() || 'jpg';
  
  // Generate R2 key
  const key = generateImageKey(productId, extension);
  
  // Convert File to ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  
  // Upload to R2
  await r2Bucket.put(key, arrayBuffer, {
    httpMetadata: {
      contentType: file.type,
    },
  });
  
  // Return public URL
  return getImageUrl(productId, extension);
}

/**
 * Delete image from R2
 */
export async function deleteImage(
  imageUrl: string,
  r2Bucket: R2Bucket
): Promise<void> {
  // Extract key from URL
  const key = extractKeyFromUrl(imageUrl);
  
  if (!key) {
    throw new Error('Invalid image URL');
  }
  
  // Delete from R2
  await r2Bucket.delete(key);
}

/**
 * Delete image by product ID
 */
export async function deleteImageByProductId(
  productId: string,
  r2Bucket: R2Bucket
): Promise<void> {
  // Try common extensions
  const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  
  for (const ext of extensions) {
    const key = generateImageKey(productId, ext);
    try {
      await r2Bucket.delete(key);
    } catch (error) {
      // Ignore errors (image might not exist with this extension)
    }
  }
}

/**
 * Replace image (delete old, upload new)
 */
export async function replaceImage(
  oldImageUrl: string,
  newFile: File,
  productId: string,
  r2Bucket: R2Bucket
): Promise<string> {
  // Delete old image
  try {
    await deleteImage(oldImageUrl, r2Bucket);
  } catch (error) {
    // Ignore error if old image doesn't exist
    console.warn('Failed to delete old image:', error);
  }
  
  // Upload new image
  return await uploadImage(newFile, productId, r2Bucket);
}

/**
 * Check if image exists in R2
 */
export async function imageExists(
  imageUrl: string,
  r2Bucket: R2Bucket
): Promise<boolean> {
  const key = extractKeyFromUrl(imageUrl);
  
  if (!key) {
    return false;
  }
  
  try {
    const object = await r2Bucket.get(key);
    return object !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Get image metadata
 */
export async function getImageMetadata(
  imageUrl: string,
  r2Bucket: R2Bucket
): Promise<{
  size: number;
  contentType: string;
  uploaded: Date;
} | null> {
  const key = extractKeyFromUrl(imageUrl);
  
  if (!key) {
    return null;
  }
  
  try {
    const object = await r2Bucket.get(key);
    
    if (!object) {
      return null;
    }
    
    return {
      size: object.size || 0,
      contentType: object.httpMetadata?.contentType || 'image/jpeg',
      uploaded: object.uploaded || new Date(),
    };
  } catch (error) {
    return null;
  }
}

/**
 * List all product images
 */
export async function listProductImages(
  r2Bucket: R2Bucket,
  options: {
    limit?: number;
    cursor?: string;
  } = {}
): Promise<{
  images: Array<{ key: string; size: number; uploaded: Date }>;
  cursor?: string;
  truncated: boolean;
}> {
  const { limit = 100, cursor } = options;
  
  const result = await r2Bucket.list({
    prefix: 'products/',
    limit,
    cursor,
  });
  
  const images = result.objects.map((obj: any) => ({
    key: obj.key,
    size: obj.size,
    uploaded: obj.uploaded,
  }));
  
  return {
    images,
    cursor: result.cursor,
    truncated: result.truncated,
  };
}

/**
 * Extract R2 key from image URL
 */
function extractKeyFromUrl(imageUrl: string): string | null {
  // Handle API URLs: /api/images/products/prod-001.jpg
  const apiMatch = imageUrl.match(/\/api\/images\/(.+)$/);
  if (apiMatch) {
    return apiMatch[1];
  }
  
  // Handle full URLs: https://domain.com/products/prod-001.jpg
  const fullMatch = imageUrl.match(/\/?(products\/.+)$/);
  if (fullMatch) {
    return fullMatch[1];
  }
  
  return null;
}

/**
 * Generate unique image filename
 */
export function generateUniqueImageKey(productId: string, extension: string): string {
  const timestamp = Date.now();
  const ext = extension.startsWith('.') ? extension.slice(1) : extension;
  return `products/${productId}-${timestamp}.${ext}`;
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file size (max 5MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_SIZE / 1024 / 1024}MB limit`,
    };
  }
  
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${validTypes.join(', ')}`,
    };
  }
  
  // Check file extension
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!validExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed extensions: ${validExtensions.join(', ')}`,
    };
  }
  
  return { valid: true };
}
