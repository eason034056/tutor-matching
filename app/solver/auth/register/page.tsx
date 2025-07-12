'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading, register } = useAuth();

  // 密碼強度檢查
  const passwordRequirements = [
    { label: '至少8個字符', check: password.length >= 8 },
    { label: '包含大寫字母', check: /[A-Z]/.test(password) },
    { label: '包含小寫字母', check: /[a-z]/.test(password) },
    { label: '包含數字', check: /\d/.test(password) },
  ];

  // 監聽認證狀態變化，如果用戶已登入則重定向
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/solver');
    }
  }, [user, authLoading, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 驗證密碼
    if (password !== confirmPassword) {
      setError('兩次輸入的密碼不一致');
      setLoading(false);
      return;
    }

    // 檢查密碼強度
    const allRequirementsMet = passwordRequirements.every(req => req.check);
    if (!allRequirementsMet) {
      setError('密碼不符合安全要求');
      setLoading(false);
      return;
    }



    try {
      await register(email, password);
      // 註冊成功後，useEffect 會自動處理重定向
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '註冊失敗，請稍後再試';
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
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">加入我們</h1>
          <p className="text-neutral-600">建立您的帳號開始使用青椒老師解題助手</p>
        </div>

        {/* 註冊表單 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-neutral-100">
          <form onSubmit={handleRegister} className="space-y-6">
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
              
              {/* 密碼強度指示 */}
              {password && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center text-xs">
                      <CheckCircle 
                        className={`w-3 h-3 mr-2 ${req.check ? 'text-green-500' : 'text-neutral-300'}`}
                      />
                      <span className={req.check ? 'text-green-700' : 'text-neutral-500'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 確認密碼 */}
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="block text-sm font-semibold text-neutral-700">
                確認密碼
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-neutral-200 focus:border-brand-500 focus:ring-brand-500 rounded-xl"
                  placeholder="請再次輸入您的密碼"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {/* 密碼匹配提示 */}
              {confirmPassword && (
                <div className="flex items-center text-xs mt-1">
                  <CheckCircle 
                    className={`w-3 h-3 mr-2 ${password === confirmPassword ? 'text-green-500' : 'text-red-500'}`}
                  />
                  <span className={password === confirmPassword ? 'text-green-700' : 'text-red-700'}>
                    {password === confirmPassword ? '密碼匹配' : '密碼不匹配'}
                  </span>
                </div>
              )}
            </div>



            {/* 註冊按鈕 */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  註冊中...
                </div>
              ) : (
                '建立帳號'
              )}
            </Button>
          </form>

          {/* 分隔線 */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-neutral-200"></div>
            <span className="px-4 text-sm text-neutral-500">或</span>
            <div className="flex-1 border-t border-neutral-200"></div>
          </div>

          {/* 登入連結 */}
          <div className="text-center">
            <p className="text-neutral-600">
              已經有帳號了？{' '}
              <Link
                href="/solver/auth/login"
                className="font-semibold text-brand-500 hover:text-brand-600 transition-colors"
              >
                立即登入
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