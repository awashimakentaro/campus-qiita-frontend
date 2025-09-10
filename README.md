# Campus Qiita Frontend

大学内限定のナレッジ共有サービス「Campus Qiita」のフロントエンドです。  
Next.js (App Router) + TypeScript + Tailwind CSS で構築されています。  
ホスティングは **Vercel** を利用しています。


---
## 🎯 このアプリを作った理由

2025年8月に1ヶ月間のエンジニアインターンを経験しました。  
そこで初めてバックエンド開発に携わり、Git の運用方法やチーム開発の流れを学びました。  

学んだことを最大限吸収し、自分の力で実践するために **初めてのフルスタックアプリ制作** に挑戦しました。  
このアプリは **約10日間で開発** したもので、現在はシンプルな掲示板アプリですが、将来的には以下のように発展させたいと考えています。  

- 各大学ごとに利用できるナレッジ共有サービス  
- テスト対策やノートを知り合いを超えて共有できる仕組み  
- 「今、自分が欲しい」と思う学習支援サービスの雛形  

また、この開発を通じて以下を初めて実践しました：  

- GitHub Issue や Pull Request を用いた開発フロー  
- ブランチを切っての作業管理  
- バックエンドの ER 図設計  
- Docker, Railway, Vercel, Neon などのクラウド環境を活用したデプロイ  

単なる技術習得にとどまらず、**実際の業務に近い流れを意識して開発**した、学習と挑戦のプロジェクトです。
---

## 🔧 使用技術

- [Next.js 14 (App Router)](https://nextjs.org/)
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) コンポーネント
- Firebase Authentication（Google Login）
- API 通信: 独自 `apiClient` ラッパー
- デプロイ: [Vercel](https://vercel.com/)

---

## 📂 ディレクトリ構成（主要）
```
campus-qiita-frontend/
├── app/              # Next.js App Router ページ群
│   ├── articles/     # 記事作成・編集・閲覧ページ
│   └── layout.tsx    # レイアウト設定
├── components/       # UI コンポーネント
├── lib/              # apiClient, apiHooks, auth などロジック
├── public/           # 静的ファイル
├── styles/           # Tailwind 設定
└── …
```
---

## 🚀 セットアップ方法

### 1. リポジトリをクローン

```bash
git clone https://github.com/<your-username>/campus-qiita-frontend.git
cd campus-qiita-frontend
```
### 2. 依存関係をインストール
```bash
npm install
```
### 3. 環境変数を設定
```
#バックエンド API の URL（Railway でデプロイした FastAPI）
NEXT_PUBLIC_API_BASE=https://campus-qiita-backend-production.up.railway.app

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=xxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxxxxx
```
### 4. ローカル開発サーバー起動
```
npm run dev
```

## 🌐 デプロイ
	•	Vercel に GitHub リポジトリを接続して自動デプロイ
	•	Production Branch: deploy or main（必要に応じて変更）
	•	Vercel の Environment Variables に .env.local の内容を設定

## 🔑 機能概要
	•	Google アカウントでログイン（Firebase Authentication）
	•	記事の作成 / 編集 / 削除 /個別の下書き保存
	•	タグの作成 / 絞り込み検索 /　キーワード検索
	•	いいね / コメント機能
	•	管理者専用 API（ユーザー削除など）

## 📝 メモ
	•	CORS: バックエンド側の CORS_ALLOW_ORIGINS に Vercel のドメインを必ず追加すること。
	•	Cookie 認証: API 通信時に credentials: include を必ず設定済み。
	•	Preview ドメインでも API にアクセスできるよう、Railway 側に追加する必要あり。

## 個人的なメモ
```
#マージした後強制的にmainの状態にする
git fetch origin main 
git reset --hard origin/main
'''
