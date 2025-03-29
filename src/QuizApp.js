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
      const questionsWithMeta = subcategory.questions.map(q => ({
        ...q,
        categoryName: category.name,
        subcategoryName: subcategory.name
      }));
      allQuestions.push(...questionsWithMeta);
    });
  });
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
    if (selectedCategory && selectedSubcategory && 
        quizData.categories[selectedCategory]?.subcategories[selectedSubcategory]) {
      try {
        const subcategoryQuestions = quizData.categories[selectedCategory]
          .subcategories[selectedSubcategory].questions;
        if (subcategoryQuestions && subcategoryQuestions.length > 0) {
          const shuffledQuestions = shuffleArray([...subcategoryQuestions]).slice(0, 10);
          setQuestions(shuffledQuestions);
          setCurrentQuestionIndex(0);
          setScore(0);
          setShowScore(false);
          setFeedback(null);
          setIsAnswered(false);
          setIsQuizKingMode(false);
        } else {
          console.error('選択されたサブカテゴリーに問題がありません');
        }
      } catch (error) {
        console.error('問題データの読み込みエラー:', error);
      }
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
    const allQuestions = getAllQuestions();
    setQuestions(allQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowScore(false);
    setFeedback(null);
    setIsAnswered(false);
    setIsQuizKingMode(true);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  // 問題が切り替わるたびに選択肢の順序をシャッフル
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const currentQuestion = questions[currentQuestionIndex];
      const allOptions = shuffleArray([
        currentQuestion.correct,
        currentQuestion.distractor1,
        currentQuestion.distractor2,
        currentQuestion.distractor3
      ]);
      setOptions(allOptions);
      setShowFeedback(false);
      setIsAnswered(false);
    }
  }, [currentQuestionIndex, questions]);

  // 回答ボタンをクリックしたときの処理
  const handleAnswerOptionClick = async (selectedOption) => {
    if (isAnswered) return;
    setIsAnswered(true);

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correct;
    
    // フィードバックを設定
    setFeedback({
      isCorrect,
      correctAnswer: currentQuestion.correct,
      selectedAnswer: selectedOption
    });
    setShowFeedback(true);

    // 正解の場合、スコアを加算
    if (isCorrect) {
      setScore(prevScore => prevScore + 1);
    }

    // 回答統計を保存
    try {
      await saveAnswerStat(currentQuestion.question, isCorrect);
    } catch (error) {
      console.error('回答統計の保存に失敗:', error);
    }

    // 回答履歴に追加
    const newAnswer = {
      questionNumber: currentQuestionIndex + 1,
      question: currentQuestion.question,
      selectedAnswer: selectedOption,
      correctAnswer: currentQuestion.correct,
      isCorrect: isCorrect,
      category: isQuizKingMode ? currentQuestion.categoryName : quizData.categories[selectedCategory].name,
      subcategoryName: currentQuestion.subcategoryName
    };
    setAnswerHistory(prev => [...prev, newAnswer]);

    // 3秒後に次の問題へ
    setTimeout(() => {
      const nextQuestion = currentQuestionIndex + 1;
      if (nextQuestion < questions.length) {
        setCurrentQuestionIndex(nextQuestion);
      } else {
        if (isQuizKingMode) {
          setShowNameInput(true);
        } else {
          setShowScore(true);
        }
      }
    }, 3000);
  };

  // プレイヤー名を保存
  const handleNameSubmit = async () => {
    try {
      await saveScore();
    } catch (error) {
      console.error('ランキングの保存に失敗:', error);
    }
  };

  // カテゴリー選択画面
  if (!selectedCategory && !isQuizKingMode) {
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
            <p>全カテゴリーからランダムに30問出題されます</p>
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
  if (selectedCategory && !selectedSubcategory && !isQuizKingMode) {
    return (
      <div className="app">
        <h1>サブカテゴリーを選択してください</h1>
        <div className="subcategory-selection">
          <div className="subcategory-grid">
            <button
              onClick={() => {
                const categoryQuestions = quizData.categories[selectedCategory].questions || [];
                if (categoryQuestions.length > 0) {
                  const shuffledQuestions = shuffleArray([...categoryQuestions]).slice(0, 10);
                  setQuestions(shuffledQuestions);
                  setCurrentQuestionIndex(0);
                  setScore(0);
                  setShowScore(false);
                }
              }}
              className="subcategory-button"
            >
              全サブカテゴリーから出題
            </button>
            {Object.entries(quizData.categories[selectedCategory].subcategories).map(([key, subcategory]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedSubcategory(key);
                  const subcategoryQuestions = subcategory.questions;
                  const shuffledQuestions = shuffleArray([...subcategoryQuestions]).slice(0, 10);
                  setQuestions(shuffledQuestions);
                  setCurrentQuestionIndex(0);
                  setScore(0);
                  setShowScore(false);
                }}
                className="subcategory-button"
              >
                {subcategory.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSelectedCategory(null)}
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
            onClick={() => {
              setSelectedCategory(null);
              setSelectedSubcategory(null);
              setIsQuizKingMode(false);
            }}
            className="back-button"
          >
            カテゴリー選択に戻る
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
        <div className="category-info">
          {isQuizKingMode ? (
            <div>
              <div className="category-name">
                {quizData.categories[questions[currentQuestionIndex].category].name}
              </div>
              <div className="subcategory-name">
                {quizData.categories[questions[currentQuestionIndex].category]
                  .subcategories[questions[currentQuestionIndex].subcategory].name}
              </div>
            </div>
          ) : (
            <div>
              <div className="category-name">
                {quizData.categories[selectedCategory].name}
              </div>
              {selectedSubcategory && (
                <div className="subcategory-name">
                  {quizData.categories[selectedCategory].subcategories[selectedSubcategory].name}
                </div>
              )}
            </div>
          )}
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
