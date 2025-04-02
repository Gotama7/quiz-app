import React, { useState, useEffect } from 'react';
import './styles.css';

// 画像のURLを設定
const titleImageUrl = process.env.PUBLIC_URL + '/favicon.ico';

// 選択肢をランダムに並べ替える関数
function shuffleArray(array) {
  return array.sort(() => 0.5 - Math.random());
}

function QuizApp() {
  const [view, setView] = useState('categorySelection');
  const [selectedCategory, setSelectedCategory] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [showScore, setShowScore] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [options, setOptions] = useState([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showNextButton, setShowNextButton] = useState(false);
  const [quizData, setQuizData] = useState({ categories: {} });
  const [isLoading, setIsLoading] = useState(true);

  // JSONデータを読み込む
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // src/data/index.jsonを読み込む
        const indexData = await import('./data/index.json');
        
        // カテゴリーデータを作成
        const categoriesData = {};
        
        // 各カテゴリーのJSONファイルを読み込む
        for (const [categoryKey, categoryInfo] of Object.entries(indexData.categories)) {
          try {
            const categoryData = await import(`./data/${categoryInfo.file}`);
            categoriesData[categoryKey] = categoryData[categoryKey];
          } catch (error) {
            console.error(`Error loading category ${categoryKey}:`, error);
          }
        }
        
        setQuizData({ categories: categoriesData });
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load quiz data:', error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // サブカテゴリー選択ハンドラー
  const handleSubcategorySelect = (subcategoryId) => {
    setSelectedSubcategory(subcategoryId);
    
    // 選択されたサブカテゴリーの問題を取得
    const categoryQuestions = quizData.categories[selectedCategory].subcategories[subcategoryId].questions;
    
    // 問題を10問ランダムに選択
    const selectedQuestions = [];
    const tempQuestions = [...categoryQuestions];
    
    const numQuestionsToSelect = Math.min(10, tempQuestions.length);
    
    for (let i = 0; i < numQuestionsToSelect; i++) {
      const randomIndex = Math.floor(Math.random() * tempQuestions.length);
      const selectedQuestion = tempQuestions.splice(randomIndex, 1)[0];
      
      // 選択肢を作成
      const options = [
        { text: selectedQuestion.correct, isCorrect: true },
        { text: selectedQuestion.distractors[0], isCorrect: false },
        { text: selectedQuestion.distractors[1], isCorrect: false },
        { text: selectedQuestion.distractors[2], isCorrect: false }
      ];
      
      // 選択肢をシャッフル
      const shuffledOptions = shuffleArray(options);
      
      selectedQuestions.push({
        ...selectedQuestion,
        options: shuffledOptions
      });
    }
    
    setQuestions(selectedQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowScore(false);
    setView('quiz');
  };

  // 回答ボタンクリックハンドラー
  const handleAnswerClick = (selectedIndex, isCorrect) => {
    setIsAnswered(true);
    
    if (isCorrect) {
      setScore(score + 1);
    } else {
      setFeedback(selectedIndex);
    }
    
    setShowNextButton(true);
  };

  // 次の問題ボタンクリックハンドラー
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setIsAnswered(false);
      setFeedback(null);
      setShowNextButton(false);
    } else {
      setShowScore(true);
      setView('result');
    }
  };

  // カテゴリー選択ハンドラー
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setView('subcategorySelection');
  };

  // カテゴリー選択画面
  const renderCategorySelection = () => {
    if (isLoading) {
      return <div className="loading">データを読み込み中...</div>;
    }

    return (
      <div className="category-selection">
        <div className="title-section">
          <div className="title-container">
            <img src={titleImageUrl} alt="Quiz Champion" className="title-image" />
            <h1 className="title">Quiz Champion</h1>
          </div>
          <p className="subtitle">選択したカテゴリーで知識を試そう！</p>
        </div>
        <h2>カテゴリーを選択してください</h2>
        <div className="category-grid">
          {Object.keys(quizData.categories).map((categoryId) => (
            <div
              key={categoryId}
              className="category-box"
              onClick={() => handleCategorySelect(categoryId)}
            >
              {quizData.categories[categoryId].name}
            </div>
          ))}
        </div>
        <div className="mode-selection">
          <h2>チャレンジモード</h2>
          <div className="mode-grid">
            <div className="mode-box coming-soon">
              <h3>Quiz King Challenge</h3>
              <p className="coming-soon-text">Coming Soon</p>
            </div>
            <div className="mode-box coming-soon">
              <h3>Category King Challenge</h3>
              <p className="coming-soon-text">Coming Soon</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // サブカテゴリー選択画面
  const renderSubcategorySelection = () => {
    if (!selectedCategory || !quizData.categories[selectedCategory]) {
      return <div>カテゴリーが選択されていません</div>;
    }

    return (
      <div className="subcategory-selection">
        <div className="title-section">
          <div className="title-container">
            <img src={titleImageUrl} alt="Quiz Champion" className="title-image" />
            <h1 className="title">Quiz Champion</h1>
          </div>
          <p className="category-title">{quizData.categories[selectedCategory].name}</p>
        </div>
        <h2>サブカテゴリーを選択してください</h2>
        <div className="subcategory-grid">
          {Object.keys(quizData.categories[selectedCategory].subcategories).map((subcategoryId) => (
            <div
              key={subcategoryId}
              className="subcategory-box"
              onClick={() => handleSubcategorySelect(subcategoryId)}
            >
              {quizData.categories[selectedCategory].subcategories[subcategoryId].name}
            </div>
          ))}
        </div>
        <button className="back-button" onClick={() => setView('categorySelection')}>
          戻る
        </button>
      </div>
    );
  };

  // eslint-disable-next-line no-unused-vars
  // 問題ない場合の表示
  const renderNoQuestions = () => (
    <div className="app">
      <div className="quiz-container">
        <div className="title-section">
          <img 
            src={titleImageUrl}
            alt="バルバロッサ" 
            className="title-image"
          />
          <h1>バルバロッサクイズ！</h1>
        </div>
        <div className="score-section">
          <h2>申し訳ありません</h2>
          <p>このサブカテゴリーにはまだ問題が登録されていません。</p>
          <button 
            className="back-button"
            onClick={() => setView('subcategorySelection')}
          >
            サブカテゴリー選択に戻る
          </button>
        </div>
      </div>
    </div>
  );

  // クイズ画面
  const renderQuiz = () => {
    if (questions.length === 0) {
      return <div>問題が見つかりません</div>;
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
      <div className="quiz-screen">
        <div className="title-section small">
          <div className="title-container">
            <img src={titleImageUrl} alt="Quiz Champion" className="title-image small" />
            <h1 className="title small">Quiz Champion</h1>
          </div>
        </div>
        <div className="question-counter">
          問題 {currentQuestionIndex + 1} / {questions.length}
        </div>
        <div className="question-section">
          <h2 className="question-text">{currentQuestion.question}</h2>
        </div>
        <div className="options-section">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={`option-button ${
                isAnswered
                  ? option.isCorrect
                    ? 'correct'
                    : feedback === index
                    ? 'incorrect'
                    : ''
                  : ''
              }`}
              onClick={() => handleAnswerClick(index, option.isCorrect)}
              disabled={isAnswered}
            >
              {option.text}
            </button>
          ))}
        </div>
        {showNextButton && (
          <button className="next-button" onClick={handleNextQuestion}>
            {currentQuestionIndex < questions.length - 1 ? '次の問題' : '結果を見る'}
          </button>
        )}
        <button className="quit-button" onClick={() => setView('categorySelection')}>
          終了
        </button>
      </div>
    );
  };

  // 結果画面の表示
  const renderResult = () => {
    return (
      <div className="result-screen">
        <div className="title-section">
          <div className="title-container">
            <img src={titleImageUrl} alt="Quiz Champion" className="title-image" />
            <h1 className="title">Quiz Champion</h1>
          </div>
        </div>
        <h2 className="result-title">クイズ結果</h2>
        <div className="score-section">
          <p className="score-text">
            {questions.length}問中 <span className="score-number">{score}</span> 問正解！
          </p>
          <p className="percentage">
            正答率: {Math.round((score / questions.length) * 100)}%
          </p>
        </div>
        <div className="actions">
          <button className="retry-button" onClick={() => setView('categorySelection')}>
            別のクイズをする
          </button>
        </div>
      </div>
    );
  };

  // メインのレンダリング
  return (
    <div className="quiz-app">
      {view === 'categorySelection' && renderCategorySelection()}
      {view === 'subcategorySelection' && renderSubcategorySelection()}
      {view === 'quiz' && renderQuiz()}
      {view === 'result' && renderResult()}
      {view === 'quizKingComingSoon' && (
        <div className="coming-soon-screen">
          <h2>Quiz King Challenge</h2>
          <p>この機能は近日公開予定です。お楽しみに！</p>
          <button onClick={() => setView('categorySelection')}>戻る</button>
        </div>
      )}
      {view === 'categoryKingComingSoon' && (
        <div className="coming-soon-screen">
          <h2>Category King Challenge</h2>
          <p>この機能は近日公開予定です。お楽しみに！</p>
          <button onClick={() => setView('categorySelection')}>戻る</button>
        </div>
      )}
    </div>
  );
}

export default QuizApp;
