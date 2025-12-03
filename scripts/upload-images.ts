/**
 * Image Upload Utility for Cloudflare R2
 * 
 * This script uploads product images to Cloudflare R2 bucket.
 * Usage: pnpm tsx scripts/upload-images.ts <image-path> <product-id>
 * 
 * Example: pnpm tsx scripts/upload-images.ts ./images/bottle.jpg prod-001
 */

import { readFileSync } from 'fs';
import { basename, extname } from 'path';

interface R2UploadOptions {
  productId: string;
  imagePath: string;
  bucketName?: string;
}

/**
 * Generate R2 object key based on product ID
 * Naming convention: products/{product_id}.{ext}
 */
function generateObjectKey(productId: string, originalPath: string): string {
  const ext = extname(originalPath).toLowerCase();
  return `products/${productId}${ext}`;
}

/**
 * Upload image to R2 bucket
 */
async function uploadImageToR2(options: R2UploadOptions): Promise<string> {
  const { productId, imagePath, bucketName = 'product-images' } = options;
  
  try {
    // Read image file
    const imageBuffer = readFileSync(imagePath);
    const objectKey = generateObjectKey(productId, imagePath);
    
    console.log(`Uploading ${basename(imagePath)} to R2 as ${objectKey}...`);
    
    // Get R2 credentials from environment
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    
    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'Missing R2 credentials. Please set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY'
      );
    }
    
    // Construct R2 endpoint URL
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    const url = `${endpoint}/${bucketName}/${objectKey}`;
    
    // Determine content type
    const ext = extname(imagePath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    // Upload using S3-compatible API
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
      body: imageBuffer,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    // Generate public URL
    const publicUrl = `https://pub-${accountId}.r2.dev/${bucketName}/${objectKey}`;
    
    console.log(`✓ Upload successful!`);
    console.log(`Public URL: ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: pnpm tsx scripts/upload-images.ts <image-path> <product-id>');
    console.error('Example: pnpm tsx scripts/upload-images.ts ./images/bottle.jpg prod-001');
    process.exit(1);
  }
  
  const [imagePath, productId] = args;
  
  try {
    const publicUrl = await uploadImageToR2({ imagePath, productId });
    console.log('\nNext steps:');
    console.log(`1. Update products.json with the new image URL:`);
    console.log(`   "image_url": "${publicUrl}"`);
  } catch (error) {
    console.error('Failed to upload image:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { uploadImageToR2, generateObjectKey };
