/**
 * Sitemap Generator
 * Generates XML sitemap for SEO
 */

import type { APIRoute } from 'astro';
import { getAllProducts } from '../lib/products';

const SITE_URL = 'https://yourdomain.com'; // TODO: Replace with your actual domain

export const GET: APIRoute = async ({ locals }) => {
  const products = await getAllProducts(locals.runtime);
  
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Static pages
  const staticPages = [
    { url: '', changefreq: 'daily', priority: 1.0, lastmod: currentDate },
    { url: '/products', changefreq: 'daily', priority: 0.9, lastmod: currentDate },
    { url: '/quote-list', changefreq: 'weekly', priority: 0.8, lastmod: currentDate },
    { url: '/quote-submit', changefreq: 'weekly', priority: 0.8, lastmod: currentDate },
  ];
  
  // Product pages
  const productPages = products.map(product => ({
    url: `/products/${product.product_id}`,
    changefreq: 'weekly',
    priority: 0.7,
    lastmod: currentDate
  }));
  
  // Combine all pages
  const allPages = [...staticPages, ...productPages];
  
  // Generate XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  });
};
