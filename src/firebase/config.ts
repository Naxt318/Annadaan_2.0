import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Warn in dev if .env is missing
if (import.meta.env.DEV && !firebaseConfig.apiKey) {
  console.warn(
    "[Firebase] VITE_FIREBASE_API_KEY is not set. " +
    "Make sure your .env file is present and the dev server was restarted after editing it."
  );
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence — dashboards load instantly on repeat visits,
// and real-time listeners survive brief network drops.
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("[Firebase] Persistence unavailable (multiple tabs open)");
  } else if (err.code === "unimplemented") {
    console.warn("[Firebase] Offline persistence not supported in this browser");
  }
});

// Keep auth session across page reloads
setPersistence(auth, browserLocalPersistence).catch(() => {});
