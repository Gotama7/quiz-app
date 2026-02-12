// src/lib/score.js
import { db, auth } from "../firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";

/** スコア保存 */
export async function saveScoreToFirestore({ 
  name, 
  score, 
  mode, 
  categoryId, 
  categoryName, 
  subcategoryId, 
  subcategoryName 
}) {
  console.log('=== saveScoreToFirestore 開始 ===');
  console.log('auth:', auth);
  console.log('auth.currentUser:', auth.currentUser);
  console.log('db:', db);
  
  // 念のため匿名ログインを担保
  if (!auth.currentUser) {
    console.log('匿名認証開始...');
    try {
      await signInAnonymously(auth);
      console.log('匿名認証成功:', auth.currentUser);
    } catch (error) {
      console.error('匿名認証エラー:', error);
      throw new Error('匿名認証に失敗しました: ' + error.message);
    }
  } else {
    console.log('既に認証済み:', auth.currentUser);
  }

  console.log('Firestore書き込み開始...');
  await addDoc(collection(db, "scores"), {
    name: name || "名無し",
    score: Number(score) || 0,
    mode: Number(mode) || 10,
    categoryId: categoryId || null,
    categoryName: categoryName || null,
    subcategoryId: subcategoryId || null,
    subcategoryName: subcategoryName || null,
    createdAt: serverTimestamp(),
  });
  console.log('Firestore書き込み完了');
}

/** ランキング取得（上位20件） */
export async function fetchRankingFromFirestore({ mode, categoryId, subcategoryId }) {
  const base = collection(db, "scores");
  let q = query(base, where("mode", "==", Number(mode)));

  if (categoryId) {
    q = query(q, where("categoryId", "==", categoryId));
  }
  if (subcategoryId) {
    q = query(q, where("subcategoryId", "==", subcategoryId));
  }

  // スコア降順・最新優先（同点なら新しい方を上にしたい場合）
  q = query(q, orderBy("score", "desc"), orderBy("createdAt", "desc"), limit(20));

  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data());
} 