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
  // 念のため匿名ログインを担保
  if (!auth.currentUser) {
    await signInAnonymously(auth).catch(console.error);
  }

  await addDoc(collection(db, "scores"), {
    name: name || "名無し",
    score: Number(score) || 0,
    mode: String(mode || ""),
    categoryId: categoryId || null,
    categoryName: categoryName || null,
    subcategoryId: subcategoryId || null,
    subcategoryName: subcategoryName || null,
    createdAt: serverTimestamp(),
  });
}

/** ランキング取得（上位20件） */
export async function fetchRankingFromFirestore({ mode, categoryId, subcategoryId }) {
  const base = collection(db, "scores");
  let q = query(base, where("mode", "==", String(mode)));

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