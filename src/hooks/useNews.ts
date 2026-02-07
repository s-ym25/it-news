/**
 * useNews.ts — ニュースデータ取得カスタムフック
 *
 * Reactの「カスタムフック」。
 * フックとは: Reactが提供する特殊な関数で、コンポーネントに「状態」や「副作用」を持たせる仕組み。
 * カスタムフックとは: 自分で作ったフック。ロジックを部品化して再利用できるようにする。
 *
 * このフックは:
 * 1. ページ読み込み時に /data/news.json を取得（fetch）
 * 2. 取得結果を { news, loading, error } として返す
 * 3. App.tsx がこのフックを呼び出してデータを受け取る
 */

// useState: コンポーネントに「状態（変化するデータ）」を持たせるフック
// useEffect: コンポーネントの描画後に「副作用（データ取得等）」を実行するフック
import { useState, useEffect } from "react";
import type { DailyNews } from "../types/news";

/**
 * useNews — ニュースデータを取得して返すカスタムフック
 *
 * @returns {news} ニュースデータ（取得前はnull）
 * @returns {loading} 読み込み中かどうか（true/false）
 * @returns {error} エラーメッセージ（エラーがなければnull）
 */
export function useNews() {
  // --- 状態（state）の定義 ---
  // useState<型>(初期値) で状態変数を作る
  // [値, 値を更新する関数] の組が返される

  // ニュースデータ本体（最初はnull = まだ取得していない）
  const [news, setNews] = useState<DailyNews | null>(null);
  // 読み込み中フラグ（最初はtrue = 読み込み中）
  const [loading, setLoading] = useState(true);
  // エラーメッセージ（最初はnull = エラーなし）
  const [error, setError] = useState<string | null>(null);

  // --- 副作用（effect）の定義 ---
  // useEffect(() => { ... }, []) で「コンポーネントが最初に表示された時に1回だけ実行」される処理を定義
  // 第2引数の [] は「依存配列」。空配列 = 最初の1回だけ実行
  useEffect(() => {
    // /data/news.json をHTTPリクエストで取得
    // （Vercelにデプロイされたサイトでは、public/data/news.json が /data/news.json として公開される）
    fetch("/data/news.json")
      .then((res) => {
        // .then() はPromise（非同期処理）が成功した時に実行される
        // res.ok: HTTPステータスが200番台（成功）かどうか
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // レスポンスをJSON形式としてパース（文字列→JavaScriptオブジェクトに変換）
        return res.json();
      })
      .then((data: DailyNews) => {
        // JSONのパースが成功したら、ニュースデータを状態にセット
        setNews(data); // ニュースデータを保存
        setLoading(false); // 読み込み完了
      })
      .catch((err) => {
        // .catch() はPromiseチェーンのどこかでエラーが発生した時に実行される
        setError(err.message); // エラーメッセージを保存
        setLoading(false); // 読み込み完了（エラーだけど「読み込み中」は終わり）
      });
  }, []);

  // 状態をオブジェクトとして返す
  // 呼び出し側は const { news, loading, error } = useNews() で受け取れる
  return { news, loading, error };
}
