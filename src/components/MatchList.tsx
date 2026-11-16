import type { Lang } from "../types";
import { seriesFor, seriesId, type FakerSeries } from "../data/faker";
import { shortTeam } from "../data/teams";
import { roundName, tournamentName } from "../data/l10n";
import { NeverHappened } from "./NeverHappened";

interface Props {
  seriesKey: string | null; // finished Bo5 pattern currently shown, or null
  lang: Lang;
  onOpen: (s: FakerSeries, from: DOMRect) => void;
}

const STEP_MS = 70; // stagger between rows
const MAX_STAGGER = 18; // rows past this arrive together, so long lists don't drag

// Faker's real series that share the pattern on the diamond, dealt in one by
// one each time the pattern changes (remounted via `key`, so it replays).
export function MatchList({ seriesKey, lang, onOpen }: Props) {
  const list = seriesKey ? seriesFor(seriesKey) : [];
  const ko = lang === "ko";
  const n = list.length;

  return (
    <aside className={"match-list" + (seriesKey ? " show" : "")} aria-live="polite">
      {seriesKey && (
        <div className={"ml-inner" + (n === 0 ? " empty" : "")} key={seriesKey + lang}>
          <p className="ml-head">{ko ? `${n}개의 매치` : `${n} ${n === 1 ? "match" : "matches"}`}</p>
          {n === 0 ? (
            <div className="ml-empty">
              <NeverHappened seriesKey={seriesKey} lang={lang} />
            </div>
          ) : (
            <ol className="ml-items">
              {list.map((s, i) => {
                const id = seriesId(s);
                return (
                  <li
                    key={id}
                    className="ml-item"
                    role="button"
                    tabIndex={0}
                    data-sid={id}
                    onClick={(e) => onOpen(s, e.currentTarget.getBoundingClientRect())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onOpen(s, e.currentTarget.getBoundingClientRect());
                      }
                    }}
                    style={{ animationDelay: `${Math.min(i, MAX_STAGGER) * STEP_MS}ms` }}
                  >
                    <div className="ml-row1">
                      <span className="ml-date">{s.date.replace(/-/g, ".")}</span>
                      <span className="ml-seq" aria-hidden="true">
                        {s.key.split("").map((g, k) => (
                          <i key={k} className={g === "a" ? "up" : "down"} />
                        ))}
                      </span>
                    </div>
                    <div className="ml-vs">
                      <span className="ml-team" title={s.team}>{shortTeam(s.team)}</span>
                      <span className="ml-score">{s.score.replace("-", " : ")}</span>
                      <span className="ml-opp" title={s.opponent}>{shortTeam(s.opponent)}</span>
                    </div>
                    <div className="ml-meta">
                      {tournamentName(s.tournament, lang)} · {roundName(s.round, lang)}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </aside>
  );
}
