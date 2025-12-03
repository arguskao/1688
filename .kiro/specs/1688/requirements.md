# Requirements Document

## Introduction

詢價清單系統是一個基於 Astro 和 Cloudflare 技術棧的 B2B 產品詢價解決方案。該系統允許用戶瀏覽產品、將感興趣的產品加入詢價清單、提交詢價請求，並通過郵件通知業務人員處理。系統採用靜態優先的架構，利用 Cloudflare Pages 部署靜態內容，Cloudflare Functions 處理動態 API，並使用 Serverless 資料庫儲存詢價記錄。

## Glossary

- **Quote List System**: 詢價清單系統，本文檔描述的完整系統
- **Quote List**: 詢價清單，用戶暫存的產品列表，類似購物車但用於詢價而非購買
- **Product**: 產品，系統中展示的可詢價商品
- **Quote Request**: 詢價請求，用戶提交的完整詢價單，包含產品清單和聯絡資訊
- **Browser Storage**: 瀏覽器儲存，指 Local Storage 或 Session Storage
- **Astro Island**: Astro 島嶼，Astro 框架中的互動式組件區域
- **Quote API**: 詢價 API，處理詢價單提交的後端接口
- **Email Service**: 郵件服務，用於發送通知的第三方服務（如 SendGrid、Mailgun、Resend）
- **SSG**: Static Site Generation，靜態網站生成
- **Product Data Source**: 產品資料源，儲存產品資訊的 JSON 或 Markdown 檔案
- **R2 Bucket**: Cloudflare R2 儲存桶，用於儲存和提供產品圖片的物件儲存服務

## Requirements

### Requirement 1

**User Story:** 作為一個潛在客戶，我想要瀏覽產品資訊，以便了解產品詳情並決定是否詢價。

#### Acceptance Criteria

1. WHEN the Quote List System generates product pages THEN the Quote List System SHALL create static HTML pages for each product from the Product Data Source
2. WHEN a product page is displayed THEN the Quote List System SHALL show product_id, name_en, sku, category, description_en, specs_json, and image_url
3. WHEN a user accesses a product page THEN the Quote List System SHALL load the page without requiring server-side rendering
4. WHEN the Product Data Source contains product specifications in specs_json THEN the Quote List System SHALL parse and display the specifications in a readable format
5. WHEN a product has an image_url THEN the Quote List System SHALL display the product image on the product page

### Requirement 2

**User Story:** 作為一個潛在客戶，我想要將感興趣的產品加入詢價清單，以便稍後一次性提交詢價請求。

#### Acceptance Criteria

1. WHEN a user views a product page THEN the Quote List System SHALL display an "Add to Quote List" button
2. WHEN a user clicks the "Add to Quote List" button THEN the Quote List System SHALL store the product_id and quantity in Browser Storage
3. WHEN a product is already in the Quote List and the user adds it again THEN the Quote List System SHALL update the quantity instead of creating a duplicate entry
4. WHEN a user adds a product to the Quote List THEN the Quote List System SHALL provide visual feedback confirming the action
5. WHEN Browser Storage is unavailable THEN the Quote List System SHALL display an error message and prevent the add action

### Requirement 3

**User Story:** 作為一個潛在客戶，我想要查看和管理我的詢價清單，以便確認詢價內容並進行調整。

#### Acceptance Criteria

1. WHEN a user accesses the quote list page THEN the Quote List System SHALL retrieve all items from Browser Storage and display them
2. WHEN displaying quote list items THEN the Quote List System SHALL show product name, SKU, quantity, and product image for each item
3. WHEN a user modifies the quantity of an item THEN the Quote List System SHALL update the quantity in Browser Storage immediately
4. WHEN a user removes an item from the quote list THEN the Quote List System SHALL delete the item from Browser Storage
5. WHEN the quote list is empty THEN the Quote List System SHALL display a message indicating no items are in the list

### Requirement 4

**User Story:** 作為一個潛在客戶，我想要提交詢價請求並提供我的聯絡資訊，以便業務人員能夠聯繫我。

#### Acceptance Criteria

1. WHEN a user submits a quote request THEN the Quote List System SHALL collect customer name, email, phone number, company name, and message
2. WHEN a user submits a quote request with empty required fields THEN the Quote List System SHALL prevent submission and display validation errors
3. WHEN a user submits a valid quote request THEN the Quote List System SHALL send the data to the Quote API via POST request to /api/quote
4. WHEN the Quote API receives a quote request THEN the Quote List System SHALL validate the email format before processing
5. WHEN a quote request is successfully submitted THEN the Quote List System SHALL clear the Quote List from Browser Storage

### Requirement 5

**User Story:** 作為系統管理員，我想要將詢價請求儲存到資料庫，以便追蹤和管理所有詢價記錄。

#### Acceptance Criteria

1. WHEN the Quote API receives a valid quote request THEN the Quote List System SHALL insert a new record into the Quotes table with a unique quote_id
2. WHEN storing a quote request THEN the Quote List System SHALL save customer_name, customer_email, customer_phone, company_name, message, and created_at timestamp
3. WHEN storing quote items THEN the Quote List System SHALL insert each product into the QuoteItems table with quote_id, product_id, and quantity
4. WHEN a database write operation fails THEN the Quote List System SHALL return an error response to the client and log the error
5. WHEN a quote is successfully stored THEN the Quote List System SHALL return a success response with the quote_id to the client

### Requirement 6

**User Story:** 作為業務人員，我想要在收到新詢價時立即收到郵件通知，以便快速回應客戶需求。

#### Acceptance Criteria

1. WHEN a quote request is successfully stored in the database THEN the Quote List System SHALL trigger an email notification to the configured business email address
2. WHEN sending an email notification THEN the Quote List System SHALL include customer information, quote_id, product list with quantities, and customer message
3. WHEN the Email Service is unavailable THEN the Quote List System SHALL log the error but still return success to the client
4. WHEN the email is sent successfully THEN the Quote List System SHALL log the email delivery status
5. WHEN formatting the email content THEN the Quote List System SHALL present product information in a readable table format with product names and quantities

### Requirement 7

**User Story:** 作為開發人員，我想要系統能夠處理錯誤情況，以便提供良好的用戶體驗並便於除錯。

#### Acceptance Criteria

1. WHEN the Quote API encounters an invalid request format THEN the Quote List System SHALL return a 400 status code with a descriptive error message
2. WHEN the database connection fails THEN the Quote List System SHALL return a 500 status code and log the error details
3. WHEN the Email Service fails THEN the Quote List System SHALL log the error but not fail the entire quote submission
4. WHEN a user submits a quote with non-existent product_id values THEN the Quote List System SHALL validate against the Product Data Source and reject invalid products
5. WHEN an error occurs THEN the Quote List System SHALL return error messages in JSON format with error code and description

### Requirement 8

**User Story:** 作為開發人員，我想要系統使用 TypeScript 和現代化的技術棧，以便確保代碼質量和可維護性。

#### Acceptance Criteria

1. WHEN building the frontend THEN the Quote List System SHALL use Astro framework with Cloudflare Adapter
2. WHEN implementing interactive components THEN the Quote List System SHALL use Astro Islands with React or Vue
3. WHEN styling the UI THEN the Quote List System SHALL use Tailwind CSS for responsive design
4. WHEN implementing the Quote API THEN the Quote List System SHALL use TypeScript for type safety
5. WHEN deploying the application THEN the Quote List System SHALL deploy static pages to Cloudflare Pages and API functions to Cloudflare Functions

### Requirement 9

**User Story:** 作為系統管理員，我想要使用 Serverless 資料庫，以便降低維護成本並確保高可用性。

#### Acceptance Criteria

1. WHEN connecting to the database THEN the Quote List System SHALL support Cloudflare D1, Neon, or PlanetScale as database options
2. WHEN the Quote API executes database queries THEN the Quote List System SHALL use connection pooling for efficient resource usage
3. WHEN initializing the database THEN the Quote List System SHALL create Quotes and QuoteItems tables with proper schema
4. WHEN storing timestamps THEN the Quote List System SHALL use ISO 8601 format for created_at fields
5. WHEN querying the database THEN the Quote List System SHALL use parameterized queries to prevent SQL injection

### Requirement 10

**User Story:** 作為系統管理員，我想要使用 Cloudflare R2 儲存產品圖片，以便提供快速、可靠且成本效益高的圖片服務。

#### Acceptance Criteria

1. WHEN uploading product images THEN the Quote List System SHALL store images in a Cloudflare R2 Bucket
2. WHEN a product page displays an image THEN the Quote List System SHALL serve the image from the R2 Bucket via a public URL or custom domain
3. WHEN storing images in R2 THEN the Quote List System SHALL organize images using a consistent naming convention based on product_id or SKU
4. WHEN accessing images from R2 THEN the Quote List System SHALL configure appropriate cache headers for optimal performance
5. WHEN the Product Data Source references an image THEN the Quote List System SHALL store the R2 image URL in the image_url field

### Requirement 11

**User Story:** 作為用戶，我想要系統提供良好的 SEO 和快速的頁面載入速度，以便更好的搜尋引擎排名和使用體驗。

#### Acceptance Criteria

1. WHEN generating product pages THEN the Quote List System SHALL include proper meta tags for SEO optimization
2. WHEN a user accesses the site THEN the Quote List System SHALL serve pre-rendered static HTML for optimal performance
3. WHEN loading interactive components THEN the Quote List System SHALL use Astro Islands to minimize JavaScript bundle size
4. WHEN serving images from R2 THEN the Quote List System SHALL optimize image loading with lazy loading and appropriate formats
5. WHEN a search engine crawls the site THEN the Quote List System SHALL provide accessible and indexable content
