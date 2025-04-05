import React, { useState, useEffect, useRef } from 'react';
import './styles.css';

// 画像のURLを設定
const titleImageUrl = process.env.PUBLIC_URL + '/images/barbarossa.jpeg';

// 選択肢をランダムに並べ替える関数（Fisherâ€"Yatesアルゴリズム）
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    // 0からiまでのランダムなインデックスを選択
    const j = Math.floor(Math.random() * (i + 1));
    // 要素を入れ替え
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
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
  const [timeLeft, setTimeLeft] = useState(15);
  // eslint-disable-next-line no-unused-vars
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

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

  // タイマー制御
  useEffect(() => {
    if (view === 'quiz' && !isAnswered && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            // 時間切れで不正解扱い
      const currentQuestion = questions[currentQuestionIndex];
            setIsAnswered(true);
            setFeedback({
              isCorrect: false,
              selectedAnswer: null,
              correctAnswer: currentQuestion.options.find(opt => opt.isCorrect).text
            });
            setShowNextButton(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      return () => clearInterval(timerRef.current);
    }
  }, [view, currentQuestionIndex, isAnswered, isPaused, questions]);

  // 問題変更時にタイマーをリセット
  useEffect(() => {
    if (view === 'quiz') {
      setTimeLeft(15);
    }
  }, [currentQuestionIndex, view]);

  // カテゴリー選択ハンドラー
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setView('subcategorySelection');
  };

  // 次の問題ボタンクリックハンドラー
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setIsAnswered(false);
      setFeedback(null);
      setShowNextButton(false);
      setTimeLeft(15);
    } else {
      setShowScore(true);
      setView('result');
    }
  };

  // 回答ボタンクリックハンドラー
  const handleAnswerClick = (selectedIndex, isCorrect) => {
    if (isAnswered) return;
    
    setIsAnswered(true);
    clearInterval(timerRef.current);
    
    const currentQuestion = questions[currentQuestionIndex];
    
    setFeedback({
      isCorrect,
      selectedAnswer: currentQuestion.options[selectedIndex].text,
      correctAnswer: currentQuestion.options.find(opt => opt.isCorrect).text
    });
    
    if (isCorrect) {
      setScore(score + 1);
      // 正解の場合は少し待ってから次の問題へ
      setTimeout(() => {
        handleNextQuestion();
      }, 1500);
    } else {
      setShowNextButton(true);
    }
  };

  // サブカテゴリー選択ハンドラー
  const handleSubcategorySelect = (subcategoryId) => {
    setSelectedSubcategory(subcategoryId);
    
    // 選択されたサブカテゴリーの問題を取得
    const categoryQuestions = quizData.categories[selectedCategory].subcategories[subcategoryId].questions;
    
    // 有効な問題をフィルタリング
    const validQuestions = categoryQuestions.filter(q => 
      q.question && q.correct && q.distractors && q.distractors.length === 3
    );
    
    // 問題を10問ランダムに選択
    const selectedQuestions = [];
    const tempQuestions = [...validQuestions];
    
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
        options: shuffledOptions,
        categoryName: quizData.categories[selectedCategory].name,
        subcategoryName: quizData.categories[selectedCategory].subcategories[subcategoryId].name
      });
    }
    
    if (selectedQuestions.length === 0) {
      alert('このサブカテゴリーには問題がありません。別のサブカテゴリーを選んでください。');
      return;
    }
    
    setQuestions(selectedQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowScore(false);
    setIsAnswered(false);
    setFeedback(null);
    setShowNextButton(false);
    setTimeLeft(15);
    setView('quiz');
  };

  // クイズ王チャレンジ処理
  const handleQuizKingChallenge = () => {
    // カテゴリーごとに問題を整理
    const questionsByCategory = {};
    let totalCategories = 0;
    
    // 各カテゴリーとサブカテゴリーから問題を集める
    Object.keys(quizData.categories).forEach(categoryId => {
      const category = quizData.categories[categoryId];
      questionsByCategory[categoryId] = {
        name: category.name,
        subcategories: {}
      };
      
      let validSubcategoryCount = 0;
      
      // 各サブカテゴリーを処理
      Object.keys(category.subcategories).forEach(subcategoryId => {
        const subcategory = category.subcategories[subcategoryId];
        if (subcategory.questions && subcategory.questions.length > 0) {
          // 有効な問題をフィルタリング
          const validQuestions = subcategory.questions.filter(q => 
            q.question && q.correct && q.distractors && q.distractors.length === 3
          );
          
          if (validQuestions.length > 0) {
            questionsByCategory[categoryId].subcategories[subcategoryId] = {
              name: subcategory.name,
              questions: validQuestions.map(q => ({
                ...q,
                categoryId,
                categoryName: category.name,
                subcategoryId,
                subcategoryName: subcategory.name
              }))
            };
            validSubcategoryCount++;
          }
        }
      });
      
      if (validSubcategoryCount > 0) {
        totalCategories++;
      }
    });
    
    // 十分なカテゴリがない場合
    if (totalCategories < 3) {
      alert('十分なカテゴリーがありません。もっと問題を追加してください。');
      return;
    }
    
    // カテゴリーごとの出題数を計算
    const questionsPerCategory = Math.floor(30 / totalCategories);
    let remainingQuestions = 30 - (questionsPerCategory * totalCategories);
    
    // 最終的な問題リスト
    const selectedQuestions = [];
    
    // 各カテゴリーから均等に問題を選択
    Object.keys(questionsByCategory).forEach(categoryId => {
      const categoryData = questionsByCategory[categoryId];
      const validSubcategories = Object.keys(categoryData.subcategories);
      
      if (validSubcategories.length === 0) return;
      
      // このカテゴリーから選ぶ問題数
      let questionsToSelectFromCategory = questionsPerCategory;
      if (remainingQuestions > 0) {
        questionsToSelectFromCategory++;
        remainingQuestions--;
      }
      
      // サブカテゴリーごとの出題数を計算
      const questionsPerSubcategory = Math.max(1, Math.floor(questionsToSelectFromCategory / validSubcategories.length));
      let remainingForCategory = questionsToSelectFromCategory - (questionsPerSubcategory * validSubcategories.length);
      
      // 各サブカテゴリーから問題を選択
      validSubcategories.forEach(subcategoryId => {
        const subcategoryData = categoryData.subcategories[subcategoryId];
        const questions = subcategoryData.questions;
        
        // このサブカテゴリーから選ぶ問題数
        let questionsToSelect = questionsPerSubcategory;
        if (remainingForCategory > 0) {
          questionsToSelect++;
          remainingForCategory--;
        }
        
        // 利用可能な問題数よりも多く選ぼうとしていないか確認
        questionsToSelect = Math.min(questionsToSelect, questions.length);
        
        // 問題をシャッフルして選択
        const shuffledQuestions = shuffleArray([...questions]);
        selectedQuestions.push(...shuffledQuestions.slice(0, questionsToSelect));
      });
    });
    
    // 足りない問題がある場合、ランダムに追加
    if (selectedQuestions.length < 30) {
      // 全ての有効な問題を集める
      const allQuestions = [];
      Object.keys(questionsByCategory).forEach(categoryId => {
        const categoryData = questionsByCategory[categoryId];
        Object.keys(categoryData.subcategories).forEach(subcategoryId => {
          allQuestions.push(...categoryData.subcategories[subcategoryId].questions);
        });
      });
      
      // 既に選ばれていない問題をフィルタリング
      const unusedQuestions = allQuestions.filter(q1 => 
        !selectedQuestions.some(q2 => q1.question === q2.question)
      );
      
      // 必要な数だけ追加
      const additionalNeeded = 30 - selectedQuestions.length;
      if (unusedQuestions.length >= additionalNeeded) {
        const additionalQuestions = shuffleArray(unusedQuestions).slice(0, additionalNeeded);
        selectedQuestions.push(...additionalQuestions);
      } else {
        // 足りない場合は、既存の問題から重複を許して追加
        const moreQuestions = shuffleArray(allQuestions).slice(0, additionalNeeded);
        selectedQuestions.push(...moreQuestions);
      }
    }
    
    // 最終的な問題リストをシャッフル
    const finalQuestions = shuffleArray(selectedQuestions).slice(0, 30);
    
    // 選択肢の準備
    const questionsWithOptions = finalQuestions.map(q => {
      const options = [
        { text: q.correct, isCorrect: true },
        { text: q.distractors[0], isCorrect: false },
        { text: q.distractors[1], isCorrect: false },
        { text: q.distractors[2], isCorrect: false }
      ];
      
      return {
        ...q,
        options: shuffleArray(options)
      };
    });
    
    // クイズの状態をセット
    setQuestions(questionsWithOptions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowScore(false);
    setIsAnswered(false);
    setFeedback(null);
    setShowNextButton(false);
    setTimeLeft(15);
    setView('quiz');
  };

  // カテゴリー王チャレンジの処理
  const handleCategoryKingChallenge = () => {
    if (!selectedCategory) return;
    
    const category = quizData.categories[selectedCategory];
    const allCategoryQuestions = [];
    
    // 選択されたカテゴリーの全サブカテゴリーから問題を集める
    Object.keys(category.subcategories).forEach(subcategoryId => {
      const subcategory = category.subcategories[subcategoryId];
      if (subcategory.questions && subcategory.questions.length > 0) {
        // 有効な問題のみフィルタリング
        const validQuestions = subcategory.questions.filter(q => 
          q.question && q.correct && q.distractors && q.distractors.length === 3
        );
        
        // 各サブカテゴリーから均等に問題を選ぶように改善
        const subcategoryQuestions = validQuestions.map(question => ({
          ...question,
          categoryName: category.name,
          subcategoryName: subcategory.name
        }));
        
        allCategoryQuestions.push(...subcategoryQuestions);
      }
    });
    
    // 十分な問題がない場合
    if (allCategoryQuestions.length < 20) {
      alert('このカテゴリーには十分な問題がありません。他のカテゴリーを選んでください。');
      return;
    }

    // サブカテゴリーの数を取得
    const subcategoryCount = Object.keys(category.subcategories).filter(
      subcatId => {
        const subcat = category.subcategories[subcatId];
        return subcat.questions && subcat.questions.some(q => 
          q.question && q.correct && q.distractors && q.distractors.length === 3
        );
      }
    ).length;

    // サブカテゴリーごとの基本問題数を計算
    const questionsPerSubcategory = Math.floor(20 / subcategoryCount);
    
    // 余りの問題数
    let remainingQuestions = 20 - (questionsPerSubcategory * subcategoryCount);

    // 各サブカテゴリーから選ばれる問題数を格納する配列
    const subcategoryQuestionCounts = {};
    
    // 各サブカテゴリーの選択問題数を初期化
    Object.keys(category.subcategories).forEach(subcatId => {
      const subcat = category.subcategories[subcatId];
      const validQuestions = subcat.questions ? subcat.questions.filter(q => 
        q.question && q.correct && q.distractors && q.distractors.length === 3
      ) : [];
      
      if (validQuestions.length > 0) {
        // 基本問題数を設定
        subcategoryQuestionCounts[subcatId] = questionsPerSubcategory;
        
        // 余りがある場合、順に1問ずつ追加
        if (remainingQuestions > 0) {
          subcategoryQuestionCounts[subcatId]++;
          remainingQuestions--;
        }
      }
    });
    
    // 各サブカテゴリーから問題を選択
    const selectedQuestions = [];
    Object.keys(subcategoryQuestionCounts).forEach(subcatId => {
      const subcat = category.subcategories[subcatId];
      const count = subcategoryQuestionCounts[subcatId];
      
      // 有効な問題だけをフィルタリング
      const validQuestions = subcat.questions.filter(q => 
        q.question && q.correct && q.distractors && q.distractors.length === 3
      );
      
      // 問題が十分にある場合はランダムに選択
      if (validQuestions.length >= count) {
        const shuffled = shuffleArray([...validQuestions]);
        const selected = shuffled.slice(0, count);
        selectedQuestions.push(...selected.map(q => ({
          ...q,
          categoryName: category.name,
          subcategoryName: subcat.name
        })));
      } else {
        // 問題が足りない場合は、ある分だけ追加
        selectedQuestions.push(...validQuestions.map(q => ({
          ...q,
          categoryName: category.name,
          subcategoryName: subcat.name
        })));
      }
    });
    
    // 選択問題数が20問未満の場合、他のサブカテゴリーから補填
    if (selectedQuestions.length < 20) {
      // すでに選ばれていない問題を集める
      const unusedQuestions = allCategoryQuestions.filter(q => 
        !selectedQuestions.some(sq => sq.question === q.question)
      );
      
      // 不足分を追加
      const neededCount = 20 - selectedQuestions.length;
      const additionalQuestions = shuffleArray(unusedQuestions).slice(0, neededCount);
      selectedQuestions.push(...additionalQuestions);
    }
    
    // 最終的な問題リストをシャッフル
    const finalQuestions = shuffleArray(selectedQuestions).slice(0, 20);
    
    // 選択肢の準備
    const questionsWithOptions = finalQuestions.map(q => {
      const options = [
        { text: q.correct, isCorrect: true },
        { text: q.distractors[0], isCorrect: false },
        { text: q.distractors[1], isCorrect: false },
        { text: q.distractors[2], isCorrect: false }
      ];
      
      return {
        ...q,
        options: shuffleArray(options)
      };
    });
    
    // クイズの状態をセット
    setQuestions(questionsWithOptions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowScore(false);
    setIsAnswered(false);
    setFeedback(null);
    setShowNextButton(false);
    setTimeLeft(15);
    setView('quiz');
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
              onClick={handleQuizKingChallenge}
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
              onClick={handleCategoryKingChallenge}
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
    const progressPercentage = (currentQuestionIndex / questions.length) * 100;

    return (
      <div className="app">
        <div className="quiz-container">
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className={`time-left-display ${timeLeft <= 5 ? 'warning' : ''}`}>
            残り時間: {timeLeft}秒
          </div>
          <div className="quiz-header">
            <div className="quiz-info">
              <p>問題 {currentQuestionIndex + 1} / {questions.length}</p>
              <p>カテゴリー：{currentQuestion.categoryName}</p>
              <p>サブカテゴリー：{currentQuestion.subcategoryName}</p>
            </div>
            <div className="timer">
              <div className="timer-bar-container">
                <div 
                  className={`timer-bar ${timeLeft <= 5 ? 'warning' : ''}`}
                  style={{ width: `${(timeLeft / 15) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="question-section">
            <h2>{currentQuestion.question}</h2>
          </div>

          {isAnswered && feedback && (
            <div className={`feedback ${feedback.isCorrect ? 'correct-feedback' : 'incorrect-feedback'}`}>
              <p>{feedback.isCorrect ? '正解！' : '不正解...'}</p>
              {!feedback.isCorrect && <p>正解は: {feedback.correctAnswer}</p>}
              {!feedback.isCorrect && showNextButton && (
                <button className="next-button" onClick={handleNextQuestion}>
                  {currentQuestionIndex < questions.length - 1 ? '次の問題' : '結果を見る'}
                </button>
              )}
            </div>
          )}
          
          <div className="options-container">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                className={`option-button ${
                  isAnswered
                    ? option.isCorrect
                      ? 'correct'
                      : feedback && feedback.selectedAnswer === option.text && !option.isCorrect
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
          {feedback && feedback.isCorrect && showNextButton && (
            <button className="next-button" onClick={handleNextQuestion}>
              {currentQuestionIndex < questions.length - 1 ? '次の問題' : '結果を見る'}
            </button>
          )}
          <button
            className="back-button"
            onClick={() => {
              if (window.confirm('クイズを中断してトップに戻りますか？')) {
                clearInterval(timerRef.current);
                setView('categorySelection');
              }
            }}
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
            <div className="percentage-score">
              正答率: {Math.round((score / questions.length) * 100)}%
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
