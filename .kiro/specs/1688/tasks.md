# Implementation Plan

- [x] 1. Initialize project structure and dependencies
  - Create Astro project with TypeScript
  - Install Cloudflare adapter, React, Tailwind CSS
  - Configure astro.config.mjs for hybrid output and Cloudflare adapter
  - Setup TypeScript configuration
  - Install testing dependencies (Vitest, fast-check)
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 2. Setup database schema and migrations
  - Create D1 database migration file for Quotes table
  - Create D1 database migration file for QuoteItems table
  - Add indexes for performance optimization
  - Create database connection utility module
  - _Requirements: 5.1, 5.2, 5.3, 9.3, 9.4_

- [x] 3. Create product data source and SSG setup
  - Create JSON schema for product data source
  - Add sample product data with all required fields
  - Create product page template in Astro
  - Implement getStaticPaths to generate product pages
  - _Requirements: 1.1, 1.2_

- [x] 3.1 Write property test for product page generation
  - **Property 1: Product page generation completeness**
  - **Validates: Requirements 1.1**
  - Implemented in `src/lib/productPage.test.ts`

- [x] 3.2 Write property test for product information rendering
  - **Property 2: Product information rendering completeness**
  - **Validates: Requirements 1.2, 1.4, 1.5**
  - Implemented in `src/lib/productPage.test.ts`

- [x] 4. Implement browser storage service
  - Create quoteStorage.ts module with TypeScript interfaces
  - Implement getQuoteListFromStorage function
  - Implement saveQuoteListToStorage function
  - Implement clearQuoteListFromStorage function
  - Add error handling for storage quota exceeded
  - _Requirements: 2.2, 2.3, 3.1, 3.3, 3.4_

- [x] 4.1 Write property test for add to quote list persistence
  - **Property 3: Add to quote list persistence**
  - **Validates: Requirements 2.2**
  - Implemented in `src/lib/quoteStorage.property.test.ts`

- [x] 4.2 Write property test for no duplicate entries
  - **Property 4: No duplicate entries in quote list**
  - **Validates: Requirements 2.3**
  - Implemented in `src/lib/quoteStorage.property.test.ts`

- [x] 4.3 Write property test for quote list retrieval
  - **Property 5: Quote list retrieval completeness**
  - **Validates: Requirements 3.1, 3.2**
  - Implemented in `src/lib/quoteStorage.property.test.ts`

- [x] 4.4 Write property test for quantity update persistence
  - **Property 6: Quantity update persistence**
  - **Validates: Requirements 3.3**
  - Implemented in `src/lib/quoteStorage.property.test.ts`

- [x] 4.5 Write property test for item removal
  - **Property 7: Item removal completeness**
  - **Validates: Requirements 3.4**
  - Implemented in `src/lib/quoteStorage.property.test.ts`

- [x] 5. Build AddToQuoteButton component
  - Create React component with TypeScript props interface
  - Implement click handler to add product to storage
  - Add visual feedback (toast notification or button state change)
  - Handle storage errors gracefully
  - Style with Tailwind CSS
  - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [x] 6. Build QuoteListManager component
  - Create React component to display quote list items
  - Implement quantity update functionality
  - Implement item removal functionality
  - Handle empty list state
  - Style with Tailwind CSS for responsive layout
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 7. Build QuoteSubmissionForm component
  - Create React component with form fields
  - Implement form state management
  - Add client-side validation for required fields
  - Add email format validation
  - Implement form submission to API
  - Handle success and error states
  - Style with Tailwind CSS
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 7.1 Write property test for quote submission data completeness
  - **Property 8: Quote submission data completeness**
  - **Validates: Requirements 4.1**
  - Implemented in `src/lib/quoteSubmission.property.test.ts`

- [x] 7.2 Write property test for required field validation
  - **Property 9: Required field validation**
  - **Validates: Requirements 4.2**
  - Implemented in `src/lib/quoteSubmission.property.test.ts`

- [x] 7.3 Write property test for storage clearing after submission
  - **Property 11: Storage clearing after submission**
  - **Validates: Requirements 4.5**
  - Implemented in `src/lib/quoteSubmission.property.test.ts`

- [x] 8. Create validation utilities
  - Implement email format validation function
  - Implement phone number validation function
  - Implement required field validation function
  - Create TypeScript types for validation results
  - _Requirements: 4.2, 4.4_

- [ ]* 8.1 Write property test for email format validation
  - **Property 10: Email format validation**
  - **Validates: Requirements 4.4**

- [x] 9. Implement Quote API endpoint
  - Create functions/api/quote.ts with TypeScript types
  - Implement request validation logic
  - Implement product ID validation against data source
  - Add error handling and proper status codes
  - Return JSON responses with consistent format
  - _Requirements: 4.3, 4.4, 7.1, 7.4, 7.5_

- [ ]* 9.1 Write property test for invalid request error handling
  - **Property 17: Invalid request error handling**
  - **Validates: Requirements 7.1, 7.5**

- [ ]* 9.2 Write property test for invalid product ID rejection
  - **Property 18: Invalid product ID rejection**
  - **Validates: Requirements 7.4**

- [x] 10. Implement database service
  - Create db.ts module with D1 database operations
  - Implement storeQuote function with transaction support
  - Generate unique quote_id using crypto.randomUUID()
  - Store quote in Quotes table with all fields
  - Store quote items in QuoteItems table
  - Add error handling and logging
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 10.1 Write property test for unique quote ID generation
  - **Property 12: Unique quote ID generation**
  - **Validates: Requirements 5.1**

- [ ]* 10.2 Write property test for quote data integrity
  - **Property 13: Quote data integrity**
  - **Validates: Requirements 5.2, 5.3**

- [ ]* 10.3 Write property test for successful storage response
  - **Property 14: Successful storage response**
  - **Validates: Requirements 5.5**

- [ ]* 10.4 Write property test for ISO 8601 timestamp format
  - **Property 19: ISO 8601 timestamp format**
  - **Validates: Requirements 9.4**

- [x] 11. Implement email notification service
  - Create email.ts module with email service integration
  - Implement sendEmailNotification function
  - Create HTML email template with product table
  - Integrate with Resend/SendGrid/Mailgun API
  - Add error handling (non-blocking for quote submission)
  - Add logging for email delivery status
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 11.1 Write property test for email notification trigger
  - **Property 15: Email notification trigger**
  - **Validates: Requirements 6.1**

- [ ]* 11.2 Write property test for email content completeness
  - **Property 16: Email content completeness**
  - **Validates: Requirements 6.2, 6.5**

- [ ]* 11.3 Write unit test for email service failure handling
  - Test that email failure does not fail quote submission
  - Verify error is logged
  - _Requirements: 6.3_

- [x] 12. Integrate API endpoint with database and email services
  - Connect Quote API to database service
  - Connect Quote API to email service
  - Implement complete flow: validate → store → email → respond
  - Add comprehensive error handling
  - _Requirements: 5.1, 5.2, 5.3, 5.5, 6.1_

- [x] 13. Setup Cloudflare R2 for product images
  - Create R2 bucket configuration in wrangler.toml
  - Implement image upload utility (for development/admin use)
  - Implement naming convention based on product_id
  - Configure cache headers for R2 responses
  - Update product data source with R2 URLs
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 13.1 Write property test for R2 image storage
  - **Property 20: R2 image storage**
  - **Validates: Requirements 10.1, 10.3**

- [ ]* 13.2 Write property test for R2 URL consistency
  - **Property 21: R2 URL consistency**
  - **Validates: Requirements 10.2, 10.5**

- [ ]* 13.3 Write property test for R2 cache headers
  - **Property 22: R2 cache headers**
  - **Validates: Requirements 10.4**

- [x] 14. Create quote list page
  - Create src/pages/quote-list.astro page
  - Integrate QuoteListManager component
  - Integrate QuoteSubmissionForm component
  - Add page layout and styling
  - _Requirements: 3.1, 3.2, 4.1_

- [x] 15. Add rate limiting to Quote API
  - Implement rate limiting middleware
  - Configure limit (10 requests per minute per IP)
  - Return 429 status code when exceeded
  - Add rate limit headers to responses
  - _Requirements: 7.1_

- [ ]* 15.1 Write unit test for rate limiting
  - Test that excessive requests return 429
  - Test that rate limit resets after time window
  - _Requirements: 7.1_

- [x] 16. Configure environment variables and secrets
  - Create .env.example file with all required variables
  - Document environment variables in README
  - Configure Cloudflare secrets for production
  - Setup wrangler.toml with bindings
  - _Requirements: 8.5, 9.1_

- [x] 17. Create deployment configuration
  - Configure wrangler.toml for Cloudflare Pages
  - Setup D1 database binding
  - Setup R2 bucket binding
  - Create database migration script
  - Document deployment steps
  - _Requirements: 8.5, 9.1_

- [x] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 19. Write integration tests for complete quote flow
  - Test adding products to quote list
  - Test submitting quote with valid data
  - Test database record creation
  - Test email notification
  - Test storage clearing
  - _Requirements: 2.2, 4.3, 5.1, 6.1, 4.5_

- [ ]* 20. Write unit tests for edge cases
  - Test empty quote list display
  - Test storage quota exceeded
  - Test database connection failure
  - Test invalid JSON in storage
  - _Requirements: 2.5, 3.5, 5.4, 7.2_

- [x] 21. Add SEO optimization
  - Add meta tags to product pages
  - Configure sitemap generation
  - Add robots.txt
  - Optimize image loading with lazy loading
  - _Requirements: 11.1, 11.4, 11.5_

- [x] 22. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
