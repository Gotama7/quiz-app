const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// 既存のクイズデータを読み込む
const quizDataPath = path.join(__dirname, '../src/quizData.json');
const quizData = require(quizDataPath);

// CSVファイルから問題を読み込む
fs.createReadStream('questions.csv')
  .pipe(csv())
  .on('data', (data) => {
    // CSVの各行を処理
    const question = {
      question: data.question,
      correct: data.correct,
      distractors: [data.distractor1, data.distractor2, data.distractor3]
    };

    // カテゴリーが存在しない場合は作成
    if (!quizData.categories[data.category]) {
      quizData.categories[data.category] = {
        name: data.categoryName,
        questions: []
      };
    }

    // 問題をカテゴリーに追加
    quizData.categories[data.category].questions.push(question);
  })
  .on('end', () => {
    // 更新されたデータをJSONファイルに書き込む
    fs.writeFileSync(quizDataPath, JSON.stringify(quizData, null, 2));
    console.log('問題データが正常にインポートされました');
  }); 