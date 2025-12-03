/**
 * Test database connection script
 * Run this to verify your DATABASE_URL is configured correctly
 * 
 * Usage:
 *   tsx scripts/test-db-connection.ts
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, existsSync } from 'fs';
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

async function testConnection() {
  // Load .dev.vars first
  loadDevVars();
  
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('\nPlease set DATABASE_URL in your environment:');
    console.log('  1. Copy .dev.vars.example to .dev.vars');
    console.log('  2. Add your Neon connection string to .dev.vars');
    console.log('  3. Run: source .dev.vars && tsx scripts/test-db-connection.ts');
    process.exit(1);
  }

  console.log('🔄 Testing database connection...');
  console.log(`📍 Database: ${databaseUrl.split('@')[1]?.split('/')[0] || 'unknown'}`);

  try {
    const sql = neon(databaseUrl);
    
    // Test basic query
    const result = await sql`SELECT NOW() as current_time, version() as pg_version`;
    
    console.log('✅ Connection successful!');
    console.log(`\n📊 Database Info:`);
    console.log(`   Time: ${result[0].current_time}`);
    console.log(`   Version: ${result[0].pg_version}`);

    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('quotes', 'quote_items', 'products', 'admin_sessions')
      ORDER BY table_name
    `;

    if (tables.length === 0) {
      console.log('\n⚠️  Tables not found. Run migration:');
      console.log('   pnpm db:init');
    } else {
      console.log('\n✅ Tables found:');
      tables.forEach((t: any) => console.log(`   - ${t.table_name}`));
      
      // Get row counts
      const quoteCount = await sql`SELECT COUNT(*) as count FROM quotes`;
      const itemCount = await sql`SELECT COUNT(*) as count FROM quote_items`;
      const productCount = await sql`SELECT COUNT(*) as count FROM products`;
      const sessionCount = await sql`SELECT COUNT(*) as count FROM admin_sessions`;
      
      console.log('\n📈 Row counts:');
      console.log(`   quotes: ${quoteCount[0].count}`);
      console.log(`   quote_items: ${itemCount[0].count}`);
      console.log(`   products: ${productCount[0].count}`);
      console.log(`   admin_sessions: ${sessionCount[0].count}`);
    }

  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('  1. Check your DATABASE_URL is correct');
    console.log('  2. Ensure your Neon project is active');
    console.log('  3. Verify network connectivity');
    console.log('  4. Check if sslmode=require is in the connection string');
    process.exit(1);
  }
}

testConnection();
