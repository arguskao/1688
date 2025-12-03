/**
 * R2 Image URL Utilities
 * 
 * Helper functions for generating and managing R2 image URLs
 */

/**
 * Generate R2 object key for a product image
 * Naming convention: products/{product_id}.{ext}
 */
export function generateImageKey(productId: string, extension: string = 'jpg'): string {
  // Remove leading dot if present
  const ext = extension.startsWith('.') ? extension.slice(1) : extension;
  return `products/${productId}.${ext}`;
}

/**
 * Generate public R2 URL for a product image
 * This uses the API endpoint that serves images with proper cache headers
 */
export function getImageUrl(productId: string, extension: string = 'jpg'): string {
  const key = generateImageKey(productId, extension);
  // Use the API endpoint that serves images from R2
  return `/api/images/${key}`;
}

/**
 * Generate R2 public URL (if using R2 public buckets or custom domain)
 * Replace with your actual R2 public domain
 */
export function getR2PublicUrl(productId: string, extension: string = 'jpg'): string {
  const key = generateImageKey(productId, extension);
  // Replace with your R2 public domain or custom domain
  const R2_PUBLIC_DOMAIN = process.env.PUBLIC_R2_DOMAIN || 'https://images.yourdomain.com';
  return `${R2_PUBLIC_DOMAIN}/${key}`;
}

/**
 * Extract product ID from image URL
 */
export function extractProductIdFromUrl(imageUrl: string): string | null {
  const match = imageUrl.match(/products\/([^.]+)\./);
  return match ? match[1] : null;
}

/**
 * Validate image URL format
 */
export function isValidImageUrl(imageUrl: string): boolean {
  // Check if URL follows the expected pattern
  return /^(https?:\/\/|\/api\/images\/).*products\/[^/]+\.(jpg|jpeg|png|gif|webp|svg)$/i.test(imageUrl);
}
