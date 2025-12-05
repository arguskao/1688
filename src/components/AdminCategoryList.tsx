/**
 * Admin Category List Component
 * Manages product categories
 */
import { useState, useEffect, useCallback } from 'react';

interface Category {
    id: number;
    name: string;
    display_order: number;
}

export default function AdminCategoryList() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ name: '', display_order: 0 });
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete state
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; category: Category | null }>({
        show: false,
        category: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/admin/categories');
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/admin/login';
                    return;
                }
                throw new Error(data.error || 'Failed to fetch categories');
            }

            // Handle both formats: data.categories or data.data.categories
            const cats = data.categories || data.data?.categories || [];
            setCategories(cats);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load categories');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!formData.name.trim()) {
            setFormError('分類名稱為必填');
            return;
        }

        setIsSubmitting(true);

        try {
            const url = editingCategory
                ? `/api/admin/categories/${editingCategory.id}`
                : '/api/admin/categories';
            const method = editingCategory ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Operation failed');
            }

            setSuccessMessage(editingCategory ? '分類已更新' : '分類已新增');
            setShowForm(false);
            setEditingCategory(null);
            setFormData({ name: '', display_order: 0 });
            fetchCategories();

            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Operation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!deleteModal.category) return;

        setIsDeleting(true);

        try {
            const response = await fetch(`/api/admin/categories/${deleteModal.category.id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Delete failed');
            }

            setSuccessMessage('分類已刪除');
            setDeleteModal({ show: false, category: null });
            fetchCategories();

            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Delete failed');
        } finally {
            setIsDeleting(false);
        }
    };

    // Open edit form
    const openEditForm = (category: Category) => {
        setEditingCategory(category);
        setFormData({ name: category.name, display_order: category.display_order });
        setFormError(null);
        setShowForm(true);
    };

    // Open create form
    const openCreateForm = () => {
        setEditingCategory(null);
        setFormData({ name: '', display_order: categories.length + 1 });
        setFormError(null);
        setShowForm(true);
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">分類管理</h1>
                    <p className="text-gray-600 mt-1">共 {categories.length} 個分類</p>
                </div>
                <button
                    onClick={openCreateForm}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    新增分類
                </button>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {successMessage}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                    <button onClick={() => setError(null)} className="ml-2 text-red-500">✕</button>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="flex justify-center py-12">
                    <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
            )}

            {/* Category List */}
            {!isLoading && categories.length > 0 && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">排序</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">名稱</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {categories.map((category) => (
                                <tr key={category.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-500">{category.display_order}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{category.name}</td>
                                    <td className="px-6 py-4 text-right text-sm">
                                        <button
                                            onClick={() => openEditForm(category)}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            編輯
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal({ show: true, category })}
                                            className="text-red-600 hover:text-red-900"
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

            {/* Empty State */}
            {!isLoading && categories.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">尚無分類</p>
                    <button
                        onClick={openCreateForm}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                    >
                        新增分類
                    </button>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            {editingCategory ? '編輯分類' : '新增分類'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {formError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                                    {formError}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    分類名稱 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="輸入分類名稱"
                                    maxLength={50}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    排序順序
                                </label>
                                <input
                                    type="number"
                                    value={formData.display_order}
                                    onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    min={0}
                                />
                                <p className="mt-1 text-xs text-gray-500">數字越小排越前面</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                                >
                                    {isSubmitting ? '處理中...' : editingCategory ? '儲存' : '新增'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModal.show && deleteModal.category && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">確認刪除</h3>
                        <p className="text-gray-600 mb-4">
                            確定要刪除分類「{deleteModal.category.name}」嗎？
                            <br />
                            <span className="text-sm text-red-600">注意：如果有產品使用此分類，將無法刪除。</span>
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteModal({ show: false, category: null })}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                            >
                                {isDeleting ? '刪除中...' : '刪除'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
