# Implementation Plan: Admin Product Management System

- [x] 1. Database schema and migrations
  - Create products table with all required fields
  - Create admin_sessions table for session management
  - Add indexes for performance optimization
  - Create migration script for deployment
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 1.1 Write property test for database operations
  - **Property 10: Product creation persistence**
  - **Validates: Requirements 3.4**

- [ ]* 1.2 Write property test for referential integrity
  - **Property 29: Referential integrity**
  - **Validates: Requirements 9.5**

- [x] 2. Authentication system
  - Implement password hashing and verification utilities
  - Create session management functions (create, validate, destroy)
  - Implement authentication middleware for API endpoints
  - Add session cookie handling
  - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [ ]* 2.1 Write property test for correct password authentication
  - **Property 1: Correct password grants access**
  - **Validates: Requirements 1.2**

- [ ]* 2.2 Write property test for incorrect password rejection
  - **Property 2: Incorrect password denies access**
  - **Validates: Requirements 1.3**

- [ ]* 2.3 Write property test for session persistence
  - **Property 3: Session persistence**
  - **Validates: Requirements 1.4**

- [ ]* 2.4 Write property test for unauthenticated access
  - **Property 4: Unauthenticated access redirect**
  - **Validates: Requirements 1.5**

- [x] 3. Product validation utilities
  - Implement product name validation (required, max 200 chars)
  - Implement SKU validation (required, unique)
  - Implement category validation (must be in predefined list)
  - Implement specs_json validation
  - Implement image file validation (format, size)
  - Create comprehensive validation error messages
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 3.1 Write property test for name validation
  - **Property 17: Product name validation**
  - **Validates: Requirements 6.1**

- [ ]* 3.2 Write property test for category validation
  - **Property 18: Category validation**
  - **Validates: Requirements 6.3**

- [ ]* 3.3 Write property test for image format validation
  - **Property 19: Image format validation**
  - **Validates: Requirements 6.4**

- [ ]* 3.4 Write property test for validation error messages
  - **Property 20: Validation error messages**
  - **Validates: Requirements 6.5**

- [ ]* 3.5 Write property test for required field validation
  - **Property 8: Required field validation**
  - **Validates: Requirements 3.2, 3.6**

- [x] 4. Product database service
  - Implement createProduct function with transaction support
  - Implement getProducts function with pagination
  - Implement getProductById function
  - Implement updateProduct function with transaction support
  - Implement deleteProduct function with cascade delete
  - Add error handling for database operations
  - _Requirements: 3.4, 4.4, 5.2, 9.1, 9.2, 9.3, 9.4_

- [ ]* 4.1 Write property test for product update persistence
  - **Property 13: Product update persistence**
  - **Validates: Requirements 4.4**

- [ ]* 4.2 Write property test for product deletion persistence
  - **Property 14: Product deletion persistence**
  - **Validates: Requirements 5.2**

- [ ]* 4.3 Write property test for deletion cancellation
  - **Property 16: Deletion cancellation preserves data**
  - **Validates: Requirements 5.5**

- [x] 5. Image management service
  - Implement image upload to R2 with unique ID generation
  - Implement image deletion from R2
  - Implement image URL generation
  - Add image format validation (JPEG, PNG, WebP)
  - Add image replacement logic (delete old, upload new)
  - _Requirements: 3.3, 4.3, 5.3, 7.1, 7.2, 7.3_

- [ ]* 5.1 Write property test for image upload and storage
  - **Property 9: Image upload and storage**
  - **Validates: Requirements 3.3**

- [ ]* 5.2 Write property test for image format acceptance
  - **Property 21: Image format acceptance**
  - **Validates: Requirements 7.1**

- [ ]* 5.3 Write property test for unique image identifiers
  - **Property 22: Unique image identifiers**
  - **Validates: Requirements 7.2**

- [ ]* 5.4 Write property test for image replacement cleanup
  - **Property 12: Image replacement cleanup**
  - **Validates: Requirements 4.3**

- [ ]* 5.5 Write property test for image cleanup on deletion
  - **Property 15: Image cleanup on deletion**
  - **Validates: Requirements 5.3**

- [-] 6. Authentication API endpoints
  - Create POST /api/admin/login endpoint
  - Create POST /api/admin/logout endpoint
  - Implement rate limiting for login attempts
  - Add CSRF protection
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 7. Product management API endpoints
  - Create GET /api/admin/products endpoint with pagination
  - Create POST /api/admin/products endpoint with image upload
  - Create PUT /api/admin/products/:id endpoint with image replacement
  - Create DELETE /api/admin/products/:id endpoint with cascade delete
  - Add authentication middleware to all endpoints
  - Implement comprehensive error handling
  - _Requirements: 2.1, 3.1, 3.3, 3.4, 4.1, 4.3, 4.4, 5.1, 5.2_

- [ ]* 7.1 Write property test for product list completeness
  - **Property 5: Product list completeness**
  - **Validates: Requirements 2.1**

- [ ] 8. Product import functionality
  - Implement CSV parser for product import
  - Implement JSON parser for product import
  - Add validation for each imported product record
  - Create detailed error reporting for failed imports
  - Implement batch insert with transactions
  - Create import summary generation
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ]* 8.1 Write property test for import file parsing
  - **Property 23: Import file parsing**
  - **Validates: Requirements 8.1**

- [ ]* 8.2 Write property test for import validation consistency
  - **Property 24: Import validation consistency**
  - **Validates: Requirements 8.2**

- [ ]* 8.3 Write property test for import error reporting
  - **Property 25: Import error reporting**
  - **Validates: Requirements 8.3**

- [ ]* 8.4 Write property test for bulk import completeness
  - **Property 26: Bulk import completeness**
  - **Validates: Requirements 8.4**

- [ ]* 8.5 Write property test for import summary accuracy
  - **Property 27: Import summary accuracy**
  - **Validates: Requirements 8.5**

- [ ]* 8.6 Write property test for invalid import file rejection
  - **Property 28: Invalid import file rejection**
  - **Validates: Requirements 8.6**

- [ ] 9. Product import API endpoint
  - Create POST /api/admin/products/import endpoint
  - Add file upload handling (multipart/form-data)
  - Implement file size limits
  - Add progress reporting for large imports
  - Return detailed import results
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 10. Admin login page
  - Create /admin/login page with Astro
  - Build AdminLogin React component
  - Implement form submission with error handling
  - Add loading states and user feedback
  - Implement redirect after successful login
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 11. Admin product list page
  - Create /admin/products page with authentication check
  - Build AdminProductList React component
  - Display products in table format with all required fields
  - Add action buttons (edit, delete) for each product
  - Implement delete confirmation dialog
  - Add pagination controls
  - Handle empty state
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1_

- [ ]* 11.1 Write property test for product display fields
  - **Property 6: Product display fields**
  - **Validates: Requirements 2.2**

- [ ]* 11.2 Write property test for action buttons presence
  - **Property 7: Action buttons presence**
  - **Validates: Requirements 2.4**

- [ ] 12. Admin product form component
  - Build AdminProductForm React component for create/edit
  - Implement form fields for all product properties
  - Add image upload with preview
  - Implement client-side validation with error display
  - Add form submission with loading states
  - Handle success and error responses
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 12.1 Write property test for edit form pre-population
  - **Property 11: Edit form pre-population**
  - **Validates: Requirements 4.1**

- [ ] 13. Admin product create page
  - Create /admin/products/new page with authentication check
  - Integrate AdminProductForm component in create mode
  - Handle form submission to POST /api/admin/products
  - Implement redirect to product list on success
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 14. Admin product edit page
  - Create /admin/products/[id]/edit page with authentication check
  - Fetch product data and pass to AdminProductForm
  - Integrate AdminProductForm component in edit mode
  - Handle form submission to PUT /api/admin/products/:id
  - Implement redirect to product list on success
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 15. Admin product import page
  - Create /admin/products/import page with authentication check
  - Build AdminProductImport React component
  - Implement file upload with drag-and-drop
  - Display import progress and results
  - Show detailed error report for failed imports
  - Add link to download sample CSV/JSON template
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 16. Admin navigation and layout
  - Create admin layout component with navigation menu
  - Add links to all admin pages (products, create, import)
  - Add logout button
  - Implement consistent styling with Tailwind CSS
  - Add breadcrumbs for navigation context
  - _Requirements: 1.4_

- [ ] 17. Environment configuration
  - Add ADMIN_PASSWORD_HASH to environment variables
  - Add SESSION_SECRET to environment variables
  - Update .env.example with new variables
  - Create documentation for setting up admin credentials
  - _Requirements: 1.2_

- [ ] 18. Update existing product pages
  - Modify product data source to fetch from database instead of JSON
  - Update getAllProducts to query database
  - Update getProductById to query database
  - Ensure backward compatibility with existing quote system
  - _Requirements: 9.4_

- [ ] 19. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Documentation
  - Create admin user guide with screenshots
  - Document CSV/JSON import format with examples
  - Create deployment guide for admin system
  - Document environment variable setup
  - Add troubleshooting section
  - _Requirements: All_

- [ ] 21. Final deployment
  - Run database migration to create products table
  - Deploy updated application to Cloudflare Pages
  - Set admin password and session secret
  - Test all functionality in production
  - Migrate existing products from JSON to database
  - _Requirements: All_
