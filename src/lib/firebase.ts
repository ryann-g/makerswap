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
    console.error("Firebase Auth not initialized. Check your configuration.");
    throw new Error("Firebase Auth not initialized. Check your configuration.");
  }
  try {
    console.log("Attempting Google Sign-In with popup...");
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Login successful:", result.user.email);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google:", error.code, error.message);
    throw error;
  }
};

export const logout = () => auth && signOut(auth);
