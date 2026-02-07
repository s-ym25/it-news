/**
 * NewsList.tsx — ニュース一覧コンポーネント
 *
 * 記事カード（NewsCard）を縦に並べて一覧表示する。
 * 記事が0件の場合は「該当するニュースがありません」と表示。
 */

import type { NewsItem } from "../types/news";
import { NewsCard } from "./NewsCard";

/**
 * NewsListProps — このコンポーネントが受け取るProps
 */
interface NewsListProps {
  items: NewsItem[]; // 表示する記事データの配列（フィルター済み）
}

/**
 * NewsList — ニュースカードを一覧表示するコンポーネント
 */
export function NewsList({ items }: NewsListProps) {
  // 記事が0件の場合の表示
  if (items.length === 0) {
    return (
      <div className="text-center text-[var(--color-text-secondary)] py-12">
        該当するニュースがありません
      </div>
    );
  }

  // 記事一覧を表示
  // flex flex-col: 縦並び、gap-3: 各カード間に余白
  // px-4: 左右余白、pb-8: 下部余白（iPhoneのホームバーと被らないように）
  return (
    <div className="flex flex-col gap-3 px-4 pb-8">
      {/* items配列をループして、各記事に対してNewsCardコンポーネントを描画 */}
      {/* key: Reactが各要素を識別するための一意な値（item.idを使用） */}
      {items.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );
}
