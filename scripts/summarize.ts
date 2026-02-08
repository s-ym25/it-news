/**
 * summarize.ts — AI要約スクリプト
 *
 * Claude API（Anthropic社のAI）を使って、各ニュース記事の
 * タイトルから1〜2文の日本語要約を生成する。
 *
 * API呼び出し回数を減らすため、10記事ずつまとめて（バッチ処理で）要約する。
 * ANTHROPIC_API_KEY が未設定の場合は要約をスキップする。
 */

// Anthropic社のClaude API クライアントライブラリ
import Anthropic from "@anthropic-ai/sdk";
import type { NewsItem } from "../src/types/news.js";

// 1回のAPI呼び出しで処理する記事数（10件ずつ）
const BATCH_SIZE = 10;

/**
 * summarizeNews — ニュース記事にAI要約を追加する
 *
 * @param items - 要約前の記事配列
 * @returns 要約が追加された記事配列
 */
export async function summarizeNews(items: NewsItem[]): Promise<NewsItem[]> {
  // 環境変数からAPIキーを取得
  // process.env = 環境変数にアクセスするオブジェクト（GitHub Secretsで設定した値が入る）
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // APIキーがなければ要約をスキップ（ローカルテスト時はこれが発動する）
    console.warn("ANTHROPIC_API_KEY not set. Skipping summarization.");
    return items; // 要約なしでそのまま返す
  }

  // Claude APIクライアントを初期化
  const client = new Anthropic({ apiKey });
  // 要約済みの記事を溜めていく配列
  const summarized: NewsItem[] = [];

  // BATCH_SIZE（10件）ずつ処理するループ
  // 例: 30件なら → 0〜9, 10〜19, 20〜29 の3回に分けて処理
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    // 現在のバッチ（10件分）を切り出す
    const batch = items.slice(i, i + BATCH_SIZE);
    console.log(
      `Summarizing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(items.length / BATCH_SIZE)}...`
    );

    // Claude APIに送る記事リストの文字列を作成
    // 例: "[1] タイトル: xxx\nソース: Gigazine\nURL: https://..."
    const articleList = batch
      .map(
        (item, idx) =>
          `[${idx + 1}] タイトル: ${item.title}\nソース: ${item.source}\nURL: ${item.url}`
      )
      .join("\n\n"); // 各記事を空行で区切る

    try {
      // Claude APIを呼び出して要約を生成
      const response = await client.messages.create({
        model: "claude-sonnet-4-5-20250929", // 使用するAIモデル
        max_tokens: 4096, // 最大出力トークン数（AIの返答の長さ上限）
        messages: [
          {
            role: "user", // ユーザーからのメッセージとして送る
            content: `以下のニュース記事について、それぞれ3〜5文の日本語要約を生成してください。
タイトルから内容を推測して、背景や影響も含めて詳しく要約してください。

フォーマット:
[番号] 要約文

${articleList}`,
          },
        ],
      });

      // AIの返答からテキスト部分を取得
      // response.content は配列で、最初の要素のtype が "text" ならテキストが入っている
      const text =
        response.content[0].type === "text" ? response.content[0].text : "";

      // 返答テキストをパース（解析）して要約の配列に変換
      const summaries = parseSummaries(text, batch.length);

      // 各記事に要約を追加
      for (let j = 0; j < batch.length; j++) {
        summarized.push({
          ...batch[j], // スプレッド構文: 元の記事データをコピー
          summary: summaries[j] || batch[j].title, // 要約がなければタイトルをそのまま使う
        });
      }
    } catch (error) {
      // API呼び出しが失敗した場合（レート制限、ネットワークエラー等）
      console.error("Summarization failed for batch:", error);
      // 要約なしでそのまま追加
      summarized.push(...batch);
    }

    // 次のバッチがある場合、1秒待つ（APIのレート制限対策）
    if (i + BATCH_SIZE < items.length) {
      await sleep(1000);
    }
  }

  return summarized;
}

/**
 * parseSummaries — AIの返答テキストから要約を抽出する
 *
 * AIは "[1] 要約文..." という形式で返答するので、
 * 正規表現で番号と要約文を分離して配列にする。
 *
 * @param text - AIの返答テキスト全体
 * @param expectedCount - 期待する要約の数
 * @returns 要約文の配列
 */
function parseSummaries(text: string, expectedCount: number): string[] {
  const summaries: string[] = [];
  const lines = text.split("\n"); // 改行で分割

  for (const line of lines) {
    // 正規表現: "[数字] テキスト" のパターンにマッチするか判定
    // ^ = 行頭、\[ = 角括弧、(\d+) = 1個以上の数字（キャプチャ）、\s* = 空白、(.+) = テキスト
    const match = line.match(/^\[(\d+)\]\s*(.+)/);
    if (match) {
      summaries.push(match[2].trim()); // match[2]が要約テキスト部分。trim()で前後の空白を除去
    }
  }

  // 要約の数が足りない場合、空文字で埋める
  while (summaries.length < expectedCount) {
    summaries.push("");
  }

  return summaries;
}

/**
 * generateDailySummary — 全記事の要約をさらにまとめた「今日のまとめ」を生成する
 *
 * 各記事のタイトルと要約をClaude APIに渡し、
 * その日のニュース全体を3〜5文で俯瞰するテキストを生成する。
 *
 * @param items - 要約済みの記事配列
 * @returns 「今日のまとめ」テキスト（APIキー未設定時は空文字）
 */
export async function generateDailySummary(
  items: NewsItem[]
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return "";
  }

  const client = new Anthropic({ apiKey });

  // 全記事のタイトル＋要約を一覧にまとめる
  const articleList = items
    .map(
      (item, idx) =>
        `[${idx + 1}] ${item.title}${item.summary ? `\n要約: ${item.summary}` : ""}`
    )
    .join("\n\n");

  try {
    console.log("Generating daily summary...");
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `以下は今日のITニュース一覧です。全体を俯瞰して「今日のまとめ」を3〜5文の日本語で書いてください。
主要なトピックやトレンドを簡潔にまとめてください。箇条書きではなく、自然な文章で書いてください。

${articleList}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return text.trim();
  } catch (error) {
    console.error("Daily summary generation failed:", error);
    return "";
  }
}

/**
 * sleep — 指定ミリ秒だけ処理を一時停止する
 *
 * Promise + setTimeout を使って「待つ」を実現する。
 * await sleep(1000) で1秒待てる。
 *
 * @param ms - 待機時間（ミリ秒）
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
