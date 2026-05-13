import { getApp, getApps, initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import type { FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";
import type { Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDABbkPIGNTubSNedurnPZh0gCimHw8jfA",
  authDomain: "iha-careflow.firebaseapp.com",
  projectId: "iha-careflow",
  storageBucket: "iha-careflow.firebasestorage.app",
  messagingSenderId: "1089535846060",
  appId: "1:1089535846060:web:c99b5d29f70c5348e62109",
  measurementId: "G-J7ZFQV1KPX",
};

export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);

let analyticsPromise: Promise<Analytics | null> | null = null;

export function getFirebaseAnalytics() {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  analyticsPromise ??= isSupported()
    .then((supported) => (supported ? getAnalytics(firebaseApp) : null))
    .catch(() => null);

  return analyticsPromise;
}
