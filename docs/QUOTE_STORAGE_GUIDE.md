# 詢價清單儲存服務使用指南

## 概述

詢價清單儲存服務使用瀏覽器的 `localStorage` 來持久化用戶的詢價清單。即使關閉瀏覽器，用戶的詢價清單也會保留。

## 核心功能

### 1. 獲取詢價清單

```typescript
import { getQuoteListFromStorage } from '../lib/quoteStorage';

const items = getQuoteListFromStorage();
// 返回: StoredQuoteItem[]
```

### 2. 添加產品到詢價清單

```typescript
import { addToQuoteList } from '../lib/quoteStorage';

addToQuoteList({
  productId: 'prod-001',
  productName: 'Stainless Steel Water Bottle',
  sku: 'SSB-500-BLK',
  imageUrl: 'https://example.com/image.jpg',
  quantity: 2  // 可選，預設為 1
});
```

**特性：**
- 如果產品已存在，會自動累加數量
- 如果產品不存在，會新增到清單

### 3. 更新數量

```typescript
import { updateQuantity } from '../lib/quoteStorage';

updateQuantity('prod-001', 5);
```

**限制：**
- 數量必須 > 0
- 如果數量 <= 0 會拋出錯誤

### 4. 移除產品

```typescript
import { removeFromQuoteList } from '../lib/quoteStorage';

removeFromQuoteList('prod-001');
```

### 5. 清空詢價清單

```typescript
import { clearQuoteListFromStorage } from '../lib/quoteStorage';

clearQuoteListFromStorage();
```

### 6. 獲取總數量

```typescript
import { getQuoteListCount } from '../lib/quoteStorage';

const totalCount = getQuoteListCount();
// 返回所有產品的數量總和
```

### 7. 檢查產品是否在清單中

```typescript
import { isInQuoteList } from '../lib/quoteStorage';

if (isInQuoteList('prod-001')) {
  console.log('產品已在詢價清單中');
}
```

### 8. 檢查儲存是否可用

```typescript
import { isStorageAvailable } from '../lib/quoteStorage';

if (!isStorageAvailable()) {
  alert('您的瀏覽器不支援本地儲存功能');
}
```

## 資料結構

### StoredQuoteItem

```typescript
interface StoredQuoteItem {
  productId: string;      // 產品 ID
  productName: string;    // 產品名稱
  sku: string;           // SKU 編號
  imageUrl: string;      // 產品圖片 URL
  quantity: number;      // 數量
}
```

### 儲存格式

資料以 JSON 格式儲存在 localStorage 中：

```json
{
  "quote_list": [
    {
      "productId": "prod-001",
      "productName": "Stainless Steel Water Bottle",
      "sku": "SSB-500-BLK",
      "imageUrl": "https://example.com/image.jpg",
      "quantity": 2
    },
    {
      "productId": "prod-002",
      "productName": "Bamboo Cutting Board",
      "sku": "BCB-SET-3PC",
      "imageUrl": "https://example.com/image2.jpg",
      "quantity": 1
    }
  ]
}
```

## 錯誤處理

### 儲存空間已滿

當 localStorage 空間不足時：

```typescript
try {
  addToQuoteList({
    productId: 'prod-001',
    productName: 'Product',
    sku: 'SKU-001',
    imageUrl: 'https://example.com/image.jpg'
  });
} catch (error) {
  if (error.message.includes('儲存空間已滿')) {
    alert('詢價清單已滿，請移除部分項目');
  }
}
```

### 儲存不可用

```typescript
if (!isStorageAvailable()) {
  // 使用替代方案，例如：
  // 1. 提示用戶啟用 localStorage
  // 2. 使用 sessionStorage
  // 3. 使用記憶體儲存（頁面重新整理會遺失）
}
```

## 在 React 組件中使用

### 範例：AddToQuoteButton

```typescript
import { useState } from 'react';
import { addToQuoteList, isInQuoteList } from '../lib/quoteStorage';

interface Props {
  productId: string;
  productName: string;
  sku: string;
  imageUrl: string;
}

export function AddToQuoteButton({ productId, productName, sku, imageUrl }: Props) {
  const [isAdded, setIsAdded] = useState(isInQuoteList(productId));

  const handleClick = () => {
    try {
      addToQuoteList({
        productId,
        productName,
        sku,
        imageUrl,
        quantity: 1
      });
      setIsAdded(true);
      alert('已加入詢價清單');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <button 
      onClick={handleClick}
      disabled={isAdded}
    >
      {isAdded ? '已加入' : '加入詢價清單'}
    </button>
  );
}
```

### 範例：QuoteListManager

```typescript
import { useState, useEffect } from 'react';
import {
  getQuoteListFromStorage,
  updateQuantity,
  removeFromQuoteList,
  type StoredQuoteItem
} from '../lib/quoteStorage';

export function QuoteListManager() {
  const [items, setItems] = useState<StoredQuoteItem[]>([]);

  useEffect(() => {
    setItems(getQuoteListFromStorage());
  }, []);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    try {
      updateQuantity(productId, newQuantity);
      setItems(getQuoteListFromStorage());
    } catch (error) {
      alert(error.message);
    }
  };

  const handleRemove = (productId: string) => {
    removeFromQuoteList(productId);
    setItems(getQuoteListFromStorage());
  };

  if (items.length === 0) {
    return <p>詢價清單是空的</p>;
  }

  return (
    <div>
      {items.map(item => (
        <div key={item.productId}>
          <img src={item.imageUrl} alt={item.productName} />
          <h3>{item.productName}</h3>
          <p>SKU: {item.sku}</p>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value))}
            min="1"
          />
          <button onClick={() => handleRemove(item.productId)}>
            移除
          </button>
        </div>
      ))}
    </div>
  );
}
```

## 儲存限制

### localStorage 容量

- **大多數瀏覽器**: 5-10 MB
- **建議**: 每個詢價清單項目約 200-300 bytes
- **估計容量**: 可儲存約 15,000-25,000 個項目

### 實際使用

對於詢價清單系統：
- 單個項目: ~250 bytes
- 100 個項目: ~25 KB
- 1000 個項目: ~250 KB

**結論**: localStorage 容量對於詢價清單來說綽綽有餘。

## 最佳實踐

### 1. 定期清理

建議在提交詢價後清空清單：

```typescript
import { clearQuoteListFromStorage } from '../lib/quoteStorage';

async function submitQuote(quoteData) {
  const response = await fetch('/api/quote', {
    method: 'POST',
    body: JSON.stringify(quoteData)
  });
  
  if (response.ok) {
    clearQuoteListFromStorage();
  }
}
```

### 2. 錯誤處理

始終使用 try-catch 包裹儲存操作：

```typescript
try {
  addToQuoteList(item);
} catch (error) {
  // 顯示友善的錯誤訊息
  console.error('Failed to add to quote list:', error);
  alert('無法加入詢價清單，請稍後再試');
}
```

### 3. 驗證資料

在儲存前驗證產品 ID：

```typescript
import { isValidProductId } from '../lib/products';
import { addToQuoteList } from '../lib/quoteStorage';

function addProduct(productId: string, ...) {
  if (!isValidProductId(productId)) {
    throw new Error('無效的產品 ID');
  }
  
  addToQuoteList({ productId, ... });
}
```

### 4. 同步狀態

在 React 中使用自訂 Hook：

```typescript
import { useState, useEffect } from 'react';
import { getQuoteListFromStorage, type StoredQuoteItem } from '../lib/quoteStorage';

export function useQuoteList() {
  const [items, setItems] = useState<StoredQuoteItem[]>([]);

  const refresh = () => {
    setItems(getQuoteListFromStorage());
  };

  useEffect(() => {
    refresh();
    
    // 監聽 storage 事件（跨分頁同步）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'quote_list') {
        refresh();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { items, refresh };
}
```

## 跨分頁同步

localStorage 支援跨分頁同步。當一個分頁修改詢價清單時，其他分頁會收到 `storage` 事件：

```typescript
window.addEventListener('storage', (e) => {
  if (e.key === 'quote_list') {
    // 重新載入詢價清單
    const items = getQuoteListFromStorage();
    updateUI(items);
  }
});
```

## 測試

### 執行測試

```bash
pnpm test
```

### 測試覆蓋

- ✅ 獲取空清單
- ✅ 獲取已儲存的清單
- ✅ 處理無效 JSON
- ✅ 儲存清單
- ✅ 清空清單
- ✅ 添加新項目
- ✅ 累加現有項目數量
- ✅ 更新數量
- ✅ 移除項目
- ✅ 計算總數量
- ✅ 檢查項目是否存在
- ✅ 檢查儲存可用性

## 常見問題

### Q: 用戶清除瀏覽器資料會怎樣？

A: 詢價清單會被清空。這是 localStorage 的限制。建議：
- 提示用戶定期提交詢價
- 考慮添加「匯出清單」功能

### Q: 隱私模式下能用嗎？

A: 大多數瀏覽器在隱私模式下支援 localStorage，但關閉視窗後資料會被清除。

### Q: 如何遷移到資料庫？

A: 可以在用戶登入後同步：

```typescript
async function syncQuoteListToServer() {
  const items = getQuoteListFromStorage();
  
  await fetch('/api/sync-quote-list', {
    method: 'POST',
    body: JSON.stringify({ items })
  });
  
  clearQuoteListFromStorage();
}
```

### Q: 如何處理版本升級？

A: 添加版本號並進行遷移：

```typescript
interface StorageData {
  version: number;
  items: StoredQuoteItem[];
}

function migrateStorage() {
  const data = localStorage.getItem('quote_list');
  if (!data) return;
  
  try {
    const parsed = JSON.parse(data);
    
    // 舊版本（直接是陣列）
    if (Array.isArray(parsed)) {
      const newData: StorageData = {
        version: 2,
        items: parsed
      };
      localStorage.setItem('quote_list', JSON.stringify(newData));
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
```

## 相關檔案

```
src/
├── lib/
│   ├── quoteStorage.ts        # 儲存服務
│   └── quoteStorage.test.ts   # 測試
└── types/
    └── ...
```

## 下一步

- [ ] 實作 AddToQuoteButton 組件
- [ ] 實作 QuoteListManager 組件
- [ ] 添加詢價清單徽章（顯示項目數量）
- [ ] 實作詢價提交功能
