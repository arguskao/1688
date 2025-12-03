/**
 * Import products with images array from CSV
 */
import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_LzGQA4kU0OrS@ep-royal-waterfall-a15t3mrk-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function importProducts(csvPath: string) {
  console.log('📖 讀取 CSV...');
  const content = readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  
  // Parse CSV (simple parser for our format)
  const products = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const fields = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current);
    
    if (fields.length >= 8) {
      products.push({
        product_id: fields[0],
        name_en: fields[1],
        sku: fields[2],
        category: fields[3],
        description_en: fields[4],
        specs_json: fields[5],
        image_url: fields[6],
        images: fields[7]
      });
    }
  }
  
  console.log(`✅ 解析了 ${products.length} 個產品\n`);
  
  // Connect to database
  console.log('🔄 連接資料庫...');
  const pool = new Pool({ connectionString: databaseUrl });
  
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  
  for (const product of products) {
    try {
      // Check if exists
      const existing = await pool.query(
        'SELECT product_id FROM products WHERE product_id = $1',
        [product.product_id]
      );
      
      if (existing.rows.length > 0) {
        // Update
        await pool.query(
          `UPDATE products 
           SET name_en = $1, sku = $2, category = $3, description_en = $4,
               specs_json = $5::jsonb, image_url = $6, images = $7::jsonb,
               updated_at = NOW()
           WHERE product_id = $8`,
          [
            product.name_en,
            product.sku,
            product.category,
            product.description_en,
            product.specs_json,
            product.image_url,
            product.images,
            product.product_id
          ]
        );
        console.log(`✏️  更新: ${product.product_id} - ${product.name_en}`);
        updated++;
      } else {
        // Insert
        await pool.query(
          `INSERT INTO products 
           (product_id, name_en, sku, category, description_en, specs_json, image_url, images)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8::jsonb)`,
          [
            product.product_id,
            product.name_en,
            product.sku,
            product.category,
            product.description_en,
            product.specs_json,
            product.image_url,
            product.images
          ]
        );
        console.log(`➕ 新增: ${product.product_id} - ${product.name_en}`);
        inserted++;
      }
    } catch (error: any) {
      console.error(`❌ 錯誤 ${product.product_id}:`, error.message);
      errors++;
    }
  }
  
  await pool.end();
  
  console.log(`\n✅ 匯入完成!`);
  console.log(`   新增: ${inserted}`);
  console.log(`   更新: ${updated}`);
  console.log(`   錯誤: ${errors}`);
}

const csvPath = process.argv[2] || 'products-with-images.csv';
importProducts(csvPath).catch(console.error);
