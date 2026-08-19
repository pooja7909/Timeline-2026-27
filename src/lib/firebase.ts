import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Bundled client-safe Firebase project credentials
export const FIREBASE_CONFIG = {
  projectId: "zinc-terminal-xr5vm",
  appId: "1:799733809546:web:5c215c86184595fb2d0873",
  
  authDomain: "zinc-terminal-xr5vm.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-computingcurricu-d3cba489-9250-4dee-a6b7-715fa9c413ff",
  storageBucket: "zinc-terminal-xr5vm.firebasestorage.app",
  messagingSenderId: "799733809546",
  oAuthClientId: "799733809546-ctl0l13nc458jg7vchmiv1keeip3tn9p.apps.googleusercontent.com"
};

// Initialize Firebase App singleton safely across bundlers
const app = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApp();

// Use the designated Firestore Database ID
export const db: Firestore = getFirestore(app, FIREBASE_CONFIG.firestoreDatabaseId);

export default app;
