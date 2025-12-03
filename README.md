# 詢價清單系統 (Quote List System)

基於 Astro 和 Cloudflare 技術棧的 B2B 產品詢價解決方案。

## 技術棧

- **Frontend**: Astro 4.x with TypeScript
- **Interactive Components**: React 18.x
- **Styling**: Tailwind CSS 3.x
- **Database**: Neon (Serverless PostgreSQL)
- **Object Storage**: Cloudflare R2
- **Email Service**: Resend / SendGrid / Mailgun
- **Deployment**: Cloudflare Pages + Functions
- **Testing**: Vitest + fast-check

## 開發環境設置

### 1. 安裝依賴

```bash
pnpm install
```

### 2. 配置環境變數

```bash
# 複製環境變數範例檔案
cp .dev.vars.example .dev.vars
cp .env.example .env
```

編輯 `.dev.vars` 和 `.env`，填入以下配置：

- `DATABASE_URL`: Neon 資料庫連接字串
- `EMAIL_API_KEY`: 郵件服務 API 金鑰（Resend/SendGrid/Mailgun）
- `BUSINESS_EMAIL`: 接收詢價通知的業務郵箱
- `RATE_LIMIT_PER_MINUTE`: 速率限制（可選，預設 10）

詳細的環境變數配置說明請參考 [docs/ENVIRONMENT_VARIABLES_GUIDE.md](docs/ENVIRONMENT_VARIABLES_GUIDE.md)

### 3. 設置 Neon 資料庫

1. 前往 [Neon Console](https://console.neon.tech) 創建專案
2. 複製資料庫連接字串到 `.dev.vars` 的 `DATABASE_URL`
3. 詳細說明請參考 [docs/NEON_SETUP.md](docs/NEON_SETUP.md)

### 4. 執行資料庫遷移

```bash
# 使用 psql（需要先安裝 PostgreSQL 客戶端）
psql $DATABASE_URL -f migrations/0001_initial.sql
```

### 5. 啟動開發伺服器

```bash
pnpm dev
```

### 執行測試

```bash
pnpm test
```

### 建置專案

```bash
pnpm build
```

## 部署

### 設置 Neon 資料庫

1. 在 [Neon Console](https://console.neon.tech) 創建新專案
2. 複製連接字串到 `.env` 檔案的 `DATABASE_URL`
3. 執行資料庫遷移：

```bash
# 使用 psql 或其他 PostgreSQL 客戶端執行遷移
psql $DATABASE_URL -f migrations/0001_initial.sql
```

### 設置 Cloudflare R2 儲存桶

```bash
# 創建 R2 bucket
pnpm wrangler r2 bucket create product-images

# 上傳產品圖片
./scripts/upload-to-r2.sh ./images/your-image.jpg prod-001
```

詳細的 R2 設置說明請參考 [docs/R2_QUICK_START.md](docs/R2_QUICK_START.md)

### 部署到 Cloudflare Pages

```bash
pnpm build
wrangler pages deploy dist
```

### 配置環境變數和 Secrets

```bash
# 設置 Cloudflare Pages 密鑰
wrangler pages secret put DATABASE_URL
wrangler pages secret put EMAIL_API_KEY
wrangler pages secret put BUSINESS_EMAIL
```

詳細的配置說明請參考 [docs/ENVIRONMENT_VARIABLES_GUIDE.md](docs/ENVIRONMENT_VARIABLES_GUIDE.md)

## 專案結構

```
.
├── src/
│   ├── components/      # React 組件
│   ├── lib/            # 工具函數和服務
│   ├── pages/          # Astro 頁面
│   ├── data/           # 產品資料源
│   └── env.d.ts        # TypeScript 環境定義
├── functions/          # Cloudflare Functions (API)
│   └── api/
│       ├── quote.ts    # 詢價 API
│       └── images/     # R2 圖片服務
├── migrations/         # 資料庫遷移檔案
├── scripts/           # 工具腳本
│   ├── upload-to-r2.sh        # R2 圖片上傳腳本
│   └── upload-images.ts       # TypeScript 上傳工具
├── docs/              # 文檔
│   ├── R2_QUICK_START.md      # R2 快速開始
│   ├── R2_SETUP.md            # R2 詳細設置
│   ├── R2_IMAGE_STORAGE_GUIDE.md  # R2 使用指南
│   └── ...
├── public/            # 靜態資源
└── tests/             # 測試檔案
```

## 文檔

### 配置指南
- [Environment Variables Guide](docs/ENVIRONMENT_VARIABLES_GUIDE.md) - 環境變數配置完整指南
- [Neon Setup Guide](docs/NEON_SETUP.md) - Neon 資料庫設置
- [Email Service Guide](docs/EMAIL_SERVICE_GUIDE.md) - 郵件服務設置
- [R2 Quick Start](docs/R2_QUICK_START.md) - R2 圖片儲存快速開始

### 使用指南
- [Database Usage Guide](docs/DATABASE_USAGE.md) - 資料庫使用指南
- [R2 Setup Guide](docs/R2_SETUP.md) - R2 詳細設置指南
- [R2 Image Storage Guide](docs/R2_IMAGE_STORAGE_GUIDE.md) - R2 使用指南
- [Products Guide](docs/PRODUCTS_GUIDE.md) - 產品資料管理

## 授權

MIT
