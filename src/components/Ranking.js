import React, { useState, useEffect } from 'react';
import { database } from '../firebase';
import { ref, onValue } from 'firebase/database';

const Ranking = () => {
  const [rankings, setRankings] = useState({
    "歴史・人文": {
      "日本史": [],
      "世界史": [],
      "歴史・人文王": []
    },
    "数学・科学": {
      "数学": [],
      "科学": [],
      "数学・科学王": []
    },
    "クイズ王": []
  });
  const [selectedMain, setSelectedMain] = useState("歴史・人文");
  const [selectedSub, setSelectedSub] = useState("日本史");
  const [showKing, setShowKing] = useState("");

  useEffect(() => {
    const scoresRef = ref(database, 'scores');
    const unsubscribe = onValue(scoresRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      // データをカテゴリごとに整理
      const organizedData = {
        "歴史・人文": {
          "日本史": [],
          "世界史": [],
          "歴史・人文王": []
        },
        "数学・科学": {
          "数学": [],
          "科学": [],
          "数学・科学王": []
        },
        "クイズ王": []
      };

      // データを配列に変換
      const scoresArray = Object.values(data);

      scoresArray.forEach(record => {
        const timestamp = new Date(record.timestamp).toLocaleString('ja-JP');
        const rankingEntry = {
          name: record.name,
          score: record.score,
          timestamp: timestamp
        };

        if (record.category === "history_literature") {
          if (record.subcategory === "japanese_history") {
            organizedData["歴史・人文"]["日本史"].push(rankingEntry);
          } else if (record.subcategory === "world_history") {
            organizedData["歴史・人文"]["世界史"].push(rankingEntry);
          }
          // カテゴリ王の判定
          if (record.score >= 18) {
            organizedData["歴史・人文"]["歴史・人文王"].push(rankingEntry);
          }
        } else if (record.category === "math_science") {
          if (record.subcategory === "mathematics") {
            organizedData["数学・科学"]["数学"].push(rankingEntry);
          } else if (record.subcategory === "science") {
            organizedData["数学・科学"]["科学"].push(rankingEntry);
          }
          // カテゴリ王の判定
          if (record.score >= 18) {
            organizedData["数学・科学"]["数学・科学王"].push(rankingEntry);
          }
        }

        // クイズ王の判定（30問中25問以上正解）
        if (record.totalQuestions === 30 && record.score >= 25) {
          organizedData["クイズ王"].push(rankingEntry);
        }
      });

      // 各カテゴリのスコアを降順でソート
      Object.keys(organizedData).forEach(mainCat => {
        if (mainCat === "クイズ王") {
          organizedData[mainCat].sort((a, b) => b.score - a.score);
        } else {
          Object.keys(organizedData[mainCat]).forEach(subCat => {
            organizedData[mainCat][subCat].sort((a, b) => b.score - a.score);
          });
        }
      });

      setRankings(organizedData);
    });

    // クリーンアップ関数
    return () => unsubscribe();
  }, []);

  // 満点の判定
  let maxScore = 10;
  if (showKing === "クイズ王") {
    maxScore = 30;
  } else if (selectedSub === `${selectedMain}王`) {
    maxScore = 20;
  }

  // メインカテゴリ切り替え時にサブカテゴリもリセット
  const handleMainTab = (cat) => {
    setSelectedMain(cat);
    setSelectedSub(Object.keys(rankings[cat])[0]);
    setShowKing("");
  };

  // サブカテゴリタブリスト（王を一番左に）
  const subTabs = [
    `${selectedMain}王`,
    ...Object.keys(rankings[selectedMain]).filter(sub => sub !== `${selectedMain}王`)
  ];

  // タブのスタイル（黒統一）
  const tabStyle = {
    color: 'black',
    borderColor: 'black',
    background: 'white',
    fontWeight: 'bold'
  };
  const activeTabStyle = {
    ...tabStyle,
    background: 'black',
    color: 'white',
    borderColor: 'black'
  };

  // ランキング項目のスタイル
  const itemStyle = {
    color: 'black',
    borderColor: 'black',
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    width: '100%',
    padding: '0.7rem 0',
    fontSize: '1.1rem',
    borderRadius: '8px',
    margin: '0.3rem 0',
    boxSizing: 'border-box',
  };
  const colStyle = {
    flex: 1,
    textAlign: 'center',
    minWidth: 0
  };

  // メダルアイコン
  const renderMedal = (index) => {
    if (index === 0) return <span style={{ fontSize: '1.5em', marginRight: '0.2em' }}>🥇</span>;
    if (index === 1) return <span style={{ fontSize: '1.5em', marginRight: '0.2em' }}>🥈</span>;
    if (index === 2) return <span style={{ fontSize: '1.5em', marginRight: '0.2em' }}>🥉</span>;
    return null;
  };

  return (
    <div className="ranking-section" style={{ color: 'black' }}>
      <h2>ランキング</h2>
      <div className="ranking-tabs">
        <button
          className={`ranking-tab${showKing === "クイズ王" ? ' active' : ''}`}
          style={showKing === "クイズ王" ? activeTabStyle : tabStyle}
          onClick={() => setShowKing("クイズ王")}
        >
          クイズ王
        </button>
        {Object.keys(rankings).filter(cat => cat !== "クイズ王").map(cat => (
          <button
            key={cat}
            className={`ranking-tab${selectedMain === cat && showKing !== "クイズ王" ? ' active' : ''}`}
            style={selectedMain === cat && showKing !== "クイズ王" ? activeTabStyle : tabStyle}
            onClick={() => handleMainTab(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="ranking-tabs">
        {showKing !== "クイズ王" && subTabs.map(sub => (
          <button
            key={sub}
            className={`ranking-tab${selectedSub === sub ? ' active' : ''}`}
            style={selectedSub === sub ? activeTabStyle : tabStyle}
            onClick={() => setSelectedSub(sub)}
          >
            {sub}
          </button>
        ))}
      </div>
      <div style={{ color: 'black', fontWeight: 'bold', margin: '1rem 0' }}>
        満点：{maxScore}点
      </div>
      <div className="ranking-list">
        <div style={{ ...itemStyle, fontWeight: 'bold', background: '#eee' }}>
          <span style={colStyle}>順位</span>
          <span style={colStyle}>名前</span>
          <span style={colStyle}>スコア</span>
          <span style={colStyle}>日時</span>
        </div>
        {showKing === "クイズ王"
          ? rankings["クイズ王"].map((ranking, index) => (
              <div key={index} className="ranking-item" style={itemStyle}>
                <span style={colStyle} className="rank-number">
                  {renderMedal(index)}
                  {index < 3 ? '' : `#${index + 1}`}
                </span>
                <span style={colStyle} className="player-name">{ranking.name}</span>
                <span style={colStyle} className="player-score">{ranking.score}点</span>
                <span style={colStyle} className="player-timestamp">{ranking.timestamp}</span>
              </div>
            ))
          : rankings[selectedMain][selectedSub].map((ranking, index) => (
              <div key={index} className="ranking-item" style={itemStyle}>
                <span style={colStyle} className="rank-number">
                  {renderMedal(index)}
                  {index < 3 ? '' : `#${index + 1}`}
                </span>
                <span style={colStyle} className="player-name">{ranking.name}</span>
                <span style={colStyle} className="player-score">{ranking.score}点</span>
                <span style={colStyle} className="player-timestamp">{ranking.timestamp}</span>
              </div>
            ))}
      </div>
    </div>
  );
};

export default Ranking; 