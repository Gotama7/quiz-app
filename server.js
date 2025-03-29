require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// ミドルウェアの設定
app.use(cors());
app.use(express.json());

// データベース接続設定
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'quiz_app'
});

// データベース接続
db.connect((err) => {
  if (err) {
    console.error('データベース接続エラー:', err);
    return;
  }
  console.log('データベースに接続しました');
  
  // テーブル作成
  createTables();
});

// テーブル作成
function createTables() {
  // 回答統計テーブル
  db.query(`
    CREATE TABLE IF NOT EXISTS answer_stats (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category VARCHAR(50) NOT NULL,
      subcategory VARCHAR(50) NOT NULL,
      question_text TEXT NOT NULL,
      total_attempts INT DEFAULT 0,
      correct_attempts INT DEFAULT 0,
      last_answered TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_question (category, subcategory, question_text)
    )
  `, (err) => {
    if (err) {
      console.error('answer_statsテーブル作成エラー:', err);
    } else {
      console.log('answer_statsテーブルを作成しました');
    }
  });

  // ランキングテーブル
  db.query(`
    CREATE TABLE IF NOT EXISTS rankings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      score INT NOT NULL,
      total_questions INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_quiz_king BOOLEAN DEFAULT FALSE
    )
  `, (err) => {
    if (err) {
      console.error('rankingsテーブル作成エラー:', err);
    } else {
      console.log('rankingsテーブルを作成しました');
    }
  });
}

// 回答統計を保存するAPI
app.post('/api/answer-stats', (req, res) => {
  const { category, subcategory, question, isCorrect } = req.body;
  
  const query = `
    INSERT INTO answer_stats (category, subcategory, question_text, total_attempts, correct_attempts)
    VALUES (?, ?, ?, 1, ?)
    ON DUPLICATE KEY UPDATE
      total_attempts = total_attempts + 1,
      correct_attempts = correct_attempts + ?,
      last_answered = CURRENT_TIMESTAMP
  `;
  
  db.query(query, [category, subcategory, question, isCorrect ? 1 : 0, isCorrect ? 1 : 0], (err) => {
    if (err) {
      console.error('回答統計の保存エラー:', err);
      res.status(500).json({ error: '回答統計の保存に失敗しました' });
      return;
    }
    res.json({ message: '回答統計を保存しました' });
  });
});

// 回答統計を取得するAPI
app.get('/api/answer-stats', (req, res) => {
  const { category, subcategory } = req.query;
  
  let query = `
    SELECT 
      question_text,
      total_attempts,
      correct_attempts,
      ROUND((correct_attempts / total_attempts) * 100, 1) as correct_percentage
    FROM answer_stats
  `;
  
  const params = [];
  
  if (category) {
    query += ' WHERE category = ?';
    params.push(category);
    if (subcategory) {
      query += ' AND subcategory = ?';
      params.push(subcategory);
    }
  }
  
  query += ' ORDER BY last_answered DESC';
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('回答統計の取得エラー:', err);
      res.status(500).json({ error: '回答統計の取得に失敗しました' });
      return;
    }
    res.json(results);
  });
});

// ランキングを保存するAPI
app.post('/api/rankings', (req, res) => {
  const { name, score, totalQuestions } = req.body;
  const isQuizKing = score >= 25; // 30問中25問以上正解でクイズ王
  
  const query = `
    INSERT INTO rankings (name, score, total_questions, is_quiz_king)
    VALUES (?, ?, ?, ?)
  `;
  
  db.query(query, [name, score, totalQuestions, isQuizKing], (err) => {
    if (err) {
      console.error('ランキングの保存エラー:', err);
      res.status(500).json({ error: 'ランキングの保存に失敗しました' });
      return;
    }
    res.json({ message: 'ランキングを保存しました' });
  });
});

// ランキングを取得するAPI
app.get('/api/rankings', (req, res) => {
  const { isQuizKing } = req.query;
  
  let query = `
    SELECT 
      name,
      score,
      total_questions,
      ROUND((score / total_questions) * 100, 1) as correct_percentage,
      created_at,
      is_quiz_king
    FROM rankings
  `;
  
  if (isQuizKing === 'true') {
    query += ' WHERE is_quiz_king = true';
  }
  
  query += ' ORDER BY score DESC, created_at DESC LIMIT 100';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('ランキングの取得エラー:', err);
      res.status(500).json({ error: 'ランキングの取得に失敗しました' });
      return;
    }
    res.json(results);
  });
});

// サーバー起動
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
}); 