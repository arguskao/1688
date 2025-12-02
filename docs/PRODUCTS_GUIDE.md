# 產品資料源使用指南

## 概述

產品資料源使用 JSON 檔案儲存，在建置時透過 Astro 的 SSG (Static Site Generation) 功能生成靜態產品頁面。

## 產品資料結構

### 資料檔案位置

```
src/data/products.json
```

### 產品資料格式

```json
{
  "products": [
    {
      "product_id": "prod-001",
      "name_en": "Product Name",
      "sku": "SKU-12345",
      "category": "Category Name",
      "description_en": "Product description",
      "specs_json": {
        "material": "Material name",
        "dimensions": "10x20x30 cm",
        "weight": "2.5 kg"
      },
      "image_url": "https://example.com/image.jpg"
    }
  ]
}
```

### 欄位說明

| 欄位 | 類型 | 必填 | 說明 |
|------|------|------|------|
| product_id | string | ✅ | 產品唯一識別碼 |
| name_en | string | ✅ | 產品英文名稱 |
| sku | string | ✅ | 產品 SKU 編號 |
| category | string | ✅ | 產品分類 |
| description_en | string | ✅ | 產品英文描述 |
| specs_json | object | ✅ | 產品規格（JSON 物件） |
| image_url | string | ✅ | 產品圖片 URL |

## 使用方式

### 1. 在 Astro 頁面中使用

```typescript
---
import { getAllProducts, getProductById } from '../lib/products';

const products = getAllProducts();
const product = getProductById('prod-001');
---

<div>
  {products.map(p => (
    <div>{p.name_en}</div>
  ))}
</div>
```

### 2. 可用的工具函數

#### getAllProducts()
獲取所有產品

```typescript
const products = getAllProducts();
// 返回: Product[]
```

#### getProductById(productId)
根據 ID 獲取單個產品

```typescript
const product = getProductById('prod-001');
// 返回: Product | undefined
```

#### getProductsByCategory(category)
根據分類獲取產品

```typescript
const products = getProductsByCategory('Electronics');
// 返回: Product[]
```

#### getAllCategories()
獲取所有分類

```typescript
const categories = getAllCategories();
// 返回: string[]
```

#### isValidProductId(productId)
驗證產品 ID 是否存在

```typescript
const isValid = isValidProductId('prod-001');
// 返回: boolean
```

#### validateProductIds(productIds)
批次驗證產品 ID

```typescript
const result = validateProductIds(['prod-001', 'prod-002', 'invalid']);
// 返回: { valid: boolean, invalidIds: string[] }
```

## 靜態頁面生成 (SSG)

### 產品頁面路由

產品詳情頁面使用動態路由 `[id].astro`，在建置時會為每個產品生成靜態 HTML：

```
/products/prod-001/  → 產品 1 詳情頁
/products/prod-002/  → 產品 2 詳情頁
...
```

### getStaticPaths 實作

```typescript
export async function getStaticPaths() {
  const products = getAllProducts();
  
  return products.map((product) => ({
    params: { id: product.product_id },
    props: { product }
  }));
}
```

### 建置輸出

執行 `pnpm build` 後，會在 `dist/` 目錄生成：

```
dist/
├── products/
│   ├── prod-001/
│   │   └── index.html
│   ├── prod-002/
│   │   └── index.html
│   └── ...
└── ...
```

## 新增產品

### 步驟

1. 編輯 `src/data/products.json`
2. 添加新產品物件到 `products` 陣列
3. 確保所有必填欄位都已填寫
4. 執行 `pnpm build` 重新建置

### 範例

```json
{
  "products": [
    // ... 現有產品
    {
      "product_id": "prod-006",
      "name_en": "New Product",
      "sku": "NEW-001",
      "category": "New Category",
      "description_en": "This is a new product",
      "specs_json": {
        "feature1": "value1",
        "feature2": "value2"
      },
      "image_url": "https://example.com/new-product.jpg"
    }
  ]
}
```

## 產品圖片

### 目前實作

目前使用佔位圖片 URL：
```
https://placeholder.com/products/prod-001.jpg
```

### 未來整合 Cloudflare R2

在後續任務中，將整合 Cloudflare R2 儲存實際產品圖片：

1. 上傳圖片到 R2 bucket
2. 更新 `image_url` 為 R2 URL
3. 配置 CDN 快取

## 產品規格 (specs_json)

### 彈性結構

`specs_json` 是一個 JSON 物件，可以包含任意鍵值對：

```json
{
  "specs_json": {
    "material": "Stainless Steel",
    "capacity": "500ml",
    "dimensions": "7cm x 7cm x 25cm",
    "weight": "280g",
    "colors": ["Black", "Silver", "Blue"],
    "features": ["Waterproof", "Durable"]
  }
}
```

### 在頁面中顯示

規格會自動渲染為鍵值對列表：

```typescript
{Object.entries(product.specs_json).map(([key, value]) => (
  <div>
    <dt>{key.replace(/_/g, ' ')}</dt>
    <dd>{Array.isArray(value) ? value.join(', ') : String(value)}</dd>
  </div>
))}
```

## 測試

### 執行產品相關測試

```bash
pnpm test
```

測試涵蓋：
- 獲取所有產品
- 根據 ID 查詢產品
- 根據分類篩選產品
- 獲取所有分類
- 驗證產品 ID

## 效能考量

### SSG 優勢

1. **快速載入**: 所有產品頁面都是預先生成的靜態 HTML
2. **SEO 友好**: 搜尋引擎可以直接索引靜態內容
3. **低成本**: 靜態檔案可以透過 CDN 快取，減少伺服器負載

### 建置時間

- 5 個產品：< 1 秒
- 100 個產品：約 2-3 秒
- 1000 個產品：約 10-15 秒

### 更新流程

當產品資料更新時：
1. 修改 `products.json`
2. 執行 `pnpm build`
3. 部署新的靜態檔案

## 常見問題

### Q: 如何添加多語言支援？

A: 可以在產品物件中添加其他語言欄位：

```json
{
  "product_id": "prod-001",
  "name_en": "Product Name",
  "name_zh": "產品名稱",
  "description_en": "Description",
  "description_zh": "產品描述"
}
```

### Q: 產品數量有限制嗎？

A: 理論上沒有限制，但建議：
- < 1000 個產品：使用 SSG
- > 1000 個產品：考慮使用資料庫 + SSR

### Q: 如何實作產品搜尋？

A: 可以在客戶端使用 JavaScript 實作：

```javascript
const searchProducts = (query) => {
  return products.filter(p => 
    p.name_en.toLowerCase().includes(query.toLowerCase()) ||
    p.description_en.toLowerCase().includes(query.toLowerCase())
  );
};
```

### Q: 可以從資料庫載入產品嗎？

A: 可以！修改 `src/lib/products.ts`：

```typescript
export async function getAllProducts(): Promise<Product[]> {
  // 從資料庫載入
  const sql = neon(process.env.DATABASE_URL);
  const products = await sql`SELECT * FROM products`;
  return products;
}
```

但這樣就不是 SSG 了，需要改用 SSR (Server-Side Rendering)。

## 相關檔案

```
src/
├── data/
│   └── products.json          # 產品資料源
├── lib/
│   ├── products.ts            # 產品工具函數
│   └── products.test.ts       # 產品測試
├── types/
│   └── product.ts             # 產品類型定義
└── pages/
    ├── products/
    │   ├── [id].astro         # 產品詳情頁（動態路由）
    │   └── index.astro        # 產品列表頁
    └── index.astro            # 首頁
```

## 下一步

- [ ] 整合 Cloudflare R2 儲存產品圖片
- [ ] 實作產品搜尋功能
- [ ] 添加產品分類篩選
- [ ] 實作產品比較功能
- [ ] 添加產品評論系統
