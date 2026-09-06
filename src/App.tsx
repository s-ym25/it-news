/**
 * App.tsx — メインアプリケーションコンポーネント
 *
 * Reactアプリの「本体」。ページ全体の構成を決めている。
 * - ニュースデータを取得し
 * - 表示する日付・カテゴリフィルターの状態を管理し
 * - Header, CategoryFilter, NewsList の各コンポーネントを配置する
 *
 * コンポーネントとは: Reactの「部品」。画面を小さな部品に分割して管理する考え方。
 * .tsx = TypeScript + JSX（HTMLっぽい記法でUIを書けるReactの拡張構文）
 */

// useState: 状態（変化するデータ）を管理するReactフック
// useMemo: 計算結果をキャッシュして、無駄な再計算を防ぐReactフック
// useCallback: 関数をキャッシュして、無駄な再生成を防ぐReactフック
import { useState, useMemo, useCallback } from "react";
// useNews: 自作のカスタムフック（news.jsonを取得する）
import { useNews } from "./hooks/useNews";
// 各UIコンポーネント（部品）をインポート
import { Header } from "./components/Header";
import { CategoryFilter } from "./components/CategoryFilter";
import { NewsList } from "./components/NewsList";

/**
 * addDays — "YYYY-MM-DD" 形式の日付を delta 日ずらして返す
 *
 * 例: addDays("2026-03-01", -1) → "2026-02-28"
 * 月またぎ・うるう年は Date オブジェクトが自動で計算してくれる。
 *
 * コンポーネントの外に書いているのは、この関数が「状態」に依存しない
 * ただの計算だから（毎回作り直す必要がない）。
 */
function addDays(date: string, delta: number): string {
  // "T00:00:00" を付けると「ローカル時間の午前0時」として解釈される
  // （付けないとUTCとして解釈され、日本時間では9時間ズレる）
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + delta); // 日にちを加算/減算

  // toISOString() はUTCに変換してしまい日付がズレるので、自分で組み立てる
  const year = d.getFullYear();
  // getMonth() は0始まり（0=1月）なので +1 する
  // padStart(2, "0"): 2桁になるまで先頭に"0"を足す（例: "3" → "03"）
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * App — メインコンポーネント
 *
 * Reactでは関数がコンポーネントになる。
 * この関数が返すJSX（HTMLっぽいもの）が画面に表示される。
 */
function App() {
  // date: 表示中の日付（null = 最新版 news.json を表示）
  // setDate: 日付を変更する関数
  const [date, setDate] = useState<string | null>(null);

  // ニュースデータを取得（useNewsフックを呼び出す）
  // news: ニュースデータ, loading: 読み込み中か, error: エラーメッセージ
  // latestDate: 最新版（news.json）の日付。「次の日」ボタンの上限判定に使う
  const { news, loading, error, latestDate } = useNews(date);

  // displayedDate: いま画面に表示している日付
  // date が null（最新表示）のときは、取得したデータ自身の日付を使う
  // ?? は「左がnull/undefinedなら右を使う」演算子（Null合体演算子）
  const displayedDate = date ?? news?.date ?? null;

  // canGoNext: 「次の日」に進めるか（最新日を表示中なら進めない）
  // "2026-05-30" < "2026-05-31" のように、YYYY-MM-DD形式の文字列は
  // そのまま辞書順で比較すれば日付の前後比較になる
  const canGoNext =
    displayedDate !== null &&
    latestDate !== null &&
    displayedDate < latestDate;

  // canGoPrev: 「前の日」に戻れるか（日付が分かっていれば常に戻れる）
  const canGoPrev = displayedDate !== null;

  // shiftDate: 表示日を delta 日ずらす（-1 = 前の日, +1 = 次の日）
  const shiftDate = (delta: number) => {
    if (!displayedDate) return; // 日付が未確定なら何もしない
    setDate(addDays(displayedDate, delta));
  };

  // selectedCategory: 現在選択中のカテゴリ（null = 「すべて」が選択されている）
  // setSelectedCategory: カテゴリを変更する関数
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // showUnreadOnly: 未読フラグ
  // setShowUnreadOnly: 未読フラグを更新する関数
  const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);

  // readIds: 既読記事のIDセット（localStorageから復元）
  // localStorage: ブラウザにデータを保存する仕組み（ページを閉じても消えない）
  // Set: 重複を許さないデータ構造（同じIDを2回追加しても1つだけ保持される）
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("readIds");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      // localStorageのデータが破損していた場合は空のSetで初期化
      return new Set();
    }
  });

  // markAsRead: 記事を既読にする関数
  // useCallback: この関数を再生成せずにキャッシュする（パフォーマンス最適化）
  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      // localStorageに保存（Setは直接JSON化できないので配列に変換）
      localStorage.setItem("readIds", JSON.stringify([...next]));
      return next;
    });
  }, []);

  // categories: ニュースデータからカテゴリ一覧を抽出する
  // useMemo: newsが変わった時だけ再計算する（パフォーマンス最適化）
  // new Set() で重複を除去 → スプレッド構文で配列に戻す
  // 例: ["IT", "IT", "ガジェット", "IT"] → ["IT", "ガジェット"]
  const categories = useMemo(() => {
    if (!news) return []; // データがまだない場合は空配列
    return [...new Set(news.items.map((item) => item.category))];
  }, [news]); // newsが変わった時だけ再計算

  // filteredItems: 選択中のカテゴリで記事をフィルタリング（元の順序を維持）
  const filteredItems = useMemo(() => {
    if (!news) return []; // データがまだない場合は空配列
    let items = selectedCategory
      ? news.items.filter((item) => item.category === selectedCategory)
      : news.items;
    // 未読フラグが立っている場合、未読の記事をフィルタリング
    if (showUnreadOnly === true) {
      items = items.filter((item) => !readIds.has(item.id));
    }
    return items;
  }, [news, selectedCategory, showUnreadOnly, readIds]); // newsまたはカテゴリ,未読フラグ、既読記事IDが変わった時に再計算

  // --- メイン画面 ---
  // JSX: HTMLに似た構文でUIを記述。className はHTMLのclassと同じ（CSSクラス指定）
  //
  // 読み込み中・エラーでも Header と CategoryFilter は表示したままにする。
  // （日付を切り替えるボタンごと消えてしまうと、404になった時に戻れなくなるため）
  return (
    <div className="min-h-screen">
      {/* ヘッダー: 日付・記事数の表示と、日付の前後移動 */}
      <Header
        date={displayedDate}
        articleCount={loading ? null : filteredItems.length} // 読み込み中は件数を出さない
        onPrevDay={() => shiftDate(-1)}
        onNextDay={() => shiftDate(1)}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
      />
      {/* カテゴリフィルター: 「すべて / IT / プログラミング / ガジェット」ボタン */}
      <CategoryFilter
        categories={categories} // カテゴリ一覧
        selected={selectedCategory} // 現在選択中のカテゴリ
        onSelect={setSelectedCategory} // ボタンが押された時にカテゴリを変更する関数
        showUnreadOnly={showUnreadOnly}
        onToggleUnread={() => setShowUnreadOnly(!showUnreadOnly)}
      />

      {/* 状態に応じて本文を出し分ける（三項演算子のネスト） */}
      {loading ? (
        // --- 読み込み中 ---
        <div className="text-center text-[var(--color-text-secondary)] py-12">
          読み込み中...
        </div>
      ) : error ? (
        // --- エラー（存在しない日付を選んだ場合など） ---
        <div className="text-center py-12 px-4">
          <p className="text-[var(--color-text-secondary)] mb-2">
            ニュースの読み込みに失敗しました
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">{error}</p>
        </div>
      ) : (
        // --- 正常時 ---
        // <>...</> は「フラグメント」。余計なdivを増やさずに複数要素をまとめる書き方
        <>
          {/* 今日のまとめ: 全記事をAIがまとめたテキスト（存在する場合のみ表示） */}
          {news?.dailySummary && (
            <div className="mx-4 mb-4 p-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
              <h2 className="text-sm font-bold mb-2">今日のまとめ</h2>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {news.dailySummary}
              </p>
            </div>
          )}
          {/* ニュース一覧: フィルター済みの記事をカード形式で表示 */}
          <NewsList
            items={filteredItems}
            readIds={readIds}
            onMarkRead={markAsRead}
          />
        </>
      )}
    </div>
  );
}

// default export: このファイルをインポートした時に、App関数がデフォルトで使われる
export default App;
