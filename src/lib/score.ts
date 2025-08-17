// src/lib/score.ts
import {
  collection, addDoc, serverTimestamp,
  query, where, orderBy, limit, getDocs
} from "firebase/firestore";
import { db } from "../firebase";

export type ScoreRow = {
  name: string;
  score: number;
  mode: 10 | 20 | 30;
  category?: string;
  createdAt?: any;
};

// Firestoreにスコア保存
export async function saveScoreToFirestore(row: ScoreRow) {
  await addDoc(collection(db, "scores"), {
    ...row,
    createdAt: serverTimestamp(),
  });
}

// Firestoreからランキング取得（上位20件）
export async function fetchRankingFromFirestore(
  mode: 10 | 20 | 30,
  category?: string
) {
  const col = collection(db, "scores");
  const conds = [where("mode", "==", mode)];
  if (category) conds.push(where("category", "==", category));

  const q = query(col, ...conds, orderBy("score", "desc"), limit(20));
  const snap = await getDocs(q);

  return snap.docs.map(d => ({
    id: d.id,
    ...(d.data() as any),
  })) as Array<ScoreRow & { id: string }>;
} 