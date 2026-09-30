import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInAnonymously,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { verifyCredentials, extractDisplayName } from './userService';

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  userEmail: string;
  displayName: string;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'immediatecrm_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [displayEmail, setDisplayEmail] = useState<string>('james@gmail.com');
  const [displayName, setDisplayName] = useState<string>('James');

  // Sync user record to Firestore users collection
  const syncUserToFirestore = async (email: string, uid: string, name: string) => {
    try {
      const userRef = doc(db, 'users', email.toLowerCase());
      await setDoc(
        userRef,
        {
          userId: uid,
          email,
          displayName: name,
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Firestore user record sync non-fatal warning:', e);
    }
  };

  useEffect(() => {
    // Check for stored session in localStorage
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.email) {
          setUser(parsed);
          setDisplayEmail(parsed.email);
          setDisplayName(parsed.displayName || extractDisplayName(parsed.email));
        }
      } catch (e) {
        // ignore parse error
      }
    }

    // Ensure client is connected to Firebase anonymously for Firestore access
    if (!auth.currentUser) {
      signInAnonymously(auth).catch((err) => {
        console.warn('Anonymous auth sync warning:', err);
      });
    }

    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    setAuthError(null);
    const cleanEmail = email.trim();
    const cleanPass = pass.trim();

    if (!cleanEmail || !cleanPass) {
      const err = 'Please enter both email and password.';
      setAuthError(err);
      throw new Error(err);
    }

    const verification = await verifyCredentials(cleanEmail, cleanPass);
    if (!verification.success || !verification.user) {
      const err = verification.error || 'Access denied: Invalid credentials.';
      setAuthError(err);
      throw new Error(err);
    }

    const matched = verification.user;
    const cleanName = matched.name || extractDisplayName(matched.email);

    // Make sure Firebase Auth session is active
    let uid = `usr_${matched.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`;
    try {
      if (!auth.currentUser) {
        const cred = await signInAnonymously(auth);
        if (cred.user) uid = cred.user.uid;
      } else {
        uid = auth.currentUser.uid;
      }
    } catch (e) {
      console.warn('Firebase anonymous sync:', e);
    }

    const sessionUser: AppUser = {
      uid,
      email: matched.email,
      displayName: cleanName,
    };

    setUser(sessionUser);
    setDisplayEmail(matched.email);
    setDisplayName(cleanName);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessionUser));

    // Record login in Firestore
    await syncUserToFirestore(matched.email, uid, cleanName);
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('signOut error:', e);
    }
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setUser(null);
  };

  const clearAuthError = () => setAuthError(null);

  const effectiveEmail = user?.email || displayEmail || 'james@gmail.com';
  const effectiveName = user?.displayName || displayName || extractDisplayName(effectiveEmail);

  return (
    <AuthContext.Provider
      value={{
        user,
        userEmail: effectiveEmail,
        displayName: effectiveName,
        loading,
        login,
        logout,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
