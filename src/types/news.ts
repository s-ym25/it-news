/**
 * news.ts — 型定義ファイル
 *
 * TypeScriptの「型」を定義するファイル。
 * 型とは「データの形」を事前に決めておく仕組み。
 * 例えば「NewsItemにはtitleというstring型のプロパティがある」と宣言しておくと、
 * typoや型ミスをコンパイル時に検出できる。
 *
 * このファイルはコードとしては何も実行しない。
 * 開発時の「設計図」のような役割。
 */

/**
 * NewsItem — 1つのニュース記事を表す型
 *
 * scripts/scrape.ts で生成され、news.json に保存される。
 * フロントエンド（React）側でも同じ型を使ってデータを扱う。
 */
export interface NewsItem {
  id: string; // 記事のユニークID（例: "a3x7kf"）
  title: string; // 記事タイトル（例: "TikTokのアルゴリズムが..."）
  url: string; // 元記事のURL（タップするとここに飛ぶ）
  source: string; // ニュースソース名（例: "Gigazine", "GIZMODO Japan"）
  category: string; // カテゴリ（例: "IT", "プログラミング", "ガジェット"）
  summary: string; // AI生成の要約文（空の場合もある）
  image: string | null; // サムネイル画像URL（RSSフィードから取得。ない場合はnull）
  publishedAt: string; // 記事の公開日時（ISO 8601形式の文字列）
  scrapedAt: string; // スクレイピングした日時
}

/**
 * DailyNews — 1日分のニュースデータ全体を表す型
 *
 * news.json のルートオブジェクトの構造。
 * { date: "2026-02-07", items: [...], generatedAt: "..." }
 */
export interface DailyNews {
  date: string; // 日付（例: "2026-02-07"）
  items: NewsItem[]; // その日のニュース記事の配列
  generatedAt: string; // このデータが生成された日時
}
