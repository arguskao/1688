# Neon 資料庫設置指南

本專案使用 Neon 作為 Serverless PostgreSQL 資料庫。

## 為什麼選擇 Neon？

- ✅ Serverless PostgreSQL，無需管理伺服器
- ✅ 自動擴展和縮減
- ✅ 快速冷啟動
- ✅ 與 Cloudflare Workers 完美整合
- ✅ 免費方案足夠開發使用

## 設置步驟

### 1. 創建 Neon 專案

1. 前往 [Neon Console](https://console.neon.tech)
2. 註冊或登入帳號
3. 點擊 "Create Project"
4. 選擇區域（建議選擇離你的 Cloudflare 部署區域最近的）
5. 創建專案後，複製連接字串

### 2. 配置本地開發環境

創建 `.dev.vars` 檔案（用於本地開發）：

```bash
cp .dev.vars.example .dev.vars
```

編輯 `.dev.vars`，填入你的 Neon 連接字串：

```
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
EMAIL_API_KEY=your-email-api-key
BUSINESS_EMAIL=your-email@example.com
```

### 3. 執行資料庫遷移

使用 `psql` 或任何 PostgreSQL 客戶端執行遷移：

```bash
# 使用 psql
psql $DATABASE_URL -f migrations/0001_initial.sql

# 或者使用 Neon CLI
neonctl sql-execute --file migrations/0001_initial.sql
```

### 4. 配置生產環境

在 Cloudflare Pages 設置環境變數：

```bash
# 設置 DATABASE_URL
wrangler pages secret put DATABASE_URL

# 設置其他 secrets
wrangler pages secret put EMAIL_API_KEY
```

## 資料庫架構

### Quotes 表

```sql
CREATE TABLE quotes (
  quote_id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  company_name TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status TEXT DEFAULT 'pending'
);
```

### QuoteItems 表

```sql
CREATE TABLE quote_items (
  id SERIAL PRIMARY KEY,
  quote_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  FOREIGN KEY (quote_id) REFERENCES quotes(quote_id) ON DELETE CASCADE
);
```

## 使用範例

### 在 Cloudflare Functions 中使用

```typescript
import { getDbFromLocals } from '../src/lib/neon';

export const onRequestPost = async (context) => {
  const sql = getDbFromLocals(context.locals);
  
  // 執行查詢
  const result = await sql`
    SELECT * FROM quotes WHERE status = 'pending'
  `;
  
  return new Response(JSON.stringify(result));
};
```

### 插入資料

```typescript
const quoteId = crypto.randomUUID();
await sql`
  INSERT INTO quotes (
    quote_id, customer_name, customer_email, 
    customer_phone, company_name, message
  ) VALUES (
    ${quoteId}, ${name}, ${email}, 
    ${phone}, ${company}, ${message}
  )
`;
```

### 查詢資料

```typescript
const quotes = await sql`
  SELECT q.*, 
         json_agg(qi.*) as items
  FROM quotes q
  LEFT JOIN quote_items qi ON q.quote_id = qi.quote_id
  WHERE q.status = 'pending'
  GROUP BY q.quote_id
`;
```

## 效能優化

1. **連接池**: Neon Serverless 自動處理連接池
2. **索引**: 已在遷移檔案中創建必要的索引
3. **查詢優化**: 使用參數化查詢防止 SQL 注入

## 監控和除錯

在 Neon Console 中可以：
- 查看查詢效能
- 監控資料庫使用量
- 查看慢查詢日誌
- 設置告警

## 常見問題

### Q: 如何重置資料庫？

```bash
# 刪除所有表
psql $DATABASE_URL -c "DROP TABLE IF EXISTS quote_items CASCADE;"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS quotes CASCADE;"

# 重新執行遷移
psql $DATABASE_URL -f migrations/0001_initial.sql
```

### Q: 如何備份資料？

```bash
pg_dump $DATABASE_URL > backup.sql
```

### Q: 連接失敗怎麼辦？

1. 確認連接字串正確
2. 確認 `sslmode=require` 參數存在
3. 檢查 Neon 專案是否處於活動狀態
4. 查看 Cloudflare Workers 日誌

## 相關資源

- [Neon 官方文檔](https://neon.tech/docs)
- [Neon Serverless Driver](https://github.com/neondatabase/serverless)
- [Cloudflare Workers + Neon](https://neon.tech/docs/guides/cloudflare-workers)
