interface HeaderProps {
  date: string | null;
  articleCount: number;
}

export function Header({ date, articleCount }: HeaderProps) {
  const formattedDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      })
    : "";

  return (
    <header className="sticky top-0 z-10 bg-[var(--color-bg)]/95 backdrop-blur-sm border-b border-[var(--color-border)] px-4 py-3">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-lg font-bold tracking-tight">IT News Daily</h1>
        {date && (
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            {formattedDate} - {articleCount}件
          </p>
        )}
      </div>
    </header>
  );
}
