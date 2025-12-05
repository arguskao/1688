/**
 * Admin Product Form Component
 * Handles both create and edit operations
 * Uses dynamic spec fields from database
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5
 */
import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import type { Product } from '../types/product';

interface SpecField {
    id: number;
    field_name: string;
    field_label: string;
    field_type: 'text' | 'number' | 'select';
    options: string[] | null;
    display_order: number;
    is_required: boolean;
}

interface AdminProductFormProps {
    product?: Product;
    mode: 'create' | 'edit';
}

interface FormData {
    product_id: string;
    name_en: string;
    sku: string;
    category: string;
    description_en: string;
    image_url: string;
}

interface FormErrors {
    [key: string]: string;
}

export default function AdminProductForm({ product, mode }: AdminProductFormProps) {
    const [formData, setFormData] = useState<FormData>({
        product_id: product?.product_id || '',
        name_en: product?.name_en || '',
        sku: product?.sku || '',
        category: product?.category || '',
        description_en: product?.description_en || '',
        image_url: product?.image_url || '',
    });

    // Dynamic spec fields values
    const [specValues, setSpecValues] = useState<Record<string, string>>({});
    const [specFields, setSpecFields] = useState<SpecField[]>([]);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(product?.image_url || null);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [categories, setCategories] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);


    // Fetch categories and spec fields from database
    useEffect(() => {
        // Fetch categories
        fetch('/api/admin/categories')
            .then(res => res.json())
            .then(data => {
                // Handle both formats: data.categories or data.data.categories
                const cats = data.categories || data.data?.categories || [];
                setCategories(cats.map((c: any) => c.name));
            })
            .catch(err => console.error('Failed to fetch categories:', err));

        // Fetch spec fields
        fetch('/api/admin/spec-fields')
            .then(res => res.json())
            .then(data => {
                // Handle both formats: data.specFields or data.data.specFields
                const fields = data.specFields || data.data?.specFields || [];
                setSpecFields(fields);
                // Initialize spec values from product if editing
                if (product?.specs_json) {
                    const specs = typeof product.specs_json === 'string'
                        ? JSON.parse(product.specs_json)
                        : product.specs_json;
                    setSpecValues(specs);
                }
            })
            .catch(err => console.error('Failed to fetch spec fields:', err));
    }, []);

    // Update form when product prop changes (for edit mode)
    useEffect(() => {
        if (product) {
            setFormData({
                product_id: product.product_id,
                name_en: product.name_en,
                sku: product.sku,
                category: product.category,
                description_en: product.description_en,
                image_url: product.image_url,
            });
            setImagePreview(product.image_url || null);

            // Set spec values
            if (product.specs_json) {
                const specs = typeof product.specs_json === 'string'
                    ? JSON.parse(product.specs_json)
                    : product.specs_json;
                setSpecValues(specs);
            }
        }
    }, [product]);

    // Handle input changes
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Handle spec field changes
    const handleSpecChange = (fieldName: string, value: string) => {
        setSpecValues(prev => ({ ...prev, [fieldName]: value }));
        if (errors[`spec_${fieldName}`]) {
            setErrors(prev => ({ ...prev, [`spec_${fieldName}`]: '' }));
        }
    };

    // Handle image selection
    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setErrors(prev => ({ ...prev, image: '請上傳 JPEG、PNG 或 WebP 格式的圖片' }));
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, image: '圖片大小不能超過 5MB' }));
            return;
        }

        setImageFile(file);
        setErrors(prev => ({ ...prev, image: '' }));

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(product?.image_url || null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };


    // Validate form
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        if (mode === 'create') {
            if (!formData.product_id.trim()) {
                newErrors.product_id = '產品 ID 為必填';
            } else if (!/^[A-Za-z0-9\-_]+$/.test(formData.product_id)) {
                newErrors.product_id = '產品 ID 只能包含字母、數字、連字號和底線';
            }
        }

        if (!formData.name_en.trim()) {
            newErrors.name_en = '產品名稱為必填';
        } else if (formData.name_en.length > 200) {
            newErrors.name_en = '產品名稱不能超過 200 字元';
        }

        if (!formData.sku.trim()) {
            newErrors.sku = 'SKU 為必填';
        } else if (!/^[A-Za-z0-9\-_]+$/.test(formData.sku)) {
            newErrors.sku = 'SKU 只能包含字母、數字、連字號和底線';
        }

        if (!formData.category) {
            newErrors.category = '請選擇分類';
        }

        if (!formData.description_en.trim()) {
            newErrors.description_en = '產品描述為必填';
        } else if (formData.description_en.length > 2000) {
            newErrors.description_en = '產品描述不能超過 2000 字元';
        }

        // Validate required spec fields
        specFields.forEach(field => {
            if (field.is_required && !specValues[field.field_name]?.trim()) {
                newErrors[`spec_${field.field_name}`] = `${field.field_label} 為必填`;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const submitData = new FormData();
            submitData.append('product_id', formData.product_id);
            submitData.append('name_en', formData.name_en);
            submitData.append('sku', formData.sku);
            submitData.append('category', formData.category);
            submitData.append('description_en', formData.description_en);
            submitData.append('specs_json', JSON.stringify(specValues));
            submitData.append('image_url', formData.image_url);

            if (imageFile) {
                submitData.append('image', imageFile);
            }

            const url = mode === 'create'
                ? '/api/admin/products'
                : `/api/admin/products/${product?.product_id}`;

            const response = await fetch(url, {
                method: mode === 'create' ? 'POST' : 'PUT',
                body: submitData,
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/admin/login';
                    return;
                }
                throw new Error(data.error || '操作失敗');
            }

            window.location.href = '/admin/products';

        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : '操作失敗，請稍後再試');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render spec field input based on type
    const renderSpecField = (field: SpecField) => {
        const value = specValues[field.field_name] || '';
        const error = errors[`spec_${field.field_name}`];

        if (field.field_type === 'select' && field.options) {
            return (
                <select
                    value={value}
                    onChange={(e) => handleSpecChange(field.field_name, e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
                >
                    <option value="">請選擇</option>
                    {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            );
        }

        return (
            <input
                type={field.field_type === 'number' ? 'number' : 'text'}
                value={value}
                onChange={(e) => handleSpecChange(field.field_name, e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={`輸入${field.field_label}`}
            />
        );
    };


    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    {mode === 'create' ? '新增產品' : '編輯產品'}
                </h1>
                <p className="text-gray-600 mt-1">
                    {mode === 'create' ? '填寫以下資訊以新增產品' : '修改產品資訊'}
                </p>
            </div>

            {submitError && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{submitError}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                {/* Product ID (only for create) */}
                {mode === 'create' && (
                    <div>
                        <label htmlFor="product_id" className="block text-sm font-medium text-gray-700 mb-1">
                            產品 ID <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="product_id"
                            name="product_id"
                            value={formData.product_id}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.product_id ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="例如：PROD-001"
                        />
                        {errors.product_id && <p className="mt-1 text-sm text-red-500">{errors.product_id}</p>}
                        <p className="mt-1 text-sm text-gray-500">唯一識別碼，建立後無法修改</p>
                    </div>
                )}

                {/* Product Name */}
                <div>
                    <label htmlFor="name_en" className="block text-sm font-medium text-gray-700 mb-1">
                        產品名稱 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="name_en"
                        name="name_en"
                        value={formData.name_en}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name_en ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="輸入產品名稱"
                    />
                    {errors.name_en && <p className="mt-1 text-sm text-red-500">{errors.name_en}</p>}
                </div>

                {/* SKU */}
                <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                        SKU <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="sku"
                        name="sku"
                        value={formData.sku}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.sku ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="例如：SKU-001"
                    />
                    {errors.sku && <p className="mt-1 text-sm text-red-500">{errors.sku}</p>}
                </div>

                {/* Category */}
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                        分類 <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
                    >
                        <option value="">請選擇分類</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description_en" className="block text-sm font-medium text-gray-700 mb-1">
                        產品描述 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="description_en"
                        name="description_en"
                        value={formData.description_en}
                        onChange={handleChange}
                        rows={4}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.description_en ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="輸入產品描述"
                    />
                    {errors.description_en && <p className="mt-1 text-sm text-red-500">{errors.description_en}</p>}
                    <p className="mt-1 text-sm text-gray-500">{formData.description_en.length}/2000 字元</p>
                </div>


                {/* Dynamic Spec Fields */}
                {specFields.length > 0 && (
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">產品規格</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {specFields.map(field => (
                                <div key={field.id}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {field.field_label}
                                        {field.is_required && <span className="text-red-500"> *</span>}
                                    </label>
                                    {renderSpecField(field)}
                                    {errors[`spec_${field.field_name}`] && (
                                        <p className="mt-1 text-sm text-red-500">{errors[`spec_${field.field_name}`]}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                        {specFields.length === 0 && (
                            <p className="text-gray-500 text-sm">
                                尚未設定規格欄位，請先到 <a href="/admin/spec-fields" className="text-blue-600 hover:underline">規格欄位管理</a> 新增。
                            </p>
                        )}
                    </div>
                )}

                {/* Image Upload */}
                <div className="border-t pt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">產品圖片</label>

                    {imagePreview && (
                        <div className="mb-3 relative inline-block">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-40 h-40 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            className="hidden"
                            id="image-upload"
                        />
                        <label
                            htmlFor="image-upload"
                            className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {imagePreview ? '更換圖片' : '上傳圖片'}
                        </label>
                        {imageFile && <span className="text-sm text-gray-500">{imageFile.name}</span>}
                    </div>
                    {errors.image && <p className="mt-1 text-sm text-red-500">{errors.image}</p>}
                    <p className="mt-1 text-sm text-gray-500">支援 JPEG、PNG、WebP 格式，最大 5MB</p>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <a
                        href="/admin/products"
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        取消
                    </a>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting && (
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        )}
                        {mode === 'create' ? '建立產品' : '儲存變更'}
                    </button>
                </div>
            </form>
        </div>
    );
}
