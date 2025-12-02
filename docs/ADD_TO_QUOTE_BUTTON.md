# AddToQuoteButton 組件使用指南

## 概述

`AddToQuoteButton` 是一個 React 組件，用於將產品添加到詢價清單。它使用 Astro Islands 架構，只在需要時載入 JavaScript。

## 功能特性

- ✅ 添加產品到詢價清單
- ✅ 自動檢測產品是否已在清單中
- ✅ 視覺反饋（成功/錯誤通知）
- ✅ 錯誤處理（儲存空間已滿等）
- ✅ 自訂樣式支援
- ✅ 觸發自訂事件供其他組件監聽

## 基本使用

### 在 Astro 頁面中使用

```astro
---
import { AddToQuoteButton } from '../components/AddToQuoteButton';
---

<AddToQuoteButton
  client:load
  productId="prod-001"
  productName="Stainless Steel Water Bottle"
  sku="SSB-500-BLK"
  imageUrl="https://example.com/image.jpg"
/>
```

### Props

| Prop | 類型 | 必填 | 說明 |
|------|------|------|------|
| productId | string | ✅ | 產品唯一識別碼 |
| productName | string | ✅ | 產品名稱 |
| sku | string | ✅ | 產品 SKU 編號 |
| imageUrl | string | ✅ | 產品圖片 URL |
| className | string | ❌ | 自訂 CSS 類別 |

## Astro Islands 指令

### client:load

最常用的指令，組件會在頁面載入時立即水合（hydrate）：

```astro
<AddToQuoteButton
  client:load
  productId="prod-001"
  ...
/>
```

### client:visible

組件進入視窗時才水合（適合頁面下方的按鈕）：

```astro
<AddToQuoteButton
  client:visible
  productId="prod-001"
  ...
/>
```

### client:idle

瀏覽器空閒時才水合：

```astro
<AddToQuoteButton
  client:idle
  productId="prod-001"
  ...
/>
```

## 樣式自訂

### 使用 className

```astro
<AddToQuoteButton
  client:load
  productId="prod-001"
  productName="Product"
  sku="SKU-001"
  imageUrl="https://example.com/image.jpg"
  className="w-full py-4 text-lg"
/>
```

### 預設樣式

按鈕有兩種狀態：

**未加入狀態：**
- 藍色背景 (`bg-blue-600`)
- Hover 時變深 (`hover:bg-blue-700`)
- 白色文字

**已加入狀態：**
- 灰色背景 (`bg-gray-400`)
- 禁用狀態 (`cursor-not-allowed`)
- 顯示勾選圖示 (✓)

## 視覺反饋

### 成功通知

當產品成功加入詢價清單時，會顯示綠色通知：

```
✓ 已加入詢價清單
```

通知會在 3 秒後自動消失。

### 錯誤通知

當發生錯誤時（例如儲存空間已滿），會顯示紅色通知：

```
儲存空間已滿，請清除部分項目後再試
```

錯誤通知會在 5 秒後自動消失。

## 自訂事件

組件會在成功添加產品後觸發 `quoteListUpdated` 事件：

```javascript
window.addEventListener('quoteListUpdated', () => {
  console.log('詢價清單已更新');
  // 更新 UI，例如更新徽章數量
});
```

### 範例：更新詢價清單徽章

```astro
<script>
  function updateBadge() {
    import('../lib/quoteStorage').then(({ getQuoteListCount }) => {
      const count = getQuoteListCount();
      const badge = document.getElementById('quote-badge');
      if (badge) {
        badge.textContent = count.toString();
        badge.style.display = count > 0 ? 'block' : 'none';
      }
    });
  }

  // 初始載入
  updateBadge();

  // 監聽更新事件
  window.addEventListener('quoteListUpdated', updateBadge);
</script>
```

## 完整範例

### 產品詳情頁

```astro
---
import { AddToQuoteButton } from '../../components/AddToQuoteButton';
import type { Product } from '../../types/product';

interface Props {
  product: Product;
}

const { product } = Astro.props;
---

<div class="product-detail">
  <h1>{product.name_en}</h1>
  <p>{product.description_en}</p>
  
  <AddToQuoteButton
    client:load
    productId={product.product_id}
    productName={product.name_en}
    sku={product.sku}
    imageUrl={product.image_url}
    className="w-full"
  />
</div>
```

### 產品列表頁

```astro
---
import { AddToQuoteButton } from '../../components/AddToQuoteButton';

const products = await getProducts();
---

<div class="product-grid">
  {products.map(product => (
    <div class="product-card">
      <img src={product.image_url} alt={product.name_en} />
      <h3>{product.name_en}</h3>
      
      <AddToQuoteButton
        client:visible
        productId={product.product_id}
        productName={product.name_en}
        sku={product.sku}
        imageUrl={product.image_url}
        className="w-full py-2"
      />
    </div>
  ))}
</div>
```

## 狀態管理

### 初始狀態檢查

組件會在載入時自動檢查產品是否已在詢價清單中：

```typescript
useEffect(() => {
  setIsAdded(isInQuoteList(productId));
}, [productId]);
```

### 狀態更新

當用戶點擊按鈕時：
1. 調用 `addToQuoteList()` 添加產品
2. 更新 `isAdded` 狀態為 `true`
3. 顯示成功通知
4. 觸發 `quoteListUpdated` 事件

## 錯誤處理

### 儲存空間已滿

```typescript
try {
  addToQuoteList({ ... });
} catch (err) {
  // 顯示錯誤訊息
  setError('儲存空間已滿，請清除部分項目後再試');
}
```

### 儲存不可用

如果 localStorage 不可用，`addToQuoteList()` 會拋出錯誤，組件會捕獲並顯示友善的錯誤訊息。

## 效能考量

### Astro Islands

使用 Astro Islands 架構，只有按鈕本身需要 JavaScript：

- **靜態內容**: 產品資訊、圖片、描述等都是靜態 HTML
- **互動組件**: 只有 AddToQuoteButton 需要 JavaScript
- **按需載入**: 使用 `client:visible` 可以延遲載入

### Bundle 大小

AddToQuoteButton 組件的 JavaScript bundle：
- **壓縮前**: ~2.66 KB
- **Gzip 壓縮後**: ~1.50 KB

非常輕量！

## 無障礙性 (Accessibility)

### 鍵盤導航

按鈕支援鍵盤操作：
- `Tab`: 聚焦按鈕
- `Enter` 或 `Space`: 觸發點擊

### 禁用狀態

已加入的產品會禁用按鈕，防止重複添加：

```html
<button disabled>✓ 已加入</button>
```

### 視覺反饋

- 清晰的按鈕文字
- 顏色變化表示狀態
- 通知訊息提供即時反饋

## 測試

### 手動測試

1. 點擊「加入詢價清單」按鈕
2. 確認按鈕變為「✓ 已加入」
3. 確認顯示成功通知
4. 重新整理頁面
5. 確認按鈕仍顯示「✓ 已加入」

### 自動化測試

組件依賴的 `quoteStorage` 模組已有完整的單元測試。

## 常見問題

### Q: 為什麼使用 client:load 而不是 client:visible？

A: 對於產品詳情頁，按鈕通常在首屏，使用 `client:load` 可以立即互動。對於產品列表頁，如果按鈕在下方，可以使用 `client:visible` 優化效能。

### Q: 如何自訂通知樣式？

A: 修改組件中的通知 div：

```tsx
<div className="absolute top-full mt-2 left-0 right-0 bg-green-500 text-white px-4 py-2 rounded shadow-lg text-sm text-center animate-fade-in">
  已加入詢價清單
</div>
```

### Q: 可以添加數量選擇器嗎？

A: 可以！修改組件添加數量輸入：

```tsx
const [quantity, setQuantity] = useState(1);

<input 
  type="number" 
  value={quantity} 
  onChange={(e) => setQuantity(parseInt(e.target.value))}
  min="1"
/>

<button onClick={() => handleAddToQuote(quantity)}>
  加入詢價清單
</button>
```

### Q: 如何在多個頁面間同步狀態？

A: localStorage 的 `storage` 事件會自動同步：

```typescript
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'quote_list') {
      setIsAdded(isInQuoteList(productId));
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, [productId]);
```

## 相關檔案

```
src/
├── components/
│   └── AddToQuoteButton.tsx    # 組件實作
├── lib/
│   └── quoteStorage.ts         # 儲存服務
└── pages/
    └── products/
        ├── [id].astro          # 產品詳情頁（使用組件）
        └── index.astro         # 產品列表頁（使用組件）
```

## 下一步

- [ ] 添加數量選擇器
- [ ] 實作詢價清單徽章
- [ ] 添加動畫效果
- [ ] 支援快速添加（一鍵添加多個產品）
