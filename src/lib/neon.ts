import { neon } from '@neondatabase/serverless';

/**
 * Create a Neon database connection
 * @param databaseUrl - The Neon database connection string
 * @returns A SQL query function
 */
export function createNeonClient(databaseUrl: string) {
  return neon(databaseUrl);
}

/**
 * Get database connection from Astro locals (for use in API routes)
 */
export function getDbFromLocals(locals: App.Locals) {
  const databaseUrl = locals.runtime?.env?.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }
  
  return createNeonClient(databaseUrl);
}
