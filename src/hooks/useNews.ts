/**
 * useNews.ts — ニュースデータ取得カスタムフック
 *
 * Reactの「カスタムフック」。
 * フックとは: Reactが提供する特殊な関数で、コンポーネントに「状態」や「副作用」を持たせる仕組み。
 * カスタムフックとは: 自分で作ったフック。ロジックを部品化して再利用できるようにする。
 *
 * このフックは:
 * 1. 指定された日付のニュースJSONを取得（fetch）
 *    - date が null         → /data/news.json（最新版）
 *    - date が "2026-05-30" → /data/news-2026-05-30.json
 * 2. 取得結果を { news, loading, error, latestDate } として返す
 * 3. App.tsx がこのフックを呼び出してデータを受け取る
 */

// useState: コンポーネントに「状態（変化するデータ）」を持たせるフック
// useEffect: コンポーネントの描画後に「副作用（データ取得等）」を実行するフック
import { useState, useEffect } from "react";
import type { DailyNews } from "../types/news";

/**
 * useNews — ニュースデータを取得して返すカスタムフック
 *
 * @param date 表示したい日付（"YYYY-MM-DD"）。null なら最新版
 * @returns {news} ニュースデータ（取得前はnull）
 * @returns {loading} 読み込み中かどうか（true/false）
 * @returns {error} エラーメッセージ（エラーがなければnull）
 * @returns {latestDate} 最新版データの日付（取得前はnull）
 */
export function useNews(date: string | null) {
  // --- 状態（state）の定義 ---
  // useState<型>(初期値) で状態変数を作る
  // [値, 値を更新する関数] の組が返される

  // ニュースデータ本体（最初はnull = まだ取得していない）
  const [news, setNews] = useState<DailyNews | null>(null);
  // エラーメッセージ（最初はnull = エラーなし）
  const [error, setError] = useState<string | null>(null);
  // 最新版（news.json）の日付。App側で「次の日」ボタンの上限判定に使う
  const [latestDate, setLatestDate] = useState<string | null>(null);
  // loadedDate: 「いま保持しているデータは、どのdateに対する結果か」
  // 初期値のundefinedは「まだ何も取得していない」という意味
  const [loadedDate, setLoadedDate] = useState<string | null | undefined>(
    undefined
  );

  // --- 副作用（effect）の定義 ---
  // useEffect(() => { ... }, [date]) で「dateが変わるたびに実行」される処理を定義
  // 第2引数の [date] は「依存配列」。ここに入れた値が変わると関数が再実行される
  useEffect(() => {
    // cancelled: この取得が「もう用済み」になったかどうかの目印
    // 取得中に日付を切り替えると、古い取得の結果が後から届いて
    // 新しい表示を上書きしてしまうことがある（競合状態）。それを防ぐためのフラグ。
    let cancelled = false;

    // 取得先を日付で切り替える
    // （Vercelにデプロイされたサイトでは、public/data/xxx.json が /data/xxx.json として公開される）
    const url = date ? `/data/news-${date}.json` : "/data/news.json";

    // URLをHTTPリクエストで取得
    fetch(url)
      .then((res) => {
        // .then() はPromise（非同期処理）が成功した時に実行される
        // 404 = その日付のファイルが存在しない（未来の日付や、収集開始前の日付）
        if (res.status === 404) throw new Error("この日付のニュースはありません");
        // res.ok: HTTPステータスが200番台（成功）かどうか
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // 開発サーバー等では、存在しないファイルでも index.html が200で返ることがある。
        // その場合JSONパースに失敗して分かりにくいエラーになるので、先に中身の種類を確認する。
        const contentType = res.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
          throw new Error("この日付のニュースはありません");
        }
        // レスポンスをJSON形式としてパース（文字列→JavaScriptオブジェクトに変換）
        return res.json();
      })
      .then((data: DailyNews) => {
        if (cancelled) return; // 古い取得の結果なら捨てる
        setNews(data); // ニュースデータを保存
        setError(null); // 前回のエラーを消す
        // 最新版(news.json)を読んだ時だけ、その日付を「最新日」として覚えておく
        if (date === null) setLatestDate(data.date);
        setLoadedDate(date); // このdateの結果を保持している、と記録
      })
      .catch((err) => {
        // .catch() はPromiseチェーンのどこかでエラーが発生した時に実行される
        if (cancelled) return; // 古い取得の結果なら捨てる
        setError(err.message); // エラーメッセージを保存
        setLoadedDate(date); // 失敗も「このdateに対する結果」なので記録する
      });

    // useEffectが返す関数は「クリーンアップ関数」。
    // 次回このeffectが実行される直前（＝dateが変わった時）に呼ばれる。
    return () => {
      cancelled = true;
    };
  }, [date]); // dateが変わるたびに再取得

  // loading は状態として持たず、計算で求める（派生値）。
  // 「要求中の日付」と「取得済みの日付」がズレている間＝読み込み中。
  // こうするとdateを変えた瞬間にloadingがtrueになり、setLoading()を書く必要がない。
  const loading = loadedDate !== date;

  // 状態をオブジェクトとして返す
  // 呼び出し側は const { news, loading, error, latestDate } = useNews(date) で受け取れる
  return { news, loading, error, latestDate };
}
