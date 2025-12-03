/**
 * Database initialization script
 * Run this script to initialize the database with all migrations
 * 
 * Usage:
 *   tsx scripts/init-db.ts
 * 
 * Make sure to set DATABASE_URL environment variable first
 */

import { Pool } from '@neondatabase/serverless';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

// Load environment variables from .dev.vars if it exists
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

async function initDatabase() {
  // Load .dev.vars first
  loadDevVars();
  
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('Please set DATABASE_URL in your .dev.vars or .env file');
    process.exit(1);
  }

  console.log('🔄 Connecting to database...');
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Get all migration files
    const migrationsDir = join(process.cwd(), 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql') && file !== '.gitkeep')
      .sort(); // Sort to ensure migrations run in order

    console.log(`📁 Found ${migrationFiles.length} migration file(s)\n`);

    // Execute each migration
    for (const file of migrationFiles) {
      console.log(`🔄 Running migration: ${file}`);
      const migrationPath = join(migrationsDir, file);
      const migrationSQL = readFileSync(migrationPath, 'utf-8');
      
      await pool.query(migrationSQL);
      console.log(`✅ Completed: ${file}\n`);
    }

    console.log('✅ All migrations completed successfully!');
    console.log('\nTables created:');
    console.log('  - quotes');
    console.log('  - quote_items');
    console.log('  - products');
    console.log('  - admin_sessions');
    console.log('\nIndexes created:');
    console.log('  - idx_quotes_created_at');
    console.log('  - idx_quotes_email');
    console.log('  - idx_quotes_status');
    console.log('  - idx_quote_items_quote_id');
    console.log('  - idx_quote_items_product_id');
    console.log('  - idx_products_category');
    console.log('  - idx_products_sku');
    console.log('  - idx_products_created_at');
    console.log('  - idx_sessions_expires_at');

    await pool.end();
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    await pool.end();
    process.exit(1);
  }
}

initDatabase();
