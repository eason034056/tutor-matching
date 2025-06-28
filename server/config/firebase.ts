import { initializeApp } from "firebase/app";
import { 
  collection, 
  getFirestore, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "tutor-matching-5c608.firebaseapp.com",
  projectId: "tutor-matching-5c608",
  storageBucket: "tutor-matching-5c608.appspot.com",
  messagingSenderId: "645473434432",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// 初始化 Storage
export const storage = getStorage(app);

export const tutorsCollection = collection(db, 'tutors');
export const casesCollection = collection(db, 'cases');
export const approvedTutorsCollection = collection(db, 'approvedTutors');
export const approvedCasesCollection = collection(db, 'approvedCases');
export default app;
