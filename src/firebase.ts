import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, increment, serverTimestamp, arrayUnion } from 'firebase/firestore';

// Standard AI Studio Firebase pattern
let firebaseConfig: any = {
  apiKey: "AIzaSyAc-ii8kBpO1ia2RTZYTkyGobeUiQ05nFo",
  authDomain: "shirley-du-app.firebaseapp.com",
  projectId: "shirley-du-app",
  storageBucket: "shirley-du-app.firebasestorage.app",
  messagingSenderId: "24682636107",
  appId: "1:24682636107:web:dad8771f30542d9a01fece"
};

// Try to load from environment or placeholder
const envConfig = process.env.VITE_FIREBASE_CONFIG;
if (envConfig && envConfig !== 'undefined') {
  try {
    const parsed = typeof envConfig === 'string' ? JSON.parse(envConfig) : envConfig;
    firebaseConfig = { ...firebaseConfig, ...parsed };
  } catch (e) {
    console.error("Failed to parse VITE_FIREBASE_CONFIG", e);
  }
}

// Also check for individual variables
const individualConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: process.env.VITE_FIREBASE_DATABASE_ID
};

Object.entries(individualConfig).forEach(([key, value]) => {
  if (value && value !== 'undefined') {
    firebaseConfig[key] = value;
  }
});

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// @ts-ignore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, onAuthStateChanged, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, increment, serverTimestamp, arrayUnion };
