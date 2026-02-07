import type { NewsItem } from "../types/news";
import { NewsCard } from "./NewsCard";

interface NewsListProps {
  items: NewsItem[];
}

export function NewsList({ items }: NewsListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center text-[var(--color-text-secondary)] py-12">
        該当するニュースがありません
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 pb-8">
      {items.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );
}
