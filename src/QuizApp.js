import React, { useState } from 'react';
import './styles.css';

// 画像のURLを設定
const titleImageUrl = process.env.PUBLIC_URL + '/favicon.ico';

// eslint-disable-next-line no-unused-vars
const quizData = {
  categories: {
    history_literature: {
      name: "歴史・人文",
      subcategories: {
        japanese_history: {
          name: "日本史",
          questions: [
            {
              question: "徳川家康が征夷大将軍になった年は？",
              correct: "1603年",
              distractors: ["1590年", "1600年", "1615年"]
            },
            {
              question: "平安時代の始まりの年は？",
              correct: "794年",
              distractors: ["710年", "645年", "1185年"]
            }
          ]
        },
        world_history: {
          name: "世界史",
          questions: [
            {
              question: "第一次世界大戦が始まった年は？",
              correct: "1914年",
              distractors: ["1917年", "1939年", "1941年"]
            }
          ]
        }
      }
    },
    math_science: {
      name: "数学・科学",
      subcategories: {
        mathematics: {
          name: "数学",
          questions: [
            {
              question: "円周率の最初の3桁は？",
              correct: "3.14",
              distractors: ["3.41", "3.16", "3.12"]
            }
          ]
        },
        physics: {
          name: "物理",
          questions: [
            {
              question: "光の速さは秒速約何キロメートル？",
              correct: "30万km/s",
              distractors: ["10万km/s", "50万km/s", "100万km/s"]
            }
          ]
        }
      }
    },
    art_subculture: {
      name: "芸術・サブカルチャー",
      subcategories: {
        art: { name: "芸術", questions: [] },
        music: { name: "音楽", questions: [] }
      }
    },
    sports: {
      name: "スポーツ",
      subcategories: {
        soccer: { name: "サッカー", questions: [] },
        baseball: { name: "野球", questions: [] }
      }
    },
    living_things: {
      name: "生物",
      subcategories: {
        animals: { name: "動物", questions: [] },
        plants: { name: "植物", questions: [] }
      }
    },
    vehicles_hobbies: {
      name: "乗り物・趣味",
      subcategories: {
        cars: { name: "車", questions: [] },
        trains: { name: "電車", questions: [] }
      }
    }
  }
};

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
  const [options, setOptions] = useState([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showNextButton, setShowNextButton] = useState(false);

  // 特定のカテゴリーのサブカテゴリーから問題を取得する関数
  const getSubcategoryQuestions = (categoryKey, subcategoryKey) => {
    const category = quizData.categories[categoryKey];
    if (!category) return [];
    
    const subcategory = category.subcategories[subcategoryKey];
    if (!subcategory || !subcategory.questions || subcategory.questions.length === 0) return [];
    
    const validQuestions = subcategory.questions
      .filter(q => q.question && q.correct && q.distractors && q.distractors.length === 3)
      .map(q => ({
        question: q.question,
        correct: q.correct,
        distractors: q.distractors,
        categoryName: category.name,
        subcategoryName: subcategory.name
      }));
    
    return shuffleArray(validQuestions).slice(0, Math.min(10, validQuestions.length));
  };

  // 次の問題へ進む処理
  const handleNextQuestion = () => {
    const nextQuestion = currentQuestionIndex + 1;
    if (nextQuestion < questions.length) {
      setCurrentQuestionIndex(nextQuestion);
      setIsAnswered(false);
      setFeedback(null);
      setShowNextButton(false);
      
      // 次の問題の選択肢をセット
      const nextQuestionData = questions[nextQuestion];
      const nextOptions = shuffleArray([
        nextQuestionData.correct,
        ...nextQuestionData.distractors
      ]);
      setOptions(nextOptions);
    } else {
      setShowScore(true);
    }
  };

  // 回答処理
  const handleAnswerOptionClick = (selectedAnswer) => {
    if (isAnswered) return;
    
    setIsAnswered(true);
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correct;
    setFeedback({
      isCorrect,
      selectedAnswer,
      correctAnswer: currentQuestion.correct
    });
    
    if (isCorrect) {
      setScore(score + 1);
      setTimeout(() => {
        handleNextQuestion();
      }, 1500);
    } else {
      setShowNextButton(true);
    }
  };

  // サブカテゴリー選択時の処理
  const handleSubcategorySelect = (subcategoryKey) => {
    setSelectedSubcategory(subcategoryKey);
    
    const subcategoryQuestions = getSubcategoryQuestions(selectedCategory, subcategoryKey);
    
    if (subcategoryQuestions.length > 0) {
      setQuestions(subcategoryQuestions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setShowScore(false);
      setIsAnswered(false);
      
      const firstQuestionOptions = shuffleArray([
        subcategoryQuestions[0].correct,
        ...subcategoryQuestions[0].distractors
      ]);
      setOptions(firstQuestionOptions);
      
      setView('quiz');
    } else {
      setView('noQuestions');
    }
  };

  // カテゴリー選択画面
  const renderCategorySelection = () => (
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
        <div className="category-grid">
          {Object.entries(quizData.categories).map(([key, category]) => (
            <button
              key={key}
              className="category-button"
              onClick={() => {
                setSelectedCategory(key);
                setView('subcategorySelection');
              }}
            >
              {category.name}
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

  // サブカテゴリー選択画面
  const renderSubcategorySelection = () => {
    const category = quizData.categories[selectedCategory];
    
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
            {category?.name || 'カテゴリー'}
          </h2>
          <div className="category-selection">
            <h2>サブカテゴリーを選択してください</h2>
            
            <div className="category-grid">
              {Object.entries(category?.subcategories || {}).map(([key, subcategory]) => (
                <button
                  key={key}
                  className="category-button"
                  onClick={() => handleSubcategorySelect(key)}
                >
                  {subcategory.name}
                </button>
              ))}
            </div>
            
            <div className="category-king-section">
              <h2>{category?.name || ''}王チャレンジ</h2>
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
      </div>
    );
  };

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
    if (!questions.length || currentQuestionIndex >= questions.length) {
      return renderNoQuestions();
    }
    
    const currentQuestion = questions[currentQuestionIndex];
    
    return (
      <div className="app">
        <div className="quiz-container">
          <div className="quiz-header">
            <div className="quiz-info">
              <p>問題 {currentQuestionIndex + 1} / {questions.length}</p>
              <p>カテゴリー：{currentQuestion.categoryName}</p>
              <p>サブカテゴリー：{currentQuestion.subcategoryName}</p>
            </div>
          </div>
          
          <div className="question-section">
            <h2>{currentQuestion.question}</h2>
          </div>
          
          {isAnswered && (
            <div className={`feedback ${feedback?.isCorrect ? 'correct-feedback' : 'incorrect-feedback'}`}>
              <p>{feedback?.isCorrect ? '正解！' : '不正解...'}</p>
              {!feedback?.isCorrect && <p>正解は: {currentQuestion.correct}</p>}
            </div>
          )}
          
          {showNextButton && (
            <button onClick={handleNextQuestion} className="next-button">
              次の問題へ
            </button>
          )}
          
          <div className="options-container">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerOptionClick(option)}
                className={`option-button ${
                  isAnswered
                    ? option === currentQuestion.correct
                      ? 'correct'
                      : option === feedback?.selectedAnswer
                      ? 'incorrect'
                      : ''
                    : ''
                }`}
                disabled={isAnswered}
              >
                {option}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (window.confirm('クイズを中断してトップに戻りますか？')) {
                setView('categorySelection');
              }
            }}
            className="back-button"
          >
            トップに戻る
          </button>
        </div>
      </div>
    );
  };

  // スコア表示画面
  const renderScore = () => (
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

  // 準備中画面（クイズ王モード）
  const renderQuizKingComingSoon = () => (
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
  );

  // 準備中画面（カテゴリー王モード）
  const renderCategoryKingComingSoon = () => (
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
  );

  // 表示するビューの選択
  switch (view) {
    case 'subcategorySelection':
      return renderSubcategorySelection();
    case 'quiz':
      return renderQuiz();
    case 'score':
      // showScoreがtrueの場合もスコア画面を表示
      return renderScore();
    case 'noQuestions':
      return renderNoQuestions();
    case 'quizKingComingSoon':
      return renderQuizKingComingSoon();
    case 'categoryKingComingSoon':
      return renderCategoryKingComingSoon();
    case 'categorySelection':
    default:
      // selectedSubcategoryとshowScoreをリセット
      if (selectedSubcategory || showScore) {
        setSelectedSubcategory(null);
        setShowScore(false);
      }
      return renderCategorySelection();
  }
}

export default QuizApp;
