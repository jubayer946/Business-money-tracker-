import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration from Console
const firebaseConfig = {
  apiKey: "AIzaSyCoVpu7daGKYtOWt-qZj9NoWZFIwJtiSe4",
  authDomain: "business-tracker-160ed.firebaseapp.com",
  databaseURL: "https://business-tracker-160ed-default-rtdb.firebaseio.com",
  projectId: "business-tracker-160ed",
  storageBucket: "business-tracker-160ed.firebasestorage.app",
  messagingSenderId: "658925390299",
  appId: "1:658925390299:web:04449b2c493b1675a4bffe"
};

// Initialize Firebase - using singleton pattern to avoid multiple instances in dev
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;