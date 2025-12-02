# 郵件通知服務使用指南

## 概述

郵件通知服務使用 [Resend](https://resend.com) 發送詢價通知郵件給業務團隊。當客戶提交詢價請求時，系統會自動發送包含完整詢價資訊的 HTML 郵件。

## 功能特性

- ✅ 自動發送詢價通知
- ✅ 精美的 HTML 郵件模板
- ✅ 包含完整客戶資訊
- ✅ 產品清單表格
- ✅ XSS 防護（HTML 轉義）
- ✅ 非阻塞發送（郵件失敗不影響詢價提交）
- ✅ 錯誤日誌記錄

## 設置步驟

### 1. 註冊 Resend 帳號

1. 前往 [Resend](https://resend.com)
2. 註冊帳號
3. 驗證你的網域（或使用測試網域）

### 2. 獲取 API 金鑰

1. 登入 Resend Dashboard
2. 前往 API Keys 頁面
3. 創建新的 API Key
4. 複製 API Key

### 3. 配置環境變數

#### 本地開發（.dev.vars）

```bash
EMAIL_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
BUSINESS_EMAIL=business@yourdomain.com
```

#### 生產環境（Cloudflare）

```bash
# 設置 secrets
wrangler pages secret put EMAIL_API_KEY
wrangler pages secret put BUSINESS_EMAIL
```

## 郵件模板

### 郵件內容包含

1. **詢價單編號**
   - 唯一的 UUID
   - 用於追蹤和查詢

2. **客戶資訊**
   - 姓名
   - Email（可點擊）
   - 電話（可點擊）
   - 公司名稱

3. **詢價產品**
   - 產品名稱
   - SKU 編號
   - 數量
   - 總計統計

4. **客戶留言**
   - 如果客戶有留言則顯示

5. **提醒資訊**
   - 24 小時內回覆提醒
   - 詢價時間戳

### 郵件範例

```
主旨: 新詢價單 #abc-123-def - Acme Corp

🎉 新詢價單
詢價單編號: #abc-123-def

👤 客戶資訊
姓名: John Doe
Email: john@example.com
電話: 0912345678
公司: Acme Corp

📦 詢價產品
┌────────────────────┬──────────┬────┐
│ 產品名稱           │ SKU      │數量│
├────────────────────┼──────────┼────┤
│ Water Bottle       │ SSB-500  │ 2  │
│ Cutting Board      │ BCB-SET  │ 1  │
└────────────────────┴──────────┴────┘
總計: 2 種產品，共 3 件

💬 客戶留言
我想了解這些產品的批發價格

⏰ 提醒: 請在 24 小時內回覆客戶詢價
```

## API 使用

### 發送郵件通知

```typescript
import { sendEmailNotification } from './lib/email';

const env = {
  EMAIL_API_KEY: 'your-api-key',
  BUSINESS_EMAIL: 'business@yourdomain.com'
};

const quoteId = 'abc-123-def';
const request = {
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '0912345678',
  companyName: 'Acme Corp',
  message: '詢價訊息',
  items: [
    {
      productId: 'prod-001',
      productName: 'Water Bottle',
      sku: 'SSB-500',
      quantity: 2
    }
  ]
};

try {
  await sendEmailNotification(env, quoteId, request);
  console.log('Email sent successfully');
} catch (error) {
  console.error('Email failed:', error);
  // 郵件失敗不應該影響主要流程
}
```

### 生成郵件模板

```typescript
import { generateEmailTemplate } from './lib/email';

const html = generateEmailTemplate(quoteId, request);
// 返回完整的 HTML 郵件內容
```

## 錯誤處理

### 非阻塞發送

郵件發送失敗不會導致詢價提交失敗：

```typescript
// In API endpoint
try {
  const quoteId = await storeQuote(db, request);
  
  // Non-blocking email send
  sendEmailNotification(env, quoteId, request)
    .catch(err => console.error('Email failed:', err));
  
  // Return success even if email fails
  return { success: true, quoteId };
} catch (error) {
  // Only database errors fail the request
  return { success: false, error: 'Database error' };
}
```

### 錯誤日誌

所有郵件錯誤都會被記錄：

```typescript
console.error('Failed to send email notification:', error);
```

### 配置檢查

如果環境變數未設置，會跳過郵件發送：

```typescript
if (!env.EMAIL_API_KEY) {
  console.warn('EMAIL_API_KEY not configured, skipping email');
  return;
}
```

## 安全性

### XSS 防護

所有用戶輸入都會進行 HTML 轉義：

```typescript
function escapeHtml(text: string): string {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
```

**範例**：
- 輸入: `<script>alert('xss')</script>`
- 輸出: `&lt;script&gt;alert('xss')&lt;/script&gt;`

### API 金鑰保護

- 使用 Cloudflare Secrets 儲存
- 不要提交到 Git
- 定期輪換金鑰

## 測試

### 單元測試

```bash
pnpm test
```

測試涵蓋：
- ✅ 郵件模板生成
- ✅ 客戶資訊顯示
- ✅ 產品清單格式
- ✅ HTML 轉義
- ✅ 空留言處理
- ✅ 總計計算

### 手動測試

1. 設置測試環境變數
2. 提交測試詢價
3. 檢查收件箱
4. 驗證郵件內容

## 替代郵件服務

### SendGrid

```typescript
const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    personalizations: [{
      to: [{ email: env.BUSINESS_EMAIL }]
    }],
    from: { email: 'noreply@yourdomain.com' },
    subject: `新詢價單 #${quoteId}`,
    content: [{
      type: 'text/html',
      value: emailHtml
    }]
  })
});
```

### Mailgun

```typescript
const formData = new FormData();
formData.append('from', 'noreply@yourdomain.com');
formData.append('to', env.BUSINESS_EMAIL);
formData.append('subject', `新詢價單 #${quoteId}`);
formData.append('html', emailHtml);

const response = await fetch(
  `https://api.mailgun.net/v3/${domain}/messages`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`api:${env.EMAIL_API_KEY}`)}`
    },
    body: formData
  }
);
```

## 監控

### Resend Dashboard

在 Resend Dashboard 可以查看：
- 郵件發送狀態
- 開信率
- 點擊率
- 錯誤日誌

### Cloudflare Logs

查看 Cloudflare Functions 日誌：

```bash
wrangler pages deployment tail
```

## 最佳實踐

### 1. 使用交易郵件服務

- Resend（推薦）
- SendGrid
- Mailgun
- AWS SES

### 2. 設置 SPF/DKIM

確保郵件不被標記為垃圾郵件：
- 驗證發送網域
- 配置 SPF 記錄
- 配置 DKIM 記錄

### 3. 郵件模板優化

- 使用內聯 CSS
- 測試多種郵件客戶端
- 保持簡潔清晰
- 包含必要資訊

### 4. 錯誤處理

- 非阻塞發送
- 記錄所有錯誤
- 設置告警
- 提供重試機制

### 5. 合規性

- 包含取消訂閱連結（如適用）
- 遵守 GDPR/隱私法規
- 不發送未經請求的郵件

## 常見問題

### Q: 郵件沒有收到？

A: 檢查：
1. EMAIL_API_KEY 是否正確
2. BUSINESS_EMAIL 是否正確
3. Resend 網域是否已驗證
4. 檢查垃圾郵件資料夾
5. 查看 Cloudflare 日誌

### Q: 如何自訂郵件模板？

A: 編輯 `src/lib/email.ts` 中的 `generateEmailTemplate` 函數。

### Q: 可以發送給多個收件人嗎？

A: 可以！修改 `to` 欄位為陣列：

```typescript
to: [env.BUSINESS_EMAIL, 'sales@yourdomain.com']
```

### Q: 如何添加附件？

A: Resend 支援附件：

```typescript
body: JSON.stringify({
  // ... other fields
  attachments: [{
    filename: 'quote.pdf',
    content: base64Content
  }]
})
```

### Q: 郵件發送失敗會影響詢價提交嗎？

A: 不會！郵件發送是非阻塞的，失敗只會記錄錯誤，不會影響詢價儲存。

## 相關資源

- [Resend 文檔](https://resend.com/docs)
- [Resend API 參考](https://resend.com/docs/api-reference)
- [HTML Email 最佳實踐](https://www.campaignmonitor.com/dev-resources/guides/coding/)
- [Email 測試工具](https://www.emailonacid.com/)

---

**郵件通知服務已準備就緒！** 📧
