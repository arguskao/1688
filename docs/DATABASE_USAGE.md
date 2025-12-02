# 資料庫使用指南

## 快速開始

### 1. 設置資料庫連接

創建 `.dev.vars` 檔案：

```bash
cp .dev.vars.example .dev.vars
```

編輯 `.dev.vars`，填入你的 Neon 連接字串：

```
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### 2. 測試連接

```bash
pnpm db:test
```

### 3. 初始化資料庫

```bash
pnpm db:init
```

## 資料庫架構

### Quotes 表

| 欄位 | 類型 | 說明 |
|------|------|------|
| quote_id | TEXT | 主鍵，UUID |
| customer_name | TEXT | 客戶姓名 |
| customer_email | TEXT | 客戶 Email |
| customer_phone | TEXT | 客戶電話 |
| company_name | TEXT | 公司名稱 |
| message | TEXT | 客戶留言（可為空） |
| created_at | TIMESTAMP | 建立時間 |
| status | TEXT | 狀態（pending/processing/completed/cancelled） |

**索引：**
- `idx_quotes_created_at` - 建立時間索引
- `idx_quotes_email` - Email 索引
- `idx_quotes_status` - 狀態索引

### QuoteItems 表

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | SERIAL | 主鍵，自動遞增 |
| quote_id | TEXT | 外鍵，關聯到 quotes.quote_id |
| product_id | TEXT | 產品 ID |
| quantity | INTEGER | 數量（必須 > 0） |

**索引：**
- `idx_quote_items_quote_id` - Quote ID 索引
- `idx_quote_items_product_id` - Product ID 索引

**外鍵約束：**
- `quote_id` 關聯到 `quotes(quote_id)`，CASCADE DELETE

## 使用範例

### 在 Cloudflare Functions 中使用

```typescript
import { getDbFromLocals } from '../../src/lib/neon';
import { storeQuote } from '../../src/lib/db';
import type { QuoteRequest } from '../../src/types/database';

export const onRequestPost = async (context) => {
  const sql = getDbFromLocals(context.locals);
  
  const request: QuoteRequest = await context.request.json();
  
  try {
    const quoteId = await storeQuote(sql, request);
    
    return new Response(
      JSON.stringify({ success: true, quoteId }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to store quote' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### 儲存詢價單

```typescript
import { storeQuote } from './lib/db';
import type { QuoteRequest } from './types/database';

const request: QuoteRequest = {
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '+886912345678',
  companyName: 'Acme Corporation',
  message: '我想詢問這些產品的價格',
  items: [
    { productId: 'prod-001', quantity: 10 },
    { productId: 'prod-002', quantity: 5 }
  ]
};

const quoteId = await storeQuote(sql, request);
console.log(`Quote created: ${quoteId}`);
```

### 查詢詢價單

```typescript
import { getQuoteById, getQuotes } from './lib/db';

// 根據 ID 查詢
const quote = await getQuoteById(sql, 'quote-uuid-here');
if (quote) {
  console.log(`Customer: ${quote.customer_name}`);
  console.log(`Items: ${quote.items.length}`);
}

// 查詢所有待處理的詢價單
const pendingQuotes = await getQuotes(sql, 'pending');
console.log(`Pending quotes: ${pendingQuotes.length}`);

// 查詢所有詢價單
const allQuotes = await getQuotes(sql);
```

### 更新詢價單狀態

```typescript
import { updateQuoteStatus } from './lib/db';

await updateQuoteStatus(sql, 'quote-uuid-here', 'completed');
```

### 刪除詢價單

```typescript
import { deleteQuote } from './lib/db';

// 會自動刪除關聯的 quote_items（CASCADE）
await deleteQuote(sql, 'quote-uuid-here');
```

## 類型定義

所有類型定義都在 `src/types/database.ts` 中：

```typescript
import type { 
  Quote, 
  QuoteItem, 
  QuoteRequest, 
  QuoteWithItems,
  QuoteStatus 
} from './types/database';
```

### QuoteRequest

用於創建新詢價單的請求格式：

```typescript
interface QuoteRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  message: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}
```

### Quote

資料庫中的詢價單記錄：

```typescript
interface Quote {
  quote_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company_name: string;
  message: string | null;
  created_at: Date;
  status: QuoteStatus;
}
```

### QuoteWithItems

包含詢價項目的完整詢價單：

```typescript
interface QuoteWithItems extends Quote {
  items: QuoteItem[];
}
```

## 錯誤處理

所有資料庫函數都會在失敗時拋出錯誤：

```typescript
try {
  const quoteId = await storeQuote(sql, request);
} catch (error) {
  console.error('Failed to store quote:', error);
  // 處理錯誤
}
```

## 效能優化

### 索引使用

資料庫已經創建了以下索引來優化查詢：

- **created_at**: 用於按時間排序查詢
- **customer_email**: 用於按客戶 Email 查詢
- **status**: 用於按狀態篩選
- **quote_id** (在 quote_items): 用於 JOIN 查詢
- **product_id**: 用於按產品查詢

### 連接池

Neon Serverless 自動處理連接池，無需手動管理。

### 批次操作

如果需要插入大量資料，考慮使用批次插入：

```typescript
// 不推薦：逐個插入
for (const item of items) {
  await sql`INSERT INTO quote_items ...`;
}

// 推薦：批次插入
const values = items.map(item => 
  `('${quoteId}', '${item.productId}', ${item.quantity})`
).join(',');
await sql`INSERT INTO quote_items (quote_id, product_id, quantity) VALUES ${values}`;
```

## 資料庫維護

### 備份

```bash
# 使用 pg_dump 備份
pg_dump $DATABASE_URL > backup.sql

# 或使用 Neon Console 的備份功能
```

### 還原

```bash
psql $DATABASE_URL < backup.sql
```

### 清空資料

```bash
# 清空所有資料但保留表結構
psql $DATABASE_URL -c "TRUNCATE quotes CASCADE;"
```

### 重置資料庫

```bash
# 刪除所有表
psql $DATABASE_URL -c "DROP TABLE IF EXISTS quote_items CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS quotes CASCADE;"

# 重新執行遷移
pnpm db:init
```

## 監控

在 Neon Console 中可以監控：
- 查詢效能
- 資料庫大小
- 連接數
- 慢查詢

## 常見問題

### Q: 如何處理時區？

A: 資料庫使用 UTC 時間。在應用層轉換為本地時區：

```typescript
const localTime = new Date(quote.created_at).toLocaleString('zh-TW', {
  timeZone: 'Asia/Taipei'
});
```

### Q: 如何處理大量資料？

A: 使用分頁查詢：

```typescript
const limit = 50;
const offset = page * limit;

const quotes = await sql`
  SELECT * FROM quotes
  ORDER BY created_at DESC
  LIMIT ${limit} OFFSET ${offset}
`;
```

### Q: 如何搜尋？

A: 使用 PostgreSQL 的全文搜尋：

```typescript
const searchTerm = 'Acme';
const results = await sql`
  SELECT * FROM quotes
  WHERE customer_name ILIKE ${'%' + searchTerm + '%'}
     OR company_name ILIKE ${'%' + searchTerm + '%'}
`;
```

## 相關資源

- [Neon 文檔](https://neon.tech/docs)
- [PostgreSQL 文檔](https://www.postgresql.org/docs/)
- [Neon Serverless Driver](https://github.com/neondatabase/serverless)
