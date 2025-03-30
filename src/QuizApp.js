import React, { useState, useEffect } from 'react';
import quizData from './quizData.json';
import './styles.css';

// 選択肢をランダムに並べ替える関数
function shuffleArray(array) {
  return array.sort(() => 0.5 - Math.random());
}

// 全カテゴリーから問題を取得する関数
function getAllQuestions() {
  const allQuestions = [];
  Object.entries(quizData.categories).forEach(([categoryKey, category]) => {
    Object.entries(category.subcategories).forEach(([subcategoryKey, subcategory]) => {
      if (subcategory.questions && subcategory.questions.length > 0) {
        subcategory.questions.forEach(q => {
          if (q.question && q.correct && q.distractors && q.distractors.length === 3) {
            allQuestions.push({
              question: q.question,
              correct: q.correct,
              distractors: q.distractors,
              categoryName: category.name,
              subcategoryName: subcategory.name
            });
          }
        });
      }
    });
  });
  console.log('取得した問題数:', allQuestions.length); // デバッグ用
  return shuffleArray(allQuestions).slice(0, 30);
}

// ランキングをサーバーに保存する関数
const saveScoreToServer = async (scoreData) => {
  try {
    const response = await fetch('http://localhost:3001/api/rankings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scoreData)
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('ランキング保存エラー:', error);
    return null;
  }
};

// ランキングをサーバーから取得する関数
const fetchRankings = async (mode) => {
  try {
    const response = await fetch(`http://localhost:3001/api/rankings/${mode}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('ランキング取得エラー:', error);
    return [];
  }
};

function QuizApp() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [options, setOptions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isQuizKingMode, setIsQuizKingMode] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [rankings, setRankings] = useState({
    normal: [],
    quizKing: []
  });
  const [answerHistory, setAnswerHistory] = useState([]);
  const [answerStats, setAnswerStats] = useState({});

  // サブカテゴリーが選択されたときに問題を設定
  useEffect(() => {
    if (selectedCategory && selectedSubcategory) {
      const categoryQuestions = quizData.categories[selectedCategory].subcategories[selectedSubcategory].questions;
      const shuffledQuestions = shuffleArray([...categoryQuestions]).slice(0, 10);
      setQuestions(shuffledQuestions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setShowScore(false);
    }
  }, [selectedCategory, selectedSubcategory]);

  // ランキングデータを読み込む
  useEffect(() => {
    const loadRankings = async () => {
      const normalRankings = await fetchRankings('normal');
      const quizKingRankings = await fetchRankings('quizKing');
      setRankings({
        normal: normalRankings,
        quizKing: quizKingRankings
      });
    };
    loadRankings();
  }, [showScore]);

  // 問題の正答率を取得
  const fetchAnswerStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/answer-stats');
      const data = await response.json();
      const statsMap = {};
      data.forEach(stat => {
        statsMap[stat.question_text] = {
          total: stat.total_attempts,
          correct: stat.correct_attempts,
          percentage: stat.correct_percentage
        };
      });
      setAnswerStats(statsMap);
    } catch (error) {
      console.error('正答率取得エラー:', error);
    }
  };

  // コンポーネントマウント時に正答率を取得
  useEffect(() => {
    fetchAnswerStats();
  }, []);

  // 回答データを保存
  const saveAnswerStat = async (question, isCorrect) => {
    try {
      await fetch('http://localhost:3001/api/answer-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: isQuizKingMode ? questions[currentQuestionIndex].categoryName : quizData.categories[selectedCategory].name,
          subcategory: questions[currentQuestionIndex].subcategoryName,
          question: question,
          isCorrect: isCorrect
        })
      });
      // 正答率を再取得
      fetchAnswerStats();
    } catch (error) {
      console.error('回答統計保存エラー:', error);
    }
  };

  // スコアを保存する関数
  const saveScore = async () => {
    if (!playerName.trim()) return;

    const scoreData = {
      name: playerName,
      score: score,
      total: questions.length,
      category: isQuizKingMode ? 'クイズ王チャレンジ' : quizData.categories[selectedCategory].name,
      mode: isQuizKingMode ? 'quizKing' : 'normal'
    };

    const result = await saveScoreToServer(scoreData);
    if (result) {
      const updatedRankings = await fetchRankings(isQuizKingMode ? 'quizKing' : 'normal');
      setRankings(prev => ({
        ...prev,
        [isQuizKingMode ? 'quizKing' : 'normal']: updatedRankings
      }));
      setShowScore(true);
    }
  };

  // クイズ王チャレンジモード開始
  const startQuizKingChallenge = () => {
    console.log('クイズ王チャレンジ開始'); // デバッグ用
    const allQuestions = getAllQuestions();
    console.log('選択された問題:', allQuestions); // デバッグ用
    
    if (allQuestions.length > 0) {
      setQuestions(allQuestions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setShowScore(false);
      setIsQuizKingMode(true);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      
      // 最初の問題の選択肢をセット
      const firstQuestion = allQuestions[0];
      const initialOptions = shuffleArray([
        firstQuestion.correct,
        ...firstQuestion.distractors
      ]);
      setOptions(initialOptions);
    } else {
      console.error('利用可能な問題がありません');
    }
  };

  // 問題が切り替わるたびに選択肢の順序をシャッフル
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const currentQuestion = questions[currentQuestionIndex];
      const allOptions = shuffleArray([
        currentQuestion.correct,
        ...currentQuestion.distractors
      ]);
      setOptions(allOptions);
      setShowFeedback(false);
      setIsAnswered(false);
    }
  }, [currentQuestionIndex, questions]);

  // 回答を処理する関数
  const handleAnswerOptionClick = async (selectedOption) => {
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correct;
    
    if (!isAnswered) {
      setIsAnswered(true);
      if (isCorrect) {
        setScore(prevScore => prevScore + 1);
      }
      
      // フィードバックを表示
      setFeedback({
        isCorrect,
        correctAnswer: currentQuestion.correct
      });
      setShowFeedback(true);
      
      // 回答データを保存
      await saveAnswerStat(currentQuestion.question, isCorrect);
      
      // 回答履歴を更新
      setAnswerHistory(prev => [...prev, {
        question: currentQuestion.question,
        selectedAnswer: selectedOption,
        correctAnswer: currentQuestion.correct,
        isCorrect
      }]);
      
      // 少し待ってから次の問題へ
      setTimeout(() => {
        const nextQuestion = currentQuestionIndex + 1;
        if (nextQuestion < questions.length) {
          setCurrentQuestionIndex(nextQuestion);
        } else {
          setShowNameInput(true);
        }
      }, 1500);
    }
  };

  // プレイヤー名を保存
  const handleNameSubmit = async () => {
    try {
      await saveScore();
    } catch (error) {
      console.error('ランキングの保存に失敗:', error);
    }
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setQuestions([]);
  };

  const handleBackToSubcategories = () => {
    setSelectedSubcategory(null);
    setQuestions([]);
    setShowScore(false);
  };

  // カテゴリー選択画面
  if (!selectedCategory) {
    return (
      <div className="app">
        <h1>クイズアプリ</h1>
        <div className="category-selection">
          <h2>カテゴリーを選択してください</h2>
          <div className="category-grid">
            {Object.entries(quizData.categories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className="category-button"
              >
                {category.name}
              </button>
            ))}
          </div>
          <div className="quiz-king-section">
            <h2>クイズ王チャレンジ</h2>
            <p>全カテゴリーからランダムに30問出題！ハイスコアを目指そう！</p>
            <button
              onClick={startQuizKingChallenge}
              className="quiz-king-button"
            >
              チャレンジ開始
            </button>
          </div>
        </div>
      </div>
    );
  }

  // サブカテゴリー選択画面
  if (!selectedSubcategory) {
    const category = quizData.categories[selectedCategory];
    return (
      <div className="app">
        <h1>{category.name}</h1>
        <div className="category-selection">
          <h2>サブカテゴリーを選択してください</h2>
          <div className="category-grid">
            {Object.entries(category.subcategories).map(([key, subcategory]) => (
              <button
                key={key}
                onClick={() => setSelectedSubcategory(key)}
                className="category-button"
              >
                {subcategory.name}
              </button>
            ))}
          </div>
          <button
            onClick={handleBackToCategories}
            className="back-button"
          >
            カテゴリー選択に戻る
          </button>
        </div>
      </div>
    );
  }

  // プレイヤー名入力画面
  if (showNameInput) {
    return (
      <div className="app">
        <div className="name-input-section">
          <h2>クイズ王チャレンジ終了！</h2>
          <p>スコア: {score} / {questions.length}</p>
          <div className="name-input">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="あなたの名前を入力"
            />
            <button onClick={handleNameSubmit}>結果を保存</button>
          </div>
        </div>
      </div>
    );
  }

  // スコア表示画面
  if (showScore) {
    return (
      <div className="app">
        <div className="score-section">
          <h2>クイズ終了！</h2>
          <div className="score-text">
            あなたのスコアは {score} / {questions.length} です
          </div>
          <button
            onClick={handleBackToSubcategories}
            className="back-button"
          >
            サブカテゴリー選択に戻る
          </button>
        </div>
      </div>
    );
  }

  // クイズ画面
  return (
    <div className="app">
      <div className="question-section">
        <div className="question-count">
          <span>質問 {currentQuestionIndex + 1}</span>/{questions.length}
        </div>
        <div className="category-name">
          {quizData.categories[selectedCategory].name} - 
          {quizData.categories[selectedCategory].subcategories[selectedSubcategory].name}
        </div>
        <div className="question-text">
          {questions[currentQuestionIndex].question}
        </div>
      </div>
      <div className="answer-section">
        {options.map((option, index) => (
          <button 
            key={index} 
            onClick={() => handleAnswerOptionClick(option)}
            className={`answer-button ${isAnswered ? (option === questions[currentQuestionIndex].correct ? 'correct' : 
              option === feedback?.selectedAnswer ? 'incorrect' : '') : ''}`}
            disabled={isAnswered}
          >
            {option}
          </button>
        ))}
      </div>
      {showFeedback && (
        <div className={`feedback ${feedback.isCorrect ? 'correct' : 'incorrect'}`}>
          {feedback.isCorrect ? '正解！' : `不正解... 正解は ${feedback.correctAnswer} です`}
        </div>
      )}
    </div>
  );
}

export default QuizApp;
