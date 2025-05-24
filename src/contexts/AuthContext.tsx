
"use client";

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth } from '../lib/firebase'; // Relative path
import {
  loginWithEmail,
  signupWithEmail,
  logoutUser,
  signInWithGooglePopup,
  type LoginCredentials,
  type SignupCredentials
} from '../services/authService'; // Relative path

interface AuthContextType {
  user: FirebaseUser | null;
  authLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<FirebaseUser>;
  signup: (credentials: SignupCredentials) => Promise<FirebaseUser>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<FirebaseUser>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(firebaseUser => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<FirebaseUser> => {
    const firebaseUser = await loginWithEmail(credentials.email, credentials.password);
    // setUser(firebaseUser); // Managed by onAuthStateChanged
    return firebaseUser;
  };

  const signup = async (credentials: SignupCredentials): Promise<FirebaseUser> => {
    const firebaseUser = await signupWithEmail(credentials.email, credentials.password);
    // setUser(firebaseUser); // Managed by onAuthStateChanged
    return firebaseUser;
  };

  const logout = async (): Promise<void> => {
    await logoutUser();
    // setUser(null); // Managed by onAuthStateChanged
  };

  const loginWithGoogle = async (): Promise<FirebaseUser> => {
    const firebaseUser = await signInWithGooglePopup();
    // setUser(firebaseUser); // Managed by onAuthStateChanged
    return firebaseUser;
  };

  const value = { user, authLoading, login, signup, logout, loginWithGoogle };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
