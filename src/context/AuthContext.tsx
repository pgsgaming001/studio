
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Auth,
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { auth as firebaseAuth } from '@/lib/firebase'; // Assuming auth is exported from firebase.ts
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!firebaseAuth) {
      console.error("Firebase Auth is not initialized. Auth context cannot function.");
      setLoading(false);
      toast({
        title: "Authentication Error",
        description: "Firebase Auth service is not available. Please check console.",
        variant: "destructive",
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const signInWithGoogle = async () => {
    if (!firebaseAuth) {
      toast({ title: "Auth Error", description: "Authentication service not available.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(firebaseAuth, provider);
      setUser(result.user);
      toast({
        title: "Signed In Successfully!",
        description: `Welcome, ${result.user.displayName || result.user.email}!`,
      });
      // Optional: Save user to your DB here if needed
      // e.g., await saveUserToDb(result.user);
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      let errorMessage = "Failed to sign in with Google.";
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in popup was closed. Please try again.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = "Sign-in was cancelled. Please try again.";
      }
      toast({
        title: "Sign-In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    if (!firebaseAuth) {
      toast({ title: "Auth Error", description: "Authentication service not available.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await signOut(firebaseAuth);
      setUser(null);
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error("Sign-Out Error:", error);
      toast({
        title: "Sign-Out Failed",
        description: "An error occurred while signing out.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !firebaseAuth) { // Initial check if auth itself failed to load
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">Auth service unavailable. Check console.</p>
      </div>
    );
  }


  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
