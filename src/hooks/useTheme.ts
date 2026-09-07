/**
 * useTheme.ts — テーマ（ダーク/ライト）切り替えカスタムフック
 */
import { useState ,useEffect } from "react";

export type Theme = "dark" | "light";

/**
 * 前回保存したテーマを読み出す。保存がなければダークにする。
 */
function getInitialTheme(): Theme {
  const saved = localStorage.getItem("theme");
  return saved === "light" ? "light" : "dark";
}

export function useTheme(){
    const [theme, setTheme] =useState<Theme>(getInitialTheme);
    
     // theme が変わるたびに、画面に反映し、次回のために保存する
    useEffect(() => {
        document.documentElement.setAttribute("data-theme",theme);
        localStorage.setItem("theme",theme)
    }, [theme]);

    function toggleTheme(){
        setTheme(theme === "dark" ? "light" : "dark");
    }
    
    return {theme,toggleTheme};
}