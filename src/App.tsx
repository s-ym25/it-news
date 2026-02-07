/**
 * App.tsx — メインアプリケーションコンポーネント
 *
 * Reactアプリの「本体」。ページ全体の構成を決めている。
 * - ニュースデータを取得し
 * - カテゴリフィルターの状態を管理し
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
 * App — メインコンポーネント
 *
 * Reactでは関数がコンポーネントになる。
 * この関数が返すJSX（HTMLっぽいもの）が画面に表示される。
 */
function App() {
  // ニュースデータを取得（useNewsフックを呼び出す）
  // news: ニュースデータ, loading: 読み込み中か, error: エラーメッセージ
  const { news, loading, error } = useNews();

  // selectedCategory: 現在選択中のカテゴリ（null = 「すべて」が選択されている）
  // setSelectedCategory: カテゴリを変更する関数
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // readIds: 既読記事のIDセット（localStorageから復元）
  // localStorage: ブラウザにデータを保存する仕組み（ページを閉じても消えない）
  // Set: 重複を許さないデータ構造（同じIDを2回追加しても1つだけ保持される）
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("readIds");
    return saved ? new Set(JSON.parse(saved)) : new Set();
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

  // filteredItems: 選択中のカテゴリで記事をフィルタリングし、既読を下に移動
  const filteredItems = useMemo(() => {
    if (!news) return []; // データがまだない場合は空配列
    const items = selectedCategory
      ? news.items.filter((item) => item.category === selectedCategory)
      : news.items;
    // 未読を上、既読を下に並び替え（それぞれの中では元の順序を維持）
    return [...items].sort((a, b) => {
      const aRead = readIds.has(a.id) ? 1 : 0;
      const bRead = readIds.has(b.id) ? 1 : 0;
      return aRead - bRead;
    });
  }, [news, selectedCategory, readIds]); // readIdsが変わった時も再計算

  // --- 読み込み中の画面 ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--color-text-secondary)]">読み込み中...</div>
      </div>
    );
  }

  // --- エラー画面 ---
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

  // --- メイン画面 ---
  // JSX: HTMLに似た構文でUIを記述。className はHTMLのclassと同じ（CSSクラス指定）
  return (
    <div className="min-h-screen">
      {/* ヘッダー: 日付と記事数を表示 */}
      <Header
        date={news?.date ?? null} // news?.date = newsがnullでなければdateを取得（オプショナルチェーン）
        articleCount={filteredItems.length} // フィルター後の記事数
      />
      {/* カテゴリフィルター: 「すべて / IT / プログラミング / ガジェット」ボタン */}
      <CategoryFilter
        categories={categories} // カテゴリ一覧
        selected={selectedCategory} // 現在選択中のカテゴリ
        onSelect={setSelectedCategory} // ボタンが押された時にカテゴリを変更する関数
      />
      {/* ニュース一覧: フィルター済みの記事をカード形式で表示 */}
      <NewsList items={filteredItems} readIds={readIds} onMarkRead={markAsRead} />
    </div>
  );
}

// default export: このファイルをインポートした時に、App関数がデフォルトで使われる
export default App;
