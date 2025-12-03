/**
 * R2 Image Serving API
 * 
 * Serves product images from R2 bucket with appropriate cache headers
 * URL format: /api/images/products/prod-001.jpg
 */

import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  R2: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { key } = context.params;
    
    if (!key || typeof key !== 'string') {
      return new Response('Invalid image key', { status: 400 });
    }
    
    // Get object from R2
    const object = await context.env.R2.get(key);
    
    if (!object) {
      return new Response('Image not found', { status: 404 });
    }
    
    // Determine content type based on file extension
    const ext = key.split('.').pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
    };
    const contentType = contentTypeMap[ext || ''] || 'application/octet-stream';
    
    // Set cache headers for optimal performance
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('ETag', object.httpEtag);
    
    // Add CORS headers if needed
    headers.set('Access-Control-Allow-Origin', '*');
    
    return new Response(object.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error serving image from R2:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
