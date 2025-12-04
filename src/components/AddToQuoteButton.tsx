import { useState, useEffect } from 'react';
import { addToQuoteList, isInQuoteList, getQuoteItemQuantity } from '../lib/quoteStorage';

interface AddToQuoteButtonProps {
  productId: string;
  productName: string;
  sku: string;
  imageUrl: string;
  className?: string;
}

export function AddToQuoteButton({
  productId,
  productName,
  sku,
  imageUrl,
  className = ''
}: AddToQuoteButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if product is already in quote list
    const inList = isInQuoteList(productId);
    setIsAdded(inList);
    if (inList) {
      const existingQty = getQuoteItemQuantity(productId);
      if (existingQty > 0) setQuantity(existingQty);
    }
  }, [productId]);

  const handleButtonClick = () => {
    if (isAdded) return;
    setQuantity(1);
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (quantity < 1) {
      setError('數量必須大於 0');
      return;
    }

    try {
      addToQuoteList({
        productId,
        productName,
        sku,
        imageUrl,
        quantity
      });

      setIsAdded(true);
      setShowModal(false);
      setShowNotification(true);
      setError(null);

      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowNotification(false);
      }, 3000);

      // Dispatch custom event for other components to listen
      window.dispatchEvent(new CustomEvent('quoteListUpdated'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '無法加入詢價清單';
      setError(errorMessage);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setError(null);
  };

  return (
    <div className="relative">
      {/* Add Button */}
      <button
        onClick={handleButtonClick}
        disabled={isAdded}
        className={`
          ${className}
          ${isAdded
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
          }
          text-white font-semibold py-2 px-4 rounded-lg transition-colors
          disabled:opacity-50
        `}
      >
        {isAdded ? '✓ 已加入' : '加入詢價清單'}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 max-w-[90vw] shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">輸入數量</h3>

            <div className="flex items-center justify-center mb-4">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setQuantity(val ? Math.max(1, parseInt(val)) : 1);
                }}
                className="w-24 text-center py-2 border rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg text-sm animate-fade-in z-50">
          已加入詢價清單 ({quantity} 件)
        </div>
      )}
    </div>
  );
}
