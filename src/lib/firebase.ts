import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
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
    console.log("Attempting Google Sign-In with popup...");
    await signInWithPopup(auth, googleProvider);
    // Note: User resolution is handled by onAuthStateChanged in useAuth.tsx automatically
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error signing in with Google:", (error as any).code, error.message);
    } else {
      console.error("Error signing in with Google:", error);
    }
    throw error;
  }
};

export const logout = () => auth && signOut(auth);
