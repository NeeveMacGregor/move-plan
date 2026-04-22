import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB87xhbR6RdEH-lGu0hXgDjkTJwQNgyGyE",
  authDomain: "move-plan-6c4c3.firebaseapp.com",
  projectId: "move-plan-6c4c3",
  storageBucket: "move-plan-6c4c3.firebasestorage.app",
  messagingSenderId: "800821382588",
  appId: "1:800821382588:web:afc23bb97644b4c85befb9",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Single-user app — one document holds all progress.
// If you ever want multi-user, change this to a per-user doc.
export const PROGRESS_DOC_PATH = { collection: "progress", doc: "main" };
