
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { getAuth, type Auth } from "firebase/auth";

// IMPORTANT: Ensure these are your actual Firebase project configuration values!
// You can find this in your Firebase project settings (Project Overview > Gear Icon > Project settings > General > Your apps > SDK setup and configuration).
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY", // Replace with your actual API Key
    authDomain: "YOUR_ACTUAL_AUTH_DOMAIN", // e.g., my-first-project-6eebf.firebaseapp.com
    projectId: "YOUR_ACTUAL_PROJECT_ID", // e.g., my-first-project-6eebf
    storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET", // e.g., my-first-project-6eebf.appspot.com
    messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
    appId: "YOUR_ACTUAL_APP_ID",
    measurementId: "YOUR_ACTUAL_MEASUREMENT_ID" // Optional, but good to have
};


let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let auth: Auth;
let analytics: Analytics | undefined;

if (!getApps().length) {
  try {
    // Ensure all required fields in firebaseConfig are present and not placeholders before initializing
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_ACTUAL_API_KEY" &&
        firebaseConfig.authDomain && firebaseConfig.authDomain !== "YOUR_ACTUAL_AUTH_DOMAIN" &&
        firebaseConfig.projectId && firebaseConfig.projectId !== "YOUR_ACTUAL_PROJECT_ID") {
      app = initializeApp(firebaseConfig);
      console.log("Firebase initialized with config for project:", firebaseConfig.projectId);
    } else {
      console.error("Firebase configuration is incomplete or uses placeholder values. Firebase cannot be initialized.");
      app = null as any; // Explicitly set to null or handle as per your app's error strategy
    }
  } catch (error) {
    console.error("Error initializing Firebase app:", error);
    app = null as any; 
  }
} else {
  app = getApp();
  // console.log("Firebase app already initialized for project:", firebaseConfig.projectId);
}

if (app) {
  try {
    db = getFirestore(app);
    // console.log("Firestore initialized.");
  } catch (error) {
    console.error("Error initializing Firestore:", error);
    db = null as any;
  }

  try {
    storage = getStorage(app);
    // console.log("Firebase Storage initialized.");
  } catch (error) {
    console.error("Error initializing Firebase Storage:", error);
    storage = null as any;
  }

  try {
    auth = getAuth(app);
    // console.log("Firebase Auth initialized.");
  } catch (error) {
    console.error("Error initializing Firebase Auth:", error);
    auth = null as any;
  }

  if (typeof window !== 'undefined') {
    if (firebaseConfig.measurementId && firebaseConfig.measurementId !== "YOUR_ACTUAL_MEASUREMENT_ID") {
      // console.log("Attempting to initialize Firebase Analytics with Measurement ID:", firebaseConfig.measurementId);
      try {
        analytics = getAnalytics(app);
        // console.log("Firebase Analytics initialized successfully.");
      } catch (error) {
        console.error("Error initializing Firebase Analytics:", error);
      }
    } else {
      // console.warn("Firebase Analytics not initialized: measurementId is missing or is a placeholder.");
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
