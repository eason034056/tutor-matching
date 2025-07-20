import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// 檢查是否已經初始化
const apps = getApps();

// 檢查環境變數
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.warn('⚠️ Firebase Admin SDK 環境變數未完全設置');
  console.warn('請確保設置以下環境變數：');
  console.warn('- FIREBASE_ADMIN_PROJECT_ID');
  console.warn('- FIREBASE_ADMIN_CLIENT_EMAIL');
  console.warn('- FIREBASE_ADMIN_PRIVATE_KEY');
  
  // 在開發環境中，我們可以繼續運行，但在生產環境中會失敗
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing Firebase Admin SDK credentials in production environment');
  }
}

if (!apps.length && projectId && clientEmail && privateKey) {
  // 只有在所有環境變數都存在時才初始化
  try {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n')
      }),
      storageBucket: `${projectId}.appspot.com`,
    });
    console.log('✅ Firebase Admin SDK 初始化成功');
  } catch (error) {
    console.error('❌ Firebase Admin SDK 初始化失敗:', error);
    throw error;
  }
}

// 導出 Firestore 實例
export const adminDb = getFirestore();
export const adminStorage = getStorage(); 