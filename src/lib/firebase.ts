
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { getAuth, type Auth } from "firebase/auth";

// -----------------------------------------------------------------------------
// IMPORTANT: FIREBASE PROJECT CONFIGURATION
// -----------------------------------------------------------------------------
// This configuration object is specific to YOUR Firebase project.
// You can find these values in your Firebase project settings:
// 1. Go to https://console.firebase.google.com/
// 2. Select your project (e.g., "my-first-project-6eebf").
// 3. Click the Gear icon (⚙️) next to "Project Overview".
// 4. Select "Project settings".
// 5. Under the "General" tab, scroll down to "Your apps".
// 6. If you have a web app registered, click on its name or look for the
//    "SDK setup and configuration" section and select "Config".
// 7. Copy the entire config object and paste it here, replacing the placeholders.
//
// DO NOT put your Google OAuth Client ID or Client Secret directly in this object.
// Those are configured in the Firebase Console (Authentication > Sign-in method > Google).
// -----------------------------------------------------------------------------

const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY", // Replace with your Firebase Project's API Key
    authDomain: "YOUR_ACTUAL_AUTH_DOMAIN", // e.g., my-project-id.firebaseapp.com
    projectId: "YOUR_ACTUAL_PROJECT_ID", // e.g., my-project-id
    storageBucket: "YOUR_ACTUAL_STORAGE_BUCKET", // e.g., my-project-id.appspot.com
    messagingSenderId: "YOUR_ACTUAL_MESSAGING_SENDER_ID",
    appId: "YOUR_ACTUAL_APP_ID",
    measurementId: "YOUR_ACTUAL_MEASUREMENT_ID" // Optional, but good for Analytics
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;
let analytics: Analytics | undefined;

// Function to check if the config is still using placeholder values
function isConfigValid(config: typeof firebaseConfig): boolean {
  if (!config.apiKey || config.apiKey === "YOUR_ACTUAL_API_KEY" || config.apiKey.includes("YOUR_ACTUAL")) {
    console.error("Firebase Initialization Error: 'apiKey' in firebaseConfig is a placeholder or missing. Please update src/lib/firebase.ts with your project's actual Firebase configuration.");
    return false;
  }
  if (!config.authDomain || config.authDomain === "YOUR_ACTUAL_AUTH_DOMAIN" || config.authDomain.includes("YOUR_ACTUAL")) {
    console.error("Firebase Initialization Error: 'authDomain' in firebaseConfig is a placeholder or missing. Please update src/lib/firebase.ts.");
    return false;
  }
  if (!config.projectId || config.projectId === "YOUR_ACTUAL_PROJECT_ID" || config.projectId.includes("YOUR_ACTUAL")) {
    console.error("Firebase Initialization Error: 'projectId' in firebaseConfig is a placeholder or missing. Please update src/lib/firebase.ts.");
    return false;
  }
  // Add checks for other critical fields if necessary (e.g., storageBucket if used extensively)
  return true;
}

if (!getApps().length) {
  if (isConfigValid(firebaseConfig)) {
    try {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized successfully for project:", firebaseConfig.projectId);
    } catch (error) {
      console.error("Firebase Initialization Error: Failed to initialize Firebase app. Check your firebaseConfig object in src/lib/firebase.ts and ensure all values are correct for your project.", error);
      app = null;
    }
  } else {
    console.error("Firebase Initialization Aborted: firebaseConfig in src/lib/firebase.ts is invalid or contains placeholders. Firebase services will not be available.");
    app = null;
  }
} else {
  app = getApp();
  if (isConfigValid(firebaseConfig)) {
    console.log("Firebase app already initialized, using existing instance for project:", app.options.projectId);
     // Verify if the existing app's project ID matches the current config, in case of HMR issues.
    if (app.options.projectId !== firebaseConfig.projectId) {
        console.warn(`Firebase Mismatch: An app for project '${app.options.projectId}' was already initialized, but current firebaseConfig is for '${firebaseConfig.projectId}'. This might happen with hot-reloading. Consider a page refresh if issues persist.`);
    }
  } else {
     console.warn("Firebase app was already initialized, but current firebaseConfig in src/lib/firebase.ts is invalid. This might lead to unexpected behavior.");
  }
}

if (app) {
  try {
    db = getFirestore(app);
    // console.log("Firestore initialized.");
  } catch (error) {
    console.error("Error initializing Firestore:", error);
    db = null;
  }

  try {
    storage = getStorage(app);
    // console.log("Firebase Storage initialized.");
  } catch (error) {
    console.error("Error initializing Firebase Storage:", error);
    storage = null;
  }

  try {
    auth = getAuth(app);
    // console.log("Firebase Auth initialized.");
  } catch (error) {
    console.error("Error initializing Firebase Auth:", error);
    auth = null;
  }

  if (typeof window !== 'undefined') {
    if (firebaseConfig.measurementId && firebaseConfig.measurementId !== "YOUR_ACTUAL_MEASUREMENT_ID" && !firebaseConfig.measurementId.includes("YOUR_ACTUAL")) {
      try {
        analytics = getAnalytics(app);
        // console.log("Firebase Analytics initialized successfully.");
      } catch (error) {
        console.error("Error initializing Firebase Analytics:", error);
        analytics = undefined;
      }
    } else if (firebaseConfig.measurementId && (firebaseConfig.measurementId === "YOUR_ACTUAL_MEASUREMENT_ID" || firebaseConfig.measurementId.includes("YOUR_ACTUAL"))) {
        // console.warn("Firebase Analytics not initialized: 'measurementId' in firebaseConfig is a placeholder. Update src/lib/firebase.ts if you intend to use Analytics.");
        analytics = undefined;
    } else {
        // console.info("Firebase Analytics not initialized: 'measurementId' is not provided in firebaseConfig.");
        analytics = undefined;
    }
  }
} else {
  console.error("Firebase app failed to initialize or uses placeholder config. Firestore, Storage, Auth, and Analytics will not be available. Please check src/lib/firebase.ts.");
  // Ensure all exports are null if app is null
  db = null;
  storage = null;
  auth = null;
  analytics = undefined;
}

export { app, db, storage, auth, analytics };
