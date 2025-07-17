'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading, register, resendVerificationEmail, refreshUser } = useAuth();

  // 密碼強度檢查
  const passwordRequirements = [
    { label: '至少6個字符', check: password.length >= 6 },
  ];

  // 監聽認證狀態變化
  useEffect(() => {
    if (!authLoading && user) {
      // 如果用戶已驗證 email，重定向到主頁
      if (user.emailVerified) {
        router.push('/solver');
      } else {
        // 如果用戶未驗證 email，顯示驗證頁面
        setShowEmailVerification(true);
      }
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
      // 註冊成功後會自動發送驗證郵件，顯示驗證頁面
      setShowEmailVerification(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '註冊失敗，請稍後再試';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 重新發送驗證郵件
  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setError('');

    try {
      await resendVerificationEmail();
      setResendSuccess(true);
      // 3秒後隱藏成功訊息
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '重新發送驗證郵件失敗';
      setError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  // 檢查驗證狀態
  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    setError('');

    try {
      await refreshUser();
      // 重新載入後，useEffect 會檢查驗證狀態
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '檢查驗證狀態失敗';
      setError(errorMessage);
    } finally {
      setCheckingVerification(false);
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

  // 如果用戶已登入且已驗證，顯示重定向狀態
  if (user && user.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-200 border-t-brand-500 mx-auto mb-4"></div>
          <p className="text-neutral-600 font-medium">重定向到解題助手...</p>
        </div>
      </div>
    );
  }

  // 如果需要顯示 email 驗證頁面
  if (showEmailVerification) {
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
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">驗證您的電子郵件</h1>
            <p className="text-neutral-600">我們已經發送驗證郵件到您的信箱</p>
          </div>

          {/* 驗證說明卡片 */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-neutral-100">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-100 rounded-full mb-4">
                <Mail className="w-8 h-8 text-brand-500" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-800 mb-2">檢查您的信箱</h2>
              <p className="text-neutral-600 text-sm">
                我們已經發送驗證連結到：<br />
                <span className="font-medium text-brand-600">{user?.email}</span>
              </p>
            </div>

            {/* 錯誤訊息 */}
            {error && (
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* 重新發送成功訊息 */}
            {resendSuccess && (
              <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                <p className="text-green-700 text-sm">驗證郵件已重新發送！</p>
              </div>
            )}

            {/* 驗證說明 */}
            <div className="bg-brand-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-neutral-800 mb-2">請按照以下步驟進行驗證：</h3>
              <ol className="text-sm text-neutral-600 space-y-1">
                <li>1. 檢查您的電子郵件收件箱</li>
                <li>2. 點擊驗證連結</li>
                <li>3. 返回此頁面並點擊「我已驗證」</li>
              </ol>
            </div>

            {/* 操作按鈕 */}
            <div className="space-y-3">
              <Button
                onClick={handleCheckVerification}
                disabled={checkingVerification}
                className="w-full h-12 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all duration-200"
              >
                {checkingVerification ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    檢查中...
                  </div>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    我已驗證
                  </>
                )}
              </Button>

              <Button
                onClick={handleResendVerification}
                disabled={resendLoading}
                variant="outline"
                className="w-full h-12 border-brand-200 text-brand-600 hover:bg-brand-50 font-semibold rounded-xl transition-all duration-200"
              >
                {resendLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-500 border-t-transparent mr-2"></div>
                    發送中...
                  </div>
                ) : (
                  '重新發送驗證郵件'
                )}
              </Button>
            </div>

            {/* 說明文字 */}
            <div className="mt-6 text-center">
              <p className="text-xs text-neutral-500">
                沒有收到郵件？請檢查垃圾郵件資料夾，或點擊重新發送
              </p>
            </div>
          </div>

          {/* 返回登入 */}
          <div className="text-center mt-6">
            <Link
              href="/solver/auth/login"
              className="text-neutral-500 hover:text-neutral-700 transition-colors text-sm"
            >
              ← 返回登入
            </Link>
          </div>
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