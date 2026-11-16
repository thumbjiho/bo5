import type { Lang } from "../types";
import { resultLetter } from "../data/l10n";
import { MiniDiamond } from "./MiniDiamond";

// Empty state for a pattern Faker never lived: the path drawn faintly, the
// game-by-game run spelled out, and a sentence instead of a bare "none".
export function NeverHappened({ seriesKey, lang }: { seriesKey: string; lang: Lang }) {
  const games = seriesKey.split("");
  const won = games.filter((g) => g === "a").length > games.length / 2;
  const run = (
    <span className="nh-run">
      {games.map((g, i) => (
        <b key={i} className={g === "a" ? "up" : "down"}>
          {resultLetter(g === "a", lang)}
        </b>
      ))}
    </span>
  );
  // Korean particle: 으로 after a final consonant (승), 로 after a vowel (패)
  const ro = games[games.length - 1] === "a" ? "으로" : "로";

  return (
    <div className="never">
      <MiniDiamond seriesKey={seriesKey} animate className="nh-diamond" />
      {lang === "ko" ? (
        <>
          <p className="nh-title">
            페이커는 {run}
            {ro}
            <br />
            {won ? "이긴" : "진"} 적이 없어요
          </p>
        </>
      ) : (
        <>
          <p className="nh-title">
            Faker has never {won ? "won" : "lost"}
            <br />a series {run}
          </p>
        </>
      )}
    </div>
  );
}
