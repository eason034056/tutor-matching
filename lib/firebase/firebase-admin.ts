import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// 檢查是否已經初始化
const apps = getApps();

// 確保環境變數存在
if (!process.env.NEXT_PUBLIC_FIREBASE_ADMIN_PROJECT_ID || 
    !process.env.NEXT_PUBLIC_FIREBASE_ADMIN_CLIENT_EMAIL || 
    !process.env.NEXT_PUBLIC_FIREBASE_ADMIN_PRIVATE_KEY) {
  throw new Error('Missing Firebase Admin SDK credentials in environment variables');
}

if (!apps.length) {
  // 如果沒有初始化過，則初始化
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

// 導出 Firestore 實例
export const adminDb = getFirestore(); 