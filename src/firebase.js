// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";

// Firebase設定（本番用）
const firebaseConfig = {
  apiKey: "AIzaSyCcRussss-aNbGZo6Nm4gjjUc9LsMHC9Fo",
  authDomain: "barbarossaquiz-a3881.firebaseapp.com",
  projectId: "barbarossaquiz-a3881",
  storageBucket: "barbarossaquiz-a3881.firebasestorage.app",
  messagingSenderId: "532007830802",
  appId: "1:532007830802:web:8d293a3080dacb86e25fcb",
  measurementId: "G-MLVP72KX9N"
};

const app = initializeApp(firebaseConfig);

// Firestore & Auth を公開
export const db = getFirestore(app);
export const auth = getAuth(app);

// 匿名ログイン（未ログインなら自動）
onAuthStateChanged(auth, (user) => {
  if (!user) signInAnonymously(auth).catch(console.error);
}); 