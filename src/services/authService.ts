
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  type UserCredential,
  type User as FirebaseUser // Alias to avoid confusion with other User types
} from 'firebase/auth';
import { auth } from '../lib/firebase'; // Relative path to firebase initialization

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {}

export const loginWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error("Error logging in with email:", error.message);
    // Better to re-throw or handle specific Firebase error codes
    throw new Error(error.message || 'Login failed. Please check your credentials.');
  }
};

export const signupWithEmail = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error("Error signing up with email:", error.message);
    throw new Error(error.message || 'Signup failed. Please try again.');
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error("Error logging out:", error.message);
    throw new Error(error.message || 'Logout failed.');
  }
};

export const signInWithGooglePopup = async (): Promise<FirebaseUser> => {
  const provider = new GoogleAuthProvider();
  try {
    const userCredential: UserCredential = await signInWithPopup(auth, provider);
    return userCredential.user;
  } catch (error: any) {
    console.error("Error signing in with Google:", error.message);
    // Handle specific errors like 'auth/popup-closed-by-user' if needed
    throw new Error(error.message || 'Google Sign-in failed. Please try again.');
  }
};
