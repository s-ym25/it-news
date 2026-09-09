/**
 * useTheme.ts — テーマ（ダーク/ライト）切り替えカスタムフック
 */
import { useState ,useEffect } from "react";

export type Theme = "dark" | "light";

/**
 * 初期テーマを決める。
 *
 * 優先順位:
 *   1. localStorage に保存された設定（一度でも切り替えたなら、その選択を尊重する）
 *   2. OSの外観モード（matchMedia で prefers-color-scheme を判定）
 *   3. ダーク（どちらも分からない場合の既定値）
 */
function getInitialTheme(): Theme {
    
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark"){
        return saved
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
        return "light"        
    } else {
        return "dark"
    }
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