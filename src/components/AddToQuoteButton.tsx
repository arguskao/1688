import { useState, useEffect } from 'react';
import { addToQuoteList, isInQuoteList } from '../lib/quoteStorage';

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
  const [isAdded, setIsAdded] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if product is already in quote list
    setIsAdded(isInQuoteList(productId));
  }, [productId]);

  const handleAddToQuote = () => {
    try {
      addToQuoteList({
        productId,
        productName,
        sku,
        imageUrl,
        quantity: 1
      });

      setIsAdded(true);
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
      
      // Hide error after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleAddToQuote}
        disabled={isAdded}
        className={`
          ${className}
          ${isAdded 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
          }
          text-white font-semibold py-3 px-6 rounded-lg transition-colors
          disabled:opacity-50
        `}
      >
        {isAdded ? '✓ 已加入' : '加入詢價清單'}
      </button>

      {/* Success Notification */}
      {showNotification && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-green-500 text-white px-4 py-2 rounded shadow-lg text-sm text-center animate-fade-in">
          已加入詢價清單
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-red-500 text-white px-4 py-2 rounded shadow-lg text-sm text-center animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
}
