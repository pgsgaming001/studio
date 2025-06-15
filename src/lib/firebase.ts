
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { getAuth, type Auth } from "firebase/auth";

// -----------------------------------------------------------------------------
// Firebase Project Configuration from Environment Variables
// -----------------------------------------------------------------------------
// These values MUST be set in your environment (e.g., .env.local for local development,
// or Railway environment variable settings for deployment).
// For client-side access in Next.js, they must be prefixed with NEXT_PUBLIC_.
// -----------------------------------------------------------------------------
// const firebaseConfig = {
//   apiKey: "AIzaSyDtbjxfeH1EJJpqIv3ZiIjoCCDSjRzmCZk",
//   authDomain: "my-first-project-6eebf.firebaseapp.com",
//   projectId: "my-first-project-6eebf",
//   storageBucket: "my-first-project-6eebf.appspot.com",
//   messagingSenderId: "1010692245718",
//   appId: "1:1010692245718:web:2906c0523917847dc52177",
//   measurementId: "G-84V7PD58P5"
// };

const firebaseConfig = {
  apiKey: "AIzaSyAm6yM-MbX39_VN3A8B9FD16Zx-tNrtdaQ",
  authDomain: "mern-estate-1b297.firebaseapp.com",
  projectId: "mern-estate-1b297",
  storageBucket: "mern-estate-1b297.appspot.com",
  messagingSenderId: "1047709383656",
  appId: "1:1047709383656:web:40f51404a1d034192cc25d"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;
let analytics: Analytics | undefined;

function isConfigValueMissingOrPlaceholder(configValue: string | undefined, keyName: string, isOptional: boolean = false): boolean {
  if (!configValue) {
    if (isOptional) return false; // Optional and missing is fine
    console.error(`Firebase Config Error (src/lib/firebase.ts): Environment variable for '${keyName}' is missing.`);
    return true;
  }
  // Check if it's one of the known placeholder values if you had them before
  if (configValue.startsWith("YOUR_ACTUAL_") || configValue.includes("PLACEHOLDER") || configValue.startsWith("AIza") && keyName === "apiKey" && configValue.length < 30) {
      console.error(`Firebase Config Error (src/lib/firebase.ts): Environment variable for '${keyName}' appears to be a placeholder or invalid value: '${configValue}'.`);
      return true;
  }
  return false;
}

function validateFirebaseConfig(config: typeof firebaseConfig): boolean {
  let isValid = true;
  if (isConfigValueMissingOrPlaceholder(config.apiKey, "NEXT_PUBLIC_FIREBASE_API_KEY")) isValid = false;
  if (isConfigValueMissingOrPlaceholder(config.authDomain, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN")) isValid = false;
  if (isConfigValueMissingOrPlaceholder(config.projectId, "NEXT_PUBLIC_FIREBASE_PROJECT_ID")) isValid = false;
  if (isConfigValueMissingOrPlaceholder(config.storageBucket, "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET")) isValid = false;
  if (isConfigValueMissingOrPlaceholder(config.messagingSenderId, "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID")) isValid = false;
  if (isConfigValueMissingOrPlaceholder(config.appId, "NEXT_PUBLIC_FIREBASE_APP_ID")) isValid = false;
  
  // measurementId is optional, so only check if it's a placeholder if it exists
  if (config.measurementId && isConfigValueMissingOrPlaceholder(config.measurementId, "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", true) && (config.measurementId.startsWith("YOUR_ACTUAL_") || config.measurementId.includes("PLACEHOLDER"))) {
    // It was provided but looks like a placeholder
    console.warn("Firebase Config Warning: NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID seems to be a placeholder.");
  }


  if (!isValid) {
    console.error("CRITICAL: Firebase configuration from environment variables is incomplete or contains placeholders. Firebase services may NOT work correctly. Please ensure all required NEXT_PUBLIC_FIREBASE_* environment variables are set with your project's actual Firebase credentials.");
  }
  return isValid;
}

console.log("Firebase module (src/lib/firebase.ts) loading...");

if (!getApps().length) {
  console.log("No Firebase apps initialized yet. Validating config from environment variables...");
  if (validateFirebaseConfig(firebaseConfig)) {
    try {
      // We cast to `any` because the Firebase SDK expects all keys, but TS sees them as `string | undefined`
      app = initializeApp(firebaseConfig as any);
      console.log("Firebase app initialized successfully using environment variables. Project ID:", firebaseConfig.projectId);
    } catch (error) {
      console.error("Firebase Initialization Error (initializeApp):", error);
      console.error("Ensure firebaseConfig object in src/lib/firebase.ts is correctly sourcing from environment variables.");
      app = null;
    }
  } else {
    console.error("Firebase Initialization Aborted: firebaseConfig from environment variables is invalid. Firebase services will be unavailable.");
    app = null;
  }
} else {
  app = getApp();
  console.log("Firebase app already initialized. Using existing instance. Project ID from existing app:", app.options.projectId);
  // Optionally, re-validate if the loaded config differs from the existing app's options
  if (app.options.projectId !== firebaseConfig.projectId) {
     console.warn(`Firebase Project ID Mismatch: Existing app's projectId ('${app.options.projectId}') does not match configured NEXT_PUBLIC_FIREBASE_PROJECT_ID ('${firebaseConfig.projectId}'). This can happen with HMR. Ensure your environment variables are correct.`);
     if (!validateFirebaseConfig(firebaseConfig)) {
       console.error("Additionally, the current Firebase configuration from environment variables is invalid.");
     }
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
        if (firebaseConfig.measurementId && !isConfigValueMissingOrPlaceholder(firebaseConfig.measurementId, "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", true)) {
          try {
            analytics = getAnalytics(app!); // app is guaranteed to be non-null here if measurementId is valid
            console.log("Firebase Analytics initialized.");
          } catch (error) {
            console.error("Error initializing Firebase Analytics:", error);
            analytics = undefined;
          }
        } else if (firebaseConfig.measurementId && isConfigValueMissingOrPlaceholder(firebaseConfig.measurementId, "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", true)) {
            console.warn("Firebase Analytics not initialized: NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID in environment variables is a placeholder or invalid. Update if you intend to use Analytics.");
            analytics = undefined;
        } else {
            console.info("Firebase Analytics not initialized: NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID is not provided in environment variables.");
            analytics = undefined;
        }
      } else {
        console.info("Firebase Analytics is not supported in this environment.");
        analytics = undefined;
      }
    });
  }
} else {
  console.error("Firebase app is null. Firestore, Storage, Auth, and Analytics will not be available. Review previous errors regarding environment variable configuration in src/lib/firebase.ts.");
  db = null;
  storage = null;
  auth = null;
  analytics = undefined;
}

export { app, db, storage, auth, analytics };
