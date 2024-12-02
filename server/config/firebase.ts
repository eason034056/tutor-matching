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

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "tutor-matching-5c608.firebaseapp.com",
  projectId: "tutor-matching-5c608",
  storageBucket: "tutor-matching-5c608.firebasestorage.app",
  messagingSenderId: "645473434432",
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const tutorsCollection = collection(db, 'tutors');
export const casesCollection = collection(db, 'cases');
export default db;
