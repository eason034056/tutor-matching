import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const normalizeStorageBucket = (rawBucket: string | undefined, projectId: string) => {
  const trimmed = (rawBucket || '').trim().replace(/^['"]|['"]$/g, '');
  if (!trimmed) {
    return `${projectId}.appspot.com`;
  }

  if (trimmed.startsWith('gs://')) {
    return trimmed.replace('gs://', '').replace(/\/+$/, '');
  }

  return trimmed.replace(/\/+$/, '');
};

export function initAdmin() {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase Admin 環境變數未設置');
    }

    const storageBucket = normalizeStorageBucket(
      process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      projectId
    );

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      storageBucket,
    });
  }

  return getFirestore();
}

export const adminDb = initAdmin();
export const adminStorage = getStorage();
