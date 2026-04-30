import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app: any = null;
let db: any = null;
let auth: any = null;

try {
  if (firebaseConfig && firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
  }
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

export { app, db, auth };
export const googleProvider = new GoogleAuthProvider();

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
