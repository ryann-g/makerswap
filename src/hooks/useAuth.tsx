import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logout } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { UserProfile } from '../types';
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? `UID: ${user.uid}` : "Logged out");
      try {
        setUser(user);
        if (user && db) {
          console.log("Checking Firestore for profile...");
          try {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef).catch(err => handleFirestoreError(err, OperationType.GET, 'users/' + user.uid));
            
            if (userSnap.exists()) {
              console.log("Profile found in Firestore");
              const data = userSnap.data();
              setProfile({ 
                id: userSnap.id, 
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
              } as any);
            } else {
              console.log("No profile found, creating one...");
              const newProfileData = {
                uid: user.uid,
                name: user.displayName || 'Anonymous User',
                email: user.email || '',
                image: user.photoURL || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              };
              await setDoc(userRef, newProfileData).catch(err => handleFirestoreError(err, OperationType.WRITE, 'users/' + user.uid));
              console.log("Profile created successfully");
              setProfile({ 
                id: user.uid, 
                ...newProfileData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              } as any);
            }
          } catch (error: any) {
            console.error("Profile sync error detailed:", error);
            toast.error("Failed to sync your profile. You may have limited access.");
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
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
      console.error("Login failed:", error);
      toast.error("Login failed: " + (error.message || "Unknown error"));
    }
  };

  const signOutHandler = async () => {
    await logout();
  };

  const getToken = async () => {
    if (!user) return null;
    return await user.getIdToken();
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (user && db) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          ...data,
          updatedAt: serverTimestamp()
        }).catch(err => handleFirestoreError(err, OperationType.UPDATE, 'users/' + user.uid));
        const updated = await getDoc(userRef).catch(err => handleFirestoreError(err, OperationType.GET, 'users/' + user.uid));
        if (updated.exists()) {
          const updatedData = updated.data();
          setProfile({ 
            id: updated.id, 
            ...updatedData,
            createdAt: updatedData.createdAt?.toDate?.()?.toISOString() || updatedData.createdAt,
            updatedAt: updatedData.updatedAt?.toDate?.()?.toISOString() || updatedData.updatedAt,
          } as any);
        }
      } catch (error) {
        console.error("Update profile error:", error);
        throw error;
      }
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
