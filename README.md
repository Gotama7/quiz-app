# バルバロッサクイズアプリ

React + Firebaseを使用したクイズアプリケーションです。

## 機能

- カテゴリー別クイズ（10問）
- カテゴリー王チャレンジ（20問）
- クイズ王チャレンジ（30問）
- Firebase Firestoreを使用したスコア保存
- モード別・カテゴリーフィルター付きランキング表示
- 匿名認証によるセキュアなデータアクセス

## 技術スタック

- React 18
- Firebase v9 (modular SDK)
- Firestore (データベース)
- Firebase Auth (匿名認証)

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Firebase設定

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
2. Firestore Databaseを有効化
3. Authenticationで匿名認証を有効化
4. `src/firebase.ts`の設定値を更新（TODOコメント部分）

### 3. Firestoreセキュリティルール

`firestore.rules`の内容をFirebase ConsoleのFirestore > ルールにコピー：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scores/{doc} {
      allow read: if true;                 // ランキングは公開
      allow write: if request.auth != null; // 匿名認証済みのみ書き込み許可
    }
  }
}
```

### 4. アプリの起動

```bash
npm start
```

## データ構造

### Firestore コレクション: `scores`

```javascript
{
  name: "プレイヤー名",
  score: 点数,
  mode: モード（10/20/30）,
  category: "カテゴリー名",
  createdAt: サーバータイムスタンプ,
  id: "ドキュメントID"
}
```

## 主な変更点

- GAS経由のスコア保存を廃止
- Firebase Firestoreを使用したフロントエンドのみの実装
- 匿名認証によるセキュアなアクセス
- カテゴリーフィルター付きランキング表示
- CORS問題の解決
- TypeScript対応のヘルパー関数

## ファイル構成

- `src/firebase.ts` - Firebase初期化設定
- `src/lib/score.ts` - スコア保存・ランキング取得のヘルパー関数
- `src/QuizApp.js` - メインのクイズアプリケーション
- `firestore.rules` - Firestoreセキュリティルール

## 注意事項

- Firebaseプロジェクトの設定が正しく行われていることを確認してください
- `src/firebase.ts`の設定値を実際のFirebaseプロジェクトの値に置き換えてください
- Firestoreのセキュリティルールが適切に設定されていることを確認してください
- 匿名認証が有効になっていることを確認してください 