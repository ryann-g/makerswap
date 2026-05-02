import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logout } from '../lib/firebase';
import { UserProfile } from '../types';
import { formatFirestoreDate } from '../lib/utils';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  getToken: () => Promise<string | null>;
  login: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? `UID: ${firebaseUser.uid}` : "Logged out");
      
      try {
        setUser(firebaseUser);
        
        if (firebaseUser && db) {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            setProfile({ 
              id: userSnap.id, 
              uid: data.uid,
              name: data.name,
              email: data.email,
              image: data.image,
              universityOrg: data.universityOrg,
              bio: data.bio,
              createdAt: formatFirestoreDate(data.createdAt),
              updatedAt: formatFirestoreDate(data.updatedAt),
            } as UserProfile);
          } else {
            // New user creation
            const now = new Date().toISOString();
            const newProfileData = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Anonymous User',
              email: firebaseUser.email || '',
              image: firebaseUser.photoURL || '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            
            await setDoc(userRef, newProfileData);
            
            setProfile({ 
              id: firebaseUser.uid, 
              ...newProfileData,
              createdAt: now,
              updatedAt: now,
            } as UserProfile);
          }
        } else {
          setProfile(null);
        }
      } catch (error: any) {
        console.error("Profile synchronization failed:", error);
        toast.error("Profile sync error. Some features may be restricted.");
      } finally {
        setLoading(false);
      }
    });
    
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error(`Login failed: ${error.message}`);
      }
    }
  };

  const signOutHandler = async () => {
    try {
      await logout();
      setProfile(null);
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  const getToken = async () => {
    if (!user) return null;
    return await user.getIdToken();
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user || !db) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      const updatePayload = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      // Remove id/uid from payload if present to avoid overwriting constants
      delete (updatePayload as any).id;
      delete (updatePayload as any).uid;

      await updateDoc(userRef, updatePayload);
      
      // Refresh local profile state
      const updated = await getDoc(userRef);
      if (updated.exists()) {
        const updatedData = updated.data();
        setProfile({ 
          id: updated.id, 
          uid: updatedData.uid,
          name: updatedData.name,
          email: updatedData.email,
          image: updatedData.image,
          universityOrg: updatedData.universityOrg,
          bio: updatedData.bio,
          createdAt: formatFirestoreDate(updatedData.createdAt),
          updatedAt: formatFirestoreDate(updatedData.updatedAt),
        } as UserProfile);
      }
      toast.success("Profile updated");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to save changes.");
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, getToken, login, signOut: signOutHandler, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
