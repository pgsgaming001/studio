
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { auth as firebaseAuth } from '@/lib/firebase';
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
      console.error("AuthContext FATAL ERROR: Firebase Auth is not initialized (firebaseAuth is null in AuthContext). Authentication cannot function. Check src/lib/firebase.ts and its console logs.");
      setLoading(false);
      toast({
        title: "Critical Auth Error",
        description: "Firebase Auth service not initialized. App may not function correctly.",
        variant: "destructive",
        duration: Infinity, // Keep this critical error visible
      });
      return;
    }
    console.log("AuthContext: firebaseAuth instance is available.");

    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      console.log("AuthContext: onAuthStateChanged triggered. currentUser:", currentUser ? currentUser.uid : null);
      setUser(currentUser);
      setLoading(false);
    }, (error) => {
      console.error("AuthContext: Error in onAuthStateChanged listener:", error);
      setLoading(false);
      toast({
        title: "Authentication State Error",
        description: "Could not listen to authentication changes.",
        variant: "destructive",
      });
    });

    return () => {
      console.log("AuthContext: Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    };
  }, [toast]);

  const signInWithGoogle = async () => {
    if (!firebaseAuth) {
      toast({ title: "Auth Service Error", description: "Authentication service not available. Check Firebase setup.", variant: "destructive" });
      console.error("signInWithGoogle: firebaseAuth is not initialized.");
      setLoading(false);
      return;
    }
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    // Log the current origin
    const currentOrigin = typeof window !== "undefined" ? window.location.origin : "Unknown (not in browser)";
    console.log("AuthContext: Attempting Google Sign-In. Current window.location.origin:", currentOrigin);
    toast({ title: "Attempting Sign-In...", description: `Requesting from origin: ${currentOrigin}. Ensure this is in Google Cloud's 'Authorized JavaScript origins'.` });


    try {
      const result = await signInWithPopup(firebaseAuth, provider);
      // setUser(result.user); // onAuthStateChanged will handle this
      console.log("AuthContext: signInWithPopup successful. User:", result.user.uid);
      toast({
        title: "Signed In Successfully!",
        description: `Welcome, ${result.user.displayName || result.user.email}!`,
      });
    } catch (error: any) {
      console.error("AuthContext: Google Sign-In Error:", error);
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
            errorMessage = `This domain (${currentOrigin}) is not authorized for OAuth operations. Check 'Authorized JavaScript origins' in your Google Cloud Console for the OAuth client ID.`;
            break;
          default:
            errorMessage = `Error (${error.code}): ${error.message}` || errorMessage;
        }
      }
      toast({
        title: "Sign-In Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 10000, // Longer duration for errors
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
      // setUser(null); // onAuthStateChanged will handle this
      console.log("AuthContext: signOutUser successful.");
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      console.error("AuthContext: Sign-Out Error:", error);
      toast({
        title: "Sign-Out Failed",
        description: error.message || "An error occurred while signing out.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !firebaseAuth && typeof window !== 'undefined') { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-secondary/50">
        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
        <p className="text-xl text-muted-foreground">Initializing Authentication System...</p>
        <p className="text-sm text-destructive mt-2">If this persists, check Firebase configuration in src/lib/firebase.ts and console logs.</p>
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
