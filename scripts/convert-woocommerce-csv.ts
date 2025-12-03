/**
 * Convert WooCommerce product export CSV to our system format
 * 
 * Usage:
 *   tsx scripts/convert-woocommerce-csv.ts <input.csv> <output.csv>
 * 
 * Example:
 *   tsx scripts/convert-woocommerce-csv.ts wc-products.csv products.csv
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface WooCommerceProduct {
  代碼: string;
  類型: string;
  貨號: string;
  名稱: string;
  已發佈: string;
  目錄的可見度: string;
  簡短描述: string;
  描述: string;
  分類: string;
  標籤: string;
  圖片: string;
  [key: string]: string;
}

interface OurProduct {
  product_id: string;
  name_en: string;
  sku: string;
  category: string;
  description_en: string;
  specs_json: string;
  image_url: string;
}

/**
 * Clean HTML tags from text
 */
function stripHtml(html: string): string {
  if (!html) return '';
  
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, ' ');
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
  
  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

/**
 * Extract first image URL from comma-separated list
 */
function extractFirstImage(imageUrls: string): string {
  if (!imageUrls) return '';
  
  const urls = imageUrls.split(',').map(url => url.trim());
  return urls[0] || '';
}

/**
 * Map WooCommerce category to our categories
 */
function mapCategory(wcCategory: string, tags: string): string {
  if (!wcCategory && !tags) return 'Pet Supplies';
  
  const categoryMap: Record<string, string> = {
    '保健食品': 'Health',
    '外用洗劑': 'Beauty',
    '優惠組合': 'Pet Supplies',
    '試用品': 'Pet Supplies',
    '周邊商品': 'Office Supplies',
    '飼主用': 'Health',
  };
  
  // Check tags for more specific categorization
  if (tags) {
    if (tags.includes('過敏')) return 'Health';
    if (tags.includes('關節保健')) return 'Health';
    if (tags.includes('葉黃素')) return 'Health';
  }
  
  // Split by comma and get first category
  const firstCategory = wcCategory.split(',')[0].trim();
  
  return categoryMap[firstCategory] || 'Pet Supplies';
}

/**
 * Generate specs JSON from WooCommerce data
 */
function generateSpecs(product: WooCommerceProduct): string {
  const specs: Record<string, any> = {};
  
  // Add tags if available
  if (product['標籤']) {
    specs.tags = product['標籤'].split(',').map(t => t.trim());
  }
  
  // Add product type
  if (product['類型']) {
    specs.type = product['類型'];
  }
  
  // Add visibility
  if (product['目錄的可見度']) {
    specs.visibility = product['目錄的可見度'];
  }
  
  return JSON.stringify(specs);
}

/**
 * Parse CSV line (handles quoted fields with commas)
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current);
  
  return result;
}

/**
 * Convert WooCommerce CSV to our format
 */
function convertCsv(inputPath: string, outputPath: string): void {
  console.log('🔄 Reading WooCommerce CSV...');
  
  const content = readFileSync(inputPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    console.error('❌ Empty CSV file');
    process.exit(1);
  }
  
  // Parse header
  const headerFields = parseCsvLine(lines[0]);
  console.log(`📋 Found ${headerFields.length} columns`);
  
  // Parse products
  const products: OurProduct[] = [];
  let skipped = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    
    // Create object from fields
    const wcProduct: WooCommerceProduct = {} as any;
    headerFields.forEach((header, index) => {
      wcProduct[header] = fields[index] || '';
    });
    
    // Skip if not published or not visible
    if (wcProduct['已發佈'] !== '1' || wcProduct['目錄的可見度'] === 'hidden') {
      skipped++;
      continue;
    }
    
    // Skip variations (we only want parent products)
    if (wcProduct['類型'] === 'variation') {
      skipped++;
      continue;
    }
    
    // Get description (prefer short description, fallback to full description)
    let description = wcProduct['簡短描述'] || wcProduct['描述'] || '';
    description = stripHtml(description);
    
    // Limit description length
    if (description.length > 500) {
      description = description.substring(0, 497) + '...';
    }
    
    // Convert to our format
    const product: OurProduct = {
      product_id: wcProduct['貨號'] || `prod-${i}`,
      name_en: stripHtml(wcProduct['名稱']),
      sku: wcProduct['貨號'] || `SKU-${i}`,
      category: mapCategory(wcProduct['分類'], wcProduct['標籤']),
      description_en: description || 'No description available',
      specs_json: generateSpecs(wcProduct),
      image_url: extractFirstImage(wcProduct['圖片']),
    };
    
    // Skip if no name
    if (!product.name_en) {
      skipped++;
      continue;
    }
    
    products.push(product);
  }
  
  console.log(`✅ Converted ${products.length} products (skipped ${skipped})`);
  
  // Write output CSV
  console.log('💾 Writing output CSV...');
  
  const outputLines: string[] = [];
  
  // Header
  outputLines.push('product_id,name_en,sku,category,description_en,specs_json,image_url');
  
  // Products
  for (const product of products) {
    const line = [
      escapeCsvField(product.product_id),
      escapeCsvField(product.name_en),
      escapeCsvField(product.sku),
      escapeCsvField(product.category),
      escapeCsvField(product.description_en),
      escapeCsvField(product.specs_json),
      escapeCsvField(product.image_url),
    ].join(',');
    
    outputLines.push(line);
  }
  
  writeFileSync(outputPath, outputLines.join('\n'), 'utf-8');
  
  console.log(`✅ Output written to: ${outputPath}`);
  console.log('\n📊 Summary:');
  console.log(`   Total products: ${products.length}`);
  console.log(`   Skipped: ${skipped}`);
  
  // Show category distribution
  const categoryCount: Record<string, number> = {};
  products.forEach(p => {
    categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
  });
  
  console.log('\n📦 Categories:');
  Object.entries(categoryCount).forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count}`);
  });
}

/**
 * Escape CSV field (add quotes if needed)
 */
function escapeCsvField(field: string): string {
  if (!field) return '';
  
  // If field contains comma, quote, or newline, wrap in quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    // Escape quotes by doubling them
    const escaped = field.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  
  return field;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('❌ Usage: tsx scripts/convert-woocommerce-csv.ts <input.csv> <output.csv>');
    console.log('\nExample:');
    console.log('  tsx scripts/convert-woocommerce-csv.ts wc-products.csv products.csv');
    process.exit(1);
  }
  
  const inputPath = args[0];
  const outputPath = args[1];
  
  try {
    convertCsv(inputPath, outputPath);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
