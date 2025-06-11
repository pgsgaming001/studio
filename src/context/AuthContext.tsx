
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
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
      console.error("Firebase Auth is not initialized in AuthContext. Auth context cannot function.");
      setLoading(false);
      // It's important that firebaseAuth itself is correctly initialized in firebase.ts
      // The toast here might be redundant if firebase.ts already logs/handles its init error.
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    }, (error) => {
      console.error("Error in onAuthStateChanged listener:", error);
      setLoading(false);
      toast({
        title: "Authentication State Error",
        description: "Could not listen to authentication changes.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [toast]);

  const signInWithGoogle = async () => {
    if (!firebaseAuth) {
      toast({ title: "Auth Service Error", description: "Authentication service not available. Check Firebase setup.", variant: "destructive" });
      console.error("signInWithGoogle: firebaseAuth is not initialized.");
      setLoading(false); // Ensure loading is false if we can't proceed
      return;
    }
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(firebaseAuth, provider);
      setUser(result.user); // State will be updated by onAuthStateChanged, but this is good for immediate feedback
      toast({
        title: "Signed In Successfully!",
        description: `Welcome, ${result.user.displayName || result.user.email}!`,
      });
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      let errorMessage = "Failed to sign in with Google. Please try again.";
      if (error.code) {
        switch (error.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = "Sign-in popup was closed before completion.";
            break;
          case 'auth/cancelled-popup-request':
          case 'auth/popup-blocked':
            errorMessage = "Sign-in popup was cancelled or blocked. Please allow popups and try again.";
            break;
          case 'auth/network-request-failed':
            errorMessage = "Network error during sign-in. Please check your connection.";
            break;
          case 'auth/unauthorized-domain':
            errorMessage = "This domain is not authorized for OAuth operations. Check your Firebase and Google Cloud console settings for Authorized Domains.";
            break;
          // Add more specific Firebase error codes as needed
          default:
            errorMessage = error.message || errorMessage;
        }
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
      toast({ title: "Auth Service Error", description: "Authentication service not available.", variant: "destructive" });
      console.error("signOutUser: firebaseAuth is not initialized.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      await signOut(firebaseAuth);
      setUser(null); // State will be updated by onAuthStateChanged
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      console.error("Sign-Out Error:", error);
      toast({
        title: "Sign-Out Failed",
        description: error.message || "An error occurred while signing out.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // This addresses the case where firebaseAuth might not be initialized from src/lib/firebase.ts
  if (loading && !firebaseAuth && typeof window !== 'undefined') { 
    // Only show this specific loader/message if firebaseAuth is truly missing after initial load attempt.
    // The useEffect will also handle the loading state if firebaseAuth is available.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-secondary/50">
        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
        <p className="text-xl text-muted-foreground">Initializing Authentication...</p>
        <p className="text-sm text-destructive mt-2">If this persists, check Firebase configuration.</p>
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
