# SEO Optimization Guide

本指南說明詢價清單系統的 SEO 優化實現和最佳實踐。

## 已實現的 SEO 功能

### 1. Meta Tags

#### 所有頁面包含

- **Primary Meta Tags**
  - `<title>` - 獨特的頁面標題
  - `<meta name="description">` - 頁面描述
  - `<meta name="keywords">` - 關鍵字
  
- **Open Graph Tags** (Facebook/LinkedIn)
  - `og:type` - 內容類型
  - `og:url` - 頁面 URL
  - `og:title` - 分享標題
  - `og:description` - 分享描述
  - `og:image` - 分享圖片
  
- **Twitter Cards**
  - `twitter:card` - 卡片類型
  - `twitter:title` - 標題
  - `twitter:description` - 描述
  - `twitter:image` - 圖片

#### 產品頁面特殊標記

- **Product Schema.org**
  ```json
  {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": "產品名稱",
    "image": "圖片URL",
    "description": "產品描述",
    "sku": "SKU",
    "category": "分類",
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock"
    }
  }
  ```

### 2. Sitemap

**檔案**: `/sitemap.xml`

動態生成的 XML sitemap，包含：
- 首頁
- 產品列表頁
- 所有產品詳情頁
- 詢價清單頁
- 詢價提交頁

**特點**:
- 自動包含所有產品
- 設置適當的 `changefreq` 和 `priority`
- 包含 `lastmod` 時間戳
- 快取 1 小時

### 3. Robots.txt

**檔案**: `/robots.txt`

配置：
- 允許所有爬蟲訪問
- 指定 sitemap 位置
- 設置爬取延遲

### 4. 圖片優化

- **Lazy Loading**: 所有產品圖片使用 `loading="lazy"`
- **Alt Text**: 所有圖片包含描述性 alt 文字
- **適當尺寸**: 圖片通過 R2 提供，可配置不同尺寸

### 5. 語義化 HTML

- 使用適當的 HTML5 標籤
- 正確的標題層級 (h1, h2, h3)
- 語義化的導航結構
- 結構化資料標記

### 6. 效能優化

- **靜態生成**: 所有產品頁面預渲染
- **CDN**: 通過 Cloudflare Pages 全球分發
- **快取**: 適當的快取標頭
- **最小化 JavaScript**: 使用 Astro Islands

## 頁面 SEO 詳情

### 首頁 (/)

**標題**: 詢價清單系統 - B2B 產品詢價解決方案

**描述**: 專業的 B2B 產品詢價系統，輕鬆管理您的產品詢價需求

**關鍵字**: B2B, 詢價系統, 產品詢價, 批發, 報價

**優先級**: 1.0 (最高)

### 產品列表 (/products)

**標題**: 產品目錄 - 瀏覽所有產品 | 詢價清單系統

**描述**: 瀏覽完整產品目錄，包含多種分類

**優先級**: 0.9

### 產品詳情 (/products/[id])

**標題**: {產品名稱} - {分類} | 詢價清單系統

**描述**: {產品描述}

**優先級**: 0.7

**特殊標記**: Product Schema.org

### 詢價清單 (/quote-list)

**標題**: 詢價清單 | 詢價清單系統

**優先級**: 0.8

## 配置步驟

### 1. 更新域名

在以下檔案中將 `yourdomain.com` 替換為實際域名：

- `src/pages/sitemap.xml.ts`
- `src/pages/index.astro`
- `src/pages/products/index.astro`
- `src/pages/products/[id].astro`
- `public/robots.txt`

### 2. 添加 Open Graph 圖片

創建 `/public/og-image.jpg`:
- 尺寸: 1200x630 像素
- 格式: JPG 或 PNG
- 內容: 品牌 logo 和標語

### 3. 添加 Favicon

創建 `/public/favicon.svg`:
- 格式: SVG（推薦）或 ICO
- 尺寸: 32x32 或 16x16

### 4. 驗證 Sitemap

```bash
# 本地測試
pnpm run dev
curl http://localhost:4321/sitemap.xml

# 生產環境
curl https://yourdomain.com/sitemap.xml
```

### 5. 提交到搜尋引擎

#### Google Search Console

1. 前往 [Google Search Console](https://search.google.com/search-console)
2. 添加網站
3. 驗證所有權
4. 提交 sitemap: `https://yourdomain.com/sitemap.xml`

#### Bing Webmaster Tools

1. 前往 [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. 添加網站
3. 驗證所有權
4. 提交 sitemap

## SEO 最佳實踐

### 1. 內容優化

- **獨特標題**: 每個頁面有獨特的標題
- **描述性**: 標題和描述清晰描述頁面內容
- **關鍵字**: 自然地包含相關關鍵字
- **長度**:
  - 標題: 50-60 字元
  - 描述: 150-160 字元

### 2. 圖片優化

```html
<!-- 好的範例 -->
<img 
  src="/api/images/products/prod-001.jpg" 
  alt="不鏽鋼保溫瓶 500ml - 黑色"
  loading="lazy"
  width="800"
  height="800"
/>
```

### 3. 內部連結

- 使用描述性錨文字
- 建立清晰的網站結構
- 麵包屑導航

### 4. 行動優化

- 響應式設計
- 快速載入時間
- 易於點擊的按鈕

### 5. 結構化資料

使用 Schema.org 標記：
- Product（產品頁面）
- BreadcrumbList（麵包屑）
- Organization（組織資訊）

## 監控和分析

### Google Analytics

添加 GA4 追蹤碼：

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 關鍵指標

監控以下指標：
- **有機流量**: 來自搜尋引擎的訪問
- **關鍵字排名**: 目標關鍵字的排名
- **點擊率 (CTR)**: 搜尋結果的點擊率
- **跳出率**: 用戶離開率
- **頁面載入時間**: Core Web Vitals

### 工具

- **Google Search Console**: 搜尋表現
- **Google Analytics**: 流量分析
- **PageSpeed Insights**: 效能分析
- **Lighthouse**: 綜合評分

## 進階優化

### 1. 結構化資料增強

添加更多 Schema.org 類型：

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "詢價清單系統",
  "url": "https://yourdomain.com",
  "logo": "https://yourdomain.com/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+886-xxx-xxx-xxx",
    "contactType": "customer service"
  }
}
```

### 2. 麵包屑標記

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [{
    "@type": "ListItem",
    "position": 1,
    "name": "首頁",
    "item": "https://yourdomain.com"
  }, {
    "@type": "ListItem",
    "position": 2,
    "name": "產品",
    "item": "https://yourdomain.com/products"
  }]
}
```

### 3. 多語言支援

添加 hreflang 標籤：

```html
<link rel="alternate" hreflang="zh-TW" href="https://yourdomain.com/zh-tw/" />
<link rel="alternate" hreflang="en" href="https://yourdomain.com/en/" />
```

### 4. AMP (可選)

為行動用戶創建 AMP 版本。

## 檢查清單

### 部署前

- [ ] 更新所有域名引用
- [ ] 創建 Open Graph 圖片
- [ ] 添加 Favicon
- [ ] 測試 sitemap 生成
- [ ] 驗證所有 meta tags
- [ ] 檢查圖片 alt 文字
- [ ] 測試行動版本

### 部署後

- [ ] 提交 sitemap 到 Google
- [ ] 提交 sitemap 到 Bing
- [ ] 設置 Google Analytics
- [ ] 設置 Google Search Console
- [ ] 運行 Lighthouse 測試
- [ ] 檢查 PageSpeed Insights
- [ ] 驗證結構化資料

### 持續優化

- [ ] 每月檢查排名
- [ ] 分析搜尋查詢
- [ ] 優化低表現頁面
- [ ] 更新內容
- [ ] 添加新關鍵字
- [ ] 建立外部連結

## 常見問題

### Q: 多久能看到 SEO 效果？

A: 通常需要 3-6 個月才能看到明顯效果。

### Q: 如何提高排名？

A: 
1. 優質內容
2. 適當的關鍵字
3. 良好的用戶體驗
4. 快速的載入速度
5. 行動友好
6. 外部連結

### Q: 需要付費廣告嗎？

A: SEO 是有機流量，不需要付費。但 Google Ads 可以補充 SEO。

## 資源

- [Google Search Central](https://developers.google.com/search)
- [Schema.org](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards)
- [Web.dev](https://web.dev/)

## 總結

系統已實現完整的 SEO 優化：

✅ Meta tags（所有頁面）
✅ Open Graph 和 Twitter Cards
✅ Product Schema.org
✅ 動態 Sitemap
✅ Robots.txt
✅ 圖片 lazy loading
✅ 語義化 HTML
✅ 效能優化

遵循本指南可以確保網站在搜尋引擎中獲得良好的排名！
