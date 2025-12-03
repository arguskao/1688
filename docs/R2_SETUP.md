# Cloudflare R2 Setup Instructions

本文檔提供設置 Cloudflare R2 用於產品圖片儲存的詳細步驟。

## 前置要求

- Cloudflare 帳號
- 已安裝 wrangler CLI
- 已登入 wrangler

## 快速開始

### 1. 登入 Cloudflare

```bash
pnpm wrangler login
```

這會打開瀏覽器進行身份驗證。

### 2. 創建 R2 Bucket

```bash
pnpm wrangler r2 bucket create product-images
```

輸出應該類似：
```
✅ Created bucket 'product-images'
```

### 3. 驗證 Bucket 創建

```bash
pnpm wrangler r2 bucket list
```

你應該看到 `product-images` 在列表中。

### 4. 配置 wrangler.toml

R2 bucket 綁定已經在 `wrangler.toml` 中配置好了：

```toml
[[r2_buckets]]
binding = "R2"
bucket_name = "product-images"
```

### 5. 上傳測試圖片

```bash
# 創建測試圖片目錄
mkdir -p test-images

# 下載或創建測試圖片
# 然後上傳
./scripts/upload-to-r2.sh test-images/sample.jpg prod-001
```

### 6. 驗證上傳

```bash
pnpm wrangler r2 object list product-images
```

你應該看到上傳的圖片。

### 7. 本地開發測試

```bash
# 啟動開發伺服器
pnpm run dev
```

訪問 `http://localhost:4321/api/images/products/prod-001.jpg` 來測試圖片 API。

## 詳細配置

### R2 Bucket 設置

#### 創建 Bucket 時的選項

```bash
# 基本創建
pnpm wrangler r2 bucket create product-images

# 指定位置（可選）
pnpm wrangler r2 bucket create product-images --location=apac
```

可用位置：
- `wnam` - Western North America
- `enam` - Eastern North America
- `weur` - Western Europe
- `eeur` - Eastern Europe
- `apac` - Asia-Pacific

### 配置公開訪問（可選）

如果你想直接從 R2 提供圖片而不通過 API：

1. 在 Cloudflare Dashboard 中：
   - 進入 R2
   - 選擇 `product-images` bucket
   - 點擊 "Settings"
   - 啟用 "Public Access"
   - 配置自訂域名（推薦）

2. 更新環境變數：
```bash
# .env
PUBLIC_R2_DOMAIN=https://images.yourdomain.com
```

### 配置 CORS（如果需要）

如果需要從其他域名訪問圖片：

```bash
# 創建 CORS 配置文件
cat > r2-cors.json << EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF

# 應用 CORS 配置
pnpm wrangler r2 bucket cors put product-images --file=r2-cors.json
```

## 上傳圖片

### 方法 1: 使用 Shell 腳本（推薦）

```bash
./scripts/upload-to-r2.sh <image-path> <product-id>

# 範例
./scripts/upload-to-r2.sh ./images/bottle.jpg prod-001
./scripts/upload-to-r2.sh ./images/board.png prod-002
```

### 方法 2: 直接使用 wrangler

```bash
pnpm wrangler r2 object put product-images/products/prod-001.jpg --file=./images/bottle.jpg
```

### 方法 3: 批量上傳

創建批量上傳腳本：

```bash
#!/bin/bash
# scripts/bulk-upload-products.sh

# 定義產品 ID 和對應的圖片檔案
declare -A products=(
  ["prod-001"]="images/bottle.jpg"
  ["prod-002"]="images/board.png"
  ["prod-003"]="images/lamp.jpg"
  ["prod-004"]="images/speaker.jpg"
  ["prod-005"]="images/chair.jpg"
)

# 上傳每個產品圖片
for product_id in "${!products[@]}"; do
  image_file="${products[$product_id]}"
  echo "Uploading $image_file for $product_id..."
  ./scripts/upload-to-r2.sh "$image_file" "$product_id"
done

echo "All images uploaded!"
```

使用：
```bash
chmod +x scripts/bulk-upload-products.sh
./scripts/bulk-upload-products.sh
```

## 管理 R2 物件

### 列出物件

```bash
# 列出所有物件
pnpm wrangler r2 object list product-images

# 列出特定前綴
pnpm wrangler r2 object list product-images --prefix=products/

# 限制結果數量
pnpm wrangler r2 object list product-images --limit=10
```

### 下載物件

```bash
pnpm wrangler r2 object get product-images/products/prod-001.jpg --file=./downloaded.jpg
```

### 刪除物件

```bash
# 刪除單個物件
pnpm wrangler r2 object delete product-images/products/prod-001.jpg

# 確認刪除
pnpm wrangler r2 object delete product-images/products/prod-001.jpg --force
```

### 查看物件資訊

```bash
pnpm wrangler r2 object info product-images/products/prod-001.jpg
```

## 環境配置

### 開發環境

開發環境使用本地 wrangler 配置：

```bash
# .dev.vars
# R2 會自動綁定，無需額外配置
```

### 生產環境

部署到 Cloudflare Pages 時，R2 綁定會自動配置。

如果需要環境變數：

```bash
# 設置生產環境變數
pnpm wrangler pages secret put PUBLIC_R2_DOMAIN
# 輸入: https://images.yourdomain.com
```

## 測試 R2 整合

### 1. 單元測試

```bash
# 運行 R2 工具函數測試
pnpm vitest run src/lib/r2.test.ts
```

### 2. 本地測試

```bash
# 啟動開發伺服器
pnpm run dev

# 在另一個終端測試 API
curl http://localhost:4321/api/images/products/prod-001.jpg -I
```

應該返回：
```
HTTP/1.1 200 OK
Content-Type: image/jpeg
Cache-Control: public, max-age=31536000, immutable
```

### 3. 整合測試

創建測試腳本：

```bash
#!/bin/bash
# scripts/test-r2-integration.sh

echo "Testing R2 integration..."

# 1. 上傳測試圖片
echo "1. Uploading test image..."
./scripts/upload-to-r2.sh test-images/test.jpg test-product

# 2. 驗證上傳
echo "2. Verifying upload..."
pnpm wrangler r2 object list product-images --prefix=products/test-product

# 3. 測試 API 端點
echo "3. Testing API endpoint..."
curl -I http://localhost:4321/api/images/products/test-product.jpg

# 4. 清理
echo "4. Cleaning up..."
pnpm wrangler r2 object delete product-images/products/test-product.jpg

echo "Test complete!"
```

## 監控和維護

### 查看 Bucket 使用情況

在 Cloudflare Dashboard 中：
1. 進入 R2
2. 選擇 `product-images` bucket
3. 查看 "Metrics" 標籤

### 設置告警

在 Cloudflare Dashboard 中設置告警：
- 儲存空間使用量
- 請求數量
- 錯誤率

### 備份策略

定期備份重要圖片：

```bash
#!/bin/bash
# scripts/backup-r2-images.sh

BACKUP_DIR="./backups/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# 列出所有物件並下載
pnpm wrangler r2 object list product-images --prefix=products/ | \
  grep -o 'products/[^"]*' | \
  while read object_key; do
    filename=$(basename "$object_key")
    pnpm wrangler r2 object get "product-images/$object_key" --file="$BACKUP_DIR/$filename"
  done

echo "Backup completed to $BACKUP_DIR"
```

## 故障排除

### 問題 1: 無法創建 Bucket

**錯誤**: `Error: You do not have permission to create buckets`

**解決方案**:
1. 確認已登入: `pnpm wrangler whoami`
2. 檢查帳號權限
3. 確認 R2 已在你的 Cloudflare 計劃中啟用

### 問題 2: 上傳失敗

**錯誤**: `Error: Failed to upload object`

**解決方案**:
1. 檢查檔案是否存在
2. 檢查檔案大小（R2 單個物件限制為 5TB）
3. 檢查網路連接
4. 重新登入: `pnpm wrangler login`

### 問題 3: API 返回 404

**錯誤**: 訪問 `/api/images/products/prod-001.jpg` 返回 404

**解決方案**:
1. 確認圖片已上傳: `pnpm wrangler r2 object list product-images`
2. 檢查 object key 是否正確
3. 確認 R2 綁定配置正確
4. 重啟開發伺服器

### 問題 4: 圖片無法顯示

**解決方案**:
1. 檢查瀏覽器控制台錯誤
2. 驗證 Content-Type 標頭
3. 檢查 CORS 配置
4. 測試直接訪問 API 端點

## 成本估算

Cloudflare R2 定價（2024）：

### 儲存成本
- $0.015 per GB per month

範例：
- 1000 張圖片 × 500KB = 500MB
- 月成本: 0.5GB × $0.015 = $0.0075

### 操作成本
- Class A (寫入): $4.50 per million requests
- Class B (讀取): $0.36 per million requests

範例：
- 每月 10,000 次上傳 = $0.045
- 每月 100,000 次讀取 = $0.036

### 出站流量
- **免費！** 這是 R2 的主要優勢

### 總成本估算
對於中小型產品目錄：
- 儲存: ~$0.01/月
- 操作: ~$0.10/月
- **總計: ~$0.11/月**

非常經濟實惠！

## 最佳實踐

### 1. 圖片優化

上傳前優化圖片以節省儲存和頻寬：

```bash
# 使用 ImageMagick
convert input.jpg -quality 85 -strip output.jpg

# 使用 cwebp 轉換為 WebP
cwebp -q 85 input.jpg -o output.webp
```

### 2. 命名規範

遵循一致的命名規範：
- 使用產品 ID: `products/prod-001.jpg`
- 或使用 SKU: `products/SSB-500-BLK.jpg`
- 多尺寸: `products/prod-001-thumb.jpg`, `products/prod-001-large.jpg`

### 3. 版本控制

如果需要更新圖片：
- 選項 1: 覆蓋現有檔案（需要清除快取）
- 選項 2: 使用版本號: `products/prod-001-v2.jpg`

### 4. 監控使用量

定期檢查：
- 儲存空間使用量
- 請求數量
- 錯誤率

### 5. 安全性

- 不要在圖片中包含敏感資訊
- 使用適當的 CORS 配置
- 定期審查訪問日誌

## 下一步

完成 R2 設置後：

1. ✅ 上傳產品圖片
2. ✅ 更新 `src/data/products.json` 中的 `image_url`
3. ✅ 測試圖片顯示
4. ✅ 部署到生產環境

## 相關文件

- [R2 Image Storage Guide](./R2_IMAGE_STORAGE_GUIDE.md) - 詳細使用指南
- [Products Guide](./PRODUCTS_GUIDE.md) - 產品資料管理
- [Cloudflare R2 官方文檔](https://developers.cloudflare.com/r2/)

## 支援

如有問題：
1. 查看 [Cloudflare R2 文檔](https://developers.cloudflare.com/r2/)
2. 檢查 [Cloudflare Community](https://community.cloudflare.com/)
3. 查看專案 issues
