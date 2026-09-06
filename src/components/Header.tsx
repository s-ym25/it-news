/**
 * Header.tsx — ヘッダーコンポーネント
 *
 * 画面上部に固定表示される（sticky）ヘッダー。
 * 「IT News Daily」というタイトル、日付、記事数を表示し、
 * 「前の日 / 次の日」ボタンで表示する日付を切り替える。
 */

/**
 * HeaderProps — このコンポーネントが受け取る「引数」の型
 *
 * Reactでは親コンポーネントから子コンポーネントにデータを渡す仕組みを「Props」と呼ぶ。
 * App.tsx から <Header date="2026-02-07" articleCount={30} ... /> のように渡される。
 */
interface HeaderProps {
  date: string | null; // 日付（例: "2026-02-07"）。データ未取得時はnull
  articleCount: number | null; // 表示中の記事数。読み込み中はnull（件数を出さない）
  onPrevDay: () => void; // 「前の日」ボタンが押された時に呼ばれる関数
  onNextDay: () => void; // 「次の日」ボタンが押された時に呼ばれる関数
  canGoPrev: boolean; // 「前の日」に移動できるか（falseならボタンを無効化）
  canGoNext: boolean; // 「次の日」に移動できるか（falseならボタンを無効化）
}

/**
 * Header — ヘッダーコンポーネント
 *
 * { date, articleCount } は「分割代入」。HeaderProps型のオブジェクトからプロパティを取り出す。
 * 通常の関数引数: function Header(props) → props.date, props.articleCount
 * 分割代入: function Header({ date, articleCount }) → 直接使える
 */
export function Header({
  date,
  articleCount,
  onPrevDay,
  onNextDay,
  canGoPrev,
  canGoNext,
}: HeaderProps) {
  // 日付を日本語フォーマットに変換（例: "2026年2月7日(金)"）
  // toLocaleDateString: ロケールに合わせた日付文字列を生成するメソッド
  const formattedDate = date
    ? new Date(date + "T00:00:00").toLocaleDateString("ja-JP", {
        year: "numeric", // 年を数値で表示（例: 2026）
        month: "long", // 月を「2月」のように表示
        day: "numeric", // 日を数値で表示
        weekday: "short", // 曜日を「(金)」のように短縮表示
      })
    : "";

  // 2つの矢印ボタンで共通して使うCSSクラス
  // disabled:xxx は「ボタンが無効化されている時だけ適用されるスタイル」（Tailwindの記法）
  const arrowClass =
    "shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-sm " +
    "bg-[var(--color-surface)] text-[var(--color-text-secondary)] " +
    "hover:bg-[var(--color-surface-hover)] transition-colors " +
    "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[var(--color-surface)]";

  // JSXで画面を描画して返す
  // className の値はTailwind CSSのクラス名（CSSを短いクラス名で指定するフレームワーク）
  // sticky top-0: 画面上部に固定表示
  // backdrop-blur-sm: 背景をぼかす
  return (
    <header className="sticky top-0 z-10 bg-[var(--color-bg)]/95 backdrop-blur-sm border-b border-[var(--color-border)] px-4 py-3">
      <div className="max-w-2xl mx-auto">
        {/* アプリタイトル */}
        <h1 className="text-lg font-bold tracking-tight">IT News Daily</h1>
        {/* 日付・記事数と、日付を前後に移動するボタン（dateがある場合のみ表示） */}
        {/* {date && (...)} は条件付きレンダリング。dateがnullでなければ()内を表示 */}
        {date && (
          <div className="flex items-center gap-2 mt-0.5">
            {/* 前の日へ。canGoPrevがfalseならdisabled（押せない状態）になる */}
            <button
              onClick={onPrevDay}
              disabled={!canGoPrev}
              aria-label="前の日" // aria-label: 画面読み上げソフト向けのボタン説明
              className={arrowClass}
            >
              ‹
            </button>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {formattedDate}
              {/* 記事数は読み込み中（null）以外の時だけ表示 */}
              {articleCount !== null && ` - ${articleCount}件`}
            </p>
            {/* 次の日へ。最新日を表示中はcanGoNextがfalseになり押せない */}
            <button
              onClick={onNextDay}
              disabled={!canGoNext}
              aria-label="次の日"
              className={arrowClass}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
