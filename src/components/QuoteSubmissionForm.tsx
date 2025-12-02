import { useState, type FormEvent } from 'react';
import { getQuoteListFromStorage, clearQuoteListFromStorage } from '../lib/quoteStorage';
import { validateQuoteForm, type QuoteFormData, type FormValidationErrors } from '../lib/validation';

export function QuoteSubmissionForm() {
  const [formData, setFormData] = useState<QuoteFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    companyName: '',
    message: ''
  });

  const [errors, setErrors] = useState<FormValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof FormValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate form
    const validation = validateQuoteForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Check if there are items in the quote list
    const items = getQuoteListFromStorage();
    if (items.length === 0) {
      setErrorMessage('詢價清單是空的，請先添加產品');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          items: items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Quote submitted successfully:', data);
        
        // Clear quote list from storage
        clearQuoteListFromStorage();
        
        // Show success message
        setSubmitStatus('success');
        
        // Reset form
        setFormData({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          companyName: '',
          message: ''
        });

        // Dispatch event to update other components
        window.dispatchEvent(new CustomEvent('quoteListUpdated'));
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || '提交失敗，請稍後再試');
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Failed to submit quote:', error);
      setErrorMessage('網路錯誤，請檢查您的連線');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <svg
          className="mx-auto h-16 w-16 text-green-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-green-900 mb-2">詢價請求已提交！</h2>
        <p className="text-green-800 mb-6">
          我們已收到您的詢價請求，業務團隊將在 24 小時內與您聯繫。
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/products"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            繼續瀏覽產品
          </a>
          <button
            onClick={() => setSubmitStatus('idle')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            提交新詢價
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {submitStatus === 'error' && errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{errorMessage}</p>
        </div>
      )}

      {/* Customer Name */}
      <div>
        <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
          姓名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="customerName"
          name="customerName"
          value={formData.customerName}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.customerName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="請輸入您的姓名"
        />
        {errors.customerName && (
          <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="customerEmail"
          name="customerEmail"
          value={formData.customerEmail}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.customerEmail ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="your.email@example.com"
        />
        {errors.customerEmail && (
          <p className="mt-1 text-sm text-red-600">{errors.customerEmail}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
          電話號碼 <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="customerPhone"
          name="customerPhone"
          value={formData.customerPhone}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.customerPhone ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="0912345678"
        />
        {errors.customerPhone && (
          <p className="mt-1 text-sm text-red-600">{errors.customerPhone}</p>
        )}
      </div>

      {/* Company Name */}
      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
          公司名稱 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="companyName"
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.companyName ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="請輸入公司名稱"
        />
        {errors.companyName && (
          <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
          留言（選填）
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="請告訴我們您的需求或問題..."
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full font-bold py-3 px-6 rounded-lg transition-colors ${
          isSubmitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        {isSubmitting ? '提交中...' : '提交詢價請求'}
      </button>

      <p className="text-sm text-gray-500 text-center">
        提交後，我們的業務團隊將在 24 小時內與您聯繫
      </p>
    </form>
  );
}
