import type { Lang } from "../types";

interface LangButtonProps {
  lang: Lang;
  onClick: () => void;
}

// Label shows the language you'd switch TO, matching the original.
export function LangButton({ lang, onClick }: LangButtonProps) {
  return (
    <button className="theme-btn lang-btn" id="lang-btn" aria-label="Switch language · 언어 전환" onClick={onClick}>
      {lang === "en" ? "한" : "EN"}
    </button>
  );
}
