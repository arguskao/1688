/**
 * Email notification service
 * Sends email notifications for new quote requests
 */

interface QuoteRequestItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
}

interface QuoteRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  message: string;
  items: QuoteRequestItem[];
}

interface EmailEnv {
  EMAIL_API_KEY: string;
  BUSINESS_EMAIL: string;
}

/**
 * Generate HTML email template for quote notification
 */
export function generateEmailTemplate(quoteId: string, request: QuoteRequest): string {
  const itemsHtml = request.items.map(item => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; text-align: left;">${escapeHtml(item.productName)}</td>
      <td style="padding: 12px; text-align: left;">${escapeHtml(item.sku)}</td>
      <td style="padding: 12px; text-align: center;">${item.quantity}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>新詢價單 #${quoteId}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #1f2937; margin: 0 0 10px 0;">🎉 新詢價單</h1>
    <p style="color: #6b7280; margin: 0; font-size: 14px;">詢價單編號: <strong>#${quoteId}</strong></p>
  </div>

  <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">👤 客戶資訊</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold; width: 100px;">姓名:</td>
        <td style="padding: 8px 0;">${escapeHtml(request.customerName)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">Email:</td>
        <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(request.customerEmail)}" style="color: #3b82f6; text-decoration: none;">${escapeHtml(request.customerEmail)}</a></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">電話:</td>
        <td style="padding: 8px 0;"><a href="tel:${escapeHtml(request.customerPhone)}" style="color: #3b82f6; text-decoration: none;">${escapeHtml(request.customerPhone)}</a></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold;">公司:</td>
        <td style="padding: 8px 0;">${escapeHtml(request.companyName)}</td>
      </tr>
    </table>
  </div>

  <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">📦 詢價產品</h2>
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
      <thead>
        <tr style="background-color: #f9fafb;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">產品名稱</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">數量</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    <p style="margin-top: 10px; color: #6b7280; font-size: 14px;">
      總計: <strong>${request.items.length}</strong> 種產品，
      共 <strong>${request.items.reduce((sum, item) => sum + item.quantity, 0)}</strong> 件
    </p>
  </div>

  ${request.message ? `
  <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #1f2937; margin-top: 0; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">💬 客戶留言</h2>
    <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(request.message)}</p>
  </div>
  ` : ''}

  <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
    <p style="margin: 0; color: #1e40af; font-size: 14px;">
      <strong>⏰ 提醒:</strong> 請在 24 小時內回覆客戶詢價
    </p>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
    <p>此郵件由詢價清單系統自動發送</p>
    <p>詢價時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Send email notification using Resend
 */
export async function sendEmailNotification(
  env: EmailEnv,
  quoteId: string,
  request: QuoteRequest
): Promise<void> {
  if (!env.EMAIL_API_KEY) {
    console.warn('EMAIL_API_KEY not configured, skipping email notification');
    return;
  }

  if (!env.BUSINESS_EMAIL) {
    console.warn('BUSINESS_EMAIL not configured, skipping email notification');
    return;
  }

  const emailHtml = generateEmailTemplate(quoteId, request);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Quote System <noreply@yourdomain.com>',
        to: env.BUSINESS_EMAIL,
        subject: `新詢價單 #${quoteId} - ${request.companyName}`,
        html: emailHtml
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Email service error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Failed to send email notification:', error);
    // Don't throw - email failure should not fail the quote submission
    throw error;
  }
}
