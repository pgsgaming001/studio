
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics } from "firebase/analytics";

// IMPORTANT: Ensure these are your actual Firebase project configuration values!
// You can find this in your Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyDAxciWioV8mRKd6k3U-W73xPWENdVUXpI",
  authDomain: "xerox2u-5855f.firebaseapp.com",
  projectId: "xerox2u-5855f",
  storageBucket: "xerox2u-5855f.appspot.com",
  messagingSenderId: "1023070994651",
  appId: "1:1023070994651:web:48802fe9d8efbeb20bccfe",
  measurementId: "G-GVGL819SMW"
};

let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | undefined;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase initialized with config for project:", firebaseConfig.projectId);
  } catch (error) {
    console.error("Error initializing Firebase app:", error);
    // Fallback or rethrow, depending on how critical initialization is.
    // For now, we'll let it proceed and other services might fail.
    // A more robust solution might involve not exporting db, storage if app init fails.
    app = null as any; // To satisfy TypeScript if it must be assigned
  }
} else {
  app = getApp();
  console.log("Firebase app already initialized for project:", firebaseConfig.projectId);
}

// Initialize Firestore and Storage only if app initialization was successful
if (app) {
  try {
    db = getFirestore(app);
    console.log("Firestore initialized.");
  } catch (error) {
    console.error("Error initializing Firestore:", error);
    db = null as any;
  }

  try {
    storage = getStorage(app);
    console.log("Firebase Storage initialized.");
  } catch (error) {
    console.error("Error initializing Firebase Storage:", error);
    storage = null as any;
  }

  // Initialize Analytics only on the client side, if app is initialized, and if measurementId is available
  if (typeof window !== 'undefined') {
    if (firebaseConfig.measurementId) {
      console.log("Attempting to initialize Firebase Analytics with Measurement ID:", firebaseConfig.measurementId);
      try {
        analytics = getAnalytics(app);
        console.log("Firebase Analytics initialized successfully.");
      } catch (error) {
        console.error("Error initializing Firebase Analytics:", error);
      }
    } else {
      console.warn("Firebase Analytics not initialized: measurementId is missing in firebaseConfig.");
    }
  }
} else {
  console.error("Firebase app failed to initialize. Firestore, Storage, and Analytics will not be available.");
  db = null as any;
  storage = null as any;
  analytics = undefined;
}

export { app, db, storage, analytics };
