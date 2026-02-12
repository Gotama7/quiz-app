// Firestoreのデータを確認するテストスクリプト
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDkDvuoVXa6102Wm43kmtAKN1tjNQDFLxI",
  authDomain: "barbarrosaquiz.firebaseapp.com",
  projectId: "barbarrosaquiz",
  storageBucket: "barbarrosaquiz.firebasestorage.app",
  messagingSenderId: "422324030081",
  appId: "1:422324030081:web:08749947d65c0d7a645b80",
  measurementId: "G-1BSJXY3M6V"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkScores() {
  try {
    console.log('📊 Firestoreのscoresコレクションを確認中...\n');

    const scoresRef = collection(db, 'scores');
    const snapshot = await getDocs(scoresRef);

    console.log(`✅ 見つかったスコア数: ${snapshot.size}件\n`);

    if (snapshot.empty) {
      console.log('⚠️  スコアが保存されていません！');
      console.log('   → スコア送信時にエラーが発生している可能性があります');
    } else {
      console.log('📋 保存されているスコア一覧：\n');
      snapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. ドキュメントID: ${doc.id}`);
        console.log('   データ内容（全体）:');
        console.log(JSON.stringify(data, null, 2));
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ エラー:', error.message);
    console.error('   詳細:', error);
  }

  process.exit(0);
}

checkScores();
