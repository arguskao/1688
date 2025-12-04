/**
 * Admin Settings Component
 * Manage company settings for quotes
 */
import { useState, useEffect } from 'react';

interface CompanySettings {
    id: number;
    company_name: string;
    company_phone: string;
    company_fax?: string;
    company_address?: string;
    company_email?: string;
    tax_id?: string;
    quote_validity_days: number;
    payment_terms?: string;
    quote_notes?: string;
    updated_at: string;
}

export default function AdminSettings() {
    const [settings, setSettings] = useState<CompanySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const fetchSettings = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (data.success) {
                setSettings(data.settings);
            } else {
                setError(data.error || '載入設定失敗');
            }
        } catch (err) {
            setError('網路錯誤');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleChange = (field: keyof CompanySettings, value: string | number) => {
        if (settings) {
            setSettings({ ...settings, [field]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const data = await res.json();
            if (data.success) {
                setSettings(data.settings);
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError(data.error || '儲存失敗');
            }
        } catch (err) {
            setError('網路錯誤');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">載入中...</div>;
    }

    if (!settings) {
        return <div className="p-8 text-center text-red-500">{error || '無法載入設定'}</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Info */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium mb-4">公司資訊</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            公司名稱 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={settings.company_name}
                            onChange={(e) => handleChange('company_name', e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            統一編號
                        </label>
                        <input
                            type="text"
                            value={settings.tax_id || ''}
                            onChange={(e) => handleChange('tax_id', e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            電話 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={settings.company_phone}
                            onChange={(e) => handleChange('company_phone', e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            傳真
                        </label>
                        <input
                            type="text"
                            value={settings.company_fax || ''}
                            onChange={(e) => handleChange('company_fax', e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={settings.company_email || ''}
                            onChange={(e) => handleChange('company_email', e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            地址
                        </label>
                        <input
                            type="text"
                            value={settings.company_address || ''}
                            onChange={(e) => handleChange('company_address', e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                        />
                    </div>
                </div>
            </div>

            {/* Quote Settings */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium mb-4">報價單設定</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            報價單有效天數
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="365"
                            value={settings.quote_validity_days}
                            onChange={(e) => handleChange('quote_validity_days', parseInt(e.target.value) || 15)}
                            className="w-32 px-3 py-2 border rounded-md"
                        />
                        <span className="ml-2 text-sm text-gray-500">天</span>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            付款方式
                        </label>
                        <input
                            type="text"
                            value={settings.payment_terms || ''}
                            onChange={(e) => handleChange('payment_terms', e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="例：簽約金 30%，進場 30%，完工驗收 40%"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            報價單備註
                        </label>
                        <textarea
                            value={settings.quote_notes || ''}
                            onChange={(e) => handleChange('quote_notes', e.target.value)}
                            className="w-full px-3 py-2 border rounded-md"
                            rows={3}
                            placeholder="會顯示在報價單底部的備註事項"
                        />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {saving ? (
                        <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            儲存中...
                        </>
                    ) : '儲存設定'}
                </button>
                {success && (
                    <span className="text-green-600 flex items-center gap-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        已儲存
                    </span>
                )}
                {error && (
                    <span className="text-red-600">{error}</span>
                )}
            </div>
        </form>
    );
}
