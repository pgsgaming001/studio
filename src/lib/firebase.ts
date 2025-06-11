
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics, isSupported as isAnalyticsSupported } from "firebase/analytics"; // Added isSupported
import { getAuth, type Auth } from "firebase/auth";

// -----------------------------------------------------------------------------
// IMPORTANT: FIREBASE PROJECT CONFIGURATION
// -----------------------------------------------------------------------------
// This configuration object MUST be specific to YOUR Firebase project.
// Find these values in your Firebase project settings:
// 1. Go to https://console.firebase.google.com/
// 2. Select your project.
// 3. Click the Gear icon (⚙️) next to "Project Overview".
// 4. Select "Project settings".
// 5. Under the "General" tab, scroll to "Your apps".
// 6. Click on your web app's name or look for "SDK setup and configuration".
// 7. Select "Config" and copy the entire object.
//
// PASTE YOUR CONFIGURATION OBJECT HERE, REPLACING THE PLACEHOLDERS.
// -----------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDtbjxfeH1EJJpqIv3ZiIjoCCDSjRzmCZk",
  authDomain: "my-first-project-6eebf.firebaseapp.com",
  projectId: "my-first-project-6eebf",
  storageBucket: "my-first-project-6eebf.appspot.com",
  messagingSenderId: "1010692245718",
  appId: "1:1010692245718:web:2906c0523917847dc52177",
  measurementId: "G-84V7PD58P5"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;
let analytics: Analytics | undefined;

function isConfigStillPlaceholder(configValue: string, placeholderPrefix: string): boolean {
  return !configValue || configValue.startsWith(placeholderPrefix) || configValue.includes("YOUR_ACTUAL");
}

function validateFirebaseConfig(config: typeof firebaseConfig): boolean {
  let isValid = true;
  if (isConfigStillPlaceholder(config.apiKey, "YOUR_ACTUAL_API_KEY")) {
    console.error("Firebase Config Error (src/lib/firebase.ts): 'apiKey' is a placeholder or missing. Update with your project's actual Firebase configuration.");
    isValid = false;
  }
  if (isConfigStillPlaceholder(config.authDomain, "YOUR_ACTUAL_AUTH_DOMAIN")) {
    console.error("Firebase Config Error (src/lib/firebase.ts): 'authDomain' is a placeholder or missing. Update with your project's actual Firebase configuration.");
    isValid = false;
  }
  if (isConfigStillPlaceholder(config.projectId, "YOUR_ACTUAL_PROJECT_ID")) {
    console.error("Firebase Config Error (src/lib/firebase.ts): 'projectId' is a placeholder or missing. Update with your project's actual Firebase configuration.");
    isValid = false;
  }
  // Add more checks if other fields are critical for your app's startup (e.g., storageBucket)
   if (isConfigStillPlaceholder(config.storageBucket, "YOUR_ACTUAL_STORAGE_BUCKET")) {
    console.warn("Firebase Config Warning (src/lib/firebase.ts): 'storageBucket' is a placeholder. This might be an issue if you use Firebase Storage.");
    // Not setting isValid to false for this one as it might not be used by all features immediately
  }

  if (!isValid) {
    console.error("CRITICAL: Firebase configuration in src/lib/firebase.ts contains placeholder values or is incomplete. Firebase services will NOT work correctly. Please replace 'YOUR_ACTUAL_...' values with your project's credentials from the Firebase console.");
  }
  return isValid;
}

console.log("Firebase module (src/lib/firebase.ts) loading...");

if (!getApps().length) {
  console.log("No Firebase apps initialized yet. Validating config...");
  if (validateFirebaseConfig(firebaseConfig)) {
    try {
      app = initializeApp(firebaseConfig);
      console.log("Firebase app initialized successfully. Project ID:", firebaseConfig.projectId);
    } catch (error) {
      console.error("Firebase Initialization Error (initializeApp):", error);
      console.error("Ensure firebaseConfig object in src/lib/firebase.ts is correct for your project:", firebaseConfig.projectId);
      app = null;
    }
  } else {
    console.error("Firebase Initialization Aborted: firebaseConfig in src/lib/firebase.ts is invalid. Firebase services will be unavailable.");
    app = null;
  }
} else {
  app = getApp();
  console.log("Firebase app already initialized. Using existing instance. Project ID from existing app:", app.options.projectId);
  if (app.options.projectId !== firebaseConfig.projectId && validateFirebaseConfig(firebaseConfig)) {
     console.warn(`Firebase Project ID Mismatch: Existing app's projectId ('${app.options.projectId}') does not match firebaseConfig.projectId ('${firebaseConfig.projectId}'). This can happen with HMR. Current config is otherwise valid.`);
  } else if (!validateFirebaseConfig(firebaseConfig)) {
     console.warn("Firebase app was already initialized, but current firebaseConfig in src/lib/firebase.ts is invalid. This may cause issues.");
  }
}

if (app) {
  try {
    db = getFirestore(app);
    console.log("Firestore initialized.");
  } catch (error) {
    console.error("Error initializing Firestore:", error);
    db = null;
  }

  try {
    storage = getStorage(app);
    console.log("Firebase Storage initialized.");
  } catch (error) {
    console.error("Error initializing Firebase Storage:", error);
    storage = null;
  }

  try {
    auth = getAuth(app);
    console.log("Firebase Auth initialized.");
  } catch (error) {
    console.error("Error initializing Firebase Auth:", error);
    auth = null;
  }

  if (typeof window !== 'undefined') {
    isAnalyticsSupported().then(supported => {
      if (supported) {
        if (firebaseConfig.measurementId && !isConfigStillPlaceholder(firebaseConfig.measurementId, "YOUR_ACTUAL_MEASUREMENT_ID")) {
          try {
            analytics = getAnalytics(app);
            console.log("Firebase Analytics initialized.");
          } catch (error) {
            console.error("Error initializing Firebase Analytics:", error);
            analytics = undefined;
          }
        } else if (firebaseConfig.measurementId && isConfigStillPlaceholder(firebaseConfig.measurementId, "YOUR_ACTUAL_MEASUREMENT_ID")) {
            console.warn("Firebase Analytics not initialized: 'measurementId' in firebaseConfig (src/lib/firebase.ts) is a placeholder. Update if you intend to use Analytics.");
            analytics = undefined;
        } else {
            console.info("Firebase Analytics not initialized: 'measurementId' is not provided or is invalid in firebaseConfig (src/lib/firebase.ts).");
            analytics = undefined;
        }
      } else {
        console.info("Firebase Analytics is not supported in this environment.");
        analytics = undefined;
      }
    });
  }
} else {
  console.error("Firebase app is null. Firestore, Storage, Auth, and Analytics will not be available. Review previous errors in src/lib/firebase.ts.");
  db = null;
  storage = null;
  auth = null;
  analytics = undefined;
}

export { app, db, storage, auth, analytics };
