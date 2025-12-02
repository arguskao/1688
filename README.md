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

### 2. 設置 Neon 資料庫

1. 前往 [Neon Console](https://console.neon.tech) 創建專案
2. 複製資料庫連接字串
3. 創建本地環境變數檔案：

```bash
cp .dev.vars.example .dev.vars
```

4. 編輯 `.dev.vars`，填入你的 Neon 連接字串和其他配置

### 3. 執行資料庫遷移

```bash
# 使用 psql（需要先安裝 PostgreSQL 客戶端）
psql $DATABASE_URL -f migrations/0001_initial.sql
```

詳細的 Neon 設置說明請參考 [docs/NEON_SETUP.md](docs/NEON_SETUP.md)

### 4. 啟動開發伺服器

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
wrangler r2 bucket create product-images
```

### 部署到 Cloudflare Pages

```bash
pnpm build
wrangler pages deploy dist
```

### 配置 Secrets

```bash
wrangler pages secret put DATABASE_URL
wrangler pages secret put EMAIL_API_KEY
```

## 專案結構

```
.
├── src/
│   ├── components/      # React 組件
│   ├── lib/            # 工具函數和服務
│   ├── pages/          # Astro 頁面
│   └── env.d.ts        # TypeScript 環境定義
├── functions/          # Cloudflare Functions (API)
├── migrations/         # 資料庫遷移檔案
├── public/            # 靜態資源
└── tests/             # 測試檔案
```

## 授權

MIT
