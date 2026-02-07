import type { NewsItem } from "../types/news";

interface NewsCardProps {
  item: NewsItem;
}

const SOURCE_COLORS: Record<string, string> = {
  Gigazine: "#e85d04",
  "ITmedia NEWS": "#0077b6",
  Publickey: "#2d6a4f",
  "GIZMODO Japan": "#7b2cbf",
  Zenn: "#3584e4",
  "はてなブックマーク テクノロジー": "#e63946",
};

export function NewsCard({ item }: NewsCardProps) {
  const timeAgo = getTimeAgo(item.publishedAt);
  const sourceColor = SOURCE_COLORS[item.source] || "#64748b";

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-[var(--color-surface)] rounded-xl p-4 hover:bg-[var(--color-surface-hover)] transition-colors active:scale-[0.98] transform"
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: sourceColor + "22", color: sourceColor }}
        >
          {item.source}
        </span>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {timeAgo}
        </span>
      </div>
      <h3 className="text-sm font-semibold leading-snug mb-2">{item.title}</h3>
      {item.summary && (
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
          {item.summary}
        </p>
      )}
    </a>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "1時間以内";
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return `${days}日前`;
}
