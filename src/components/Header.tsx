/**
 * Header.tsx — ヘッダーコンポーネント
 *
 * 画面上部に固定表示される（sticky）ヘッダー。
 * 「IT News Daily」というタイトル、日付、記事数を表示する。
 */

/**
 * HeaderProps — このコンポーネントが受け取る「引数」の型
 *
 * Reactでは親コンポーネントから子コンポーネントにデータを渡す仕組みを「Props」と呼ぶ。
 * App.tsx から <Header date="2026-02-07" articleCount={30} /> のように渡される。
 */
interface HeaderProps {
  date: string | null; // 日付（例: "2026-02-07"）。データ未取得時はnull
  articleCount: number; // 表示中の記事数
}

/**
 * Header — ヘッダーコンポーネント
 *
 * { date, articleCount } は「分割代入」。HeaderProps型のオブジェクトからプロパティを取り出す。
 * 通常の関数引数: function Header(props) → props.date, props.articleCount
 * 分割代入: function Header({ date, articleCount }) → 直接使える
 */
export function Header({ date, articleCount }: HeaderProps) {
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

  // JSXで画面を描画して返す
  // className の値はTailwind CSSのクラス名（CSSを短いクラス名で指定するフレームワーク）
  // sticky top-0: 画面上部に固定表示
  // backdrop-blur-sm: 背景をぼかす
  return (
    <header className="sticky top-0 z-10 bg-[var(--color-bg)]/95 backdrop-blur-sm border-b border-[var(--color-border)] px-4 py-3">
      <div className="max-w-2xl mx-auto">
        {/* アプリタイトル */}
        <h1 className="text-lg font-bold tracking-tight">IT News Daily</h1>
        {/* 日付と記事数（dateがある場合のみ表示） */}
        {/* {date && (...)} は条件付きレンダリング。dateがnullでなければ()内を表示 */}
        {date && (
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            {formattedDate} - {articleCount}件
          </p>
        )}
      </div>
    </header>
  );
}
