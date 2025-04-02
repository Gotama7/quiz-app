import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import quizData from './quizData.json';
import './styles.css';

// 選択肢をランダムに並べ替える関数
function shuffleArray(array) {
  return array.sort(() => 0.5 - Math.random());
}

// 全カテゴリーから問題を取得する関数
function getAllQuestions() {
  // カテゴリーごとの問題を格納するオブジェクト
  const questionsByCategory = {};
  
  // 各カテゴリーの問題を収集
  Object.entries(quizData).forEach(([categoryKey, category]) => {
    const categoryQuestions = [];
    Object.entries(category.subcategories).forEach(([, subcategory]) => {
      if (subcategory.questions && subcategory.questions.length > 0) {
        subcategory.questions.forEach(q => {
          if (q.question && q.correct && q.distractors && q.distractors.length === 3) {
            categoryQuestions.push({
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
    if (categoryQuestions.length > 0) {
      questionsByCategory[categoryKey] = shuffleArray(categoryQuestions);
    }
  });

  // 各カテゴリーから均等に問題を選ぶ
  const categories = Object.keys(questionsByCategory);
  const questionsPerCategory = Math.ceil(30 / categories.length);
  const selectedQuestions = [];
  
  // カテゴリーの順序をランダム化
  const shuffledCategories = shuffleArray([...categories]);
  
  // 各カテゴリーから問題を選択
  shuffledCategories.forEach(categoryKey => {
    const categoryQuestions = questionsByCategory[categoryKey];
    const questionsToTake = Math.min(questionsPerCategory, categoryQuestions.length);
    selectedQuestions.push(...categoryQuestions.slice(0, questionsToTake));
  });

  // 最終的な問題数を30問に調整
  return shuffleArray(selectedQuestions).slice(0, 30);
}

// 特定のカテゴリーの全サブカテゴリーから問題を取得する関数
function getCategoryQuestions(categoryKey) {
  const category = quizData[categoryKey];
  const questionsBySubcategory = {};

  // 各サブカテゴリーの問題を収集
  Object.entries(category.subcategories).forEach(([subcategoryKey, subcategory]) => {
    const subcategoryQuestions = [];
    if (subcategory.questions && subcategory.questions.length > 0) {
      subcategory.questions.forEach(q => {
        if (q.question && q.correct && q.distractors && q.distractors.length === 3) {
          subcategoryQuestions.push({
            question: q.question,
            correct: q.correct,
            distractors: q.distractors,
            categoryName: category.name,
            subcategoryName: subcategory.name
          });
        }
      });
    }
    if (subcategoryQuestions.length > 0) {
      questionsBySubcategory[subcategoryKey] = shuffleArray(subcategoryQuestions);
    }
  });

  const subcategories = Object.keys(questionsBySubcategory);
  if (subcategories.length === 0) return [];

  // 各サブカテゴリーから最低限取得する問題数を計算
  const baseQuestionsPerSubcategory = Math.floor(20 / subcategories.length);
  const remainingQuestions = 20 % subcategories.length;
  
  let selectedQuestions = [];

  // 各サブカテゴリーから均等に問題を選択
  subcategories.forEach((subcategoryKey, index) => {
    const questionsFromThisSubcategory = baseQuestionsPerSubcategory + (index < remainingQuestions ? 1 : 0);
    const subcategoryQuestions = questionsBySubcategory[subcategoryKey];
    
    // サブカテゴリーの問題数が足りない場合は、全問題を使用
    if (subcategoryQuestions.length <= questionsFromThisSubcategory) {
      selectedQuestions.push(...subcategoryQuestions);
    } else {
      selectedQuestions.push(...subcategoryQuestions.slice(0, questionsFromThisSubcategory));
    }
  });

  // 20問に満たない場合は、残りの問題をランダムに追加
  if (selectedQuestions.length < 20) {
    // 全問題を1つの配列にまとめる
    const allRemainingQuestions = [];
    subcategories.forEach(subcategoryKey => {
      const usedCount = selectedQuestions.filter(q => q.subcategoryName === questionsBySubcategory[subcategoryKey][0].subcategoryName).length;
      const remainingQuestions = questionsBySubcategory[subcategoryKey].slice(usedCount);
      allRemainingQuestions.push(...remainingQuestions);
    });

    // 残りの問題からランダムに選択して補完
    while (selectedQuestions.length < 20 && allRemainingQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * allRemainingQuestions.length);
      selectedQuestions.push(allRemainingQuestions[randomIndex]);
      allRemainingQuestions.splice(randomIndex, 1);
    }

    // それでも20問に満たない場合は、既存の問題から重複を許して補完
    if (selectedQuestions.length < 20) {
      const originalQuestions = [...selectedQuestions];
      while (selectedQuestions.length < 20) {
        const randomQuestion = originalQuestions[Math.floor(Math.random() * originalQuestions.length)];
        selectedQuestions.push({...randomQuestion});
      }
    }
  }

  // 最終的な問題をシャッフルして返す
  return shuffleArray(selectedQuestions);
}

function QuizApp() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [options, setOptions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isQuizKingMode, setIsQuizKingMode] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [showNextButton, setShowNextButton] = useState(false);

  // 次の問題へ進む処理
  const handleNextQuestion = useCallback(() => {
    const nextQuestion = currentQuestionIndex + 1;
    if (nextQuestion < questions.length) {
      setCurrentQuestionIndex(nextQuestion);
      setIsAnswered(false);
      setTimeLeft(15);
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
      if (isQuizKingMode) {
        setShowNameInput(true);
      } else {
        setShowScore(true);
      }
    }
  }, [currentQuestionIndex, questions, isQuizKingMode]);

  // 時間切れの処理
  const handleTimeUp = useCallback(() => {
    if (!isAnswered && questions && questions.length > 0) {
      const currentQuestion = questions[currentQuestionIndex];
      if (!currentQuestion) return;
      
      setIsAnswered(true);
      setFeedback({
        isCorrect: false,
        correctAnswer: currentQuestion.correct,
        selectedAnswer: null
      });

      setTimeout(() => {
        const nextQuestion = currentQuestionIndex + 1;
        if (nextQuestion < questions.length) {
          setCurrentQuestionIndex(nextQuestion);
          setIsAnswered(false);
          setTimeLeft(15);
          
          const nextQuestionData = questions[nextQuestion];
          const nextOptions = shuffleArray([
            nextQuestionData.correct,
            ...nextQuestionData.distractors
          ]);
          setOptions(nextOptions);
        } else {
          if (isQuizKingMode) {
            setShowNameInput(true);
          } else {
            setShowScore(true);
          }
        }
      }, 1500);
    }
  }, [currentQuestionIndex, isAnswered, questions, isQuizKingMode]);

  // タイマー処理
  useEffect(() => {
    let timer;
    if (timeLeft > 0 && !isAnswered) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft, isAnswered, handleTimeUp]);

  // スコアを保存する関数
  const saveScore = useCallback(() => {
    if (!playerName.trim()) return;

    const scoreData = {
      name: playerName,
      score: score,
      total: questions.length,
      category: isQuizKingMode ? 'クイズ王チャレンジ' : quizData[selectedCategory].name,
      timestamp: new Date().toISOString()
    };

    // localStorageから既存のスコアを取得
    const existingScores = JSON.parse(localStorage.getItem('quizScores') || '[]');
    
    // 新しいスコアを追加
    existingScores.push(scoreData);
    
    // スコアを保存
    localStorage.setItem('quizScores', JSON.stringify(existingScores));
    
    setShowScore(true);
  }, [playerName, score, questions.length, isQuizKingMode, selectedCategory]);

  // サブカテゴリーが選択されたときに問題を設定
  useEffect(() => {
    if (selectedCategory && selectedSubcategory) {
      try {
        const subcategoryQuestions = quizData[selectedCategory].subcategories[selectedSubcategory].questions;
        
        if (!subcategoryQuestions || subcategoryQuestions.length === 0) {
          setQuestions([]);
          setShowScore(true);
          return;
        }

        const formattedQuestions = subcategoryQuestions.map(q => {
          if (!q.question || !q.correct || !q.distractors || q.distractors.length !== 3) {
            return null;
          }
          return {
            question: q.question,
            correct: q.correct,
            distractors: q.distractors,
            categoryName: quizData[selectedCategory].name,
            subcategoryName: quizData[selectedCategory].subcategories[selectedSubcategory].name
          };
        }).filter(q => q !== null);

        if (formattedQuestions.length === 0) {
          setQuestions([]);
          setShowScore(true);
          return;
        }

        const shuffledQuestions = shuffleArray([...formattedQuestions]).slice(0, 10);
        setQuestions(shuffledQuestions);
        setCurrentQuestionIndex(0);
        setScore(0);
        setShowScore(false);
        setIsAnswered(false);
        setTimeLeft(15);

        // 最初の問題の選択肢をセット
        const firstQuestion = shuffledQuestions[0];
        const initialOptions = shuffleArray([
          firstQuestion.correct,
          ...firstQuestion.distractors
        ]);
        setOptions(initialOptions);
      } catch (error) {
        console.error('問題の処理中にエラーが発生しました:', error);
        setQuestions([]);
        setShowScore(true);
      }
    }
  }, [selectedCategory, selectedSubcategory]);

  // 名前入力後の処理
  const handleNameSubmit = () => {
    if (playerName.trim()) {
      saveScore();
      setShowNameInput(false);
    }
  };

  // カテゴリー選択画面に戻る
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowScore(false);
    setIsQuizKingMode(false);
    setTimeLeft(15);
    setShowNextButton(false);
    navigate('/');
  };

  // サブカテゴリー選択画面に戻る
  const handleBackToSubcategories = () => {
    setSelectedSubcategory(null);
    setQuestions([]);
    setShowScore(false);
    setCurrentQuestionIndex(0);
    setScore(0);
  };

  // クイズ王チャレンジモード開始
  const startQuizKingChallenge = () => {
    const allQuestions = getAllQuestions();
    
    if (allQuestions.length > 0) {
      setQuestions(allQuestions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setShowScore(false);
      setIsQuizKingMode(true);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setIsAnswered(false);
      setTimeLeft(15);
      setFeedback(null);
      
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

  // カテゴリー王チャレンジモード開始
  const startCategoryKingChallenge = () => {
    const categoryQuestions = getCategoryQuestions(selectedCategory);
    
    if (categoryQuestions.length > 0) {
      setQuestions(categoryQuestions);
      setCurrentQuestionIndex(0);
      setScore(0);
      setShowScore(false);
      setIsQuizKingMode(true);
      setSelectedSubcategory(null);
      setIsAnswered(false);
      setTimeLeft(15);
      setFeedback(null);
      
      // 最初の問題の選択肢をセット
      const firstQuestion = categoryQuestions[0];
      const initialOptions = shuffleArray([
        firstQuestion.correct,
        ...firstQuestion.distractors
      ]);
      setOptions(initialOptions);
    } else {
      console.error('利用可能な問題がありません');
    }
  };

  // 回答処理の修正
  const handleAnswerOptionClick = (selectedAnswer) => {
    if (isAnswered || !questions[currentQuestionIndex]) return;
    
    setIsAnswered(true);
    
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion?.correct;
    setFeedback({
      isCorrect,
      selectedAnswer,
      correctAnswer: currentQuestion?.correct
    });
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      setTimeout(() => {
        handleNextQuestion();
      }, 1500);
    } else {
      setShowNextButton(true);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    navigate(`/quiz/${category}`, { state: { category } });
  };

  const handleLevelSelect = (level) => {
    setSelectedSubcategory(level);
    navigate(`/quiz/${selectedCategory}/${level}`, { 
      state: { category: selectedCategory, level } 
    });
  };

  // カテゴリー選択画面
  if (!selectedCategory && !isQuizKingMode) {
    return (
      <div className="app">
        <div className="quiz-container">
          <div className="title-section">
            <img 
              src="/images/barbarossa.jpeg"
              alt="Frederick I Barbarossa" 
              className="title-image"
            />
            <h1>バルバロッサクイズ！</h1>
          </div>
          <div className="category-grid">
            {Object.entries(quizData).map(([key, category]) => (
              <button
                key={key}
                className="category-button"
                onClick={() => handleCategorySelect(key)}
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
  if (!selectedSubcategory && !isQuizKingMode) {
    const category = quizData[selectedCategory];
    return (
      <div className="app">
        <div className="quiz-container">
          <div className="title-section">
            <img 
              src="/images/barbarossa.jpeg"
              alt="Frederick I Barbarossa" 
              className="title-image"
            />
            <h1>バルバロッサクイズ！</h1>
          </div>
          <h2 className="selected-category-name">{category.name}</h2>
          <div className="category-selection">
            <h2>サブカテゴリーを選択してください</h2>
            <div className="category-grid">
              {Object.entries(category.subcategories).map(([key, subcategory]) => (
                <button
                  key={key}
                  onClick={() => handleLevelSelect(key)}
                  className="category-button"
                >
                  {subcategory.name}
                </button>
              ))}
            </div>
            <div className="category-king-section">
              <h2>{category.name}王チャレンジ</h2>
              <p>このカテゴリーの全サブカテゴリーからランダムに20問出題！</p>
              <button
                onClick={startCategoryKingChallenge}
                className="quiz-king-button"
              >
                チャレンジ開始
              </button>
            </div>
            <button
              onClick={handleBackToCategories}
              className="back-button"
            >
              カテゴリー選択に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  // プレイヤー名入力画面
  if (showNameInput) {
    return (
      <div className="app">
        <div className="quiz-container">
          <div className="name-input-section">
            <h2>クイズ{isQuizKingMode ? '王' : `${quizData[selectedCategory].name}王`}チャレンジ終了！</h2>
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
            <button
              onClick={handleBackToCategories}
              className="back-button"
              style={{ marginTop: '20px' }}
            >
              トップに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  // スコア表示画面
  if (showScore) {
    return (
      <div className="app">
        <div className="quiz-container">
          <div className="score-section">
            {questions.length === 0 ? (
              <>
                <h2>申し訳ありません</h2>
                <div className="score-text">
                  このカテゴリーにはまだ問題が登録されていません。
                </div>
                <button
                  onClick={handleBackToSubcategories}
                  className="back-button"
                >
                  サブカテゴリー選択に戻る
                </button>
              </>
            ) : (
              <>
                <h2>クイズ終了！</h2>
                <div className="score-text">
                  あなたのスコアは {score} / {questions.length} です
                </div>
                {!isQuizKingMode && (
                  <div className="name-input">
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="あなたの名前を入力"
                    />
                    <button onClick={handleNameSubmit}>結果を保存</button>
                  </div>
                )}
                <div className="navigation-buttons">
                  <button
                    onClick={handleBackToCategories}
                    className="nav-button"
                  >
                    トップに戻る
                  </button>
                  {!isQuizKingMode && (
                    <button
                      onClick={handleBackToSubcategories}
                      className="nav-button"
                    >
                      サブカテゴリー選択に戻る
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // クイズ画面
  if (questions.length > 0 && currentQuestionIndex < questions.length) {
    const currentQuestion = questions[currentQuestionIndex];
    return (
      <div className="app">
        <div className="quiz-container">
          <div className="quiz-header">
            <div className={`timer ${timeLeft <= 5 ? 'warning' : ''}`}>
              残り時間：{timeLeft}秒
              <div 
                className="timer-bar"
                style={{
                  width: `${(timeLeft / 15) * 100}%`,
                  backgroundColor: timeLeft <= 5 ? '#ef4444' : '#22c55e'
                }}
              />
            </div>
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
                handleBackToCategories();
              }
            }}
            className="back-button"
            style={{ marginTop: '20px' }}
          >
            トップに戻る
          </button>
        </div>
      </div>
    );
  }

  // 問題がない場合のエラー画面
  return (
    <div className="app">
      <div className="quiz-container">
        <div className="score-section">
          <h2>申し訳ありません</h2>
          <div className="score-text">
            このカテゴリーにはまだ問題が登録されていません。
          </div>
          <button
            onClick={handleBackToSubcategories}
            className="back-button"
          >
            サブカテゴリー選択に戻る
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizApp;
