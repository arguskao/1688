import { useState, useEffect } from 'react';
import {
  getQuoteListFromStorage,
  updateQuantity as updateStorageQuantity,
  removeFromQuoteList,
  type StoredQuoteItem
} from '../lib/quoteStorage';

export function QuoteListManager() {
  const [items, setItems] = useState<StoredQuoteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadItems = () => {
    const storedItems = getQuoteListFromStorage();
    setItems(storedItems);
    setIsLoading(false);
  };

  useEffect(() => {
    loadItems();

    // Listen for updates from AddToQuoteButton
    const handleUpdate = () => {
      loadItems();
    };

    window.addEventListener('quoteListUpdated', handleUpdate);
    return () => window.removeEventListener('quoteListUpdated', handleUpdate);
  }, []);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    try {
      if (newQuantity < 1) {
        return;
      }
      updateStorageQuantity(productId, newQuantity);
      loadItems();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      alert(error instanceof Error ? error.message : '更新數量失敗');
    }
  };

  const handleRemove = (productId: string) => {
    if (confirm('確定要移除此產品嗎？')) {
      removeFromQuoteList(productId);
      loadItems();
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">載入中...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="mt-2 text-lg font-semibold text-gray-900">詢價清單是空的</h3>
        <p className="mt-1 text-gray-500">還沒有添加任何產品到詢價清單</p>
        <div className="mt-6">
          <a
            href="/products"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            瀏覽產品
          </a>
        </div>
      </div>
    );
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-800">
              共 <span className="font-bold">{items.length}</span> 種產品
            </p>
            <p className="text-sm text-blue-800">
              總數量 <span className="font-bold">{totalItems}</span> 件
            </p>
          </div>
          <svg
            className="h-8 w-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.productId}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex gap-4">
              {/* Product Image */}
              <div className="flex-shrink-0">
                <img
                  src={item.imageUrl}
                  alt={item.productName}
                  className="w-20 h-20 object-cover rounded-md bg-gray-100"
                />
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {item.productName}
                </h3>
                <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                <p className="text-xs text-gray-400 mt-1">ID: {item.productId}</p>

                {/* Quantity Control */}
                <div className="flex items-center gap-2 mt-3">
                  <label htmlFor={`qty-${item.productId}`} className="text-sm text-gray-700">
                    數量:
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      −
                    </button>
                    <input
                      id={`qty-${item.productId}`}
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value > 0) {
                          handleQuantityChange(item.productId, value);
                        }
                      }}
                      min="1"
                      className="w-16 text-center border-x border-gray-300 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                      className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <a
                  href={`/products/${item.productId}`}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  查看詳情
                </a>
                <button
                  onClick={() => handleRemove(item.productId)}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  移除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
