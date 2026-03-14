# 日本小説クローラー (Japanese Novel Crawler)

一个现代化的日本小说阅读网站，使用 React + TypeScript + Vite 构建。

## 功能特性

- 📚 人気小説ランキング (Popular Novels Ranking)
- 🔍 タイトル・作者で検索 (Search by Title/Author)
- 📖 小説詳細ページ (Novel Detail Page)
- 📄 章ごとの読書ページ (Chapter Reading Page)
- 🎨 レスポンシブデザイン (Responsive Design)
- 🔤 文字サイズ調整 (Font Size Adjustment)
- ⏭️ 前後の章への移動 (Previous/Next Chapter Navigation)

## 技術スタック

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React (Icons)
- Axios

## インストールと実行

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

### 3. ビルド

```bash
npm run build
```

### 4. プレビュー

```bash
npm run preview
```

## プロジェクト構造

```
novel/
├── src/
│   ├── components/
│   │   ├── Header.tsx          # ヘッダーコンポーネント
│   │   └── NovelCard.tsx       # 小説カードコンポーネント
│   ├── pages/
│   │   ├── Home.tsx            # ホームページ
│   │   ├── Search.tsx          # 検索ページ
│   │   ├── NovelDetail.tsx     # 小説詳細ページ
│   │   └── Reader.tsx          # 読書ページ
│   ├── api.ts                  # API クライアント (モックデータ)
│   ├── types.ts                # TypeScript 型定義
│   ├── App.tsx                 # メインアプリコンポーネント
│   ├── main.tsx                # エントリーポイント
│   └── index.css               # グローバルスタイル
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## 注意事項

現在、このアプリケーションはモックデータを使用しています。実際の日本小説サイトからデータを取得するには、以下のような方法があります：

1. バックエンドAPIを作成し、そこからデータを取得する
2. 既存の日本小説APIサービスを利用する
3. ウェブスクレイピングツールを使用する（対象サイトの利用規約に注意）

## ライセンス

MIT
