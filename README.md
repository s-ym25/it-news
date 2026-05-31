# IT News Daily 📰

ITニュースを毎朝自動で収集し、**Claude（Anthropic API）で要約**して Web サイトに表示・**LINE に通知**するニュースアグリゲーターです。

🔗 **デモサイト**: https://it-news-eight.vercel.app

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Claude](https://img.shields.io/badge/Anthropic_Claude-D97757?logo=anthropic&logoColor=white)

---

## 📌 概要

複数のITニュースサイトの RSS を毎朝チェックするのは手間がかかります。このアプリは、その作業を **GitHub Actions で完全自動化**しました。

毎朝 7 時（JST）に最新記事を収集し、AI が各記事を 1〜2 文に要約。結果は Web サイトで一覧でき、「準備できたよ」という通知が LINE に届きます。

## ✨ 主な機能

- 🗞 **複数ソースの自動収集** — 6 つのニュースサイトの RSS から、過去 24 時間の記事を抽出
- 🤖 **AI 要約** — Claude（Sonnet 4.5）が各記事を日本語で短く要約。10 件ずつバッチ処理で API コールを節約
- 🏷 **カテゴリフィルタ** — IT / プログラミング / ガジェットで絞り込み
- 📱 **LINE 通知** — 収集完了を LINE Messaging API で Push 通知
- ⏰ **完全自動化** — GitHub Actions が毎朝 7:00 (JST) に定期実行（手動実行も可）

## 🏗 アーキテクチャ

```
GitHub Actions（毎朝 7:00 JST）
      │
      ▼
  scrape.ts    6サイトの RSS を取得・24時間以内の記事を抽出
      │
      ▼
  summarize.ts Claude API で各記事を要約（10件ずつバッチ）
      │
      ▼
  JSON 出力    public/data/news.json に書き出し
      │           │
      ▼           ▼
  notify.ts    React サイト（Vercel）が JSON を読んで表示
  LINE 通知
```

## 🛠 技術スタック

| 領域 | 使用技術 |
|------|----------|
| フロントエンド | React 19, TypeScript, Vite, Tailwind CSS |
| データ収集 | Node.js, rss-parser, tsx |
| AI 要約 | Anthropic Claude API (`@anthropic-ai/sdk`) |
| 通知 | LINE Messaging API |
| 自動化 / ホスティング | GitHub Actions, Vercel |

## 📰 収集対象（RSS ソース）

Gigazine / ITmedia NEWS / Publickey / GIZMODO Japan / Zenn / はてなブックマーク テクノロジー

## 🚀 ローカルでの実行

```bash
# 依存関係をインストール
npm install

# 開発サーバを起動（Web サイトを表示）
npm run dev

# ニュース収集スクリプトを手動実行
npm run scrape
```

### 環境変数

収集スクリプトを動かすには以下を設定します（未設定でも該当処理をスキップして動作します）。

| 変数名 | 用途 |
|--------|------|
| `ANTHROPIC_API_KEY` | Claude API による要約 |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE 通知 |
| `LINE_USER_ID` | LINE 通知の送信先 |
| `SITE_URL` | 通知に含めるサイト URL |

> 本番では GitHub Secrets に登録し、GitHub Actions から参照しています。`.env` は Git 管理対象外です。

## 📁 ディレクトリ構成

```
scripts/        ニュース収集パイプライン（scrape → summarize → notify）
  ├ main.ts      オーケストレーション（全体の司令塔）
  ├ scrape.ts    RSS 取得
  ├ summarize.ts AI 要約
  └ notify.ts    LINE 通知
src/            React フロントエンド
  ├ components/  UI コンポーネント（NewsCard, NewsList, Header ほか）
  ├ hooks/       useNews（データ取得）
  └ types/       型定義
public/data/    収集済みニュースの JSON（日付別）
.github/workflows/ scrape.yml（定期実行）
```

## 💡 工夫したポイント

- **API コストの最適化** — 記事を 10 件ずつまとめて要約リクエストし、API 呼び出し回数を削減
- **グレースフルデグレード** — API キー未設定でも要約・通知をスキップして処理を継続するため、ローカル開発が容易
- **静的データ配信** — 収集結果を JSON として書き出し、フロントは静的サイトとして配信。サーバ不要で低コスト運用
