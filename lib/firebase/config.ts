import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { ChatHistory } from '@/lib/types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 初始化 Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

export async function uploadImageToStorage(file: File, userId: string): Promise<string> {
  console.log('[DEBUG] uploadImageToStorage file:', file, 'userId:', userId);
  const ext = file.name.split('.').pop();
  const storageRef = ref(storage, `chat_images/${userId}_${Date.now()}.${ext}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  console.log('[DEBUG] uploadImageToStorage imageUrl:', url);
  return url;
}

export async function getChatHistory(userId: string): Promise<(ChatHistory & { id: string })[]> {
  console.log('[DEBUG] getChatHistory userId:', userId);
  const q = query(
    collection(db, 'chat_history'),
    where('userId', '==', userId),
    orderBy('timestamp', 'asc')
  );
  const querySnapshot = await getDocs(q);
  console.log('[DEBUG] chat_history 查詢結果數量:', querySnapshot.size);
  querySnapshot.forEach(doc => {
    console.log('[DEBUG] chat_history 文件:', doc.id, doc.data());
  });
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }) as ChatHistory & { id: string });
} 