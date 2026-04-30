import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithRedirect, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { app };

export const signInWithGoogle = async () => {
  if (!auth) {
    throw new Error("Firebase Auth not initialized.");
  }
  try {
    console.log("Attempting Google Sign-In with redirect...");
    await signInWithRedirect(auth, googleProvider);
    // Note: User resolution is handled by onAuthStateChanged in useAuth.tsx automatically
  } catch (error: any) {
    console.error("Error signing in with Google:", error.code, error.message);
    throw error;
  }
};

export const logout = () => auth && signOut(auth);
