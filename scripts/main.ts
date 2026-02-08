/**
 * main.ts — メインスクリプト（オーケストレーション）
 *
 * このファイルが全体の司令塔。以下の順番で処理を実行する：
 * 1. RSSフィードからニュース記事を取得（scrape.ts）
 * 2. Claude APIでAI要約を生成（summarize.ts）
 * 3. JSONファイルに書き出し（Webサイトが読み込むデータ）
 * 4. LINE通知を送信（notify.ts）
 *
 * GitHub Actions が毎朝7時にこのスクリプトを実行する。
 * ローカルでも `npm run scrape` で手動実行できる。
 */

// --- Node.js標準ライブラリのインポート ---
// writeFileSync: ファイルに書き込む関数。mkdirSync: フォルダを作成する関数
import { writeFileSync, mkdirSync } from "node:fs";
// join: パスを結合する関数（例: "public" + "data" → "public/data"）
// dirname: ファイルパスからディレクトリ部分を取得（例: "/a/b/c.ts" → "/a/b"）
import { join, dirname } from "node:path";
// fileURLToPath: ESModuleのURLをファイルパスに変換する
import { fileURLToPath } from "node:url";

// --- 自作モジュールのインポート ---
import { scrapeAll } from "./scrape.js"; // RSS取得関数
import { summarizeNews } from "./summarize.js"; // AI要約関数
import { notifyLine } from "./notify.js"; // LINE通知関数
import type { DailyNews } from "../src/types/news.js"; // 型定義（データの形を定義したもの）

// __dirname: このファイルが置かれているディレクトリのパスを取得
// （ESModuleでは __dirname が使えないので、自分で作る必要がある）
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * メイン処理関数
 * async = 非同期関数（ネットワーク通信など、待ち時間がある処理を含む）
 */
async function main() {
  // 処理開始時刻を記録（最後に「何秒かかったか」を表示するため）
  const startTime = Date.now();
  console.log("=== IT News Daily Scraper ===");
  console.log(`Start: ${new Date().toISOString()}`);

  // ============================
  // ステップ1: RSSフィードから記事を取得
  // ============================
  // scrapeAll() は6つのニュースサイトのRSSを取得し、記事の配列を返す
  const items = await scrapeAll();

  // 記事が0件なら終了（RSSが全てエラーだった場合など）
  if (items.length === 0) {
    console.log("No articles found. Exiting.");
    return;
  }

  // ============================
  // ステップ2: Claude APIで要約を生成
  // ============================
  // 各記事のタイトルからAIが1〜2文の要約を作成する
  // ANTHROPIC_API_KEYが未設定の場合はスキップされる
  const summarized = await summarizeNews(items);

  // ============================
  // ステップ3: JSONファイルに保存
  // ============================
  // 今日の日付を日本時間（JST）で "2026-02-08" のような形式で取得
  // toISOString()はUTCなので、JSTでは9時間ズレる → toLocaleDateStringで日本時間を使う
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });

  // DailyNews型のオブジェクトを作成（Webサイトが読み込むデータ構造）
  const dailyNews: DailyNews = {
    date: today, // 日付
    items: summarized, // 要約済みの記事配列
    generatedAt: new Date().toISOString(), // 生成日時
  };

  // 出力先ディレクトリ: public/data/
  const outputDir = join(__dirname, "..", "public", "data");
  // ディレクトリが存在しない場合は作成する（recursive: trueで親フォルダも一括作成）
  mkdirSync(outputDir, { recursive: true });

  // メインのJSONファイルに書き出し（Webサイトはこのファイルを読み込む）
  const outputPath = join(outputDir, "news.json");
  // JSON.stringify: JavaScriptオブジェクト → JSON文字列に変換
  // 第3引数の2はインデント幅（見やすくするため）
  writeFileSync(outputPath, JSON.stringify(dailyNews, null, 2), "utf-8");
  console.log(`Written ${summarized.length} articles to ${outputPath}`);

  // 日付入りのアーカイブファイルも作成（例: news-2026-02-07.json）
  // 過去のデータを保存しておくため
  const archivePath = join(outputDir, `news-${today}.json`);
  writeFileSync(archivePath, JSON.stringify(dailyNews, null, 2), "utf-8");

  // ============================
  // ステップ4: LINE通知を送信
  // ============================
  // 環境変数 SITE_URL からサイトURLを取得（GitHub Secretsで設定済み）
  const siteUrl = process.env.SITE_URL || "https://your-site.vercel.app";
  // 「本日のニュース X件 が準備できました」というメッセージをLINEに送信
  await notifyLine(summarized.length, siteUrl);

  // 処理時間を計算して表示
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s`);
}

// main関数を実行。エラーが発生したらログに出力してプロセスを異常終了させる
// .catch() はPromise（非同期処理）でエラーが起きた時のエラーハンドリング
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1); // 終了コード1 = エラーで終了（GitHub Actionsがエラーとして検知する）
});
