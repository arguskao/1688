# Admin API Setup Guide

## 環境變數設置

在 Cloudflare Pages 上設置以下環境變數：

### 1. ADMIN_PASSWORD_HASH

管理員密碼的哈希值。使用以下命令生成：

```bash
npx tsx scripts/generate-password-hash.ts YOUR_PASSWORD
```

例如，密碼 `admin123` 的哈希值：
```
240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
```

### 2. SESSION_SECRET

會話加密密鑰（至少 32 字元的隨機字串）：

```bash
openssl rand -hex 32
```

### 3. DATABASE_URL

Neon PostgreSQL 連接字串（已設置）：
```
postgresql://neondb_owner:npg_LzGQA4kU0OrS@ep-royal-waterfall-a15t3mrk-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 4. R2_BUCKET (可選)

Cloudflare R2 bucket 綁定（用於圖片上傳）

## 在 Cloudflare Pages 設置環境變數

### 方法 1：使用 Wrangler CLI

```bash
# 設置 ADMIN_PASSWORD_HASH
wrangler pages secret put ADMIN_PASSWORD_HASH --project-name=1688
# 輸入哈希值

# 設置 SESSION_SECRET
wrangler pages secret put SESSION_SECRET --project-name=1688
# 輸入密鑰

# 設置 DATABASE_URL
wrangler pages secret put DATABASE_URL --project-name=1688
# 輸入連接字串
```

### 方法 2：使用 Cloudflare Dashboard

1. 前往 Cloudflare Dashboard
2. 選擇 Pages 專案：1688
3. 進入 Settings > Environment variables
4. 添加以下變數：
   - `ADMIN_PASSWORD_HASH`
   - `SESSION_SECRET`
   - `DATABASE_URL`

## API 端點

### 身份驗證

**POST /api/admin/login**
```json
{
  "password": "admin123"
}
```

**POST /api/admin/logout**
```
需要 admin_session cookie
```

### 產品管理

**GET /api/admin/products**
```
查詢參數：
- page: 頁碼（預設 1）
- limit: 每頁數量（預設 20）
- category: 分類篩選（可選）
- search: 搜尋關鍵字（可選）

需要 admin_session cookie
```

**POST /api/admin/products**
```
Content-Type: multipart/form-data

欄位：
- product_id
- name_en
- sku
- category
- description_en
- specs_json (JSON 字串)
- image (檔案，可選)

需要 admin_session cookie
```

**PUT /api/admin/products/:id**
```
Content-Type: multipart/form-data

欄位：同 POST，但 product_id 不可修改

需要 admin_session cookie
```

**DELETE /api/admin/products/:id**
```
需要 admin_session cookie
```

### 產品匯入

**POST /api/admin/products/import**
```
Content-Type: multipart/form-data

欄位：
- file: CSV 或 JSON 檔案（最大 10MB）

需要 admin_session cookie
```

**GET /api/admin/products/import?format=csv|json**
```
下載範本檔案

需要 admin_session cookie
```

## 測試 API

運行測試腳本：

```bash
npx tsx scripts/test-admin-api.ts
```

## 安全注意事項

1. **密碼強度**：使用強密碼（至少 12 字元，包含大小寫字母、數字和符號）
2. **HTTPS**：所有 API 請求必須使用 HTTPS
3. **會話過期**：會話在 24 小時後自動過期
4. **速率限制**：登入端點有速率限制（15 分鐘內最多 5 次嘗試）
5. **Cookie 安全**：會話 cookie 設置為 HttpOnly 和 Secure

## 故障排除

### 401 Unauthorized

- 檢查是否已登入
- 檢查 session cookie 是否有效
- 檢查環境變數是否正確設置

### 500 Internal Server Error

- 檢查 DATABASE_URL 是否正確
- 檢查資料庫連接是否正常
- 查看 Cloudflare Pages 日誌

### 登入失敗

- 檢查 ADMIN_PASSWORD_HASH 是否正確
- 檢查密碼是否正確
- 檢查是否觸發速率限制
