import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, increment, serverTimestamp } from 'firebase/firestore';

// Standard AI Studio Firebase pattern
let firebaseConfig: any = {
  apiKey: "PLACEHOLDER",
  authDomain: "PLACEHOLDER",
  projectId: "PLACEHOLDER",
  storageBucket: "PLACEHOLDER",
  messagingSenderId: "PLACEHOLDER",
  appId: "PLACEHOLDER"
};

// Try to load from environment or placeholder
if (typeof process !== 'undefined' && process.env.VITE_FIREBASE_CONFIG) {
  try {
    firebaseConfig = JSON.parse(process.env.VITE_FIREBASE_CONFIG);
  } catch (e) {
    console.error("Failed to parse VITE_FIREBASE_CONFIG");
  }
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// @ts-ignore
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, onAuthStateChanged, doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, increment, serverTimestamp };
