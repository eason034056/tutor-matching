import { useState, useEffect } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  reload
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export function useAuth() {
  console.log('[DEBUG] useAuth hook 被呼叫');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[DEBUG] useAuth useEffect 開始執行');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('[DEBUG] onAuthStateChanged called, user:', user);
      setUser(user);
      setLoading(false);
    });
    console.log('[DEBUG] onAuthStateChanged 已註冊');

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      console.log('[註冊] 開始註冊用戶:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('[註冊] 用戶註冊成功:', userCredential.user.uid);
      
      // 註冊成功後自動發送驗證郵件
      console.log('[註冊] 準備發送驗證郵件到:', email);
      await sendEmailVerification(userCredential.user);
      console.log('[註冊] 驗證郵件發送成功');
      
      return userCredential.user;
    } catch (error) {
      console.error('[註冊] 註冊失敗:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  // 重新發送驗證郵件
  const resendVerificationEmail = async () => {
    try {
      if (user) {
        console.log('[重新發送] 準備重新發送驗證郵件到:', user.email);
        console.log('[重新發送] 用戶資訊:', { uid: user.uid, emailVerified: user.emailVerified });
        await sendEmailVerification(user);
        console.log('[重新發送] 驗證郵件重新發送成功');
      } else {
        console.error('[重新發送] 錯誤：沒有登入的用戶');
        throw new Error('沒有登入的用戶');
      }
    } catch (error) {
      console.error('[重新發送] 重新發送驗證郵件失敗:', error);
      throw error;
    }
  };

  // 重新載入用戶狀態（檢查是否已驗證）
  const refreshUser = async () => {
    try {
      if (user) {
        await reload(user);
        // 重新載入後更新狀態
        setUser({ ...user });
      }
    } catch (error) {
      throw error;
    }
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    resendVerificationEmail,
    refreshUser
  };
} 