import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBgRIMd8RemzQ7rXPG4w511z_8ocxTgC_Q",
  authDomain: "flipnosis-96a66.firebaseapp.com",
  projectId: "flipnosis-96a66",
  storageBucket: "flipnosis-96a66.firebasestorage.app",
  messagingSenderId: "40675833596",
  appId: "1:40675833596:web:6f659ef01e949de0f8c979",
  measurementId: "G-5F0Z8ZM0KL"
};

console.log('🔥 Initializing Firebase with config:', firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

console.log('✅ Firebase services exported:', { db, auth, storage });

export default app; 