import React, { useState } from 'react';
import './styles.css';

function QuizApp() {
  const [view, setView] = useState('categorySelection');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // サンプルカテゴリー
  const categories = {
    history: { name: "歴史・人文" },
    math: { name: "数学・科学" },
    art: { name: "芸術・サブカルチャー" },
    sports: { name: "スポーツ" },
    nature: { name: "生物" },
    vehicle: { name: "乗り物・趣味" }
  };

  // カテゴリー選択画面
  const renderCategorySelection = () => (
    <div className="app">
      <div className="quiz-container">
        <div className="title-section">
          <h1>バルバロッサクイズ！</h1>
        </div>
        <div className="category-grid">
          {Object.entries(categories).map(([key, category]) => (
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
            onClick={() => setView('quizKing')}
          >
            チャレンジ開始
          </button>
        </div>
      </div>
    </div>
  );

  // サブカテゴリー選択画面
  const renderSubcategorySelection = () => (
    <div className="app">
      <div className="quiz-container">
        <div className="title-section">
          <h1>バルバロッサクイズ！</h1>
        </div>
        <h2 className="selected-category-name">
          {categories[selectedCategory]?.name || 'カテゴリー'}
        </h2>
        <div className="category-selection">
          <h2>サブカテゴリーを選択してください</h2>
          <p>現在このモードは準備中です。</p>
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

  // クイズ王モード画面
  const renderQuizKing = () => (
    <div className="app">
      <div className="quiz-container">
        <div className="title-section">
          <h1>クイズ王チャレンジ</h1>
        </div>
        <div className="score-section">
          <h2>準備中です！</h2>
          <p>クイズモードは現在開発中です。もうしばらくお待ちください。</p>
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

  // 表示するビューの選択
  switch (view) {
    case 'subcategorySelection':
      return renderSubcategorySelection();
    case 'quizKing':
      return renderQuizKing();
    case 'categorySelection':
    default:
      return renderCategorySelection();
  }
}

export default QuizApp;
