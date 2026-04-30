import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, logout } from '../lib/firebase';
import { UserProfile } from '../types';
import { getUserProfile, createUserProfile } from '../services/db';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
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
        if (user) {
          let p = await getUserProfile(user.uid);
          if (!p) {
            p = {
              uid: user.uid,
              name: user.displayName || 'Anonymous User',
              email: user.email || '',
              image: user.photoURL || '',
            };
            await createUserProfile(user.uid, p);
          }
          setProfile(p);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        toast.error("Profile synchronization failed. Check if Firestore rules are deployed.");
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

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (user) {
      try {
        await createUserProfile(user.uid, data);
        const updated = await getUserProfile(user.uid);
        setProfile(updated);
      } catch (error) {
        console.error("Update profile error:", error);
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signOut: signOutHandler, updateProfile }}>
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
