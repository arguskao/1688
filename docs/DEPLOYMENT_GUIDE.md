# Deployment Guide

本指南說明如何將詢價清單系統部署到 Cloudflare Pages。

## 概述

系統使用以下 Cloudflare 服務：
- **Cloudflare Pages**: 靜態網站託管和 Serverless Functions
- **Cloudflare R2**: 產品圖片儲存
- **Neon**: PostgreSQL 資料庫（外部服務）
- **Resend/SendGrid/Mailgun**: 郵件服務（外部服務）

## 前置要求

### 必需工具

- Node.js 18+ 和 pnpm
- Wrangler CLI (`pnpm install -g wrangler`)
- PostgreSQL 客戶端 (psql)
- Git

### 必需帳號

- Cloudflare 帳號（免費方案即可）
- Neon 帳號（資料庫）
- Resend/SendGrid/Mailgun 帳號（郵件服務）

## 部署步驟

### 1. 準備工作

#### 1.1 登入 Cloudflare

```bash
wrangler login
```

這會打開瀏覽器進行身份驗證。

#### 1.2 驗證登入

```bash
wrangler whoami
```

應該顯示你的 Cloudflare 帳號資訊。

### 2. 設置資料庫

#### 2.1 創建 Neon 專案

1. 前往 [Neon Console](https://console.neon.tech)
2. 點擊 "Create Project"
3. 選擇區域（建議選擇離用戶最近的區域）
4. 記下資料庫連接字串

#### 2.2 執行資料庫遷移

```bash
# 設置資料庫 URL
export DATABASE_URL='postgresql://user:password@host/database?sslmode=require'

# 執行遷移
./scripts/migrate-database.sh production
```

或使用 psql 直接執行：

```bash
psql $DATABASE_URL -f migrations/0001_initial.sql
```

#### 2.3 驗證資料庫

```bash
# 連接到資料庫
psql $DATABASE_URL

# 列出所有表
\dt

# 應該看到：
# - quotes
# - quote_items

# 退出
\q
```

### 3. 設置 R2 儲存

#### 3.1 創建 R2 Bucket

```bash
pnpm wrangler r2 bucket create product-images
```

#### 3.2 驗證 Bucket

```bash
pnpm wrangler r2 bucket list
```

應該看到 `product-images` 在列表中。

#### 3.3 上傳產品圖片（可選）

```bash
# 使用上傳腳本
./scripts/upload-to-r2.sh ./images/product-001.jpg prod-001

# 或直接使用 wrangler
pnpm wrangler r2 object put product-images/products/prod-001.jpg --file=./images/product-001.jpg
```

### 4. 配置環境變數

#### 4.1 設置 Cloudflare Secrets

```bash
# 設置資料庫 URL
wrangler pages secret put DATABASE_URL
# 輸入: postgresql://user:password@host/database?sslmode=require

# 設置郵件 API 金鑰
wrangler pages secret put EMAIL_API_KEY
# 輸入: 你的郵件服務 API 金鑰

# 設置業務郵箱
wrangler pages secret put BUSINESS_EMAIL
# 輸入: business@example.com
```

#### 4.2 驗證 Secrets

```bash
# 列出所有 secrets（不會顯示值）
wrangler pages secret list
```

應該看到：
- DATABASE_URL
- EMAIL_API_KEY
- BUSINESS_EMAIL

### 5. 構建和部署

#### 5.1 構建專案

```bash
pnpm install
pnpm run build
```

驗證構建成功：
- 檢查 `dist/` 目錄是否存在
- 應該包含靜態 HTML 檔案和 `_worker.js`

#### 5.2 部署到 Cloudflare Pages

```bash
pnpm wrangler pages deploy dist
```

首次部署時，會詢問專案名稱：
- 輸入: `quote-list-system`（或你喜歡的名稱）

#### 5.3 記錄部署 URL

部署成功後，會顯示 URL：
```
✨ Deployment complete! Take a peek over at https://quote-list-system.pages.dev
```

### 6. 驗證部署

#### 6.1 訪問網站

打開瀏覽器訪問部署 URL：
```
https://quote-list-system.pages.dev
```

#### 6.2 測試功能

1. **瀏覽產品頁面**
   - 訪問 `/products`
   - 檢查產品列表是否顯示

2. **測試詢價清單**
   - 點擊 "加入詢價清單"
   - 訪問 `/quote-list`
   - 檢查產品是否在清單中

3. **測試提交詢價**
   - 填寫聯絡資訊
   - 提交詢價
   - 檢查是否收到成功訊息

4. **驗證資料庫**
   ```bash
   psql $DATABASE_URL -c "SELECT * FROM quotes ORDER BY created_at DESC LIMIT 5;"
   ```

5. **檢查郵件**
   - 確認業務郵箱收到詢價通知

### 7. 配置自訂域名（可選）

#### 7.1 在 Cloudflare Dashboard 中配置

1. 前往 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 選擇你的 Pages 專案
3. 點擊 "Custom domains"
4. 添加你的域名

#### 7.2 更新 DNS

按照 Cloudflare 的指示更新 DNS 記錄。

## 環境管理

### 生產環境

```bash
# 部署到生產環境
pnpm wrangler pages deploy dist --env production
```

### 測試環境

```bash
# 部署到測試環境
pnpm wrangler pages deploy dist --env staging
```

### 查看部署

```bash
# 列出所有部署
pnpm wrangler pages deployment list
```

## 更新部署

### 更新代碼

```bash
# 1. 拉取最新代碼
git pull

# 2. 安裝依賴
pnpm install

# 3. 運行測試
pnpm test

# 4. 構建
pnpm run build

# 5. 部署
pnpm wrangler pages deploy dist
```

### 更新環境變數

```bash
# 更新 secret
wrangler pages secret put DATABASE_URL

# 刪除 secret
wrangler pages secret delete OLD_SECRET
```

### 回滾部署

```bash
# 列出部署歷史
pnpm wrangler pages deployment list

# 回滾到特定部署
pnpm wrangler pages deployment rollback <deployment-id>
```

## 監控和日誌

### 查看日誌

```bash
# 實時查看日誌
pnpm wrangler pages deployment tail
```

### Cloudflare Dashboard

1. 前往 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 選擇你的 Pages 專案
3. 查看：
   - Analytics（分析）
   - Logs（日誌）
   - Deployments（部署歷史）

### 設置告警

在 Cloudflare Dashboard 中設置告警：
- 錯誤率過高
- 請求量異常
- 部署失敗

## 效能優化

### 1. 啟用 Cloudflare CDN

Cloudflare Pages 自動使用 CDN，無需額外配置。

### 2. 配置快取

在 `wrangler.toml` 中配置快取規則（已配置）。

### 3. 優化圖片

```bash
# 使用 WebP 格式
cwebp -q 85 input.jpg -o output.webp

# 上傳到 R2
./scripts/upload-to-r2.sh output.webp prod-001
```

### 4. 監控效能

使用 Cloudflare Analytics 監控：
- 頁面載入時間
- API 響應時間
- 錯誤率

## 安全配置

### 1. 啟用 HTTPS

Cloudflare Pages 自動提供 HTTPS，無需額外配置。

### 2. 配置 CSP

在 `public/_headers` 中配置 Content Security Policy：

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

### 3. 速率限制

已在 API 中配置速率限制（每分鐘 10 個請求）。

### 4. 定期更新密鑰

```bash
# 每 90 天更新一次
wrangler pages secret put EMAIL_API_KEY
wrangler pages secret put DATABASE_URL
```

## 備份策略

### 資料庫備份

```bash
# 備份資料庫
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# 恢復資料庫
psql $DATABASE_URL < backup-20240101.sql
```

### R2 備份

```bash
# 下載所有圖片
pnpm wrangler r2 object list product-images | \
  grep -o 'products/[^"]*' | \
  while read key; do
    pnpm wrangler r2 object get "product-images/$key" --file="backup/$key"
  done
```

## 故障排除

### 問題 1: 部署失敗

**錯誤**: `Error: Build failed`

**解決方案**:
1. 檢查構建日誌
2. 本地運行 `pnpm run build`
3. 修復錯誤後重新部署

### 問題 2: 資料庫連接失敗

**錯誤**: `Error: connect ECONNREFUSED`

**解決方案**:
1. 檢查 `DATABASE_URL` secret 是否正確
2. 驗證 Neon 專案是否啟動
3. 檢查 IP 白名單設置

### 問題 3: 郵件發送失敗

**錯誤**: `Email service error: 401`

**解決方案**:
1. 檢查 `EMAIL_API_KEY` secret
2. 驗證 API 金鑰是否有效
3. 檢查郵件服務帳戶狀態

### 問題 4: R2 圖片無法載入

**錯誤**: `404 Not Found`

**解決方案**:
1. 檢查 R2 bucket 是否存在
2. 驗證圖片已上傳
3. 檢查 `wrangler.toml` 綁定配置

## 部署檢查清單

### 部署前

- [ ] 所有測試通過 (`pnpm test`)
- [ ] 構建成功 (`pnpm run build`)
- [ ] 環境變數已配置
- [ ] 資料庫遷移已執行
- [ ] R2 bucket 已創建
- [ ] 產品圖片已上傳

### 部署後

- [ ] 網站可訪問
- [ ] 產品頁面正常顯示
- [ ] 詢價清單功能正常
- [ ] 提交詢價成功
- [ ] 資料庫記錄正確
- [ ] 郵件通知收到
- [ ] 圖片正常載入
- [ ] 速率限制生效

### 監控

- [ ] 設置 Cloudflare 告警
- [ ] 監控錯誤率
- [ ] 檢查效能指標
- [ ] 定期備份資料庫

## 持續部署（CI/CD）

### GitHub Actions 範例

創建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests
        run: pnpm test
      
      - name: Build
        run: pnpm run build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: quote-list-system
          directory: dist
```

## 成本估算

### Cloudflare Pages
- 免費方案：
  - 500 次構建/月
  - 無限請求
  - 100GB 頻寬/月

### Cloudflare R2
- 儲存: $0.015/GB/月
- 操作: 免費（前 100 萬次）
- 出站流量: 免費

### Neon
- 免費方案：
  - 0.5GB 儲存
  - 100 小時計算時間/月

### 郵件服務（Resend）
- 免費方案：
  - 3,000 封郵件/月

**總計**: 小型專案可完全使用免費方案！

## 相關文檔

- [Environment Variables Guide](./ENVIRONMENT_VARIABLES_GUIDE.md)
- [Neon Setup Guide](./NEON_SETUP.md)
- [R2 Setup Guide](./R2_SETUP.md)
- [Email Service Guide](./EMAIL_SERVICE_GUIDE.md)

## 支援

如有問題：
1. 查看 [Cloudflare Pages 文檔](https://developers.cloudflare.com/pages/)
2. 查看 [Wrangler 文檔](https://developers.cloudflare.com/workers/wrangler/)
3. 查看專案 README
4. 提交 Issue

## 總結

遵循本指南可以成功部署詢價清單系統到 Cloudflare Pages。關鍵步驟：

1. ✅ 設置資料庫（Neon）
2. ✅ 創建 R2 bucket
3. ✅ 配置環境變數
4. ✅ 構建專案
5. ✅ 部署到 Cloudflare Pages
6. ✅ 驗證功能
7. ✅ 監控和維護

祝部署順利！🚀
