/**
 * Product import functionality
 * Supports CSV and JSON formats
 */
import { parse } from 'csv-parse/sync';
import { validateProduct } from './productValidation';
import { createProduct } from './productDb';
import type { Product } from '../types/product';

export interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  failed: number;
  errors: ImportError[];
  summary: string;
}

export interface ImportError {
  row: number;
  productId?: string;
  errors: string[];
}

/**
 * Parse CSV file content
 */
export function parseCSV(content: string): any[] {
  try {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
    });
    return records;
  } catch (error: any) {
    throw new Error(`CSV parsing failed: ${error.message}`);
  }
}

/**
 * Parse JSON file content
 */
export function parseJSON(content: string): any[] {
  try {
    const data = JSON.parse(content);
    
    // Support both array and object with products array
    if (Array.isArray(data)) {
      return data;
    } else if (data.products && Array.isArray(data.products)) {
      return data.products;
    } else {
      throw new Error('JSON must be an array or object with "products" array');
    }
  } catch (error: any) {
    throw new Error(`JSON parsing failed: ${error.message}`);
  }
}

/**
 * Validate import file format
 */
export function validateImportFile(filename: string, content: string): {
  valid: boolean;
  format?: 'csv' | 'json';
  error?: string;
} {
  const ext = filename.toLowerCase().split('.').pop();
  
  if (ext === 'csv') {
    try {
      parseCSV(content);
      return { valid: true, format: 'csv' };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  } else if (ext === 'json') {
    try {
      parseJSON(content);
      return { valid: true, format: 'json' };
    } catch (error: any) {
      return { valid: false, error: error.message };
    }
  } else {
    return { valid: false, error: 'Unsupported file format. Only CSV and JSON are supported.' };
  }
}

/**
 * Transform raw import data to Product format
 */
function transformImportData(data: any): Omit<Product, 'created_at' | 'updated_at'> {
  return {
    product_id: data.product_id || data.id || '',
    name_en: data.name_en || data.name || '',
    sku: data.sku || '',
    category: data.category || '',
    description_en: data.description_en || data.description || '',
    description_html: data.description_html,
    specs_json: typeof data.specs_json === 'string' 
      ? JSON.parse(data.specs_json) 
      : (data.specs_json || {}),
    image_url: data.image_url || data.image || '',
    images: data.images || []
  };
}

/**
 * Import products from parsed data
 */
export async function importProducts(
  records: any[],
  databaseUrl: string
): Promise<ImportResult> {
  const errors: ImportError[] = [];
  let imported = 0;
  let failed = 0;
  
  for (let i = 0; i < records.length; i++) {
    const row = i + 1;
    const record = records[i];
    
    try {
      // Transform data
      const productData = transformImportData(record);
      
      // Validate product
      const validation = validateProduct(productData);
      if (!validation.valid) {
        errors.push({
          row,
          productId: productData.product_id,
          errors: validation.errors.map(e => `${e.field}: ${e.message}`)
        });
        failed++;
        continue;
      }
      
      // Create product in database
      await createProduct(productData, databaseUrl);
      imported++;
      
    } catch (error: any) {
      errors.push({
        row,
        productId: record.product_id || record.id,
        errors: [error.message]
      });
      failed++;
    }
  }
  
  const total = records.length;
  const summary = `Imported ${imported} of ${total} products. ${failed} failed.`;
  
  return {
    success: failed === 0,
    total,
    imported,
    failed,
    errors,
    summary
  };
}

/**
 * Import products from file content
 */
export async function importProductsFromFile(
  filename: string,
  content: string,
  databaseUrl: string
): Promise<ImportResult> {
  // Validate file format
  const validation = validateImportFile(filename, content);
  if (!validation.valid) {
    return {
      success: false,
      total: 0,
      imported: 0,
      failed: 0,
      errors: [{ row: 0, errors: [validation.error || 'Invalid file format'] }],
      summary: validation.error || 'Invalid file format'
    };
  }
  
  // Parse file
  let records: any[];
  try {
    if (validation.format === 'csv') {
      records = parseCSV(content);
    } else {
      records = parseJSON(content);
    }
  } catch (error: any) {
    return {
      success: false,
      total: 0,
      imported: 0,
      failed: 0,
      errors: [{ row: 0, errors: [error.message] }],
      summary: `Failed to parse file: ${error.message}`
    };
  }
  
  // Import products
  return await importProducts(records, databaseUrl);
}

/**
 * Generate sample CSV template
 */
export function generateSampleCSV(): string {
  const headers = [
    'product_id',
    'name_en',
    'sku',
    'category',
    'description_en',
    'specs_json',
    'image_url'
  ];
  
  const sampleRow = [
    'PROD001',
    'Sample Product',
    'SKU001',
    'Health',
    'This is a sample product description',
    '{"type":"simple","tags":["sample"]}',
    'https://example.com/image.jpg'
  ];
  
  return [
    headers.join(','),
    sampleRow.map(field => `"${field}"`).join(',')
  ].join('\n');
}

/**
 * Generate sample JSON template
 */
export function generateSampleJSON(): string {
  const sample = {
    products: [
      {
        product_id: 'PROD001',
        name_en: 'Sample Product',
        sku: 'SKU001',
        category: 'Health',
        description_en: 'This is a sample product description',
        specs_json: {
          type: 'simple',
          tags: ['sample']
        },
        image_url: 'https://example.com/image.jpg'
      }
    ]
  };
  
  return JSON.stringify(sample, null, 2);
}
