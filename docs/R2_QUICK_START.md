# R2 Quick Start Guide

快速開始使用 Cloudflare R2 儲存產品圖片。

## 5 分鐘快速設置

### 1. 創建 R2 Bucket

```bash
pnpm wrangler login
pnpm wrangler r2 bucket create product-images
```

### 2. 上傳圖片

```bash
# 使用上傳腳本
./scripts/upload-to-r2.sh ./images/your-image.jpg prod-001

# 或直接使用 wrangler
pnpm wrangler r2 object put product-images/products/prod-001.jpg --file=./images/your-image.jpg
```

### 3. 更新產品資料

編輯 `src/data/products.json`：

```json
{
  "product_id": "prod-001",
  "image_url": "/api/images/products/prod-001.jpg"
}
```

### 4. 測試

```bash
# 啟動開發伺服器
pnpm run dev

# 訪問圖片
# http://localhost:4321/api/images/products/prod-001.jpg
```

## 完成！

你的產品圖片現在通過 R2 提供，享受：
- ✅ 全球 CDN 分發
- ✅ 自動快取優化
- ✅ 零出站流量費用
- ✅ 高可用性

## 詳細文檔

- [R2 Setup Guide](./R2_SETUP.md) - 完整設置指南
- [R2 Image Storage Guide](./R2_IMAGE_STORAGE_GUIDE.md) - 使用指南

## 命名規範

所有圖片使用以下格式：
```
products/{product_id}.{extension}
```

範例：
- `products/prod-001.jpg`
- `products/prod-002.png`
- `products/SSB-500-BLK.webp`

## 常用命令

```bash
# 列出所有圖片
pnpm wrangler r2 object list product-images

# 下載圖片
pnpm wrangler r2 object get product-images/products/prod-001.jpg --file=./downloaded.jpg

# 刪除圖片
pnpm wrangler r2 object delete product-images/products/prod-001.jpg
```

## 故障排除

### 圖片無法顯示？

1. 檢查圖片是否上傳：
```bash
pnpm wrangler r2 object list product-images --prefix=products/
```

2. 檢查 URL 格式：
```
正確: /api/images/products/prod-001.jpg
錯誤: /images/products/prod-001.jpg
```

3. 重啟開發伺服器

### 上傳失敗？

1. 確認已登入：
```bash
pnpm wrangler whoami
```

2. 確認 bucket 存在：
```bash
pnpm wrangler r2 bucket list
```

## 成本

非常便宜！範例：
- 1000 張圖片 (500KB 每張) = 500MB
- 月成本: ~$0.01
- 出站流量: **免費**

## 下一步

- 上傳你的產品圖片
- 更新產品資料
- 部署到生產環境

需要幫助？查看 [完整文檔](./R2_SETUP.md)
