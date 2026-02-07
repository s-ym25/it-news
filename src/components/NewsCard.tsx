/**
 * NewsCard.tsx — ニュースカードコンポーネント
 *
 * 1つのニュース記事を「カード」形式で表示する。
 * - ソース名（色付きバッジ）
 * - 公開からの経過時間（例: "3時間前"）
 * - 記事タイトル
 * - AI要約文（あれば）
 *
 * タップすると元記事のURLが新しいタブで開く。
 */

import type { NewsItem } from "../types/news";

/**
 * NewsCardProps — このコンポーネントが受け取るProps
 */
interface NewsCardProps {
  item: NewsItem; // 表示する記事データ
}

/**
 * SOURCE_COLORS — ニュースソースごとの色定義
 *
 * Record<string, string> = 「文字列のキーと文字列の値」を持つオブジェクトの型
 * バッジの色をソース名で振り分ける
 */
const SOURCE_COLORS: Record<string, string> = {
  Gigazine: "#e85d04", // オレンジ
  "ITmedia NEWS": "#0077b6", // 青
  Publickey: "#2d6a4f", // 緑
  "GIZMODO Japan": "#7b2cbf", // 紫
  Zenn: "#3584e4", // 水色
  "はてなブックマーク テクノロジー": "#e63946", // 赤
};

/**
 * NewsCard — 1つのニュース記事を表示するコンポーネント
 */
export function NewsCard({ item }: NewsCardProps) {
  // 公開日時から「X時間前」「X日前」の文字列を計算
  const timeAgo = getTimeAgo(item.publishedAt);
  // ソース名に対応する色を取得（未定義のソースはグレー）
  const sourceColor = SOURCE_COLORS[item.source] || "#64748b";

  return (
    // <a>タグ: リンク。タップすると元記事が新しいタブで開く
    // target="_blank": 新しいタブで開く
    // rel="noopener noreferrer": セキュリティ対策（外部サイトからの逆参照を防ぐ）
    // active:scale-[0.98]: タップ時に少し小さくなるアニメーション（押した感）
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-[var(--color-surface)] rounded-xl p-4 hover:bg-[var(--color-surface-hover)] transition-colors active:scale-[0.98] transform"
    >
      {/* ソース名バッジ + 経過時間 */}
      <div className="flex items-center gap-2 mb-2">
        {/* ソース名バッジ（色付き） */}
        {/* style属性で直接CSSを指定（Tailwindではカバーしにくい動的な色を設定） */}
        {/* sourceColor + "22" は色に22%の透明度を追加（背景色を薄くする） */}
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: sourceColor + "22", color: sourceColor }}
        >
          {item.source}
        </span>
        {/* 経過時間（例: "3時間前"） */}
        <span className="text-xs text-[var(--color-text-secondary)]">
          {timeAgo}
        </span>
      </div>
      {/* 記事タイトル */}
      <h3 className="text-sm font-semibold leading-snug mb-2">{item.title}</h3>
      {/* AI要約文（要約がある場合のみ表示） — 全文表示 */}
      {item.summary && (
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          {item.summary}
        </p>
      )}
    </a>
  );
}

/**
 * getTimeAgo — 日付文字列から「X時間前」「X日前」を計算する
 *
 * @param dateStr - ISO 8601形式の日付文字列
 * @returns 経過時間の文字列
 */
function getTimeAgo(dateStr: string): string {
  // 現在時刻との差をミリ秒で計算
  const diff = Date.now() - new Date(dateStr).getTime();
  // ミリ秒 → 時間に変換（1000ms × 60秒 × 60分 = 1時間分のミリ秒）
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "1時間以内";
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}
