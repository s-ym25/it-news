import { useState, useMemo } from "react";
import { useNews } from "./hooks/useNews";
import { Header } from "./components/Header";
import { CategoryFilter } from "./components/CategoryFilter";
import { NewsList } from "./components/NewsList";

function App() {
  const { news, loading, error } = useNews();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    if (!news) return [];
    return [...new Set(news.items.map((item) => item.category))];
  }, [news]);

  const filteredItems = useMemo(() => {
    if (!news) return [];
    if (!selectedCategory) return news.items;
    return news.items.filter((item) => item.category === selectedCategory);
  }, [news, selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--color-text-secondary)]">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-[var(--color-text-secondary)] mb-2">
            ニュースの読み込みに失敗しました
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        date={news?.date ?? null}
        articleCount={filteredItems.length}
      />
      <CategoryFilter
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />
      <NewsList items={filteredItems} />
    </div>
  );
}

export default App;
