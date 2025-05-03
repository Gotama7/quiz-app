import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebaseの設定
const firebaseConfig = {
  apiKey: "AIzaSyCcRussss-aNbGZo6Nm4gjjUc9LsMHC9Fo",
  authDomain: "barbarossaquiz-a3881.firebaseapp.com",
  databaseURL: "https://barbarossaquiz-a3881-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "barbarossaquiz-a3881",
  storageBucket: "barbarossaquiz-a3881.firebasestorage.app",
  messagingSenderId: "532007830802",
  appId: "1:532007830802:web:8d293a3080dacb86e25fcb",
  measurementId: "G-MLVP72KX9N"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database }; 