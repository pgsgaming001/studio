
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { getAuth, type Auth } from "firebase/auth"; // Added Auth import

// IMPORTANT: Ensure these are your actual Firebase project configuration values!
// You can find this in your Firebase project settings.

const firebaseConfig = {
    apiKey: "AIzaSyDtbjxfeH1EJJpqIv3ZiIjoCCDSjRzmCZk",
    authDomain: "my-first-project-6eebf.firebaseapp.com",
    projectId: "my-first-project-6eebf",
    storageBucket: "my-first-project-6eebf.appspot.com",
    messagingSenderId: "1010692245718",
    appId: "1:1010692245718:web:2906c0523917847dc52177",
    measurementId: "G-84V7PD58P5"
};


let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let auth: Auth; // Added Auth instance
let analytics: Analytics | undefined;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase initialized with config for project:", firebaseConfig.projectId);
  } catch (error) {
    console.error("Error initializing Firebase app:", error);
    app = null as any; 
  }
} else {
  app = getApp();
  console.log("Firebase app already initialized for project:", firebaseConfig.projectId);
}

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

  try {
    auth = getAuth(app); // Initialize Auth
    console.log("Firebase Auth initialized.");
  } catch (error) {
    console.error("Error initializing Firebase Auth:", error);
    auth = null as any;
  }

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
  console.error("Firebase app failed to initialize. Firestore, Storage, Auth, and Analytics will not be available.");
  db = null as any;
  storage = null as any;
  auth = null as any;
  analytics = undefined;
}

export { app, db, storage, auth, analytics };
