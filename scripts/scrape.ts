/**
 * scrape.ts — RSSフィード取得スクリプト
 *
 * 6つのニュースサイトのRSSフィードを取得し、
 * 過去24時間以内の記事だけを抽出して返す。
 *
 * RSSとは: ニュースサイトが提供する「最新記事一覧」のXML形式データ。
 * ブラウザでURLを開くと、XMLが表示される。
 */

// rss-parser: RSSフィード（XML形式）をJavaScriptオブジェクトに変換するライブラリ
import Parser from "rss-parser";
// NewsItem型をインポート（各ニュース記事のデータ構造）
import type { NewsItem } from "../src/types/news.js";

// RSSパーサーの初期設定
// customFields: RSS標準にない拡張フィールドを取得する設定
// media:thumbnail や media:content は画像URLを持っていることが多い
const parser = new Parser({
  headers: {
    // User-Agent: Webサーバに「誰がアクセスしているか」を伝えるヘッダー
    // ボットであることを明示している（マナー）
    "User-Agent": "IT-News-Aggregator/1.0",
  },
  timeout: 10000, // タイムアウト: 10秒以内にレスポンスがなければエラーにする
  customFields: {
    item: [
      ["media:thumbnail", "mediaThumbnail"],   // メディアサムネイル
      ["media:content", "mediaContent"],        // メディアコンテンツ
    ],
  },
});

/**
 * FeedSource型: RSSフィードの情報を定義
 * interface = TypeScriptの「型定義」。データの形を事前に決めておく仕組み。
 */
interface FeedSource {
  name: string; // サイト名（例: "Gigazine"）
  url: string; // RSSフィードのURL
  category: string; // カテゴリ（例: "IT", "ガジェット"）
}

/**
 * FEED_SOURCES: 取得対象のニュースサイト一覧
 * ここにサイトを追加/削除すれば、取得元を変更できる。
 */
const FEED_SOURCES: FeedSource[] = [
  {
    name: "Gigazine",
    url: "https://gigazine.net/news/rss_2.0/",
    category: "IT",
  },
  {
    name: "ITmedia NEWS",
    url: "https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml",
    category: "IT",
  },
  {
    name: "Publickey",
    url: "https://www.publickey1.jp/atom.xml",
    category: "プログラミング",
  },
  {
    name: "GIZMODO Japan",
    url: "https://www.gizmodo.jp/index.xml",
    category: "ガジェット",
  },
  {
    name: "Zenn",
    url: "https://zenn.dev/feed",
    category: "プログラミング",
  },
  {
    name: "はてなブックマーク テクノロジー",
    url: "https://b.hatena.ne.jp/hotentry/it.rss",
    category: "IT",
  },
];

/**
 * generateId — 記事ごとのユニークなIDを生成する関数
 *
 * ソース名とタイトルを組み合わせてハッシュ値を計算し、
 * 短い文字列のIDにする。（例: "a3x7kf"）
 *
 * @param source - ニュースソース名（例: "Gigazine"）
 * @param title - 記事タイトル
 * @returns 短いID文字列
 */
function generateId(source: string, title: string): string {
  const str = `${source}-${title}`; // ソース名とタイトルを連結
  let hash = 0;
  // 文字列の各文字のコードを使ってハッシュ値を計算
  // （同じタイトルなら常に同じIDになる = 重複チェックに使える）
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i); // 文字をASCIIコード（数値）に変換
    hash = (hash << 5) - hash + char; // ビットシフト演算でハッシュを計算
    hash |= 0; // 32ビット整数に変換
  }
  // Math.abs: 絶対値（負の数を正にする）
  // .toString(36): 36進数（0-9 + a-z）に変換して短い文字列にする
  return Math.abs(hash).toString(36);
}

/**
 * extractImage — RSSアイテムからサムネイル画像URLを抽出する
 *
 * RSSフィードによって画像の格納場所が異なるため、
 * 複数の場所を優先順位付きで探索する。
 *
 * @param item - rss-parserがパースしたRSSアイテム
 * @returns 画像URLの文字列、見つからなければnull
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractImage(item: any): string | null {
  // 1. enclosure（RSS標準の添付メディア。多くのフィードが対応）
  if (item.enclosure?.url) return item.enclosure.url;

  // 2. media:thumbnail（メディア系RSS拡張）
  //    属性オブジェクト { $: { url: "..." } } の形式で入ることがある
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  if (typeof item.mediaThumbnail === "string") return item.mediaThumbnail;

  // 3. media:content（メディア系RSS拡張）
  if (item.mediaContent?.$?.url) return item.mediaContent.$.url;

  // 4. content内の <img src="..."> をHTMLから正規表現で抽出
  if (item.content) {
    const match = item.content.match(/<img[^>]+src=["']([^"']+)["']/);
    if (match) return match[1];
  }

  // 5. content:encoded 内の <img> タグ（一部のRSSフィードが使用）
  if (item["content:encoded"]) {
    const match = item["content:encoded"].match(/<img[^>]+src=["']([^"']+)["']/);
    if (match) return match[1];
  }

  return null; // どこにも画像がなかった
}

/**
 * fetchFeed — 1つのRSSフィードを取得して記事の配列を返す
 *
 * @param source - 取得するフィードの情報
 * @returns 記事の配列（NewsItem[]）。エラー時は空配列を返す
 */
async function fetchFeed(source: FeedSource): Promise<NewsItem[]> {
  try {
    // RSSフィードをURLから取得してパース（XMLをJavaScriptオブジェクトに変換）
    const feed = await parser.parseURL(source.url);
    const now = new Date();
    // 24時間前の日時を計算（これより古い記事は除外する）
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return (feed.items || []) // フィードの記事一覧（なければ空配列）
      .filter((item) => {
        // 過去24時間以内の記事だけを残す
        const pubDate = item.pubDate ? new Date(item.pubDate) : now;
        return pubDate >= oneDayAgo;
      })
      .slice(0, 10) // 最大10件に制限（1サイトあたり）
      .map((item) => ({
        // 各記事をNewsItem型のオブジェクトに変換
        id: generateId(source.name, item.title || ""),
        title: item.title || "No title", // タイトルがなければ "No title"
        url: item.link || "", // 記事のURL
        source: source.name, // ソース名（例: "Gigazine"）
        category: source.category, // カテゴリ（例: "IT"）
        summary: "", // 要約は後でsummarize.tsが埋める（ここでは空）
        image: extractImage(item), // サムネイル画像URL（なければnull）
        publishedAt: item.pubDate || now.toISOString(), // 公開日時
        scrapedAt: now.toISOString(), // 取得日時（今の時刻）
      }));
  } catch (error) {
    // RSSの取得に失敗した場合（サイトがダウンしている、URLが間違っている等）
    // エラーを表示するが、プログラム全体は止めない（他のサイトの取得は続ける）
    console.error(`Failed to fetch ${source.name}:`, error);
    return []; // 空配列を返す
  }
}

/**
 * scrapeAll — 全てのRSSフィードを取得するメイン関数
 *
 * 6つのサイトを並列（同時）に取得し、結果を1つの配列にまとめて返す。
 * export = 他のファイルからインポートできるようにする
 *
 * @returns 全サイトの記事をまとめた配列（新しい順にソート済み）
 */
export async function scrapeAll(): Promise<NewsItem[]> {
  console.log("Fetching RSS feeds...");

  // Promise.allSettled: 全てのフィード取得を並列実行し、全ての結果を待つ
  // （1つが失敗しても他は止まらない。Promise.allだと1つの失敗で全体が止まる）
  const results = await Promise.allSettled(
    FEED_SOURCES.map((source) => fetchFeed(source))
  );

  // 成功した結果だけを1つの配列にまとめる
  const allItems: NewsItem[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      // "fulfilled" = 成功
      allItems.push(...result.value); // ...（スプレッド構文）で配列を展開して追加
    }
    // "rejected"（失敗）の場合は無視される
  }

  // 記事を新しい順にソート（publishedAtが新しいものが先頭）
  allItems.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  console.log(`Fetched ${allItems.length} articles from ${FEED_SOURCES.length} sources`);
  return allItems;
}
