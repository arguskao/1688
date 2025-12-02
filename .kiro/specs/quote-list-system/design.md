# Design Document

## Overview

詢價清單系統採用現代化的 Jamstack 架構，結合 Astro 的靜態優先策略和 Cloudflare 的邊緣運算能力。系統分為三個主要層次：

1. **靜態內容層**：使用 Astro SSG 生成產品頁面，部署到 Cloudflare Pages
2. **互動層**：使用 Astro Islands 實現客戶端互動功能（詢價清單管理）
3. **API 層**：使用 Cloudflare Functions 處理詢價提交和郵件通知

這種架構確保了優秀的 SEO、快速的頁面載入速度，以及低成本的運營。

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│  ┌────────────────┐  ┌──────────────────────────────────┐  │
│  │ Static Pages   │  │  Astro Islands (React/Vue)       │  │
│  │ (Product List) │  │  - Add to Quote List Button      │  │
│  │                │  │  - Quote List Management         │  │
│  │                │  │  - Quote Submission Form         │  │
│  └────────────────┘  └──────────────────────────────────┘  │
│           │                        │                         │
│           │                        │ Local Storage           │
│           │                        ↓                         │
│           │           ┌─────────────────────────┐           │
│           │           │   Browser Storage       │           │
│           │           │   (Quote List Data)     │           │
│           │           └─────────────────────────┘           │
└───────────┼────────────────────────┼───────────────────────┘
            │                        │
            ↓                        ↓
┌───────────────────────────────────────────────────────────┐
│                    Cloudflare Network                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              Cloudflare Pages                         │ │
│  │  - Static HTML/CSS/JS                                 │ │
│  │  - Product Pages (SSG)                                │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │           Cloudflare Functions (Workers)              │ │
│  │                                                        │ │
│  │  POST /api/quote                                      │ │
│  │  ├─ Validate Request                                  │ │
│  │  ├─ Store to Database                                 │ │
│  │  └─ Send Email Notification                           │ │
│  └──────────────────────────────────────────────────────┘ │
│                          │                                  │
└──────────────────────────┼─────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            │                             │
            ↓                             ↓
┌─────────────────────┐      ┌──────────────────────┐
│  Serverless DB      │      │   Email Service      │
│  (D1/Neon/          │      │   (SendGrid/         │
│   PlanetScale)      │      │    Mailgun/Resend)   │
│                     │      │                      │
│  - Quotes Table     │      │  - Send Notification │
│  - QuoteItems Table │      │  - Email Templates   │
└─────────────────────┘      └──────────────────────┘
            │
            ↓
┌─────────────────────┐
│  Cloudflare R2      │
│  (Image Storage)    │
│                     │
│  - Product Images   │
│  - Organized by ID  │
└─────────────────────┘
```

### Technology Stack

- **Frontend Framework**: Astro 4.x with Cloudflare Adapter
- **Interactive Components**: React 18.x or Vue 3.x (via Astro Islands)
- **Styling**: Tailwind CSS 3.x
- **Language**: TypeScript 5.x
- **Database**: Cloudflare D1 (primary recommendation) / Neon / PlanetScale
- **Object Storage**: Cloudflare R2
- **Email Service**: Resend (recommended) / SendGrid / Mailgun
- **Deployment**: Cloudflare Pages + Functions
- **Build Tool**: Vite (built into Astro)

## Components and Interfaces

### Frontend Components

#### 1. ProductPage Component
```typescript
// src/pages/products/[id].astro
interface ProductPageProps {
  product: Product;
}

// Static generation from product data source
export async function getStaticPaths() {
  const products = await loadProducts();
  return products.map(product => ({
    params: { id: product.product_id },
    props: { product }
  }));
}
```

#### 2. AddToQuoteButton Component (Astro Island)
```typescript
// src/components/AddToQuoteButton.tsx
interface AddToQuoteButtonProps {
  productId: string;
  productName: string;
  sku: string;
  imageUrl: string;
}

// Handles adding items to browser storage
function AddToQuoteButton({ productId, productName, sku, imageUrl }: AddToQuoteButtonProps) {
  const handleAddToQuote = () => {
    const quoteList = getQuoteListFromStorage();
    const existingItem = quoteList.find(item => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      quoteList.push({ productId, productName, sku, imageUrl, quantity: 1 });
    }
    
    saveQuoteListToStorage(quoteList);
    showSuccessNotification();
  };
  
  return <button onClick={handleAddToQuote}>加入詢價清單</button>;
}
```

#### 3. QuoteListManager Component (Astro Island)
```typescript
// src/components/QuoteListManager.tsx
interface QuoteItem {
  productId: string;
  productName: string;
  sku: string;
  imageUrl: string;
  quantity: number;
}

function QuoteListManager() {
  const [items, setItems] = useState<QuoteItem[]>([]);
  
  useEffect(() => {
    setItems(getQuoteListFromStorage());
  }, []);
  
  const updateQuantity = (productId: string, quantity: number) => {
    const updated = items.map(item => 
      item.productId === productId ? { ...item, quantity } : item
    );
    setItems(updated);
    saveQuoteListToStorage(updated);
  };
  
  const removeItem = (productId: string) => {
    const filtered = items.filter(item => item.productId !== productId);
    setItems(filtered);
    saveQuoteListToStorage(filtered);
  };
  
  return (
    <div>
      {items.map(item => (
        <QuoteListItem 
          key={item.productId}
          item={item}
          onUpdateQuantity={updateQuantity}
          onRemove={removeItem}
        />
      ))}
    </div>
  );
}
```

#### 4. QuoteSubmissionForm Component (Astro Island)
```typescript
// src/components/QuoteSubmissionForm.tsx
interface QuoteFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  message: string;
}

function QuoteSubmissionForm() {
  const [formData, setFormData] = useState<QuoteFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    companyName: '',
    message: ''
  });
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const quoteItems = getQuoteListFromStorage();
    
    const response = await fetch('/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        items: quoteItems
      })
    });
    
    if (response.ok) {
      clearQuoteListFromStorage();
      showSuccessMessage();
    } else {
      showErrorMessage();
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Backend API

#### Quote API Endpoint
```typescript
// functions/api/quote.ts
import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  DB: D1Database;
  EMAIL_API_KEY: string;
  BUSINESS_EMAIL: string;
}

interface QuoteRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  message: string;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
  }>;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const request = await context.request.json() as QuoteRequest;
    
    // Validate request
    if (!validateQuoteRequest(request)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Store in database
    const quoteId = await storeQuote(context.env.DB, request);
    
    // Send email notification (non-blocking)
    sendEmailNotification(context.env, quoteId, request)
      .catch(err => console.error('Email failed:', err));
    
    return new Response(
      JSON.stringify({ success: true, quoteId }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Quote API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### Storage Layer

#### Browser Storage Service
```typescript
// src/lib/quoteStorage.ts
const STORAGE_KEY = 'quote_list';

export interface StoredQuoteItem {
  productId: string;
  productName: string;
  sku: string;
  imageUrl: string;
  quantity: number;
}

export function getQuoteListFromStorage(): StoredQuoteItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to read from storage:', error);
    return [];
  }
}

export function saveQuoteListToStorage(items: StoredQuoteItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save to storage:', error);
    throw new Error('無法儲存詢價清單');
  }
}

export function clearQuoteListFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
}
```

#### Database Service
```typescript
// src/lib/db.ts
export async function storeQuote(
  db: D1Database,
  request: QuoteRequest
): Promise<string> {
  const quoteId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  
  // Insert quote
  await db.prepare(`
    INSERT INTO Quotes (
      quote_id, customer_name, customer_email, customer_phone,
      company_name, message, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    quoteId,
    request.customerName,
    request.customerEmail,
    request.customerPhone,
    request.companyName,
    request.message,
    createdAt
  ).run();
  
  // Insert quote items
  for (const item of request.items) {
    await db.prepare(`
      INSERT INTO QuoteItems (quote_id, product_id, quantity)
      VALUES (?, ?, ?)
    `).bind(quoteId, item.productId, item.quantity).run();
  }
  
  return quoteId;
}
```

#### Email Service
```typescript
// src/lib/email.ts
export async function sendEmailNotification(
  env: Env,
  quoteId: string,
  request: QuoteRequest
): Promise<void> {
  const emailHtml = generateEmailTemplate(quoteId, request);
  
  // Using Resend as example
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'noreply@yourdomain.com',
      to: env.BUSINESS_EMAIL,
      subject: `新詢價單 #${quoteId}`,
      html: emailHtml
    })
  });
  
  if (!response.ok) {
    throw new Error(`Email service error: ${response.statusText}`);
  }
}

function generateEmailTemplate(quoteId: string, request: QuoteRequest): string {
  return `
    <h2>新詢價單 #${quoteId}</h2>
    <h3>客戶資訊</h3>
    <ul>
      <li>姓名: ${request.customerName}</li>
      <li>Email: ${request.customerEmail}</li>
      <li>電話: ${request.customerPhone}</li>
      <li>公司: ${request.companyName}</li>
    </ul>
    <h3>詢價產品</h3>
    <table>
      <tr><th>產品名稱</th><th>SKU</th><th>數量</th></tr>
      ${request.items.map(item => `
        <tr>
          <td>${item.productName}</td>
          <td>${item.sku}</td>
          <td>${item.quantity}</td>
        </tr>
      `).join('')}
    </table>
    <h3>客戶留言</h3>
    <p>${request.message}</p>
  `;
}
```

## Data Models

### Product Data Source (JSON)
```json
{
  "products": [
    {
      "product_id": "uuid-or-int",
      "name_en": "Product Name",
      "sku": "SKU-12345",
      "category": "Category Name",
      "description_en": "Detailed product description",
      "specs_json": {
        "material": "Stainless Steel",
        "dimensions": "10x20x30 cm",
        "weight": "2.5 kg"
      },
      "image_url": "https://r2.yourdomain.com/products/product-id.jpg"
    }
  ]
}
```

### Database Schema

#### Quotes Table
```sql
CREATE TABLE Quotes (
  quote_id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  company_name TEXT NOT NULL,
  message TEXT,
  created_at TEXT NOT NULL,
  status TEXT DEFAULT 'pending'
);

CREATE INDEX idx_quotes_created_at ON Quotes(created_at);
CREATE INDEX idx_quotes_email ON Quotes(customer_email);
```

#### QuoteItems Table
```sql
CREATE TABLE QuoteItems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  FOREIGN KEY (quote_id) REFERENCES Quotes(quote_id)
);

CREATE INDEX idx_quote_items_quote_id ON QuoteItems(quote_id);
```

### Browser Storage Schema
```typescript
// Stored in localStorage with key 'quote_list'
interface QuoteListStorage {
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    imageUrl: string;
    quantity: number;
  }>;
  lastUpdated: string; // ISO timestamp
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:
- Properties 7.3 and 6.3 both test email failure handling - consolidated into one property
- Properties about rendering product fields (1.2, 1.4, 1.5) can be combined into a comprehensive rendering property
- Properties about quote storage fields (5.2, 5.3) can be verified together as data integrity

### Properties

**Property 1: Product page generation completeness**
*For any* product in the Product Data Source, the build process should generate a corresponding static HTML file
**Validates: Requirements 1.1**

**Property 2: Product information rendering completeness**
*For any* product, the rendered page should contain all required fields (product_id, name_en, sku, category, description_en, parsed specs_json, and image_url)
**Validates: Requirements 1.2, 1.4, 1.5**

**Property 3: Add to quote list persistence**
*For any* product, clicking the "Add to Quote List" button should result in that product's ID and quantity being stored in Browser Storage
**Validates: Requirements 2.2**

**Property 4: No duplicate entries in quote list**
*For any* product already in the Quote List, adding it again should increment the quantity rather than creating a duplicate entry
**Validates: Requirements 2.3**

**Property 5: Quote list retrieval completeness**
*For any* set of items stored in Browser Storage, retrieving the quote list should return all items with their complete information
**Validates: Requirements 3.1, 3.2**

**Property 6: Quantity update persistence**
*For any* item in the quote list and any valid new quantity value, updating the quantity should immediately persist the change to Browser Storage
**Validates: Requirements 3.3**

**Property 7: Item removal completeness**
*For any* item in the quote list, removing it should result in that item no longer existing in Browser Storage
**Validates: Requirements 3.4**

**Property 8: Quote submission data completeness**
*For any* quote submission, the request payload should include all required fields (customer name, email, phone, company name, message, and items array)
**Validates: Requirements 4.1**

**Property 9: Required field validation**
*For any* quote request with one or more empty required fields, the system should prevent submission and display validation errors
**Validates: Requirements 4.2**

**Property 10: Email format validation**
*For any* quote request with an invalid email format, the API should reject the request with a 400 status code
**Validates: Requirements 4.4**

**Property 11: Storage clearing after submission**
*For any* successfully submitted quote request, the Browser Storage should be cleared of all quote list items
**Validates: Requirements 4.5**

**Property 12: Unique quote ID generation**
*For any* valid quote request stored in the database, the system should generate a unique quote_id that does not conflict with existing quotes
**Validates: Requirements 5.1**

**Property 13: Quote data integrity**
*For any* stored quote, the database record should contain all submitted fields (customer_name, customer_email, customer_phone, company_name, message, created_at) and all quote items should be stored in QuoteItems table with correct quote_id, product_id, and quantity
**Validates: Requirements 5.2, 5.3**

**Property 14: Successful storage response**
*For any* successfully stored quote, the API response should include the generated quote_id
**Validates: Requirements 5.5**

**Property 15: Email notification trigger**
*For any* successfully stored quote, an email notification should be sent to the configured business email address
**Validates: Requirements 6.1**

**Property 16: Email content completeness**
*For any* email notification sent, the email body should contain customer information, quote_id, a table of products with quantities, and the customer message
**Validates: Requirements 6.2, 6.5**

**Property 17: Invalid request error handling**
*For any* malformed or invalid quote request, the API should return a 400 status code with a descriptive error message in JSON format
**Validates: Requirements 7.1, 7.5**

**Property 18: Invalid product ID rejection**
*For any* quote request containing product IDs that don't exist in the Product Data Source, the system should reject the request
**Validates: Requirements 7.4**

**Property 19: ISO 8601 timestamp format**
*For any* quote stored in the database, the created_at field should be in valid ISO 8601 format
**Validates: Requirements 9.4**

**Property 20: R2 image storage**
*For any* uploaded product image, the image should be stored in the R2 Bucket with a filename following the naming convention (product_id or SKU based)
**Validates: Requirements 10.1, 10.3**

**Property 21: R2 URL consistency**
*For any* product in the Product Data Source, the image_url field should contain a valid R2 Bucket URL
**Validates: Requirements 10.2, 10.5**

**Property 22: R2 cache headers**
*For any* image served from R2, the HTTP response should include appropriate cache-control headers
**Validates: Requirements 10.4**

## Error Handling

### Client-Side Error Handling

1. **Browser Storage Errors**
   - Catch and handle `QuotaExceededError` when storage is full
   - Display user-friendly error messages
   - Provide fallback behavior (e.g., session storage)

2. **Network Errors**
   - Implement retry logic for API calls (max 3 retries with exponential backoff)
   - Display connection error messages
   - Preserve form data on failure

3. **Validation Errors**
   - Real-time field validation with clear error messages
   - Prevent form submission until all errors are resolved
   - Highlight invalid fields

### Server-Side Error Handling

1. **Request Validation**
   - Validate all input fields before processing
   - Return 400 with specific error messages for invalid data
   - Log validation failures for monitoring

2. **Database Errors**
   - Wrap all database operations in try-catch blocks
   - Return 500 for database connection failures
   - Implement transaction rollback for multi-step operations
   - Log all database errors with context

3. **Email Service Errors**
   - Email failures should NOT fail the quote submission
   - Log email errors for manual follow-up
   - Consider implementing a retry queue for failed emails

4. **Rate Limiting**
   - Implement rate limiting on the Quote API (e.g., 10 requests per minute per IP)
   - Return 429 status code when rate limit is exceeded

### Error Response Format

All API errors should follow this format:
```typescript
interface ErrorResponse {
  error: string;           // Human-readable error message
  code: string;            // Machine-readable error code
  details?: any;           // Optional additional context
  timestamp: string;       // ISO 8601 timestamp
}
```

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Storage Service Tests**
   - Test adding items to empty storage
   - Test updating existing items
   - Test removing items
   - Test storage quota exceeded scenario
   - Test invalid JSON in storage

2. **Validation Tests**
   - Test email format validation with valid/invalid examples
   - Test required field validation
   - Test phone number format validation
   - Test quantity validation (positive integers only)

3. **Email Template Tests**
   - Test email HTML generation with sample data
   - Test proper escaping of user input
   - Test table formatting

4. **Database Query Tests**
   - Test quote insertion with sample data
   - Test quote items insertion
   - Test query for existing quote IDs

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** (for TypeScript/JavaScript):

**Configuration**: Each property test should run a minimum of 100 iterations.

**Test Tagging**: Each property-based test MUST include a comment tag in this format:
```typescript
// Feature: quote-list-system, Property 1: Product page generation completeness
```

**Property Test Implementation Guidelines**:

1. **Smart Generators**: Create generators that produce valid input within the expected domain
   - Product generator: valid product IDs, non-empty names, valid SKUs
   - Quote request generator: valid email formats, non-empty required fields
   - Quantity generator: positive integers within reasonable range (1-9999)

2. **Test Independence**: Each property test should be independent and not rely on external state

3. **Clear Assertions**: Each test should have clear, specific assertions that directly validate the property

4. **Example Property Test Structure**:
```typescript
import fc from 'fast-check';

// Feature: quote-list-system, Property 3: Add to quote list persistence
test('adding product to quote list persists to storage', () => {
  fc.assert(
    fc.property(
      fc.record({
        productId: fc.uuid(),
        productName: fc.string({ minLength: 1 }),
        sku: fc.string({ minLength: 1 }),
        imageUrl: fc.webUrl(),
        quantity: fc.integer({ min: 1, max: 9999 })
      }),
      (product) => {
        // Setup: clear storage
        clearQuoteListFromStorage();
        
        // Action: add product
        addToQuoteList(product);
        
        // Assert: product exists in storage
        const stored = getQuoteListFromStorage();
        const found = stored.find(item => item.productId === product.productId);
        
        expect(found).toBeDefined();
        expect(found?.quantity).toBe(product.quantity);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

Integration tests will verify end-to-end workflows:

1. **Quote Submission Flow**
   - Add products to quote list
   - Fill out submission form
   - Submit quote
   - Verify database record
   - Verify email sent
   - Verify storage cleared

2. **Product Page Generation**
   - Build site with test product data
   - Verify all product pages generated
   - Verify correct data in each page

3. **API Endpoint Tests**
   - Test POST /api/quote with valid data
   - Test with invalid data
   - Test with database unavailable
   - Test with email service unavailable

### Testing Tools

- **Unit & Integration Tests**: Vitest
- **Property-Based Testing**: fast-check
- **E2E Testing**: Playwright (optional, for critical user flows)
- **API Testing**: Supertest or native fetch with Vitest

## Deployment and Configuration

### Environment Variables

```bash
# Database (choose one)
DATABASE_URL=          # For Neon/PlanetScale
# OR use Cloudflare D1 binding (no URL needed)

# Email Service
EMAIL_API_KEY=         # SendGrid/Mailgun/Resend API key
BUSINESS_EMAIL=        # Email address to receive notifications

# R2 Configuration
R2_BUCKET_NAME=        # Cloudflare R2 bucket name
R2_PUBLIC_URL=         # Public URL for R2 bucket

# Optional
RATE_LIMIT_PER_MINUTE=10
```

### Cloudflare Configuration

**wrangler.toml**:
```toml
name = "quote-list-system"
compatibility_date = "2024-01-01"

[build]
command = "npm run build"

[[d1_databases]]
binding = "DB"
database_name = "quote_list_db"
database_id = "your-database-id"

[[r2_buckets]]
binding = "R2"
bucket_name = "product-images"

[vars]
BUSINESS_EMAIL = "business@example.com"

[env.production]
vars = { RATE_LIMIT_PER_MINUTE = "10" }
```

### Database Migration

Initial migration script for D1:
```sql
-- migrations/0001_initial.sql

CREATE TABLE IF NOT EXISTS Quotes (
  quote_id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  company_name TEXT NOT NULL,
  message TEXT,
  created_at TEXT NOT NULL,
  status TEXT DEFAULT 'pending'
);

CREATE INDEX idx_quotes_created_at ON Quotes(created_at);
CREATE INDEX idx_quotes_email ON Quotes(customer_email);
CREATE INDEX idx_quotes_status ON Quotes(status);

CREATE TABLE IF NOT EXISTS QuoteItems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  FOREIGN KEY (quote_id) REFERENCES Quotes(quote_id) ON DELETE CASCADE
);

CREATE INDEX idx_quote_items_quote_id ON QuoteItems(quote_id);
CREATE INDEX idx_quote_items_product_id ON QuoteItems(product_id);
```

Run migration:
```bash
wrangler d1 execute quote_list_db --file=migrations/0001_initial.sql
```

### Deployment Steps

1. **Install Dependencies**
   ```bash
   npm install
   npm install -D @astrojs/cloudflare @astrojs/react @astrojs/tailwind
   npm install -D fast-check vitest
   ```

2. **Configure Astro**
   ```typescript
   // astro.config.mjs
   import { defineConfig } from 'astro/config';
   import cloudflare from '@astrojs/cloudflare';
   import react from '@astrojs/react';
   import tailwind from '@astrojs/tailwind';

   export default defineConfig({
     output: 'hybrid',
     adapter: cloudflare(),
     integrations: [react(), tailwind()]
   });
   ```

3. **Setup R2 Bucket**
   ```bash
   wrangler r2 bucket create product-images
   ```

4. **Setup D1 Database**
   ```bash
   wrangler d1 create quote_list_db
   wrangler d1 execute quote_list_db --file=migrations/0001_initial.sql
   ```

5. **Deploy to Cloudflare Pages**
   ```bash
   npm run build
   wrangler pages deploy dist
   ```

6. **Configure Secrets**
   ```bash
   wrangler pages secret put EMAIL_API_KEY
   ```

### Performance Considerations

1. **Static Generation**: All product pages are pre-rendered at build time
2. **Edge Caching**: Cloudflare CDN caches static assets globally
3. **R2 Caching**: Configure long cache times for product images (e.g., 1 year)
4. **Database Indexing**: Indexes on frequently queried fields (created_at, email, status)
5. **Lazy Loading**: Use Astro Islands to load interactive components only when needed
6. **Image Optimization**: Consider using Cloudflare Images for automatic optimization

### Monitoring and Logging

1. **Cloudflare Analytics**: Monitor page views, performance metrics
2. **Workers Analytics**: Track API endpoint usage, error rates
3. **Custom Logging**: Log all quote submissions, email failures, database errors
4. **Alerts**: Set up alerts for high error rates, email delivery failures

## Security Considerations

1. **Input Validation**: Validate and sanitize all user inputs
2. **SQL Injection Prevention**: Use parameterized queries exclusively
3. **XSS Prevention**: Escape user content in email templates
4. **Rate Limiting**: Prevent abuse of the quote submission API
5. **CORS Configuration**: Restrict API access to your domain only
6. **Email Validation**: Verify email format and consider implementing email verification
7. **Data Privacy**: Comply with GDPR/privacy regulations for customer data storage
8. **Secrets Management**: Use Cloudflare secrets for API keys, never commit to code

## Future Enhancements

1. **Admin Dashboard**: View and manage quote requests
2. **Quote Status Tracking**: Allow customers to check quote status
3. **PDF Generation**: Generate PDF quotes for customers
4. **Multi-language Support**: Support multiple languages beyond English
5. **Advanced Search**: Filter and search quotes by date, customer, product
6. **Analytics Dashboard**: Track popular products, conversion rates
7. **Automated Responses**: Send automated confirmation emails to customers
8. **Quote Expiration**: Implement quote expiration dates
