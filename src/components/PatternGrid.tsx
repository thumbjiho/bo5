import { useEffect, type CSSProperties } from "react";
import type { Lang } from "../types";
import { buildCatalog } from "../lib/series";
import { patternName } from "../data/names";
import { resultLetter } from "../data/l10n";
import { seriesFor } from "../data/faker";
import { MiniDiamond } from "./MiniDiamond";

interface Props {
  open: boolean;
  lang: Lang;
  current: string | null;
  onPick: (key: string) => void;
  onClose: () => void;
}

const CATALOG = buildCatalog(3);

// "모두 보기": all 20 Bo5 outcomes as small diamonds, laid over the space the
// big diagram normally occupies (no page, no dialog). Picking one hands it
// to the big diagram (shown once the grid is toggled off).
export function PatternGrid({ open, lang, current, onPick, onClose }: Props) {
  const ko = lang === "ko";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={"pattern-grid" + (open ? " open" : "")} aria-hidden={!open}>
      {CATALOG.map((key, i) => {
        const n = seriesFor(key).length;
        return (
          <button
            key={key}
            className={"pg-cell" + (key === current ? " current" : "") + (n === 0 ? " never" : "")}
            style={{ "--d": open ? `${i * 18}ms` : "0ms" } as CSSProperties}
            tabIndex={open ? 0 : -1}
            onClick={() => onPick(key)}
            aria-label={`${patternName(key, lang)} · ${ko ? `${n}개의 매치` : `${n} ${n === 1 ? "match" : "matches"}`}`}
          >
            <MiniDiamond seriesKey={key} className="pg-diamond" />
            <span className="pg-name">{patternName(key, lang)}</span>
            <span className="pg-seq" aria-hidden="true">
              {key.split("").map((g, k) => (
                <b key={k} className={g === "a" ? "up" : "down"}>{resultLetter(g === "a", lang)}</b>
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
