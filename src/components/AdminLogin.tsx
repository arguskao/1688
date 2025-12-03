/**
 * Admin Login Component
 * Handles admin authentication with password
 */
import { useState, type FormEvent } from 'react';

interface AdminLoginProps {
    onLoginSuccess?: () => void;
    redirectUrl?: string;
}

interface LoginState {
    password: string;
    isLoading: boolean;
    error: string | null;
}

export default function AdminLogin({
    onLoginSuccess,
    redirectUrl = '/admin/products'
}: AdminLoginProps) {
    const [state, setState] = useState<LoginState>({
        password: '',
        isLoading: false,
        error: null,
    });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!state.password.trim()) {
            setState(prev => ({ ...prev, error: '請輸入密碼' }));
            return;
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: state.password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: data.error || '登入失敗，請稍後再試',
                }));
                return;
            }

            // Login successful
            if (onLoginSuccess) {
                onLoginSuccess();
            }

            // Redirect to admin dashboard
            window.location.href = redirectUrl;

        } catch (error) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: '網路錯誤，請檢查連線後再試',
            }));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4">
            <div className="max-w-md w-full">
                {/* Logo / Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                        <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">管理員登入</h1>
                    <p className="text-gray-600 mt-2">請輸入管理員密碼以繼續</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Message */}
                        {state.error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                                <svg
                                    className="w-5 h-5 flex-shrink-0"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span>{state.error}</span>
                            </div>
                        )}

                        {/* Password Input */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                密碼
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={state.password}
                                onChange={(e) => setState(prev => ({
                                    ...prev,
                                    password: e.target.value,
                                    error: null
                                }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="請輸入管理員密碼"
                                disabled={state.isLoading}
                                autoFocus
                                autoComplete="current-password"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={state.isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {state.isLoading ? (
                                <>
                                    <svg
                                        className="animate-spin h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    <span>登入中...</span>
                                </>
                            ) : (
                                <span>登入</span>
                            )}
                        </button>
                    </form>
                </div>

                {/* Back Link */}
                <div className="text-center mt-6">
                    <a
                        href="/"
                        className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
                    >
                        ← 返回首頁
                    </a>
                </div>
            </div>
        </div>
    );
}
