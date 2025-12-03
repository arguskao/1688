# Environment Variables Guide

本指南說明如何配置詢價清單系統的環境變數和密鑰。

## 概述

系統使用環境變數來配置資料庫連接、郵件服務、R2 儲存等功能。環境變數分為兩類：

1. **公開變數** - 可以提交到版本控制（如速率限制配置）
2. **密鑰** - 敏感資訊，不應提交到版本控制（如 API 金鑰、資料庫密碼）

## 快速開始

### 1. 本地開發

```bash
# 複製範例檔案
cp .dev.vars.example .dev.vars
cp .env.example .env

# 編輯 .dev.vars 填入你的配置
nano .dev.vars
```

### 2. 生產環境

```bash
# 設置 Cloudflare Pages 密鑰
wrangler pages secret put DATABASE_URL
wrangler pages secret put EMAIL_API_KEY
wrangler pages secret put BUSINESS_EMAIL
```

## 環境變數列表

### 必需變數

#### DATABASE_URL
- **描述**: PostgreSQL 資料庫連接字串
- **提供者**: Neon
- **格式**: `postgresql://user:password@host/database?sslmode=require`
- **範例**: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`
- **獲取方式**: [Neon Console](https://console.neon.tech) → 你的專案 → Connection Details
- **本地開發**: 在 `.dev.vars` 中設置
- **生產環境**: 使用 `wrangler pages secret put DATABASE_URL`

#### EMAIL_API_KEY
- **描述**: 郵件服務 API 金鑰
- **支援的服務**: Resend, SendGrid, Mailgun
- **格式**: 依服務提供者而定
- **範例**: 
  - Resend: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`
  - SendGrid: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx`
  - Mailgun: `key-xxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **獲取方式**:
  - Resend: https://resend.com/api-keys
  - SendGrid: https://app.sendgrid.com/settings/api_keys
  - Mailgun: https://app.mailgun.com/app/account/security/api_keys
- **本地開發**: 在 `.dev.vars` 中設置
- **生產環境**: 使用 `wrangler pages secret put EMAIL_API_KEY`

#### BUSINESS_EMAIL
- **描述**: 接收詢價通知的業務郵箱
- **格式**: 有效的電子郵件地址
- **範例**: `sales@example.com`
- **本地開發**: 在 `.dev.vars` 中設置
- **生產環境**: 使用 `wrangler pages secret put BUSINESS_EMAIL`

### 可選變數

#### RATE_LIMIT_PER_MINUTE
- **描述**: 每分鐘每個 IP 的最大請求數
- **預設值**: `10`
- **範例**: `10`, `20`, `100`
- **配置位置**: `wrangler.toml` 的 `[vars]` 區塊
- **環境特定配置**:
  - 開發: `100` (寬鬆限制)
  - 測試: `20` (中等限制)
  - 生產: `10` (嚴格限制)

#### R2_BUCKET_NAME
- **描述**: Cloudflare R2 儲存桶名稱
- **預設值**: `product-images`
- **配置位置**: `wrangler.toml` 的 `[[r2_buckets]]` 區塊
- **注意**: 這是綁定配置，不是環境變數

#### R2_PUBLIC_URL
- **描述**: R2 儲存桶的公開 URL（如果使用自訂域名）
- **預設值**: 空（使用 API 端點）
- **範例**: `https://images.yourdomain.com`
- **用途**: 如果配置了 R2 自訂域名，可以直接使用該 URL

#### NODE_ENV
- **描述**: 應用程式環境
- **可能值**: `development`, `production`, `test`
- **預設值**: `production`
- **用途**: 用於條件性啟用某些功能

## 配置檔案

### .dev.vars
用於本地開發的 Cloudflare Workers 環境變數。

```bash
# .dev.vars
DATABASE_URL=postgresql://user:password@host/database
EMAIL_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
BUSINESS_EMAIL=business@example.com
RATE_LIMIT_PER_MINUTE=10
```

**注意**: 
- 此檔案不應提交到版本控制
- 已在 `.gitignore` 中排除
- 使用 `.dev.vars.example` 作為範本

### .env
用於本地開發的通用環境變數。

```bash
# .env
DATABASE_URL=postgresql://user:password@host/database
EMAIL_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
BUSINESS_EMAIL=business@example.com
RATE_LIMIT_PER_MINUTE=10
NODE_ENV=development
```

**注意**:
- 此檔案不應提交到版本控制
- 已在 `.gitignore` 中排除
- 使用 `.env.example` 作為範本

### wrangler.toml
Cloudflare 部署配置檔案。

```toml
[vars]
RATE_LIMIT_PER_MINUTE = "10"

[env.production]
vars = { RATE_LIMIT_PER_MINUTE = "10" }

[env.staging]
vars = { RATE_LIMIT_PER_MINUTE = "20" }
```

**注意**:
- 只包含非敏感的公開變數
- 可以提交到版本控制
- 密鑰使用 `wrangler secret` 命令設置

## 設置步驟

### 本地開發設置

#### 1. 複製範例檔案

```bash
cp .dev.vars.example .dev.vars
cp .env.example .env
```

#### 2. 獲取 Neon 資料庫 URL

1. 前往 [Neon Console](https://console.neon.tech)
2. 選擇你的專案
3. 點擊 "Connection Details"
4. 複製 "Connection string"
5. 貼到 `.dev.vars` 和 `.env` 的 `DATABASE_URL`

#### 3. 獲取郵件服務 API 金鑰

**使用 Resend (推薦)**:
1. 前往 [Resend](https://resend.com)
2. 註冊/登入
3. 前往 [API Keys](https://resend.com/api-keys)
4. 創建新的 API 金鑰
5. 複製金鑰到 `.dev.vars` 和 `.env` 的 `EMAIL_API_KEY`

**使用 SendGrid**:
1. 前往 [SendGrid](https://sendgrid.com)
2. 登入到控制台
3. Settings → API Keys
4. 創建新的 API 金鑰
5. 複製金鑰到 `.dev.vars` 和 `.env`

#### 4. 設置業務郵箱

在 `.dev.vars` 和 `.env` 中設置 `BUSINESS_EMAIL` 為你的業務郵箱地址。

#### 5. 驗證配置

```bash
# 啟動開發伺服器
pnpm run dev

# 測試 API 端點
curl http://localhost:4321/api/quote -X POST \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Test","customerEmail":"test@example.com",...}'
```

### 生產環境設置

#### 1. 登入 Cloudflare

```bash
wrangler login
```

#### 2. 設置密鑰

```bash
# 設置資料庫 URL
wrangler pages secret put DATABASE_URL
# 輸入你的 Neon 連接字串

# 設置郵件 API 金鑰
wrangler pages secret put EMAIL_API_KEY
# 輸入你的郵件服務 API 金鑰

# 設置業務郵箱
wrangler pages secret put BUSINESS_EMAIL
# 輸入你的業務郵箱地址
```

#### 3. 驗證密鑰

```bash
# 列出所有密鑰（不會顯示值）
wrangler pages secret list
```

#### 4. 部署應用

```bash
pnpm run build
wrangler pages deploy dist
```

## 環境特定配置

### 開發環境

```toml
[env.development]
vars = { RATE_LIMIT_PER_MINUTE = "100" }
```

特點：
- 寬鬆的速率限制
- 詳細的日誌輸出
- 使用測試資料庫

### 測試環境

```toml
[env.staging]
vars = { RATE_LIMIT_PER_MINUTE = "20" }
```

特點：
- 中等的速率限制
- 使用測試資料庫
- 模擬生產環境

### 生產環境

```toml
[env.production]
vars = { RATE_LIMIT_PER_MINUTE = "10" }
```

特點：
- 嚴格的速率限制
- 最小化日誌輸出
- 使用生產資料庫

## 安全最佳實踐

### 1. 不要提交密鑰

確保以下檔案在 `.gitignore` 中：

```gitignore
.env
.dev.vars
.env.local
.env.*.local
```

### 2. 使用強密碼

- 資料庫密碼應該至少 16 個字元
- 包含大小寫字母、數字和特殊字元
- 定期更換密碼

### 3. 限制 API 金鑰權限

- 只授予必要的權限
- 使用不同的金鑰用於不同環境
- 定期輪換 API 金鑰

### 4. 監控使用情況

- 定期檢查 API 使用量
- 設置使用量警報
- 監控異常活動

### 5. 使用環境隔離

- 開發、測試、生產使用不同的資料庫
- 使用不同的 API 金鑰
- 避免在生產環境使用測試資料

## 故障排除

### 問題 1: 資料庫連接失敗

**錯誤**: `Error: connect ECONNREFUSED`

**解決方案**:
1. 檢查 `DATABASE_URL` 格式是否正確
2. 確認 Neon 專案是否啟動
3. 檢查網路連接
4. 驗證資料庫憑證

### 問題 2: 郵件發送失敗

**錯誤**: `Email service error: 401 Unauthorized`

**解決方案**:
1. 檢查 `EMAIL_API_KEY` 是否正確
2. 確認 API 金鑰是否有效
3. 檢查郵件服務帳戶狀態
4. 驗證發件人郵箱是否已驗證

### 問題 3: 環境變數未載入

**錯誤**: `undefined` 或 `null` 值

**解決方案**:
1. 確認 `.dev.vars` 檔案存在
2. 檢查變數名稱拼寫
3. 重啟開發伺服器
4. 檢查 `wrangler.toml` 配置

### 問題 4: R2 圖片無法載入

**錯誤**: `404 Not Found`

**解決方案**:
1. 確認 R2 bucket 已創建
2. 檢查 `wrangler.toml` 中的綁定配置
3. 驗證圖片已上傳到 R2
4. 檢查圖片 URL 格式

## 環境變數檢查清單

### 本地開發

- [ ] 複製 `.dev.vars.example` 到 `.dev.vars`
- [ ] 複製 `.env.example` 到 `.env`
- [ ] 設置 `DATABASE_URL`
- [ ] 設置 `EMAIL_API_KEY`
- [ ] 設置 `BUSINESS_EMAIL`
- [ ] 測試資料庫連接
- [ ] 測試郵件發送
- [ ] 啟動開發伺服器

### 生產部署

- [ ] 登入 Cloudflare (`wrangler login`)
- [ ] 設置 `DATABASE_URL` 密鑰
- [ ] 設置 `EMAIL_API_KEY` 密鑰
- [ ] 設置 `BUSINESS_EMAIL` 密鑰
- [ ] 驗證密鑰已設置
- [ ] 創建 R2 bucket
- [ ] 配置 R2 綁定
- [ ] 執行資料庫遷移
- [ ] 部署應用
- [ ] 測試生產環境

## 相關文檔

- [Neon Setup Guide](./NEON_SETUP.md) - Neon 資料庫設置
- [Email Service Guide](./EMAIL_SERVICE_GUIDE.md) - 郵件服務配置
- [R2 Setup Guide](./R2_SETUP.md) - R2 儲存設置
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - 部署指南

## 支援

如有問題：
1. 查看 [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
2. 查看 [Neon 文檔](https://neon.tech/docs)
3. 查看專案 README
4. 提交 Issue

## 總結

正確配置環境變數是系統正常運行的關鍵。請確保：

✅ 所有必需變數都已設置
✅ 密鑰不會提交到版本控制
✅ 使用不同的配置用於不同環境
✅ 定期更新和輪換密鑰
✅ 監控 API 使用情況

遵循本指南可以確保系統安全、穩定地運行！
