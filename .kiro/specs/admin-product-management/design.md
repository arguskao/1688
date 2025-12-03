# Design Document: Admin Product Management System

## Overview

The Admin Product Management System is a web-based interface that allows administrators to manage product data through CRUD operations. The system uses simple password-based authentication and provides functionality for creating, reading, updating, deleting, and bulk importing products with their associated images.

The system is built on top of the existing Astro + React + TypeScript stack, utilizing Cloudflare Pages for hosting, Neon PostgreSQL for data storage, and Cloudflare R2 for image storage.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Admin User    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         Admin Web Interface             │
│  (Astro Pages + React Components)       │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│      Authentication Middleware          │
│     (Session-based with Cookies)        │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         API Endpoints                   │
│  (Cloudflare Functions)                 │
│  - POST /api/admin/products             │
│  - GET /api/admin/products              │
│  - PUT /api/admin/products/:id          │
│  - DELETE /api/admin/products/:id       │
│  - POST /api/admin/products/import      │
│  - POST /api/admin/login                │
│  - POST /api/admin/logout               │
└────┬────────────────────────┬───────────┘
     │                        │
     ▼                        ▼
┌─────────────┐      ┌──────────────────┐
│  Neon DB    │      │  Cloudflare R2   │
│ (Products)  │      │  (Images)        │
└─────────────┘      └──────────────────┘
```

### Technology Stack

- **Frontend**: Astro + React + TypeScript + Tailwind CSS
- **Backend**: Cloudflare Functions (serverless)
- **Database**: Neon PostgreSQL
- **Storage**: Cloudflare R2
- **Authentication**: Session-based with HTTP-only cookies
- **Deployment**: Cloudflare Pages

## Components and Interfaces

### 1. Authentication System

#### Session Management
- Use HTTP-only cookies to store session tokens
- Session tokens are generated using crypto.randomUUID()
- Sessions stored in memory (for simplicity) or in database for persistence
- Session timeout: 24 hours

#### Login Component (`AdminLogin.tsx`)
```typescript
interface AdminLoginProps {
  onLoginSuccess: () => void;
}

interface LoginFormData {
  password: string;
}
```

### 2. Product List Component (`AdminProductList.tsx`)

Displays all products in a table format with action buttons.

```typescript
interface AdminProductListProps {
  products: Product[];
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
  onRefresh: () => void;
}
```

### 3. Product Form Component (`AdminProductForm.tsx`)

Handles both create and edit operations.

```typescript
interface AdminProductFormProps {
  product?: Product; // undefined for create, defined for edit
  onSave: (product: ProductFormData) => Promise<void>;
  onCancel: () => void;
}

interface ProductFormData {
  product_id: string;
  name_en: string;
  sku: string;
  category: string;
  description_en: string;
  specs_json: Record<string, any>;
  image?: File;
}
```

### 4. Product Import Component (`AdminProductImport.tsx`)

Handles bulk product import from CSV or JSON files.

```typescript
interface AdminProductImportProps {
  onImportComplete: (result: ImportResult) => void;
  onCancel: () => void;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: ImportError[];
}

interface ImportError {
  row: number;
  product_id?: string;
  errors: string[];
}
```

### 5. API Endpoints

#### Authentication Endpoints

**POST /api/admin/login**
```typescript
Request: { password: string }
Response: { success: boolean; message?: string }
Sets: session cookie
```

**POST /api/admin/logout**
```typescript
Response: { success: boolean }
Clears: session cookie
```

#### Product Management Endpoints

**GET /api/admin/products**
```typescript
Response: { products: Product[] }
Auth: Required
```

**POST /api/admin/products**
```typescript
Request: FormData {
  product_id: string;
  name_en: string;
  sku: string;
  category: string;
  description_en: string;
  specs_json: string; // JSON string
  image: File;
}
Response: { success: boolean; product: Product }
Auth: Required
```

**PUT /api/admin/products/:id**
```typescript
Request: FormData (same as POST)
Response: { success: boolean; product: Product }
Auth: Required
```

**DELETE /api/admin/products/:id**
```typescript
Response: { success: boolean }
Auth: Required
```

**POST /api/admin/products/import**
```typescript
Request: FormData {
  file: File; // CSV or JSON
}
Response: { 
  success: boolean; 
  imported: number;
  failed: number;
  errors: ImportError[];
}
Auth: Required
```

## Data Models

### Database Schema

#### Products Table

```sql
CREATE TABLE products (
  product_id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description_en TEXT NOT NULL,
  specs_json JSONB NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_created_at ON products(created_at);
```

#### Sessions Table (Optional - for persistent sessions)

```sql
CREATE TABLE admin_sessions (
  session_id TEXT PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_sessions_expires_at ON admin_sessions(expires_at);
```

### TypeScript Interfaces

```typescript
interface Product {
  product_id: string;
  name_en: string;
  sku: string;
  category: string;
  description_en: string;
  specs_json: Record<string, any>;
  image_url: string;
  created_at?: Date;
  updated_at?: Date;
}

interface AdminSession {
  session_id: string;
  created_at: Date;
  expires_at: Date;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Correct password grants access
*For any* authentication attempt with the correct password, the system should create a valid session and grant access to the admin interface.
**Validates: Requirements 1.2**

### Property 2: Incorrect password denies access
*For any* authentication attempt with an incorrect password, the system should reject the attempt and not create a session.
**Validates: Requirements 1.3**

### Property 3: Session persistence
*For any* valid session, the session should remain valid until explicitly logged out or the timeout period expires.
**Validates: Requirements 1.4**

### Property 4: Unauthenticated access redirect
*For any* request to admin pages without a valid session, the system should redirect to the login page.
**Validates: Requirements 1.5**

### Property 5: Product list completeness
*For any* set of products in the database, the product list page should display all products.
**Validates: Requirements 2.1**

### Property 6: Product display fields
*For any* product displayed in the list, the rendered output should contain product ID, name, category, and thumbnail image.
**Validates: Requirements 2.2**

### Property 7: Action buttons presence
*For any* product in the list, the system should provide edit and delete action buttons.
**Validates: Requirements 2.4**

### Property 8: Required field validation
*For any* product submission with missing required fields, the system should reject the submission and display validation errors.
**Validates: Requirements 3.2, 3.6**

### Property 9: Image upload and storage
*For any* valid image file uploaded, the system should store it in R2 and return a retrievable URL.
**Validates: Requirements 3.3**

### Property 10: Product creation persistence
*For any* valid product data submitted, the system should save the product to the database and make it retrievable.
**Validates: Requirements 3.4**

### Property 11: Edit form pre-population
*For any* product being edited, the edit form should be pre-filled with the current product data.
**Validates: Requirements 4.1**

### Property 12: Image replacement cleanup
*For any* product image replacement, the system should delete the old image from R2 and store the new image.
**Validates: Requirements 4.3**

### Property 13: Product update persistence
*For any* valid product update, the system should save the changes to the database and reflect them in subsequent queries.
**Validates: Requirements 4.4**

### Property 14: Product deletion persistence
*For any* product deletion, the system should remove the product from the database and it should no longer be retrievable.
**Validates: Requirements 5.2**

### Property 15: Image cleanup on deletion
*For any* product deletion, the system should remove all associated images from R2 storage.
**Validates: Requirements 5.3**

### Property 16: Deletion cancellation preserves data
*For any* deletion cancellation, the product should remain unchanged in the database.
**Validates: Requirements 5.5**

### Property 17: Product name validation
*For any* product name that is empty or exceeds 200 characters, the system should reject the product with a validation error.
**Validates: Requirements 6.1**

### Property 18: Category validation
*For any* product with a category not in the predefined list, the system should reject the product with a validation error.
**Validates: Requirements 6.3**

### Property 19: Image format validation
*For any* uploaded file that is not a valid image format, the system should reject the upload with a validation error.
**Validates: Requirements 6.4**

### Property 20: Validation error messages
*For any* validation failure, the error message should clearly indicate which field is invalid.
**Validates: Requirements 6.5**

### Property 21: Image format acceptance
*For any* image file in JPEG, PNG, or WebP format, the system should accept and store the image.
**Validates: Requirements 7.1**

### Property 22: Unique image identifiers
*For any* two images uploaded, they should have different unique identifiers in R2 storage.
**Validates: Requirements 7.2**

### Property 23: Import file parsing
*For any* valid CSV or JSON import file, the system should correctly parse and extract all product records.
**Validates: Requirements 8.1**

### Property 24: Import validation consistency
*For any* product in an import file, the validation rules should be the same as manual product entry.
**Validates: Requirements 8.2**

### Property 25: Import error reporting
*For any* import with validation errors, the error report should include row numbers and specific error messages for each failed record.
**Validates: Requirements 8.3**

### Property 26: Bulk import completeness
*For any* import file with all valid products, all products should be successfully imported into the database.
**Validates: Requirements 8.4**

### Property 27: Import summary accuracy
*For any* import operation, the summary count of imported products should match the actual number of products added to the database.
**Validates: Requirements 8.5**

### Property 28: Invalid import file rejection
*For any* file that is not valid CSV or JSON format, the system should reject the file with an error message.
**Validates: Requirements 8.6**

### Property 29: Referential integrity
*For any* database operation, foreign key constraints and referential integrity should be maintained.
**Validates: Requirements 9.5**

## Error Handling

### Authentication Errors
- **Invalid Password**: Return 401 Unauthorized with clear error message
- **Session Expired**: Return 401 and redirect to login
- **Missing Session**: Return 401 and redirect to login

### Validation Errors
- **Missing Required Fields**: Return 400 Bad Request with field-specific errors
- **Invalid Data Format**: Return 400 Bad Request with format requirements
- **Duplicate SKU**: Return 409 Conflict with error message
- **Invalid Category**: Return 400 Bad Request with list of valid categories

### Storage Errors
- **Image Upload Failed**: Return 500 Internal Server Error, rollback database changes
- **Image Delete Failed**: Log error but continue (orphaned images acceptable)
- **Database Connection Failed**: Return 503 Service Unavailable

### Import Errors
- **File Parse Error**: Return 400 Bad Request with parse error details
- **Partial Import Failure**: Return 207 Multi-Status with detailed error report
- **File Too Large**: Return 413 Payload Too Large

### General Error Handling Strategy
1. Validate input before any database or storage operations
2. Use database transactions for operations that modify multiple resources
3. Rollback transactions on any error
4. Log all errors with context for debugging
5. Return user-friendly error messages without exposing system internals

## Testing Strategy

### Unit Testing

Unit tests will verify specific functionality and edge cases:

1. **Validation Functions**
   - Test each validation rule with valid and invalid inputs
   - Test edge cases (empty strings, maximum lengths, boundary values)
   - Test error message generation

2. **Authentication Logic**
   - Test password verification
   - Test session creation and validation
   - Test session expiration

3. **Database Operations**
   - Test CRUD operations with mock database
   - Test transaction rollback on errors
   - Test query result mapping

4. **File Parsing**
   - Test CSV parsing with various formats
   - Test JSON parsing with various structures
   - Test error handling for malformed files

5. **Image Operations**
   - Test image upload to R2
   - Test image deletion from R2
   - Test URL generation

### Property-Based Testing

Property-based tests will verify universal properties across many inputs using the **fast-check** library (already in the project). Each test will run a minimum of 100 iterations.

1. **Authentication Properties**
   - Property 1: Correct password grants access
   - Property 2: Incorrect password denies access
   - Property 3: Session persistence
   - Property 4: Unauthenticated access redirect

2. **Product Management Properties**
   - Property 5: Product list completeness
   - Property 8: Required field validation
   - Property 10: Product creation persistence
   - Property 13: Product update persistence
   - Property 14: Product deletion persistence
   - Property 16: Deletion cancellation preserves data

3. **Validation Properties**
   - Property 17: Product name validation
   - Property 18: Category validation
   - Property 19: Image format validation
   - Property 20: Validation error messages

4. **Image Management Properties**
   - Property 9: Image upload and storage
   - Property 12: Image replacement cleanup
   - Property 15: Image cleanup on deletion
   - Property 21: Image format acceptance
   - Property 22: Unique image identifiers

5. **Import Properties**
   - Property 23: Import file parsing
   - Property 24: Import validation consistency
   - Property 25: Import error reporting
   - Property 26: Bulk import completeness
   - Property 27: Import summary accuracy
   - Property 28: Invalid import file rejection

Each property-based test must:
- Be tagged with a comment: `**Feature: admin-product-management, Property {number}: {property_text}**`
- Run at least 100 iterations
- Use appropriate generators from fast-check to create test data
- Verify the property holds for all generated inputs

### Integration Testing

Integration tests will verify end-to-end workflows:

1. **Complete Product Lifecycle**
   - Create product → Verify in database → Edit product → Verify changes → Delete product → Verify removal

2. **Image Lifecycle**
   - Upload image → Verify in R2 → Replace image → Verify old deleted → Delete product → Verify image deleted

3. **Import Workflow**
   - Upload CSV → Verify parsing → Verify validation → Verify database insertion → Verify error reporting

4. **Authentication Flow**
   - Login → Access admin pages → Logout → Verify redirect on access attempt

### Test Environment

- Use Vitest as the test runner (already configured)
- Use fast-check for property-based testing (already installed)
- Mock external services (R2, Database) for unit tests
- Use test database for integration tests
- Clean up test data after each test

## Security Considerations

### Authentication
- Store password hash in environment variable (not plain text)
- Use HTTP-only cookies for session tokens
- Implement CSRF protection for state-changing operations
- Set secure cookie flags in production

### Input Validation
- Validate all user inputs on server side
- Sanitize file names before storage
- Limit file upload sizes
- Validate file types by content, not just extension

### Access Control
- Require authentication for all admin endpoints
- Validate session on every request
- Implement rate limiting on login attempts

### Data Protection
- Use parameterized queries to prevent SQL injection
- Validate and sanitize all database inputs
- Log security-relevant events (login attempts, deletions)

## Performance Considerations

### Database Optimization
- Use indexes on frequently queried fields (category, SKU, created_at)
- Implement pagination for product lists (50 products per page)
- Use connection pooling for database connections

### Image Optimization
- Resize images on upload to reasonable dimensions
- Generate thumbnails for list view
- Use lazy loading for images in product list
- Implement CDN caching for R2 images

### Import Optimization
- Process imports in batches (100 products at a time)
- Use database transactions for batch inserts
- Implement progress reporting for large imports
- Set reasonable file size limits (10MB max)

## Deployment Considerations

### Environment Variables

Required environment variables:
```
ADMIN_PASSWORD_HASH=<bcrypt_hash_of_admin_password>
DATABASE_URL=<neon_postgresql_connection_string>
R2_ACCOUNT_ID=<cloudflare_r2_account_id>
R2_ACCESS_KEY_ID=<r2_access_key>
R2_SECRET_ACCESS_KEY=<r2_secret_key>
R2_BUCKET_NAME=product-images
SESSION_SECRET=<random_secret_for_session_signing>
```

### Database Migration

A new migration file will be created to add the products table:
```
migrations/0002_create_products_table.sql
```

### Cloudflare Configuration

Update `wrangler.toml` to include:
- R2 bucket binding (already configured)
- Environment variables for admin system
- Function routes for admin endpoints

## Future Enhancements

Potential improvements for future iterations:

1. **Multi-user Support**: Add user management with different roles
2. **Audit Log**: Track all changes to products with timestamps and user info
3. **Product Categories Management**: Allow admins to create/edit categories
4. **Bulk Edit**: Edit multiple products at once
5. **Product Search**: Add search and filter functionality
6. **Image Gallery**: Support multiple images per product
7. **Product Variants**: Support product variations (sizes, colors)
8. **Export Functionality**: Export products to CSV/JSON
9. **Draft Products**: Save products as drafts before publishing
10. **Product Analytics**: Track views and quote requests per product
