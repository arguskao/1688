# 🚀 快速部署指南

Wrangler 已安裝完成！現在讓我們一步步部署你的詢價清單系統。

## 📋 你需要準備的東西

### 1. Cloudflare 帳號（免費）
- 前往 https://dash.cloudflare.com/sign-up
- 註冊一個免費帳號

### 2. Neon 資料庫（免費）
- 前往 https://console.neon.tech
- 註冊並創建新專案
- 複製資料庫連接字串

### 3. 郵件服務（可選）
**選項 A: Resend（推薦，免費 3000 封/月）**
- 前往 https://resend.com/signup
- 獲取 API 金鑰

**選項 B: 暫時跳過**
- 可以先不設置，詢價功能仍然可用
- 只是不會發送郵件通知

---

## 🎯 部署步驟

### 步驟 1: 登入 Cloudflare

在終端執行：
```bash
wrangler login
```

這會打開瀏覽器，讓你登入 Cloudflare 帳號。

### 步驟 2: 創建 R2 Bucket（圖片儲存）

```bash
wrangler r2 bucket create product-images
```

### 步驟 3: 設置資料庫

如果你已經有 Neon 資料庫連接字串，執行遷移：

```bash
# 設置環境變數
export DATABASE_URL='你的Neon連接字串'

# 執行遷移
./scripts/migrate-database.sh production
```

### 步驟 4: 構建專案

```bash
pnpm run build
```

### 步驟 5: 部署！

```bash
wrangler pages deploy dist
```

首次部署時，會詢問專案名稱，輸入：`quote-list-system`

### 步驟 6: 設置環境變數（Secrets）

部署後，設置必要的環境變數：

```bash
# 設置資料庫 URL
wrangler pages secret put DATABASE_URL
# 輸入你的 Neon 連接字串

# 設置郵件 API 金鑰（如果有）
wrangler pages secret put EMAIL_API_KEY
# 輸入你的郵件服務 API 金鑰

# 設置業務郵箱
wrangler pages secret put BUSINESS_EMAIL
# 輸入接收詢價通知的郵箱
```

---

## ✅ 驗證部署

部署完成後，你會看到網站 URL，類似：
```
https://quote-list-system.pages.dev
```

訪問這個 URL，測試：
1. ✅ 首頁是否正常顯示
2. ✅ 產品列表是否可以瀏覽
3. ✅ 添加產品到詢價清單
4. ✅ 提交詢價（測試完整流程）

---

## 🆘 如果遇到問題

### 問題 1: wrangler 命令找不到

重新載入 shell 配置：
```bash
source ~/.zshrc
```

### 問題 2: 資料庫連接失敗

檢查 DATABASE_URL 格式：
```
postgresql://user:password@host/database?sslmode=require
```

### 問題 3: 部署失敗

檢查構建是否成功：
```bash
pnpm run build
```

---

## 📚 詳細文檔

- 完整部署指南: `docs/DEPLOYMENT_GUIDE.md`
- 環境變數配置: `docs/ENVIRONMENT_VARIABLES_GUIDE.md`
- Neon 設置: `docs/NEON_SETUP.md`
- R2 設置: `docs/R2_SETUP.md`

---

## 🎉 下一步

部署成功後：

1. **上傳產品圖片**
   ```bash
   ./scripts/upload-to-r2.sh ./images/your-image.jpg prod-001
   ```

2. **設置自訂域名**（可選）
   - 在 Cloudflare Dashboard 中配置

3. **提交 Sitemap 到 Google**
   - https://search.google.com/search-console

---

**準備好了嗎？從步驟 1 開始吧！** 🚀
