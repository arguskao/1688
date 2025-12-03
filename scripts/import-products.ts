/**
 * Import products from CSV to database
 * 
 * Usage:
 *   tsx scripts/import-products.ts <products.csv>
 * 
 * Example:
 *   tsx scripts/import-products.ts products-converted.csv
 */

import { Pool } from '@neondatabase/serverless';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface Product {
  product_id: string;
  name_en: string;
  sku: string;
  category: string;
  description_en: string;
  specs_json: string;
  image_url: string;
}

// Load environment variables from .dev.vars
function loadDevVars() {
  const devVarsPath = join(process.cwd(), '.dev.vars');
  if (existsSync(devVarsPath)) {
    const content = readFileSync(devVarsPath, 'utf-8');
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          process.env[key.trim()] = value.trim();
        }
      }
    });
  }
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
 * Import products from CSV
 */
async function importProducts(csvPath: string): Promise<void> {
  // Load environment variables
  loadDevVars();
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  console.log('📖 Reading CSV file...');
  
  const content = readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    console.error('❌ Empty CSV file');
    process.exit(1);
  }
  
  // Parse header
  const header = parseCsvLine(lines[0]);
  console.log(`📋 Columns: ${header.join(', ')}`);
  
  // Parse products
  const products: Product[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    
    // Parse additional_images if present (it's a JSON array string)
    let additionalImages: string[] = [];
    if (fields[8]) {
      try {
        additionalImages = JSON.parse(fields[8]);
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    const product: Product = {
      product_id: fields[0] || '',
      name_en: fields[1] || '',
      sku: fields[2] || '',
      category: fields[3] || '',
      description_en: fields[4] || '',
      description_html: fields[5] || '',
      specs_json: fields[6] || '{}',
      image_url: fields[7] || '',
      additional_images: additionalImages,
    };
    
    // Skip if no product_id or name
    if (!product.product_id || !product.name_en) {
      console.log(`⚠️  Skipping row ${i + 1}: missing product_id or name`);
      continue;
    }
    
    products.push(product);
  }
  
  console.log(`✅ Parsed ${products.length} products\n`);
  
  // Connect to database
  console.log('🔄 Connecting to database...');
  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    
    for (const product of products) {
      try {
        // Check if product exists
        const existing = await pool.query(
          'SELECT product_id FROM products WHERE product_id = $1',
          [product.product_id]
        );
        
        if (existing.rows.length > 0) {
          // Update existing product
          await pool.query(
            `UPDATE products 
             SET name_en = $1, sku = $2, category = $3, description_en = $4, 
                 description_html = $5, specs_json = $6, image_url = $7, 
                 additional_images = $8, updated_at = NOW()
             WHERE product_id = $9`,
            [
              product.name_en,
              product.sku,
              product.category,
              product.description_en,
              product.description_html,
              product.specs_json,
              product.image_url,
              product.additional_images,
              product.product_id,
            ]
          );
          updated++;
          console.log(`✏️  Updated: ${product.product_id} - ${product.name_en}`);
        } else {
          // Insert new product
          await pool.query(
            `INSERT INTO products 
             (product_id, name_en, sku, category, description_en, description_html, 
              specs_json, image_url, additional_images)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              product.product_id,
              product.name_en,
              product.sku,
              product.category,
              product.description_en,
              product.description_html,
              product.specs_json,
              product.image_url,
              product.additional_images,
            ]
          );
          inserted++;
          console.log(`➕ Inserted: ${product.product_id} - ${product.name_en}`);
        }
      } catch (error: any) {
        errors++;
        console.error(`❌ Error with ${product.product_id}: ${error.message}`);
      }
    }
    
    console.log('\n✅ Import complete!');
    console.log(`   Inserted: ${inserted}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Errors: ${errors}`);
    
    await pool.end();
  } catch (error: any) {
    console.error('❌ Database error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('❌ Usage: tsx scripts/import-products.ts <products.csv>');
    console.log('\nExample:');
    console.log('  tsx scripts/import-products.ts products-converted.csv');
    process.exit(1);
  }
  
  const csvPath = args[0];
  
  if (!existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`);
    process.exit(1);
  }
  
  try {
    await importProducts(csvPath);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
