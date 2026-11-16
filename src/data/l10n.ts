import type { Lang } from "../types";

// Korean renderings for the data-driven strings (tournaments, rounds,
// champions). English is the source text, so `lang === "en"` passes through.

const SEASON: Record<string, string> = { Spring: "스프링", Summer: "서머", Winter: "윈터" };

const TOURNAMENT_RULES: [RegExp, (...m: string[]) => string][] = [
  [/^Worlds Season (\d+)$/, (n) => `시즌 ${n} 월드 챔피언십`],
  [/^Worlds (\d{4}) Main Event$/, (y) => `${y} 월드 챔피언십 본선`],
  [/^Worlds (\d{4}) Play-In$/, (y) => `${y} 월드 챔피언십 플레이인`],
  [/^Worlds (\d{4})$/, (y) => `${y} 월드 챔피언십`],
  [/^MSI (\d{4}) Main Event$/, (y) => `${y} MSI 본선`],
  [/^MSI (\d{4})$/, (y) => `${y} MSI`],
  [/^LCK (\d{4}) (Spring|Summer) Playoffs$/, (y, s) => `${y} LCK ${SEASON[s]} 플레이오프`],
  [/^LCK (\d{4}) Season Playoffs$/, (y) => `${y} LCK 플레이오프`],
  [/^LCK (\d{4}) Regional Finals$/, (y) => `${y} LCK 대표 선발전`],
  [/^LCK (\d{4}) Road to MSI$/, (y) => `${y} LCK 로드 투 MSI`],
  [/^LCK Cup (\d{4})$/, (y) => `${y} LCK컵`],
  [/^Champions (\d{4}) (Spring|Summer|Winter) Playoffs$/, (y, s) => `${y} 챔피언스 ${SEASON[s]} 플레이오프`],
  [/^Champions (\d{4}) (Spring|Summer|Winter)$/, (y, s) => `${y} 챔피언스 ${SEASON[s]}`],
  [/^Korea Regional Finals Season (\d+)$/, (n) => `시즌 ${n} 한국 대표 선발전`],
  [/^Korea Regional Finals (\d{4})$/, (y) => `${y} 한국 대표 선발전`],
  [/^KeSPA Cup (\d{4})$/, (y) => `${y} KeSPA컵`],
  [/^NLB (\d{4}) (Spring|Summer|Winter)$/, (y, s) => `${y} NLB ${SEASON[s]}`],
  [/^All-Star (\d{4}) (.+)$/, (y, city) => `${y} 올스타 ${city === "Paris" ? "파리" : city}`],
  [/^IEM Season (\d+) World Championship$/, (n) => `IEM 시즌 ${n} 월드 챔피언십`],
  [/^Esports World Cup (\d{4}) Online Qualifier: Korea$/, (y) => `${y} e스포츠 월드컵 한국 온라인 예선`],
  [/^Esports World Cup (\d{4})$/, (y) => `${y} e스포츠 월드컵`],
  [/^KOREA Pre Evaluation for (\d{4}) Asian Games$/, (y) => `${y} 아시안게임 국가대표 평가전`],
];

const ROUND_RULES: [RegExp, (...m: string[]) => string][] = [
  [/^Finals$/, () => "결승"],
  [/^Semifinals$/, () => "4강"],
  [/^Quarterfinals$/, () => "8강"],
  [/^Third-Place Match$/, () => "3·4위전"],
  [/^Tiebreakers$/, () => "타이브레이커"],
  [/^Play-In$/, () => "플레이인"],
  [/^Play-In Day (\d+)$/, (n) => `플레이인 ${n}일차`],
  [/^Day (\d+)$/, (n) => `${n}일차`],
  [/^Week (\d+)$/, (n) => `${n}주차`],
  [/^Bracket Round (\d+)$/, (n) => `브래킷 ${n}라운드`],
  [/^Playoffs Round (\d+)$/, (n) => `플레이오프 ${n}라운드`],
  [/^Round (\d+)$/, (n) => `${n}라운드`],
];

const CHAMPIONS_KO: Record<string, string> = {
  Ahri: "아리", Akali: "아칼리", Anivia: "애니비아", Annie: "애니", "Aurelion Sol": "아우렐리온 솔",
  Aurora: "오로라", Azir: "아지르", Caitlyn: "케이틀린", Cassiopeia: "카시오페아", Corki: "코르키",
  Diana: "다이애나", Ekko: "에코", Ezreal: "이즈리얼", Fizz: "피즈", Galio: "갈리오", Gragas: "그라가스",
  Hwei: "흐웨이", Irelia: "이렐리아", Jayce: "제이스", "K'Sante": "크산테", Karma: "카르마",
  Karthus: "카서스", Kassadin: "카사딘", "Kha'Zix": "카직스", "Kog'Maw": "코그모", LeBlanc: "르블랑",
  Lissandra: "리산드라", Locke: "로크", Lucian: "루시안", Lulu: "룰루", Malzahar: "말자하", Mel: "멜",
  Mordekaiser: "모데카이저", Nasus: "나서스", Nautilus: "노틸러스", Neeko: "니코", Nidalee: "니달리",
  Orianna: "오리아나", Qiyana: "키아나", Renekton: "레넥톤", Riven: "리븐", Rumble: "럼블", Ryze: "라이즈",
  Sion: "사이온", Smolder: "스몰더", Swain: "스웨인", Sylas: "사일러스", Syndra: "신드라",
  Taliyah: "탈리야", Talon: "탈론", Tristana: "트리스타나", "Twisted Fate": "트위스티드 페이트",
  Varus: "바루스", Veigar: "베이가", "Vel'Koz": "벨코즈", Vex: "벡스", Viktor: "빅토르", Xerath: "제라스",
  Yasuo: "야스오", Yone: "요네", Zac: "자크", Zed: "제드", Ziggs: "직스", Zilean: "질리언", Zoe: "조이",
};

function byRules(rules: [RegExp, (...m: string[]) => string][], s: string): string {
  for (const [re, fn] of rules) {
    const m = s.match(re);
    if (m) return fn(...m.slice(1));
  }
  return s;
}

export const tournamentName = (s: string, lang: Lang) => (lang === "ko" ? byRules(TOURNAMENT_RULES, s) : s);
export const roundName = (s: string, lang: Lang) => (lang === "ko" ? byRules(ROUND_RULES, s) : s);
export const championName = (s: string, lang: Lang) => (lang === "ko" ? CHAMPIONS_KO[s] ?? s : s);

// one game result as a letter: W/L in English, 승/패 in Korean
export const resultLetter = (win: boolean, lang: Lang) => (lang === "ko" ? (win ? "승" : "패") : win ? "W" : "L");
