import React, { useState, useEffect } from 'react';
import './styles.css';

// 画像のURLを設定
const titleImageUrl = process.env.PUBLIC_URL + '/images/barbarossa.jpeg';

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
          <h2>カテゴリーを選択してください</h2>
          <div className="category-grid">
            {Object.keys(quizData.categories).map((categoryId) => (
              <button
                key={categoryId}
                className="category-button"
                onClick={() => handleCategorySelect(categoryId)}
              >
                {quizData.categories[categoryId].name}
              </button>
            ))}
          </div>
          <div className="quiz-king-section">
            <h2>クイズ王チャレンジ</h2>
            <p>全カテゴリーからランダムに30問出題！ハイスコアを目指そう！</p>
            <button 
              className="quiz-king-button"
              onClick={() => setView('quizKingComingSoon')}
            >
              チャレンジ開始
            </button>
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
          <h2 className="selected-category-name">
            {quizData.categories[selectedCategory].name}
          </h2>
          <h3>サブカテゴリーを選択してください</h3>
          <div className="category-grid">
            {Object.keys(quizData.categories[selectedCategory].subcategories).map((subcategoryId) => (
              <button
                key={subcategoryId}
                className="category-button"
                onClick={() => handleSubcategorySelect(subcategoryId)}
              >
                {quizData.categories[selectedCategory].subcategories[subcategoryId].name}
              </button>
            ))}
          </div>
          <div className="category-king-section">
            <h2>{quizData.categories[selectedCategory].name}王チャレンジ</h2>
            <p>このカテゴリーの全サブカテゴリーからランダムに20問出題！</p>
            <button
              className="quiz-king-button"
              onClick={() => setView('categoryKingComingSoon')}
            >
              チャレンジ開始
            </button>
          </div>
          <button 
            className="back-button"
            onClick={() => setView('categorySelection')}
          >
            カテゴリー選択に戻る
          </button>
        </div>
      </div>
    );
  };

  // クイズ画面
  const renderQuiz = () => {
    if (questions.length === 0) {
      return <div>問題が見つかりません</div>;
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
      <div className="app">
        <div className="quiz-container">
          <div className="quiz-header">
            <div className="quiz-info">
              <p>問題 {currentQuestionIndex + 1} / {questions.length}</p>
            </div>
          </div>
          <div className="question-section">
            <h2>{currentQuestion.question}</h2>
          </div>
          <div className="options-container">
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
          <button
            className="back-button"
            onClick={() => setView('categorySelection')}
          >
            トップに戻る
          </button>
        </div>
      </div>
    );
  };

  // 結果画面の表示
  const renderResult = () => {
    return (
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
            <h2>クイズ終了！</h2>
            <div className="score-text">
              あなたのスコアは {score} / {questions.length} です
            </div>
            <div className="navigation-buttons">
              <button
                onClick={() => setView('categorySelection')}
                className="nav-button"
              >
                トップに戻る
              </button>
              <button
                onClick={() => setView('subcategorySelection')}
                className="nav-button"
              >
                サブカテゴリー選択に戻る
              </button>
            </div>
          </div>
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
        <div className="app">
          <div className="quiz-container">
            <div className="title-section">
              <img 
                src={titleImageUrl}
                alt="バルバロッサ" 
                className="title-image"
              />
              <h1>クイズ王チャレンジ</h1>
            </div>
            <div className="score-section">
              <h2>準備中です！</h2>
              <p>クイズ王モードは現在開発中です。もうしばらくお待ちください。</p>
              <button 
                className="back-button"
                onClick={() => setView('categorySelection')}
              >
                カテゴリー選択に戻る
              </button>
            </div>
          </div>
        </div>
      )}
      {view === 'categoryKingComingSoon' && (
        <div className="app">
          <div className="quiz-container">
            <div className="title-section">
              <img 
                src={titleImageUrl}
                alt="バルバロッサ" 
                className="title-image"
              />
              <h1>{quizData.categories[selectedCategory]?.name || ''}王チャレンジ</h1>
            </div>
            <div className="score-section">
              <h2>準備中です！</h2>
              <p>カテゴリー王モードは現在開発中です。もうしばらくお待ちください。</p>
              <button 
                className="back-button"
                onClick={() => setView('subcategorySelection')}
              >
                サブカテゴリー選択に戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizApp;
