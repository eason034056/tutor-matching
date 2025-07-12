'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();

  // 監聽認證狀態變化，如果用戶已登入則重定向
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/solver');
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      // 登入成功後，useEffect 會自動處理重定向
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '登入失敗，請檢查您的帳號密碼';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 如果認證還在載入中，顯示載入狀態
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-200 border-t-brand-500 mx-auto mb-4"></div>
          <p className="text-neutral-600 font-medium">檢查登入狀態...</p>
        </div>
      </div>
    );
  }

  // 如果用戶已登入，顯示重定向狀態
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-200 border-t-brand-500 mx-auto mb-4"></div>
          <p className="text-neutral-600 font-medium">重定向到解題助手...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 p-4">
      <div className="w-full max-w-md">
        {/* 品牌標識 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4">
            <Image
              src="/teacher-icon.png"
              alt="青椒老師"
              width={48}
              height={48}
              className="rounded-xl"
            />
          </div>
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">歡迎回來</h1>
          <p className="text-neutral-600">登入您的帳號繼續使用青椒老師解題助手</p>
        </div>

        {/* 登入表單 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-neutral-100">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* 錯誤訊息 */}
            {error && (
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* 電子郵件 */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-neutral-700">
                電子郵件
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-neutral-200 focus:border-brand-500 focus:ring-brand-500 rounded-xl"
                  placeholder="請輸入您的電子郵件"
                  required
                />
              </div>
            </div>

            {/* 密碼 */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-neutral-700">
                密碼
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-neutral-200 focus:border-brand-500 focus:ring-brand-500 rounded-xl"
                  placeholder="請輸入您的密碼"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* 記住我和忘記密碼 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-brand-500 focus:ring-brand-500 border-neutral-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-neutral-700">
                  記住我
                </label>
              </div>
              <Link
                href="#"
                className="text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
              >
                忘記密碼？
              </Link>
            </div>

            {/* 登入按鈕 */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  登入中...
                </div>
              ) : (
                '登入'
              )}
            </Button>
          </form>

          {/* 分隔線 */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-neutral-200"></div>
            <span className="px-4 text-sm text-neutral-500">或</span>
            <div className="flex-1 border-t border-neutral-200"></div>
          </div>

          {/* 註冊連結 */}
          <div className="text-center">
            <p className="text-neutral-600">
              還沒有帳號？{' '}
              <Link
                href="/solver/auth/register"
                className="font-semibold text-brand-500 hover:text-brand-600 transition-colors"
              >
                立即註冊
              </Link>
            </p>
          </div>
        </div>

        {/* 返回首頁 */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-neutral-500 hover:text-neutral-700 transition-colors text-sm"
          >
            ← 返回首頁
          </Link>
        </div>
      </div>
    </div>
  );
} 