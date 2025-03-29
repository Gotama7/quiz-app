# クイズアプリケーション

多様なジャンルのクイズを楽しめるWebアプリケーションです。

## 機能

- 複数のジャンルに分かれたクイズ
- サブカテゴリー別の出題
- 正答率の表示と記録
- クイズ王チャレンジ（全ジャンルから30問）
- ランキング機能

## 技術スタック

- フロントエンド: React.js
- バックエンド: Node.js + Express
- データベース: MySQL

## 開発環境のセットアップ

1. リポジトリのクローン
```bash
git clone https://github.com/あなたのユーザー名/quiz-app.git
cd quiz-app
```

2. 依存パッケージのインストール
```bash
# フロントエンド
npm install

# バックエンド
cd server
npm install
```

3. 環境変数の設定
- `.env`ファイルを作成し、必要な環境変数を設定

4. 開発サーバーの起動
```bash
# フロントエンド
npm start

# バックエンド
cd server
npm run dev
```

## デプロイ

- フロントエンド: Vercel
- バックエンド: Railway
- データベース: Railway MySQL

## ライセンス

MIT 