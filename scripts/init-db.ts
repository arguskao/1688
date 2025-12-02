/**
 * Database initialization script
 * Run this script to initialize the database with the migration
 * 
 * Usage:
 *   tsx scripts/init-db.ts
 * 
 * Make sure to set DATABASE_URL environment variable first
 */

import { Pool } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('Please set DATABASE_URL in your .dev.vars or .env file');
    process.exit(1);
  }

  console.log('🔄 Connecting to database...');
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'migrations', '0001_initial.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('🔄 Running migration...');
    
    // Execute the migration
    await pool.query(migrationSQL);

    console.log('✅ Database initialized successfully!');
    console.log('\nTables created:');
    console.log('  - quotes');
    console.log('  - quote_items');
    console.log('\nIndexes created:');
    console.log('  - idx_quotes_created_at');
    console.log('  - idx_quotes_email');
    console.log('  - idx_quotes_status');
    console.log('  - idx_quote_items_quote_id');
    console.log('  - idx_quote_items_product_id');

    await pool.end();
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    await pool.end();
    process.exit(1);
  }
}

initDatabase();
