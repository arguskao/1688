/**
 * Admin Quote List Component
 * Displays and manages quote requests with pricing functionality
 */
import { useState, useEffect } from 'react';

interface Quote {
    quote_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    company_name: string;
    message: string;
    created_at: string;
    replied_at?: string;
    status: 'pending' | 'replied' | 'closed';
    admin_notes?: string;
}

interface QuoteItem {
    id: number;
    quote_id: string;
    product_id: string;
    quantity: number;
    unit_price?: number;
    notes?: string;
    product_name?: string;
    sku?: string;
}

interface PricingItem {
    id: number;
    unit_price: number;
    notes: string;
}

interface QuoteWithItems extends Quote {
    items: QuoteItem[];
}

interface Stats {
    total: number;
    pending: number;
    replied: number;
    closed: number;
}

const statusLabels: Record<string, string> = {
    pending: '待處理',
    replied: '已回覆',
    closed: '已結案'
};

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    replied: 'bg-blue-100 text-blue-800',
    closed: 'bg-gray-100 text-gray-800'
};

export default function AdminQuoteList() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedQuote, setSelectedQuote] = useState<QuoteWithItems | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const limit = 20;

    // Pricing mode state
    const [isPricingMode, setIsPricingMode] = useState(false);
    const [pricingItems, setPricingItems] = useState<PricingItem[]>([]);
    const [adminNotes, setAdminNotes] = useState('');
    const [sendEmail, setSendEmail] = useState(true);
    const [submittingPrice, setSubmittingPrice] = useState(false);

    const fetchQuotes = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.set('limit', limit.toString());
            params.set('offset', (page * limit).toString());
            if (filterStatus) params.set('status', filterStatus);

            const res = await fetch(`/api/admin/quotes?${params}`);
            const data = await res.json();

            if (data.success) {
                setQuotes(data.quotes);
                setTotal(data.total);
                setStats(data.stats);
            } else {
                setError(data.error || 'Failed to fetch quotes');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotes();
    }, [page, filterStatus]);

    const fetchQuoteDetails = async (quoteId: string) => {
        try {
            const res = await fetch(`/api/admin/quotes/${quoteId}`);
            const data = await res.json();
            if (data.success) {
                setSelectedQuote(data.quote);
                // Initialize pricing items
                setPricingItems(data.quote.items.map((item: QuoteItem) => ({
                    id: item.id,
                    unit_price: item.unit_price || 0,
                    notes: item.notes || ''
                })));
                setAdminNotes(data.quote.admin_notes || '');
                setIsPricingMode(false);
            }
        } catch (err) {
            console.error('Failed to fetch quote details:', err);
        }
    };

    const startPricingMode = () => {
        setIsPricingMode(true);
    };

    const cancelPricingMode = () => {
        setIsPricingMode(false);
        // Reset pricing items to original values
        if (selectedQuote) {
            setPricingItems(selectedQuote.items.map((item) => ({
                id: item.id,
                unit_price: item.unit_price || 0,
                notes: item.notes || ''
            })));
            setAdminNotes(selectedQuote.admin_notes || '');
        }
    };

    const updatePricingItem = (id: number, field: 'unit_price' | 'notes', value: number | string) => {
        setPricingItems(items => items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const submitPricing = async () => {
        if (!selectedQuote) return;

        // Validate all prices are set
        const hasEmptyPrices = pricingItems.some(item => item.unit_price <= 0);
        if (hasEmptyPrices) {
            alert('請為所有產品設定單價');
            return;
        }

        setSubmittingPrice(true);
        try {
            const res = await fetch(`/api/admin/quotes/${selectedQuote.quote_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: pricingItems,
                    adminNotes,
                    sendEmail
                })
            });
            const data = await res.json();
            if (data.success) {
                setSelectedQuote(data.quote);
                setIsPricingMode(false);
                fetchQuotes();
                alert(sendEmail ? '報價已發送給客戶' : '報價已儲存');
            } else {
                alert(data.error || '儲存失敗');
            }
        } catch (err) {
            console.error('Failed to submit pricing:', err);
            alert('網路錯誤');
        } finally {
            setSubmittingPrice(false);
        }
    };

    const calculateTotal = () => {
        if (!selectedQuote) return 0;
        return selectedQuote.items.reduce((sum, item, index) => {
            const price = pricingItems[index]?.unit_price || 0;
            return sum + (price * item.quantity);
        }, 0);
    };

    const updateStatus = async (quoteId: string, status: string) => {
        try {
            const res = await fetch(`/api/admin/quotes/${quoteId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (data.success) {
                fetchQuotes();
                if (selectedQuote?.quote_id === quoteId) {
                    setSelectedQuote({ ...selectedQuote, status: status as any });
                }
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const deleteQuote = async (quoteId: string) => {
        if (!confirm('確定要刪除這筆詢價單嗎？')) return;

        try {
            const res = await fetch(`/api/admin/quotes/${quoteId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                fetchQuotes();
                if (selectedQuote?.quote_id === quoteId) {
                    setSelectedQuote(null);
                }
            }
        } catch (err) {
            console.error('Failed to delete quote:', err);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-500">全部</div>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg shadow p-4">
                        <div className="text-sm text-yellow-600">待處理</div>
                        <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg shadow p-4">
                        <div className="text-sm text-blue-600">已回覆</div>
                        <div className="text-2xl font-bold text-blue-700">{stats.replied}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg shadow p-4">
                        <div className="text-sm text-gray-600">已結案</div>
                        <div className="text-2xl font-bold text-gray-700">{stats.closed}</div>
                    </div>
                </div>
            )}

            {/* Filter */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">篩選狀態：</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
                        className="border rounded-md px-3 py-2 text-sm"
                    >
                        <option value="">全部</option>
                        <option value="pending">待處理</option>
                        <option value="replied">已回覆</option>
                        <option value="closed">已結案</option>
                    </select>
                    <button
                        onClick={fetchQuotes}
                        className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                        重新整理
                    </button>
                </div>
            </div>

            {/* Quote List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">載入中...</div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500">{error}</div>
                ) : quotes.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">沒有詢價單</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客戶</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">公司</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">狀態</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {quotes.map((quote) => (
                                <tr key={quote.quote_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(quote.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{quote.customer_name}</div>
                                        <div className="text-sm text-gray-500">{quote.customer_email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {quote.company_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[quote.status]}`}>
                                            {statusLabels[quote.status]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => fetchQuoteDetails(quote.quote_id)}
                                            className="text-blue-600 hover:text-blue-800 mr-3"
                                        >
                                            查看
                                        </button>
                                        <button
                                            onClick={() => deleteQuote(quote.quote_id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            刪除
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {total > limit && (
                    <div className="px-6 py-4 border-t flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            共 {total} 筆，第 {page + 1} / {Math.ceil(total / limit)} 頁
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                            >
                                上一頁
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={(page + 1) * limit >= total}
                                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                            >
                                下一頁
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Quote Detail Modal */}
            {selectedQuote && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-bold">
                                    {isPricingMode ? '報價設定' : '詢價單詳情'}
                                </h2>
                                <button
                                    onClick={() => { setSelectedQuote(null); setIsPricingMode(false); }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Status & Actions */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[selectedQuote.status]}`}>
                                            {statusLabels[selectedQuote.status]}
                                        </span>
                                        {!isPricingMode && (
                                            <select
                                                value={selectedQuote.status}
                                                onChange={(e) => updateStatus(selectedQuote.quote_id, e.target.value)}
                                                className="border rounded px-2 py-1 text-sm"
                                            >
                                                <option value="pending">待處理</option>
                                                <option value="replied">已回覆</option>
                                                <option value="closed">已結案</option>
                                            </select>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!isPricingMode && selectedQuote.status !== 'closed' && (
                                            <button
                                                onClick={startPricingMode}
                                                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                設定報價
                                            </button>
                                        )}
                                        {!isPricingMode && selectedQuote.status === 'replied' && (
                                            <button
                                                onClick={() => window.open(`/admin/quotes/print/${selectedQuote.quote_id}`, '_blank')}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                                </svg>
                                                列印報價單
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Customer Info */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-medium mb-2">客戶資訊</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div><span className="text-gray-500">姓名：</span>{selectedQuote.customer_name}</div>
                                        <div><span className="text-gray-500">公司：</span>{selectedQuote.company_name}</div>
                                        <div><span className="text-gray-500">Email：</span>
                                            <a href={`mailto:${selectedQuote.customer_email}`} className="text-blue-600">
                                                {selectedQuote.customer_email}
                                            </a>
                                        </div>
                                        <div><span className="text-gray-500">電話：</span>
                                            <a href={`tel:${selectedQuote.customer_phone}`} className="text-blue-600">
                                                {selectedQuote.customer_phone}
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Message */}
                                {selectedQuote.message && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="font-medium mb-2">客戶留言</h3>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedQuote.message}</p>
                                    </div>
                                )}

                                {/* Products - View Mode */}
                                {!isPricingMode && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h3 className="font-medium mb-2">詢價產品</h3>
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left py-2">產品</th>
                                                    <th className="text-left py-2">SKU</th>
                                                    <th className="text-right py-2">數量</th>
                                                    {selectedQuote.status === 'replied' && (
                                                        <>
                                                            <th className="text-right py-2">單價</th>
                                                            <th className="text-right py-2">小計</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedQuote.items.map((item) => (
                                                    <tr key={item.id} className="border-b last:border-0">
                                                        <td className="py-2">
                                                            {item.product_name || item.product_id}
                                                            {item.notes && (
                                                                <div className="text-xs text-gray-500 mt-1">{item.notes}</div>
                                                            )}
                                                        </td>
                                                        <td className="py-2 text-gray-500">{item.sku || '-'}</td>
                                                        <td className="py-2 text-right">{item.quantity}</td>
                                                        {selectedQuote.status === 'replied' && (
                                                            <>
                                                                <td className="py-2 text-right">
                                                                    {item.unit_price ? `$${item.unit_price.toLocaleString()}` : '-'}
                                                                </td>
                                                                <td className="py-2 text-right font-medium">
                                                                    {item.unit_price ? `$${(item.unit_price * item.quantity).toLocaleString()}` : '-'}
                                                                </td>
                                                            </>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                            {selectedQuote.status === 'replied' && (
                                                <tfoot>
                                                    <tr className="border-t-2">
                                                        <td colSpan={4} className="py-2 text-right font-medium">總計：</td>
                                                        <td className="py-2 text-right font-bold text-lg">
                                                            ${selectedQuote.items.reduce((sum, item) =>
                                                                sum + (item.unit_price || 0) * item.quantity, 0
                                                            ).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>
                                )}

                                {/* Products - Pricing Mode */}
                                {isPricingMode && (
                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                        <h3 className="font-medium mb-3 text-blue-800">設定產品報價</h3>
                                        <div className="space-y-3">
                                            {selectedQuote.items.map((item, index) => (
                                                <div key={item.id} className="bg-white rounded-lg p-3 border">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="font-medium">{item.product_name || item.product_id}</div>
                                                            <div className="text-sm text-gray-500">SKU: {item.sku || '-'} | 數量: {item.quantity}</div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-gray-500">單價：</span>
                                                                <div className="relative">
                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        value={pricingItems[index]?.unit_price || ''}
                                                                        onChange={(e) => updatePricingItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                                                        className="w-32 pl-7 pr-3 py-1 border rounded text-right"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                            </div>
                                                            {pricingItems[index]?.unit_price > 0 && (
                                                                <div className="text-sm text-gray-600 mt-1">
                                                                    小計: ${(pricingItems[index].unit_price * item.quantity).toLocaleString()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={pricingItems[index]?.notes || ''}
                                                        onChange={(e) => updatePricingItem(item.id, 'notes', e.target.value)}
                                                        className="w-full px-3 py-1 border rounded text-sm"
                                                        placeholder="產品備註（選填）"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Total */}
                                        <div className="mt-4 pt-4 border-t border-blue-200 flex justify-between items-center">
                                            <span className="font-medium text-blue-800">報價總計：</span>
                                            <span className="text-2xl font-bold text-blue-900">
                                                ${calculateTotal().toLocaleString()}
                                            </span>
                                        </div>

                                        {/* Admin Notes */}
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                內部備註（不會發送給客戶）
                                            </label>
                                            <textarea
                                                value={adminNotes}
                                                onChange={(e) => setAdminNotes(e.target.value)}
                                                className="w-full px-3 py-2 border rounded text-sm"
                                                rows={2}
                                                placeholder="內部備註..."
                                            />
                                        </div>

                                        {/* Send Email Option */}
                                        <div className="mt-4 flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="sendEmail"
                                                checked={sendEmail}
                                                onChange={(e) => setSendEmail(e.target.checked)}
                                                className="rounded border-gray-300"
                                            />
                                            <label htmlFor="sendEmail" className="text-sm text-gray-700">
                                                發送報價郵件給客戶 ({selectedQuote.customer_email})
                                            </label>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="mt-4 flex justify-end gap-3">
                                            <button
                                                onClick={cancelPricingMode}
                                                className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50"
                                                disabled={submittingPrice}
                                            >
                                                取消
                                            </button>
                                            <button
                                                onClick={submitPricing}
                                                disabled={submittingPrice}
                                                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {submittingPrice ? (
                                                    <>
                                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        處理中...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        {sendEmail ? '發送報價' : '儲存報價'}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Admin Notes Display (View Mode) */}
                                {!isPricingMode && selectedQuote.admin_notes && (
                                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                        <h3 className="font-medium mb-2 text-yellow-800">內部備註</h3>
                                        <p className="text-sm text-yellow-700 whitespace-pre-wrap">{selectedQuote.admin_notes}</p>
                                    </div>
                                )}

                                {/* Meta */}
                                <div className="text-xs text-gray-400">
                                    <div>詢價單 ID: {selectedQuote.quote_id}</div>
                                    <div>建立時間: {formatDate(selectedQuote.created_at)}</div>
                                    {selectedQuote.replied_at && (
                                        <div>回覆時間: {formatDate(selectedQuote.replied_at)}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
