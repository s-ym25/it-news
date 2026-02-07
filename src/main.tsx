/**
 * main.tsx — Reactアプリのエントリポイント（起動点）
 *
 * ブラウザがindex.htmlを読み込むと、このファイルが最初に実行される。
 * HTMLの中にある <div id="root"></div> にReactアプリを描画（マウント）する。
 *
 * このファイルは基本的に変更する必要がない「お決まりのコード」。
 */

// StrictMode: React開発時の追加チェック機能。バグを見つけやすくする。本番では無効。
import { StrictMode } from "react";
// createRoot: ReactをHTMLのDOM要素に接続する関数（React 18以降の新しいAPI）
import { createRoot } from "react-dom/client";
// CSSファイルを読み込む（Tailwind CSSの設定が含まれている）
import "./index.css";
// Appコンポーネント: アプリ本体
import App from "./App.tsx";

// HTMLの <div id="root"></div> を取得し、そこにReactアプリを描画する
// document.getElementById("root")! の ! は「nullではないことを保証する」TypeScriptの記法
// .render() で指定したJSXを画面に描画する
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App /> {/* Appコンポーネントを描画 → App.tsx → Header, CategoryFilter, NewsList が表示される */}
  </StrictMode>
);
