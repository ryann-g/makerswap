import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logout } from '../lib/firebase';
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
      try {
        setUser(user);
        if (user && db) {
          try {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              setProfile({ id: userSnap.id, ...userSnap.data() } as any);
            } else {
              // If the user profile doesn't exist, create it
              const newProfileData = {
                uid: user.uid,
                name: user.displayName || 'Anonymous User',
                email: user.email || '',
                image: user.photoURL || '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              };
              await setDoc(userRef, newProfileData);
              setProfile({ id: user.uid, ...newProfileData } as any);
            }
          } catch (error: any) {
            console.error("Profile sync error:", error);
            // Don't show toast on every retry, but log it
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
        });
        const updated = await getDoc(userRef);
        if (updated.exists()) {
          setProfile({ id: updated.id, ...updated.data() } as any);
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
