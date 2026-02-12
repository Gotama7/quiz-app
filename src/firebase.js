// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDkDvuoVXa6102Wm43kmtAKN1tjNQDFLxI",
  authDomain: "barbarrosaquiz.firebaseapp.com",
  projectId: "barbarrosaquiz",
  storageBucket: "barbarrosaquiz.firebasestorage.app",
  messagingSenderId: "422324030081",
  appId: "1:422324030081:web:08749947d65c0d7a645b80",
  measurementId: "G-1BSJXY3M6V"
};

// Firebaseアプリを初期化
const app = initializeApp(firebaseConfig);

// Firestore & Auth を公開
export const db = getFirestore(app);
export const auth = getAuth(app);

// 開発環境でのエミュレーター接続（本番環境では無効）
if (process.env.NODE_ENV === 'development') {
  try {
    // connectFirestoreEmulator(db, 'localhost', 8080);
    // connectAuthEmulator(auth, 'http://localhost:9099');
  } catch (error) {
    console.log('エミュレーター接続スキップ:', error);
  }
}

// 匿名認証の初期化
export const initializeAuth = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      const result = await signInAnonymously(auth);
      console.log('匿名認証成功:', result.user.uid);
      return result.user;
    }
    return user;
  } catch (error) {
    console.error('匿名認証エラー:', error);
    throw error;
  }
}; 