
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let analytics: Analytics | null = null;
let storage: FirebaseStorage | null = null;
let isFirebaseInitialized = false;

if (typeof window !== 'undefined') {
  // Check that all required config values are present
  const requiredConfig = [
    'apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'
  ];
  const missingConfig = requiredConfig.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

  if (missingConfig.length > 0) {
    console.error(
      'Firebase configuration is missing or incomplete. Please check your .env file in the root of your project. Missing keys:', 
      missingConfig.join(', ')
    );
    isFirebaseInitialized = false;
  } else {
    try {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      auth = getAuth(app);
      firestore = getFirestore(app);
      storage = getStorage(app);
      if (firebaseConfig.measurementId) {
        analytics = getAnalytics(app);
      }
      isFirebaseInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      isFirebaseInitialized = false;
    }
  }
}

export { app, auth, firestore, analytics, storage, isFirebaseInitialized };
