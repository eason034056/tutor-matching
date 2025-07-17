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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // 註冊成功後自動發送驗證郵件
      await sendEmailVerification(userCredential.user);
      return userCredential.user;
    } catch (error) {
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
        await sendEmailVerification(user);
      } else {
        throw new Error('沒有登入的用戶');
      }
    } catch (error) {
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