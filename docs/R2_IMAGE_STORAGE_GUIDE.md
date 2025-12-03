# Cloudflare R2 Image Storage Guide

本指南說明如何使用 Cloudflare R2 儲存和提供產品圖片。

## 概述

系統使用 Cloudflare R2 作為產品圖片的物件儲存服務，提供：
- 低成本的圖片儲存
- 全球 CDN 分發
- 高可用性和耐久性
- 自動快取優化

## 架構

```
產品圖片流程：
1. 上傳圖片到 R2 bucket (使用 wrangler 或上傳腳本)
2. 圖片儲存在 R2，路徑為: products/{product_id}.{ext}
3. 前端通過 API 端點訪問: /api/images/products/{product_id}.{ext}
4. API 從 R2 讀取圖片並返回，帶有適當的快取標頭
```

## 設置步驟

### 1. 創建 R2 Bucket

```bash
# 創建名為 product-images 的 R2 bucket
pnpm wrangler r2 bucket create product-images
```

### 2. 配置 wrangler.toml

R2 bucket 綁定已在 `wrangler.toml` 中配置：

```toml
[[r2_buckets]]
binding = "R2"
bucket_name = "product-images"
```

### 3. 部署應用

```bash
# 構建並部署
pnpm run build
pnpm wrangler pages deploy dist
```

## 上傳圖片

### 方法 1: 使用 wrangler 命令

```bash
# 直接使用 wrangler 上傳
pnpm wrangler r2 object put product-images/products/prod-001.jpg --file=./images/bottle.jpg
```

### 方法 2: 使用上傳腳本

```bash
# 使用提供的 shell 腳本
chmod +x scripts/upload-to-r2.sh
./scripts/upload-to-r2.sh ./images/bottle.jpg prod-001
```

### 方法 3: 使用 TypeScript 工具

```bash
# 使用 TypeScript 上傳工具（需要配置 R2 API 憑證）
pnpm tsx scripts/upload-images.ts ./images/bottle.jpg prod-001
```

## 命名規範

所有產品圖片遵循統一的命名規範：

```
products/{product_id}.{extension}
```

範例：
- `products/prod-001.jpg`
- `products/SSB-500-BLK.png`
- `products/prod-003.webp`

## 訪問圖片

### 通過 API 端點

推薦方式，提供適當的快取標頭：

```
/api/images/products/prod-001.jpg
```

API 端點特性：
- 自動設置 Content-Type
- 快取標頭: `Cache-Control: public, max-age=31536000, immutable`
- 支援 ETag
- CORS 支援

### 使用輔助函數

```typescript
import { getImageUrl, generateImageKey } from '@/lib/r2';

// 生成圖片 URL
const imageUrl = getImageUrl('prod-001', 'jpg');
// 返回: /api/images/products/prod-001.jpg

// 生成 R2 object key
const key = generateImageKey('prod-001', 'jpg');
// 返回: products/prod-001.jpg
```

## 更新產品資料

上傳圖片後，更新 `src/data/products.json` 中的 `image_url` 欄位：

```json
{
  "product_id": "prod-001",
  "name_en": "Stainless Steel Water Bottle",
  "image_url": "/api/images/products/prod-001.jpg"
}
```

## 快取策略

### R2 API 端點快取標頭

```
Cache-Control: public, max-age=31536000, immutable
```

這意味著：
- `public`: 可被任何快取儲存
- `max-age=31536000`: 快取 1 年
- `immutable`: 內容不會改變

### 更新圖片

如果需要更新圖片：
1. 上傳新圖片到相同的 key
2. 或使用新的檔名並更新 products.json

## 支援的圖片格式

- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- GIF (`.gif`)
- WebP (`.webp`)
- SVG (`.svg`)

## 最佳實踐

### 1. 圖片優化

上傳前優化圖片：
```bash
# 使用 ImageMagick 優化 JPEG
convert input.jpg -quality 85 -strip output.jpg

# 轉換為 WebP 格式
cwebp -q 85 input.jpg -o output.webp
```

### 2. 響應式圖片

考慮提供多種尺寸：
```
products/prod-001-thumb.jpg    (縮圖, 200x200)
products/prod-001-medium.jpg   (中等, 800x800)
products/prod-001-large.jpg    (大圖, 1600x1600)
```

### 3. 使用 WebP 格式

WebP 提供更好的壓縮率：
```typescript
// 在產品資料中提供多種格式
{
  "image_url": "/api/images/products/prod-001.webp",
  "image_url_fallback": "/api/images/products/prod-001.jpg"
}
```

### 4. 延遲載入

在前端使用延遲載入：
```html
<img 
  src="/api/images/products/prod-001.jpg" 
  loading="lazy"
  alt="Product name"
/>
```

## 批量上傳

創建批量上傳腳本：

```bash
#!/bin/bash
# scripts/bulk-upload.sh

for file in ./images/*.jpg; do
  filename=$(basename "$file" .jpg)
  ./scripts/upload-to-r2.sh "$file" "$filename"
done
```

## 監控和管理

### 查看 bucket 內容

```bash
# 列出所有物件
pnpm wrangler r2 object list product-images

# 列出特定前綴
pnpm wrangler r2 object list product-images --prefix=products/
```

### 刪除物件

```bash
# 刪除單個物件
pnpm wrangler r2 object delete product-images/products/prod-001.jpg
```

### 下載物件

```bash
# 下載物件
pnpm wrangler r2 object get product-images/products/prod-001.jpg --file=./downloaded.jpg
```

## 成本考量

Cloudflare R2 定價（截至 2024）：
- 儲存: $0.015/GB/月
- Class A 操作 (寫入): $4.50/百萬次
- Class B 操作 (讀取): $0.36/百萬次
- 出站流量: 免費（這是 R2 的主要優勢）

對於典型的產品目錄：
- 1000 張圖片，每張 500KB = 500MB
- 月儲存成本: ~$0.0075
- 非常經濟實惠！

## 故障排除

### 圖片無法顯示

1. 檢查 R2 bucket 是否存在：
```bash
pnpm wrangler r2 bucket list
```

2. 檢查物件是否上傳成功：
```bash
pnpm wrangler r2 object list product-images --prefix=products/
```

3. 檢查 wrangler.toml 配置是否正確

4. 檢查 API 端點是否正常工作：
```bash
curl http://localhost:8788/api/images/products/prod-001.jpg
```

### 上傳失敗

1. 確認已登入 Cloudflare：
```bash
pnpm wrangler login
```

2. 確認有 R2 權限

3. 檢查檔案路徑是否正確

## 進階配置

### 自訂域名

配置自訂域名以提供更好的 URL：

1. 在 Cloudflare Dashboard 中設置 R2 自訂域名
2. 更新 `src/lib/r2.ts` 中的 `R2_PUBLIC_DOMAIN`
3. 使用 `getR2PublicUrl()` 函數生成 URL

### 圖片轉換

考慮使用 Cloudflare Images 進行即時圖片轉換：
- 自動調整大小
- 格式轉換
- 優化壓縮

## 相關文件

- [Cloudflare R2 文檔](https://developers.cloudflare.com/r2/)
- [Wrangler R2 命令](https://developers.cloudflare.com/workers/wrangler/commands/#r2)
- [產品資料指南](./PRODUCTS_GUIDE.md)

## 總結

Cloudflare R2 提供了一個經濟實惠、高效能的圖片儲存解決方案。通過遵循本指南的最佳實踐，你可以：
- 輕鬆管理產品圖片
- 提供快速的圖片載入
- 降低運營成本
- 確保高可用性
