/**
 * Generate password hash for admin authentication
 * 
 * Usage:
 *   tsx scripts/generate-password-hash.ts <password>
 * 
 * Example:
 *   tsx scripts/generate-password-hash.ts mySecurePassword123
 */

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

async function main() {
  const password = process.argv[2];

  if (!password) {
    console.error('❌ Please provide a password as an argument');
    console.log('\nUsage:');
    console.log('  tsx scripts/generate-password-hash.ts <password>');
    console.log('\nExample:');
    console.log('  tsx scripts/generate-password-hash.ts mySecurePassword123');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters long');
    process.exit(1);
  }

  console.log('🔐 Generating password hash...\n');

  const hash = await hashPassword(password);

  console.log('✅ Password hash generated successfully!\n');
  console.log('Add this to your .dev.vars or environment variables:');
  console.log('─'.repeat(60));
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log('─'.repeat(60));
  console.log('\nFor production deployment:');
  console.log(`  wrangler pages secret put ADMIN_PASSWORD_HASH --project-name=1688`);
  console.log('  (Then paste the hash when prompted)');
}

main();
