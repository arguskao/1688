/**
 * Convert WooCommerce CSV to our format with proper CSV parsing
 */
import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

interface WCProduct {
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

// Read and parse CSV
console.log('🔄 讀取 WooCommerce CSV...');
const content = readFileSync('wc.csv', 'utf-8');

const records = parse(content, {
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  relax_column_count: true,
}) as WCProduct[];

console.log(`📋 找到 ${records.length} 個產品`);

// Convert products
const converted = [];
let skipped = 0;

for (const product of records) {
  // Skip if not published or hidden
  if (product['已發佈'] !== '1' || product['目錄的可見度'] === 'hidden') {
    skipped++;
    continue;
  }
  
  // Skip variations
  if (product['類型'] === 'variation') {
    skipped++;
    continue;
  }
  
  // Get all image URLs
  const imageUrls = product['圖片'] || '';
  const allImages = imageUrls.split(',').map(url => url.trim()).filter(Boolean);
  const firstImage = allImages[0] || '';
  const additionalImages = allImages.slice(1);
  
  // Get HTML description (full description from WooCommerce)
  const descriptionHtml = product['描述'] || '';
  
  // Clean description for plain text version
  let desc = product['簡短描述'] || product['描述'] || '';
  desc = desc.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (desc.length > 500) {
    desc = desc.substring(0, 497) + '...';
  }
  
  // Map category
  const category = product['分類']?.includes('保健') ? 'Health' : 
                   product['分類']?.includes('洗劑') ? 'Beauty' : 
                   'Pet Supplies';
  
  converted.push({
    product_id: product['貨號'],
    name_en: product['名稱'],
    sku: product['貨號'],
    category,
    description_en: desc || 'No description',
    description_html: descriptionHtml,
    specs_json: JSON.stringify({
      type: product['類型'],
      visibility: product['目錄的可見度'],
      tags: product['標籤']?.split(',').map(t => t.trim()).filter(Boolean) || []
    }),
    image_url: firstImage,
    additional_images: additionalImages
  });
}

console.log(`✅ 轉換了 ${converted.length} 個產品 (跳過 ${skipped})`);

// Write output
const outputLines = [
  'product_id,name_en,sku,category,description_en,description_html,specs_json,image_url,additional_images'
];

for (const p of converted) {
  const escape = (s: string) => {
    if (!s) return '';
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  
  const escapeArray = (arr: string[]) => {
    if (!arr || arr.length === 0) return '';
    return escape(JSON.stringify(arr));
  };
  
  outputLines.push([
    escape(p.product_id),
    escape(p.name_en),
    escape(p.sku),
    escape(p.category),
    escape(p.description_en),
    escape(p.description_html),
    escape(p.specs_json),
    escape(p.image_url),
    escapeArray(p.additional_images)
  ].join(','));
}

writeFileSync('products-fixed.csv', outputLines.join('\n'), 'utf-8');
console.log('✅ 輸出到 products-fixed.csv');

// Show sample
console.log('\n📦 範例產品:');
converted.slice(0, 3).forEach(p => {
  console.log(`\n  ${p.name_en}`);
  console.log(`  SKU: ${p.sku}`);
  console.log(`  主圖片: ${p.image_url || '(無)'}`);
  console.log(`  額外圖片: ${p.additional_images.length} 張`);
  console.log(`  描述長度: ${p.description_html.length} 字元`);
});
