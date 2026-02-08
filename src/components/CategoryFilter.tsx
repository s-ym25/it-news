/**
 * CategoryFilter.tsx — カテゴリフィルターコンポーネント
 *
 * 「すべて / IT / プログラミング / ガジェット」のボタンを横並びで表示。
 * ボタンを押すと、そのカテゴリのニュースだけが表示される。
 * 横スクロール対応（カテゴリが多い場合も対応できる）。
 */

/**
 * CategoryFilterProps — このコンポーネントが受け取るPropsの型
 */
interface CategoryFilterProps {
  categories: string[]; // カテゴリ名の配列（例: ["IT", "プログラミング", "ガジェット"]）
  selected: string | null; // 現在選択中のカテゴリ（null = 「すべて」）
  onSelect: (category: string | null) => void; // ボタンが押された時に呼ばれる関数
  // (category: string | null) => void は「string|nullを受け取り、何も返さない関数」の型
  showUnreadOnly: boolean;
  onToggleUnread: () => void;
}

/**
 * CategoryFilter — カテゴリ選択ボタンを表示するコンポーネント
 */
export function CategoryFilter({
  categories,
  selected,
  onSelect,
  showUnreadOnly,
  onToggleUnread
}: CategoryFilterProps) {
  return (
    // overflow-x-auto: 横方向にスクロール可能。no-scrollbar: スクロールバー非表示
    <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar">
      {/* 「すべて」ボタン（常に表示） */}
      <button
        onClick={() => onSelect(null)} // クリック時: カテゴリをnull（=すべて）にする
        className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          // 三項演算子: 条件 ? 真の時 : 偽の時
          // selected === null なら「すべて」が選択中 → 青い背景
          selected === null
            ? "bg-[var(--color-primary)] text-white"
            : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
        }`}
      >
        すべて
      </button>
      {/* 各カテゴリのボタンを動的に生成 */}
      {/* .map() で配列の各要素に対してJSXを生成する（ループの代わり） */}
      {categories.map((cat) => (
        <button
          key={cat} // key: Reactがリスト内の各要素を識別するための一意な値（必須）
          onClick={() => onSelect(cat)} // クリック時: そのカテゴリを選択
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            // そのカテゴリが選択中なら青い背景、そうでなければグレー背景
            selected === cat
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
          }`}
        >
          {cat} {/* カテゴリ名を表示（例: "IT", "ガジェット"） */}
        </button>
      ))}
      <button onClick={onToggleUnread} className={`shrink-0 px-3 py-1.5 rounded-full text-sm ${
        // 三項演算子: 条件 ? 真の時 : 偽の時
          showUnreadOnly === true
            ? "bg-[var(--color-primary)] text-white"
            : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
      }`}>
        未読のみ
      </button>
    </div>
  );
}
