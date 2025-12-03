# Admin 後台管理系統使用指南

## 概述

Admin 後台管理系統提供產品管理功能，包括新增、編輯、刪除和批量匯入產品。

## 存取後台

1. 訪問 `/admin` 或 `/admin/login`
2. 輸入管理員密碼
3. 登入成功後自動跳轉到產品列表頁面

## 功能說明

### 產品列表 (`/admin/products`)

- 顯示所有產品的表格視圖
- 包含產品縮圖、名稱、SKU、分類
- 提供編輯和刪除操作按鈕
- 支援分頁瀏覽

### 新增產品 (`/admin/products/new`)

必填欄位：
- **產品 ID**: 唯一識別碼（字母、數字、連字號、底線）
- **產品名稱**: 最多 200 字元
- **SKU**: 庫存單位（字母、數字、連字號、底線）
- **分類**: 從預設分類中選擇
- **產品描述**: 最多 2000 字元
- **產品規格**: JSON 格式

選填欄位：
- **產品圖片**: JPEG、PNG、WebP 格式，最大 5MB

### 編輯產品 (`/admin/products/[id]/edit`)

- 表單預填現有產品資料
- 可更換產品圖片（舊圖片會自動刪除）
- 產品 ID 建立後無法修改

### 刪除產品

- 點擊刪除按鈕會顯示確認對話框
- 確認後產品和相關圖片會被永久刪除
- 此操作無法復原

### 批量匯入 (`/admin/products/import`)

支援 CSV 和 JSON 格式：

**CSV 格式範例：**
```csv
product_id,name_en,sku,category,description_en,specs_json
PROD-001,Product Name,SKU-001,Drinkware,Description,"{""材質"":""不鏽鋼""}"
```

**JSON 格式範例：**
```json
[
  {
    "product_id": "PROD-001",
    "name_en": "Product Name",
    "sku": "SKU-001",
    "category": "Drinkware",
    "description_en": "Description",
    "specs_json": {"材質": "不鏽鋼"}
  }
]
```

**有效分類：**
- Drinkware
- Kitchenware
- Office Supplies
- Electronics
- Furniture
- Home Decor
- Textiles
- Toys
- Sports
- Beauty
- Health
- Automotive
- Garden
- Pet Supplies
- Other

## 環境變數設定

### 產生密碼雜湊

```bash
# macOS/Linux
echo -n "your_password" | shasum -a 256

# 或使用 Node.js
node -e "const crypto = require('crypto'); console.log(crypto.createHash('sha256').update('your_password').digest('hex'))"
```

### 產生 Session Secret

```bash
openssl rand -hex 32
```

### 設定環境變數

在 `.env` 檔案中加入：
```
ADMIN_PASSWORD_HASH=your_sha256_hash_here
SESSION_SECRET=your_random_secret_here
```

在 Cloudflare Pages 中設定：
```bash
wrangler pages secret put ADMIN_PASSWORD_HASH
wrangler pages secret put SESSION_SECRET
```

## 疑難排解

### 無法登入

1. 確認 `ADMIN_PASSWORD_HASH` 環境變數已正確設定
2. 確認密碼雜湊是使用 SHA-256 產生
3. 檢查 `SESSION_SECRET` 是否已設定
4. 確認資料庫連線正常

### 圖片上傳失敗

1. 確認檔案格式為 JPEG、PNG 或 WebP
2. 確認檔案大小不超過 5MB
3. 確認 R2 bucket 已正確設定

### 匯入失敗

1. 確認檔案格式正確（CSV 或 JSON）
2. 檢查錯誤報告中的具體錯誤訊息
3. 確認所有必填欄位都有值
4. 確認分類是有效的預設分類

### Session 過期

- Session 有效期為 24 小時
- 過期後需重新登入
- 登出後 Session 會立即失效
