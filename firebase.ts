
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  disableNetwork,
  enableNetwork
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCoVpu7daGKYtOWt-qZj9NoWZFIwJtiSe4",
  authDomain: "business-tracker-160ed.firebaseapp.com",
  projectId: "business-tracker-160ed",
  storageBucket: "business-tracker-160ed.firebasestorage.app",
  messagingSenderId: "658925390299",
  appId: "1:658925390299:web:04449b2c493b1675a4bffe",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

/**
 * Fix: Added reconnectFirestore export to support manual reconnection in hooks/useFirestoreConnection.ts
 */
export const reconnectFirestore = async () => {
  try {
    await disableNetwork(db);
    await enableNetwork(db);
  } catch (error) {
    console.error("Failed to reconnect Firestore:", error);
    throw error;
  }
};

export default app;
