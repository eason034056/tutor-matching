import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// 檢查是否已經初始化
const apps = getApps();

function validateEnvironmentVariables() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing required Firebase Admin SDK credentials');
  }

  // 構建完整的 bucket URL
  const bucketUrl = `gs://tutor-matching-5c608.appspot.com`;

  return {
    projectId,
    clientEmail,
    privateKey,
    bucketUrl,
  };
}

// 初始化 Firebase Admin
if (!apps.length) {
  try {
    console.log('初始化 Firebase Admin...');
    const { projectId, clientEmail, privateKey, bucketUrl } = validateEnvironmentVariables();

    console.log('使用的 Storage Bucket:', bucketUrl);

    const config = {
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      storageBucket: bucketUrl,
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
  
  // 檢查 Storage 是否正確初始化
  const bucket = adminStorage.bucket();
  console.log('Storage bucket 名稱:', bucket.name);
  
  console.log('Storage 初始化成功');
} catch (error) {
  console.error('服務初始化失敗:', error);
  throw error;
}

export { adminDb, adminStorage }; 