/**
 * Admin Spec Field List Component
 * Manages customizable product specification fields
 */
import { useState, useEffect } from 'react';

interface SpecField {
    id: number;
    field_name: string;
    field_label: string;
    field_type: 'text' | 'number' | 'select';
    options: string[] | null;
    display_order: number;
    is_required: boolean;
}

interface FormData {
    field_name: string;
    field_label: string;
    field_type: 'text' | 'number' | 'select';
    options: string;
    display_order: number;
    is_required: boolean;
}

const initialFormData: FormData = {
    field_name: '',
    field_label: '',
    field_type: 'text',
    options: '',
    display_order: 0,
    is_required: false,
};

export default function AdminSpecFieldList() {
    const [specFields, setSpecFields] = useState<SpecField[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchSpecFields();
    }, []);

    const fetchSpecFields = async () => {
        try {
            const res = await fetch('/api/admin/spec-fields');
            if (res.status === 401) {
                window.location.href = '/admin/login';
                return;
            }
            const data = await res.json();
            if (data.success) {
                // Handle both formats: data.specFields or data.data.specFields
                const fields = data.specFields || data.data?.specFields || [];
                setSpecFields(fields);
            } else {
                setError(data.error || 'Failed to fetch spec fields');
            }
        } catch (err) {
            setError('Failed to fetch spec fields');
        } finally {
            setLoading(false);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                field_name: formData.field_name.trim(),
                field_label: formData.field_label.trim(),
                field_type: formData.field_type,
                options: formData.field_type === 'select'
                    ? formData.options.split(',').map(o => o.trim()).filter(o => o)
                    : null,
                display_order: formData.display_order,
                is_required: formData.is_required,
            };

            const url = editingId
                ? `/api/admin/spec-fields/${editingId}`
                : '/api/admin/spec-fields';

            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (data.success) {
                setSuccess(editingId ? '規格欄位已更新' : '規格欄位已建立');
                resetForm();
                fetchSpecFields();
            } else {
                setError(data.error || 'Operation failed');
            }
        } catch (err) {
            setError('Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (field: SpecField) => {
        setEditingId(field.id);
        setFormData({
            field_name: field.field_name,
            field_label: field.field_label,
            field_type: field.field_type,
            options: field.options?.join(', ') || '',
            display_order: field.display_order,
            is_required: field.is_required,
        });
        setShowForm(true);
        setError('');
        setSuccess('');
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`確定要刪除規格欄位「${name}」嗎？`)) return;

        try {
            const res = await fetch(`/api/admin/spec-fields/${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (data.success) {
                setSuccess('規格欄位已刪除');
                fetchSpecFields();
            } else {
                setError(data.error || 'Delete failed');
            }
        } catch (err) {
            setError('Delete failed');
        }
    };

    const resetForm = () => {
        setFormData(initialFormData);
        setEditingId(null);
        setShowForm(false);
    };

    const getFieldTypeLabel = (type: string) => {
        switch (type) {
            case 'text': return '文字';
            case 'number': return '數字';
            case 'select': return '下拉選單';
            default: return type;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
        );
    }


    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                    {success}
                </div>
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">規格欄位管理</h2>
                {!showForm && (
                    <button
                        onClick={() => { setShowForm(true); setEditingId(null); setFormData(initialFormData); }}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                    >
                        新增規格欄位
                    </button>
                )}
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg space-y-4">
                    <h3 className="text-lg font-medium text-gray-800">
                        {editingId ? '編輯規格欄位' : '新增規格欄位'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                欄位名稱 (英文，用於系統識別)
                            </label>
                            <input
                                type="text"
                                value={formData.field_name}
                                onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="例如: voltage, power"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                顯示標籤 (中文，顯示給使用者)
                            </label>
                            <input
                                type="text"
                                value={formData.field_label}
                                onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="例如: 電壓, 功率"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                欄位類型
                            </label>
                            <select
                                value={formData.field_type}
                                onChange={(e) => setFormData({ ...formData, field_type: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="text">文字</option>
                                <option value="number">數字</option>
                                <option value="select">下拉選單</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                排序順序
                            </label>
                            <input
                                type="number"
                                value={formData.display_order}
                                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                        <div className="flex items-center pt-6">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_required}
                                    onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                                    className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">必填欄位</span>
                            </label>
                        </div>
                    </div>

                    {formData.field_type === 'select' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                選項 (以逗號分隔)
                            </label>
                            <input
                                type="text"
                                value={formData.options}
                                onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="例如: 110V, 220V, 380V"
                            />
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
                        >
                            {submitting ? '處理中...' : (editingId ? '更新' : '建立')}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
                        >
                            取消
                        </button>
                    </div>
                </form>
            )}


            {specFields.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">尚無規格欄位</p>
                    <p className="text-sm text-gray-400 mt-1">點擊「新增規格欄位」開始建立</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">排序</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">欄位名稱</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">顯示標籤</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">類型</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">選項</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">必填</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {specFields.map((field) => (
                                <tr key={field.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-600">{field.display_order}</td>
                                    <td className="px-4 py-3 text-sm font-mono text-gray-800">{field.field_name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-800">{field.field_label}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        <span className={`px-2 py-1 rounded text-xs ${field.field_type === 'select' ? 'bg-blue-100 text-blue-700' :
                                            field.field_type === 'number' ? 'bg-purple-100 text-purple-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {getFieldTypeLabel(field.field_type)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {field.options?.join(', ') || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {field.is_required ? (
                                            <span className="text-green-600">✓</span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <button
                                            onClick={() => handleEdit(field)}
                                            className="text-blue-600 hover:text-blue-800 mr-3"
                                        >
                                            編輯
                                        </button>
                                        <button
                                            onClick={() => handleDelete(field.id, field.field_label)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            刪除
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
