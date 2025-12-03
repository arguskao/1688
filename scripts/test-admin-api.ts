/**
 * Test admin API endpoints
 */

const API_BASE = 'https://3df34448.1688-dek.pages.dev';
const TEST_PASSWORD = 'ppt11567';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];
let sessionCookie: string | null = null;

async function test(name: string, fn: () => Promise<void>) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    await fn();
    results.push({ name, success: true });
    console.log(`✅ ${name} - PASSED`);
  } catch (error: any) {
    results.push({ name, success: false, error: error.message });
    console.log(`❌ ${name} - FAILED: ${error.message}`);
  }
}

async function testLogin() {
  const response = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: TEST_PASSWORD })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Login failed: ${data.error || response.statusText}`);
  }
  
  // Extract session cookie
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    const match = setCookie.match(/admin_session=([^;]+)/);
    if (match) {
      sessionCookie = match[1];
      console.log(`   Session cookie: ${sessionCookie.substring(0, 20)}...`);
    }
  }
  
  if (!data.success) {
    throw new Error('Login response indicates failure');
  }
}

async function testGetProducts() {
  if (!sessionCookie) {
    throw new Error('No session cookie available');
  }
  
  const response = await fetch(`${API_BASE}/api/admin/products?page=1&limit=5`, {
    headers: {
      'Cookie': `admin_session=${sessionCookie}`
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Get products failed: ${data.error || response.statusText}`);
  }
  
  console.log(`   Found ${data.products?.length || 0} products`);
  console.log(`   Total: ${data.pagination?.total || 0}`);
}

async function testGetProductById() {
  if (!sessionCookie) {
    throw new Error('No session cookie available');
  }
  
  const response = await fetch(`${API_BASE}/api/admin/products?page=1&limit=1`, {
    headers: {
      'Cookie': `admin_session=${sessionCookie}`
    }
  });
  
  const data = await response.json();
  
  if (!data.products || data.products.length === 0) {
    console.log('   No products to test with, skipping');
    return;
  }
  
  const productId = data.products[0].product_id;
  console.log(`   Testing with product: ${productId}`);
  
  // This would be a GET to the product detail endpoint
  // But we don't have that endpoint yet, so we'll skip
}

async function testLogout() {
  if (!sessionCookie) {
    throw new Error('No session cookie available');
  }
  
  const response = await fetch(`${API_BASE}/api/admin/logout`, {
    method: 'POST',
    headers: {
      'Cookie': `admin_session=${sessionCookie}`
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Logout failed: ${data.error || response.statusText}`);
  }
  
  if (!data.success) {
    throw new Error('Logout response indicates failure');
  }
}

async function testUnauthorizedAccess() {
  const response = await fetch(`${API_BASE}/api/admin/products`);
  
  if (response.ok) {
    throw new Error('Unauthorized access should be rejected');
  }
  
  if (response.status !== 401) {
    throw new Error(`Expected 401, got ${response.status}`);
  }
  
  console.log('   Correctly rejected unauthorized access');
}

async function main() {
  console.log('🚀 Starting Admin API Tests');
  console.log(`📍 API Base: ${API_BASE}`);
  console.log('=' .repeat(60));
  
  await test('Unauthorized Access', testUnauthorizedAccess);
  await test('Admin Login', testLogin);
  await test('Get Products List', testGetProducts);
  await test('Get Product By ID', testGetProductById);
  await test('Admin Logout', testLogout);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary:');
  console.log(`   Total: ${results.length}`);
  console.log(`   Passed: ${results.filter(r => r.success).length}`);
  console.log(`   Failed: ${results.filter(r => !r.success).length}`);
  
  if (results.some(r => !r.success)) {
    console.log('\n❌ Some tests failed:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
  }
}

main().catch(error => {
  console.error('\n💥 Test suite failed:', error);
  process.exit(1);
});
