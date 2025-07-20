import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// 檢查是否已經初始化
const apps = getApps();

function validateEnvironmentVariables() {
  const requiredVars = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  } as const;

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return requiredVars as {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  };
}

// 初始化 Firebase Admin
if (!apps.length) {
  try {
    console.log('初始化 Firebase Admin...');
    const { projectId, clientEmail, privateKey } = validateEnvironmentVariables();

    const config = {
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      storageBucket: `${projectId}.appspot.com`,
    };

    console.log('Firebase Admin 配置:', {
      projectId,
      clientEmail,
      hasPrivateKey: !!privateKey,
      storageBucket: config.storageBucket,
    });

    initializeApp(config);
    console.log('Firebase Admin 初始化成功');
  } catch (error) {
    console.error('Firebase Admin 初始化失敗:', error);
    throw error;
  }
}

// 初始化並導出服務
let adminDb: ReturnType<typeof getFirestore>;
let adminStorage: ReturnType<typeof getStorage>;

try {
  console.log('初始化 Firestore...');
  adminDb = getFirestore();
  console.log('Firestore 初始化成功');

  console.log('初始化 Storage...');
  adminStorage = getStorage();
  console.log('Storage 初始化成功');
} catch (error) {
  console.error('服務初始化失敗:', error);
  throw error;
}

export { adminDb, adminStorage }; 