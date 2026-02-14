import React, { useState, useEffect, useRef } from 'react';
import './styles.css';
import { saveScoreToFirestore, fetchRankingFromFirestore } from './lib/score';
import { initializeAuth, auth, db } from './firebase';

/* ------------------------------------------------------------------
   0. 定数 & 共通ユーティリティ
------------------------------------------------------------------ */
// 選択肢シャッフル (Fisher‑Yates)
const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ------------------------------------------------------------------
   1. ランキング表示コンポーネント（Firestore方式）
------------------------------------------------------------------ */
function Ranking({ initialMode, initialCategoryId, initialSubcategoryId, onBack, quizData }) {
  const [categoryId, setCategoryId] = useState(initialCategoryId || '');
  const [subcategoryId, setSubcategoryId] = useState(initialSubcategoryId || '');
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);

  // 初期値が変更されたら内部状態を更新
  useEffect(() => {
    setCategoryId(initialCategoryId || '');
    setSubcategoryId(initialSubcategoryId || '');
  }, [initialCategoryId, initialSubcategoryId]);

  // 選択カテゴリのサブカテゴリ一覧
  const subcats = categoryId
    ? Object.entries(quizData.categories[categoryId]?.subcategories || {})
    : [];

  useEffect(() => {
    (async () => {
      try {
        const ranking = await fetchRankingFromFirestore({
          mode: initialMode,
          categoryId: categoryId || undefined,
          subcategoryId: subcategoryId || undefined,
        });
        setList(ranking);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setList([]);
      }
    })();
  }, [initialMode, categoryId, subcategoryId]);

  if (error)        return <p>読み込み失敗: {error}</p>;
  if (list===null)  return <p>読み込み中...</p>;
  if (list.length===0) return <p>まだ記録がありません</p>;

  const title = initialMode === 10 ? '通常モード' : initialMode === 20 ? 'カテゴリー王' : 'クイズ王';

  return (
    <div className="app">
      <div className="quiz-container">
        <div className="title-section">
          <img
            src="/images/barbarossa.jpeg"
            alt="バルバロッサ"
            className="title-image"
            style={{ width: 120, height: 'auto' }}
          />
          <h1>{title} ランキング</h1>
        </div>
        
        {/* カテゴリ・サブカテゴリフィルター */}
        <div style={{display:'flex', gap:12, justifyContent:'center', margin:'16px 0'}}>
          <select
            value={categoryId}
            onChange={(e) => { setCategoryId(e.target.value); setSubcategoryId(''); }}
            className="category-select"
          >
            <option value="">全カテゴリー</option>
            {Object.entries(quizData.categories || {}).map(([cid, c]) => (
              <option key={cid} value={cid}>{c.name}</option>
            ))}
          </select>

          {/* サブカテゴリ選択（カテゴリ選択時だけ有効） */}
          <select
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
            disabled={!categoryId}
            className="category-select"
          >
            <option value="">全サブカテゴリ</option>
            {subcats.map(([scid, sc]) => (
              <option key={scid} value={scid}>{sc.name}</option>
            ))}
          </select>
        </div>
        
        <ol className="ranking-list">
          {list.map((item, i) => {
            // 同じスコアの場合は同順位を表示
            let rank = 1;
            if (i > 0) {
              if (item.score === list[i - 1].score) {
                // 前の人と同じスコアなら、前の人の順位を取得
                rank = list[i - 1].rank;
              } else {
                rank = i + 1;
              }
            }
            // 順位を保存（次の人が参照できるように）
            item.rank = rank;

            return (
              <li key={i} className="ranking-item">
                <span className="rank-num">{rank}.</span>
                <span className="rank-name">{item.name}</span>
                <span className="rank-score">{item.score} 点</span>
                {item.categoryName && <span className="rank-category">({item.categoryName})</span>}
                {item.subcategoryName && <span className="rank-category"> - {item.subcategoryName}</span>}
              </li>
            );
          })}
        </ol>
        <button className="back-button" onClick={onBack}>戻る</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   2. メイン QuizApp コンポーネント
   （データロード／クイズ進行部は元コードそのまま）
------------------------------------------------------------------ */
export default function QuizApp() {
  // ステート類（抜粋）
  const [view, setView]                       = useState('categorySelection');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [questions, setQuestions]             = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore]                     = useState(0);
  const [isAnswered, setIsAnswered]           = useState(false);
  const [feedback, setFeedback]               = useState(null);
  const [showNextButton, setShowNextButton]   = useState(false);
  const [quizData, setQuizData]               = useState({ categories: {} });
  const [timeLeft, setTimeLeft]               = useState(15);
  const [playerName, setPlayerName]           = useState('');
  const [quizMode, setQuizMode] = useState(null);
  const timerRef                              = useRef(null);

  // ランキング表示用の初期フィルタ
  const [rankingFilter, setRankingFilter] = useState({
    mode: 10,
    categoryId: '',
    subcategoryId: ''
  });

  // スコア送信状態
  const [scoreSubmissionStatus, setScoreSubmissionStatus] = useState('idle'); // 'idle', 'submitting', 'success', 'error'
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false); // スコア送信済みフラグ

  // どこからでも呼べるランディング関数
  const openRanking = (mode = 10, categoryId = '', subcategoryId = '') => {
    setRankingFilter({ mode, categoryId, subcategoryId });
    setView('ranking');               // ← ランキング画面へ遷移
  };

  // Firebase匿名認証を初期化
  useEffect(() => {
    const initFirebase = async () => {
      try {
        await initializeAuth();
        console.log('Firebase初期化完了');
      } catch (error) {
        console.error('Firebase初期化エラー:', error);
        // エラーが発生してもアプリは動作を続ける
      }
    };
    
    // 少し遅延させて初期化
    const timer = setTimeout(initFirebase, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Firebase接続テスト用（一時的に追加）
  useEffect(() => {
    const testFirebase = async () => {
      try {
        console.log('=== Firebase接続テスト ===');
        console.log('auth:', auth);
        console.log('auth.currentUser:', auth.currentUser);
        console.log('db:', db);
        
        // 簡単なFirestore読み取りテスト
        if (db && auth.currentUser) {
          console.log('Firestore読み取りテスト開始...');
          const { collection, getDocs } = await import('firebase/firestore');
          const snapshot = await getDocs(collection(db, 'scores'));
          console.log('Firestore読み取り成功:', snapshot.docs.length, '件');
        }
      } catch (error) {
        console.error('Firebase接続テストエラー:', error);
      }
    };
    
    // 認証完了後にテスト実行
    const timer = setTimeout(testFirebase, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // JSONデータを読み込む
  useEffect(() => {
    const loadData = async () => {
      try {
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
        console.log('[debug] categories loaded =', Object.keys(categoriesData));
      } catch (error) {
        console.error('Failed to load quiz data:', error);
      }
    };
    
    loadData();
  }, []);

  // タイマー制御
  useEffect(() => {
    if (view === 'quiz' && !isAnswered) {
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
  }, [view, currentQuestionIndex, isAnswered, questions]);

  // 問題変更時にタイマーをリセット
  useEffect(() => {
    if (view === 'quiz') {
      setTimeLeft(15);
    }
  }, [currentQuestionIndex, view]);

  // カテゴリー選択ハンドラー
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null); // サブカテゴリもリセット
    setView('subcategorySelection');
  };

  // サブカテゴリー選択ハンドラー
  const handleSubcategorySelect = (subcategoryId) => {
    setSelectedSubcategory(subcategoryId);
    setHasSubmittedScore(false); // 新しいクイズ開始時にフラグをリセット
    
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
    setQuizMode(10);
    setCurrentQuestionIndex(0);
    setScore(0);
    setIsAnswered(false);
    setFeedback(null);
    setShowNextButton(false);
    setTimeLeft(15);
    setView('quiz');
  };

  // カテゴリー王チャレンジの処理
  const handleCategoryKingChallenge = () => {
    if (!selectedCategory) return;
    
    // サブカテゴリはリセット（全カテゴリーから問題を選ぶため）
    setSelectedSubcategory(null);
    setHasSubmittedScore(false); // 新しいクイズ開始時にフラグをリセット
    
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
    setQuizMode(20);
    setCurrentQuestionIndex(0);
    setScore(0);
    setIsAnswered(false);
    setFeedback(null);
    setShowNextButton(false);
    setTimeLeft(15);
    setView('quiz');
  };

  // クイズ王チャレンジ（全カテゴリーから30問）
  const handleQuizKingChallenge = () => {
    if (!quizData.categories) return;

    // 全カテゴリーの全問題を集める
    const allQuestions = [];
    Object.keys(quizData.categories).forEach(catId => {
      const category = quizData.categories[catId];
      Object.keys(category.subcategories).forEach(subId => {
        const subcategory = category.subcategories[subId];
        if (subcategory.questions) {
          subcategory.questions.forEach(q => {
            allQuestions.push({
              ...q,
              categoryId: catId,
              categoryName: category.name,
              subcategoryId: subId,
              subcategoryName: subcategory.name
            });
          });
        }
      });
    });

    // 有効な問題のみフィルター
    const validQuestions = allQuestions.filter(q =>
      q.question && q.correct && q.distractors && q.distractors.length === 3
    );

    // 30問ランダムに選択
    const selectedQuestions = [];
    const tempQuestions = [...validQuestions];
    while (selectedQuestions.length < 30 && tempQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * tempQuestions.length);
      selectedQuestions.push(tempQuestions.splice(randomIndex, 1)[0]);
    }

    // 選択肢の準備
    const questionsWithOptions = selectedQuestions.map(q => {
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
    setQuizMode(30);
    setSelectedCategory(null); // 全カテゴリーなのでnull
    setSelectedSubcategory(null);
    setCurrentQuestionIndex(0);
    setScore(0);
    setIsAnswered(false);
    setFeedback(null);
    setShowNextButton(false);
    setTimeLeft(15);
    setView('quiz');
  };

  // handleNextQuestion, handleAnswerClickの再定義（簡易版）
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setIsAnswered(false);
      setFeedback(null);
      setShowNextButton(false);
      setTimeLeft(15);
    } else {
      // クイズ終了時にスコアを保存
      if (playerName && !hasSubmittedScore) {
        setScoreSubmissionStatus('submitting');
        saveScoreToFirestore({
          name: playerName,
          score: score,
          mode: questions.length, // 10/20/30
          categoryId: selectedCategory,
          categoryName: quizData.categories[selectedCategory]?.name,
          subcategoryId: selectedSubcategory,
          subcategoryName: quizData.categories[selectedCategory]?.subcategories[selectedSubcategory]?.name,
        }).then(() => {
          setScoreSubmissionStatus('success');
          setHasSubmittedScore(true); // 送信済みフラグを設定
          console.log('クイズ終了時のスコア送信成功');
        }).catch((error) => {
          setScoreSubmissionStatus('error');
          console.error('クイズ終了時のスコア送信エラー:', error);
        });
      }
      setView('result');
    }
  };

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
      setTimeout(() => {
        handleNextQuestion();
      }, 1500);
    } else {
      setShowNextButton(true);
    }
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
              src="/images/barbarossa.jpeg"
              alt="バルバロッサ"
              className="title-image"
              style={{ width: 120, height: 'auto' }}
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
            <button
              className="rank-link"
              onClick={() => openRanking(20, selectedCategory)}
              style={{ marginTop: '10px', width: '100%' }}
            >
              🏆 このカテゴリーのランキングを見る
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
      <div className="result-section">
        <h2>クイズ結果</h2>
        <p>
          {questions.length}問中{score}問正解！
          （正答率: {Math.round((score / questions.length) * 100)}%）
        </p>
        <div className="name-input-section">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="あなたの名前を入力"
            className="name-input"
            disabled={hasSubmittedScore || scoreSubmissionStatus === 'success'}
          />
          <button
            className={`save-score-button ${scoreSubmissionStatus === 'success' ? 'success' : scoreSubmissionStatus === 'submitting' ? 'submitting' : hasSubmittedScore ? 'submitted' : ''}`}
            onClick={async () => {
              // 既に送信済みまたは送信中の場合は何もしない
              if (hasSubmittedScore || scoreSubmissionStatus === 'submitting' || scoreSubmissionStatus === 'success') return;
              
              setScoreSubmissionStatus('submitting');
              console.log('スコア送信開始');
              console.log('送信データ:', {
                name: playerName,
                score: score,
                mode: questions.length,
                categoryId: selectedCategory,
                categoryName: quizData.categories[selectedCategory]?.name,
                subcategoryId: selectedSubcategory,
                subcategoryName: quizData.categories[selectedCategory]?.subcategories[selectedSubcategory]?.name,
              });
              
              try {
                await saveScoreToFirestore({
                  name: playerName,
                  score: score,
                  mode: questions.length, // 10/20/30
                  categoryId: selectedCategory,
                  categoryName: quizData.categories[selectedCategory]?.name,
                  subcategoryId: selectedSubcategory,
                  subcategoryName: quizData.categories[selectedCategory]?.subcategories[selectedSubcategory]?.name,
                });
                console.log('スコア送信成功');
                setScoreSubmissionStatus('success');
                setHasSubmittedScore(true); // 送信済みフラグを設定
                
                // 成功メッセージを表示
                setTimeout(() => {
                  setScoreSubmissionStatus('idle');
                }, 3000);
                
              } catch (error) {
                console.error('スコア送信エラー:', error);
                setScoreSubmissionStatus('error');
                alert('スコアの保存に失敗しました: ' + error.message);
                
                // エラー状態をリセット
                setTimeout(() => {
                  setScoreSubmissionStatus('idle');
                }, 3000);
              }
            }}
            disabled={!playerName || hasSubmittedScore || scoreSubmissionStatus === 'submitting' || scoreSubmissionStatus === 'success'}
          >
            {hasSubmittedScore ? '✅ 送信済み' : 
             scoreSubmissionStatus === 'submitting' ? '送信中...' : 
             scoreSubmissionStatus === 'success' ? '✅ 送信完了！' : 
             scoreSubmissionStatus === 'error' ? '❌ 送信失敗' : 
             'スコア送信'}
          </button>
          
          {/* 成功メッセージ */}
          {scoreSubmissionStatus === 'success' && (
            <div className="success-message">
              🎉 スコアを送信しました！ランキングに反映されます。
            </div>
          )}
          
          {/* 送信済みメッセージ */}
          {hasSubmittedScore && scoreSubmissionStatus !== 'success' && (
            <div className="submitted-message">
              ℹ️ このクイズのスコアは既に送信済みです。
            </div>
          )}
        </div>
        <div className="result-buttons">
          <button onClick={() => setView('categorySelection')}>
            カテゴリー選択に戻る
          </button>
          <button onClick={() => openRanking(quizMode)}>
            今回のランキングを見る
          </button>
        </div>
      </div>
    );
  };

  /* ----------------- 3‑B. 最終レンダリング ----------------- */
  return (
    <div className="quiz-app">
      {view === 'categorySelection' && (
        <div className="app">
          <div className="quiz-container">
            <div className="title-section">
              <img
                src="/images/barbarossa.jpeg"
                alt="バルバロッサ"
                className="title-image"
                style={{ width: 120, height: 'auto' }}
              />
              <h1>バルバロッサクイズ！</h1>
            </div>

            {/* quizData がまだ空だとクラッシュするのでガードを入れる */}
            {Object.keys(quizData.categories || {}).length === 0 ? (
              <p>読み込み中...</p>
            ) : (
              <>
                <h2>カテゴリーを選択してください</h2>
                <div className="category-grid">
                  {Object.keys(quizData.categories).map((cid) => (
                    <button
                      key={cid}
                      className="category-button"
                      onClick={() => handleCategorySelect(cid)}
                    >
                      {quizData.categories[cid].name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* クイズ王チャレンジセクション */}
            <section className="quiz-king-section" style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '10px' }}>
              <h2 style={{ color: '#000000' }}>🏆 クイズ王チャレンジ</h2>
              <p>全カテゴリーからランダムに30問出題！真のクイズ王を目指せ！</p>
              <button
                className="quiz-king-button"
                onClick={handleQuizKingChallenge}
                style={{ backgroundColor: '#000000', color: 'white', padding: '15px 30px', fontSize: '18px', fontWeight: 'bold' }}
              >
                チャレンジ開始
              </button>
            </section>

            {/* ランキングを見るセクション（控えめな配置） */}
            <section className="ranking-cta">
              <h3 className="ranking-cta__title">ランキングを見る</h3>
              <div className="ranking-cta__buttons">
                <button className="rank-ghost" onClick={() => openRanking(10)}>通常10問</button>
                <button className="rank-ghost" onClick={() => openRanking(20)}>カテゴリー王20問</button>
                <button className="rank-ghost" onClick={() => openRanking(30)}>クイズ王30問</button>
              </div>
            </section>
          </div>
        </div>
      )}
      {view === 'subcategorySelection' && renderSubcategorySelection()}
      {view === 'quiz' && renderQuiz()}
      {view === 'result' && renderResult()}
      {view === 'ranking' && (
        <Ranking
          initialMode={rankingFilter.mode}
          initialCategoryId={rankingFilter.categoryId}
          initialSubcategoryId={rankingFilter.subcategoryId}
          onBack={() => setView('categorySelection')}
          quizData={quizData}
        />
      )}
    </div>
  );
}
