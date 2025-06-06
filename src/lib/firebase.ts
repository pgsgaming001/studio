
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics } from "firebase/analytics";

// IMPORTANT: Replace these with your actual Firebase project configuration!
// You can find this in your Firebase project settings.
const firebaseConfig = {
  // apiKey: "YOUR_API_KEY_HERE",
  // authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  // projectId: "YOUR_PROJECT_ID_HERE",
  // storageBucket: "YOUR_PROJECT_ID.appspot.com",
  // messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
  // appId: "YOUR_APP_ID_HERE"

  apiKey: "AIzaSyDAxciWioV8mRKd6k3U-W73xPWENdVUXpI",
  authDomain: "xerox2u-5855f.firebaseapp.com",
  projectId: "xerox2u-5855f",
  storageBucket: "xerox2u-5855f.appspot.com", // Ensure this is correct for storage
  messagingSenderId: "1023070994651",
  appId: "1:1023070994651:web:48802fe9d8efbeb20bccfe",
  measurementId: "G-GVGL819SMW"
};

let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | undefined;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

db = getFirestore(app);
storage = getStorage(app);

// Initialize Analytics only on the client side and if measurementId is available
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  analytics = getAnalytics(app);
}

export { app, db, storage, analytics };

