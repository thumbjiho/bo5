import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Lang } from "../types";
import { seriesId, type FakerGame, type FakerSeries } from "../data/faker";
import { NAMES, patternName } from "../data/names";
import { championName, roundName, tournamentName } from "../data/l10n";
import { MiniDiamond } from "./MiniDiamond";

interface Props {
  series: FakerSeries;
  lang: Lang;
  origin: DOMRect | null; // the card it was opened from
  onClose: () => void; // called once the closing animation has finished
}

const OPEN_MS = 560;
const CLOSE_MS = 420;
const EASE_OUT = "cubic-bezier(.22,1,.36,1)";
const EASE_IN_OUT = "cubic-bezier(.4,0,.2,1)";

// clip-path that crops the full-screen page down to a card's rectangle
const clipTo = (r: DOMRect) =>
  `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round 12px)`;
const FULL = "inset(0px 0px 0px 0px round 0px)";

const L = {
  ko: {
    back: "돌아가기",
    game: (n: number) => `${n}경기`,
    win: "승리",
    loss: "패배",
    blue: "블루",
    red: "레드",
    cs: "CS",
    gold: "골드",
    dmg: "피해량",
    kp: "킬 관여",
    patch: "패치",
    total: "시리즈 합계",
    champs: "챔피언",
  },
  en: {
    back: "Back",
    game: (n: number) => `Game ${n}`,
    win: "Win",
    loss: "Loss",
    blue: "Blue",
    red: "Red",
    cs: "CS",
    gold: "Gold",
    dmg: "Damage",
    kp: "Kill part.",
    patch: "Patch",
    total: "Series total",
    champs: "Champions",
  },
};

const fmt = (n: number | null) => (n == null ? "–" : n.toLocaleString("en-US"));
const kdaRatio = (g: { k: number | null; d: number | null; a: number | null }, lang: Lang) =>
  g.k == null || g.d == null || g.a == null ? null : g.d === 0 ? (lang === "ko" ? "퍼펙트" : "Perfect") : ((g.k + g.a) / g.d).toFixed(2);

// Full-screen page for one real series. The page is laid out in place from
// the first frame and only its clip grows out of the clicked card's rect, so
// nothing scales or cross-fades; the content then settles in on top.
export function MatchDetail({ series: s, lang, origin, onClose }: Props) {
  const pageRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  useLayoutEffect(() => {
    const el = pageRef.current;
    if (!el || reduced) return;
    scrimRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: OPEN_MS, easing: EASE_OUT });
    if (origin) el.animate([{ clipPath: clipTo(origin) }, { clipPath: FULL }], { duration: OPEN_MS, easing: EASE_OUT });
    else el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: "ease-out" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fold back into the card (wherever it is now), then unmount
  const requestClose = useCallback(() => {
    const el = pageRef.current;
    if (closing.current) return;
    closing.current = true;
    if (!el || reduced) return onClose();
    const card = document.querySelector(`[data-sid="${CSS.escape(seriesId(s))}"]`);
    const r = card?.getBoundingClientRect();
    const visible = r && r.width > 0 && r.bottom > 0 && r.top < innerHeight;
    el.querySelector(".md-body")?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" });
    el.querySelector(".md-back")?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" });
    scrimRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: CLOSE_MS, easing: EASE_IN_OUT, fill: "forwards" });
    const anim = visible
      ? el.animate([{ clipPath: FULL }, { clipPath: clipTo(r) }], { duration: CLOSE_MS, easing: EASE_IN_OUT, fill: "forwards" })
      : el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: "forwards" });
    anim.finished.then(onClose, onClose);
  }, [onClose, reduced, s]);
  const t = L[lang];
  const [hl, setHl] = useState<number | null>(null);
  const won = s.key.split("").filter((g) => g === "a").length === 3;
  const entry = NAMES[s.key];
  const [scoreA, scoreB] = s.score.split("-");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && requestClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  const sum = s.games.reduce(
    (acc, g) => ({ k: acc.k + (g.k ?? 0), d: acc.d + (g.d ?? 0), a: acc.a + (g.a ?? 0) }),
    { k: 0, d: 0, a: 0 }
  );

  return (
    <>
    <div className="md-scrim" ref={scrimRef} />
    <div className="md-page" ref={pageRef} role="dialog" aria-modal="true" aria-label={`${s.team} vs ${s.opponent}`}>
      <button className="md-back" onClick={requestClose}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14.5 6 9 12l5.5 6" />
        </svg>
        {t.back}
      </button>

      <div className="md-body">
        <header className="md-hero">
          <p className="md-meta">
            {s.date.replace(/-/g, ".")} · {tournamentName(s.tournament, lang)} · {roundName(s.round, lang)}
          </p>
          <div className="md-vs">
            <span className="md-team">{s.team}</span>
            <span className="md-score">
              <b className={won ? "up" : "down"}>{scoreA}</b>
              <i>:</i>
              <b className="opp">{scoreB}</b>
            </span>
            <span className="md-team opp">{s.opponent}</span>
          </div>
          {entry && (
            <p className="md-pattern">
              <strong>{patternName(s.key, lang)}</strong>
              <span>{lang === "ko" ? entry[2] : entry[1]}</span>
            </p>
          )}
        </header>

        <div className="md-main">
          <div className="md-side">
            <MiniDiamond seriesKey={s.key} highlight={hl} animate delay={320} className="md-diamond" />
            <dl className="md-sum">
              <div>
                <dt>{t.total}</dt>
                <dd>
                  {sum.k} / <span className="down">{sum.d}</span> / {sum.a}
                </dd>
              </div>
              <div>
                <dt>{t.champs}</dt>
                <dd>{[...new Set(s.games.map((g) => championName(g.champion, lang)))].join(", ")}</dd>
              </div>
            </dl>
          </div>

          <ol className="md-games">
            {s.games.map((g, i) => (
              <GameRow key={i} g={g} i={i} t={t} lang={lang} onHover={setHl} />
            ))}
          </ol>
        </div>
      </div>
    </div>
    </>
  );
}

function GameRow({
  g,
  i,
  t,
  lang,
  onHover,
}: {
  g: FakerGame;
  i: number;
  t: (typeof L)["ko"];
  lang: Lang;
  onHover: (i: number | null) => void;
}) {
  const ratio = kdaRatio(g, lang);
  const kp = g.teamKills && g.k != null && g.a != null ? Math.round(((g.k + g.a) / g.teamKills) * 100) : null;
  return (
    <li
      className={"md-game " + (g.win ? "up" : "down")}
      style={{ animationDelay: `${380 + i * 80}ms` }}
      onPointerEnter={() => onHover(i)}
      onPointerLeave={() => onHover(null)}
    >
      <div className="mg-head">
        <span className="mg-no">{t.game(i + 1)}</span>
        <span className={"mg-res " + (g.win ? "up" : "down")}>{g.win ? t.win : t.loss}</span>
        <span className={"mg-side " + (g.side === "Blue" ? "blue" : "red")}>{g.side === "Blue" ? t.blue : t.red}</span>
        <span className="mg-dur">{g.duration}</span>
      </div>
      <div className="mg-main">
        <span className="mg-champ">{championName(g.champion, lang)}</span>
        <span className="mg-kda">
          {g.k ?? "–"} / <span className="down">{g.d ?? "–"}</span> / {g.a ?? "–"}
          {ratio && <small>{ratio}</small>}
        </span>
      </div>
      <dl className="mg-stats">
        <div><dt>{t.cs}</dt><dd>{fmt(g.cs)}</dd></div>
        <div><dt>{t.gold}</dt><dd>{fmt(g.gold)}</dd></div>
        <div><dt>{t.dmg}</dt><dd>{fmt(g.damage)}</dd></div>
        <div><dt>{t.kp}</dt><dd>{kp == null ? "–" : kp + "%"}</dd></div>
        {g.patch && <div><dt>{t.patch}</dt><dd>{g.patch}</dd></div>}
      </dl>
    </li>
  );
}
