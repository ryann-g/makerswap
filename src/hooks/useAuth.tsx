import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, logout } from '../lib/firebase';
import { UserProfile } from '../types';
import { api } from '../services/api';
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
        if (user) {
          try {
            let p = await api.getUserProfile(user.uid);
            setProfile(p);
          } catch (error: any) {
            // If the user profile doesn't exist, create it
            const newProfile = {
              uid: user.uid,
              name: user.displayName || 'Anonymous User',
              email: user.email || '',
              image: user.photoURL || '',
            };
            const token = await user.getIdToken();
            await api.updateUserProfile(user.uid, newProfile, token);
            setProfile(newProfile as UserProfile);
          }
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

  const getToken = async () => {
    if (!user) return null;
    return await user.getIdToken();
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (user) {
      try {
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');
        await api.updateUserProfile(user.uid, data, token);
        const updated = await api.getUserProfile(user.uid);
        setProfile(updated);
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
