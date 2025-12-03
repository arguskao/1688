/**
 * Admin Product Import Component
 * Handles bulk product import from CSV or JSON files
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */
import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';

interface ImportError {
    row: number;
    product_id?: string;
    errors: string[];
}

interface ImportResult {
    success: boolean;
    imported: number;
    failed: number;
    errors: ImportError[];
}

export default function AdminProductImport() {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle file selection
    const handleFileSelect = (selectedFile: File) => {
        // Validate file type
        const validTypes = ['text/csv', 'application/json', 'text/plain'];
        const validExtensions = ['.csv', '.json'];
        const hasValidExtension = validExtensions.some(ext =>
            selectedFile.name.toLowerCase().endsWith(ext)
        );

        if (!validTypes.includes(selectedFile.type) && !hasValidExtension) {
            setError('請上傳 CSV 或 JSON 格式的檔案');
            return;
        }

        // Validate file size (10MB max)
        if (selectedFile.size > 10 * 1024 * 1024) {
            setError('檔案大小不能超過 10MB');
            return;
        }

        setFile(selectedFile);
        setError(null);
        setResult(null);
    };

    // Handle input change
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            handleFileSelect(selectedFile);
        }
    };

    // Handle drag events
    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    };

    // Handle upload
    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/admin/products/import', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/admin/login';
                    return;
                }
                throw new Error(data.error || '匯入失敗');
            }

            setResult(data);

        } catch (err) {
            setError(err instanceof Error ? err.message : '匯入失敗，請稍後再試');
        } finally {
            setIsUploading(false);
        }
    };

    // Reset form
    const handleReset = () => {
        setFile(null);
        setResult(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">匯入產品</h1>
                <p className="text-gray-600 mt-1">上傳 CSV 或 JSON 檔案以批量匯入產品</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Import Result */}
            {result && (
                <div className={`mb-6 p-4 rounded-lg border ${result.failed === 0
                        ? 'bg-green-50 border-green-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                    <h3 className={`font-semibold ${result.failed === 0 ? 'text-green-800' : 'text-yellow-800'
                        }`}>
                        匯入完成
                    </h3>
                    <div className="mt-2 space-y-1">
                        <p className="text-sm">
                            <span className="text-green-600 font-medium">{result.imported}</span> 個產品成功匯入
                        </p>
                        {result.failed > 0 && (
                            <p className="text-sm">
                                <span className="text-red-600 font-medium">{result.failed}</span> 個產品匯入失敗
                            </p>
                        )}
                    </div>

                    {/* Error Details */}
                    {result.errors.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">錯誤詳情：</h4>
                            <div className="max-h-60 overflow-y-auto bg-white rounded border border-gray-200">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">行號</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">產品 ID</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">錯誤</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {result.errors.map((err, idx) => (
                                            <tr key={idx}>
                                                <td className="px-3 py-2 text-gray-900">{err.row}</td>
                                                <td className="px-3 py-2 text-gray-500">{err.product_id || '-'}</td>
                                                <td className="px-3 py-2 text-red-600">{err.errors.join(', ')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                            匯入更多
                        </button>
                        <a
                            href="/admin/products"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            查看產品列表
                        </a>
                    </div>
                </div>
            )}

            {/* Upload Form */}
            {!result && (
                <div className="bg-white rounded-lg shadow p-6">
                    {/* Drop Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                                ? 'border-blue-500 bg-blue-50'
                                : file
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-300 hover:border-gray-400'
                            }`}
                    >
                        {file ? (
                            <div>
                                <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="mt-2 text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-sm text-gray-500">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                                <button
                                    onClick={handleReset}
                                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                                >
                                    移除檔案
                                </button>
                            </div>
                        ) : (
                            <div>
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="mt-2 text-sm text-gray-600">
                                    拖放檔案到此處，或
                                    <label className="text-blue-600 hover:text-blue-700 cursor-pointer ml-1">
                                        點擊選擇檔案
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleInputChange}
                                            accept=".csv,.json"
                                            className="hidden"
                                        />
                                    </label>
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    支援 CSV 和 JSON 格式，最大 10MB
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Upload Button */}
                    {file && (
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isUploading && (
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                )}
                                {isUploading ? '匯入中...' : '開始匯入'}
                            </button>
                        </div>
                    )}

                    {/* Format Guide */}
                    <div className="mt-6 border-t pt-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">檔案格式說明</h3>

                        <div className="space-y-4">
                            {/* CSV Format */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700">CSV 格式</h4>
                                <p className="text-xs text-gray-500 mt-1">
                                    第一行為標題列，必須包含以下欄位：
                                </p>
                                <code className="block mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                    product_id,name_en,sku,category,description_en,specs_json
                                </code>
                            </div>

                            {/* JSON Format */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700">JSON 格式</h4>
                                <p className="text-xs text-gray-500 mt-1">
                                    JSON 陣列，每個物件包含產品資料：
                                </p>
                                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                    {`[
  {
    "product_id": "PROD-001",
    "name_en": "Product Name",
    "sku": "SKU-001",
    "category": "Drinkware",
    "description_en": "Description",
    "specs_json": {"材質": "不鏽鋼"}
  }
]`}
                                </pre>
                            </div>

                            {/* Valid Categories */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-700">有效分類</h4>
                                <p className="text-xs text-gray-500 mt-1">
                                    Drinkware, Kitchenware, Office Supplies, Electronics, Furniture, Home Decor, Textiles, Toys, Sports, Beauty, Health, Automotive, Garden, Pet Supplies, Other
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
