/**
 * SearchBox.tsx — キーワード検索の入力欄
 *
 * 入力された文字は自分では持たず、親（App.tsx）から value を受け取り、
 * 変更を onChange で親に伝えるだけの「制御コンポーネント」。
 */

interface SearchBoxProps {
  value: string; 
  onChange: (value: string) => void; // ボタンが押された時に呼ばれる関数
}

export function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <div className="px-4 pb-3">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="キーワードで検索"
          className="w-full px-3 py-2 pr-8 rounded-lg text-sm bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]"
        />
        {/* 入力があるときだけ、クリアボタン（×）を出す */}
        {value !== "" && (
          <button
            onClick={() => onChange("")}
            aria-label="検索をクリア"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-xs bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}