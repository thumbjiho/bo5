import type { Lang, NameEntry } from "../types";

// Every outcome told from one team's perspective: [name, tagline EN, tagline KO].
// Bo5 (WINS=3) has the full 20-entry table; Bo3/Bo7 fall back to nameFor()'s
// generalised patterns below.
export const NAMES: Record<string, NameEntry> = {
  // 3:0
  aaa: ["Sweep", "Three straight. Never in doubt.", "3연승. 흔들림 없는 압승."],
  // 3:1
  baaa: ["Wake-Up Call", "Drop the opener, then three without mercy.", "1차전을 내주고, 자비 없는 3연승."],
  abaa: ["Speed Bump", "One slip mid-cruise, otherwise routine.", "순항 중 만난 과속방지턱 하나."],
  aaba: ["Stutter Step", "A wobble at match point, then the close.", "매치포인트에서 잠깐 휘청, 그리고 마무리."],
  // 3:2
  aabba: ["The Great Escape", "Up 2–0, dragged to the brink, out in five.", "2–0 리드, 벼랑 끝까지 몰렸다가 5차전 탈출."],
  ababa: ["Flip Flop", "Trade blows every game — and take the last one.", "매 게임 주고받다 마지막을 가져오다."],
  abbaa: ["Turnaround", "Down 1–2, flip the series on its head.", "1–2 열세에서 시리즈를 뒤집다."],
  baaba: ["Dogfight", "Nothing comes easy. Claw out game five.", "쉬운 게 하나 없는 진흙탕, 5차전을 긁어내다."],
  babaa: ["Late Surge", "Trail all series, arrive right on time.", "내내 끌려가다 정확히 제시간에 도착."],
  bbaaa: ["Reverse Sweep", "Down 0–2. Three straight. Legend.", "0–2에서 3연승. 전설."],
  // 2:3
  bbaab: ["Heartbreaker", "All the way back from 0–2 — and it slips.", "0–2에서 다 따라잡고 — 마지막에 놓치다."],
  babab: ["Flip Flopped", "Trade blows every game — and lose the last one.", "매 게임 주고받다 마지막을 내주다."],
  baabb: ["Collapse", "Lead 2–1, then watch it all come down.", "2–1 리드가 무너져 내리다."],
  abbab: ["Quicksand", "Win the opener, sink slowly ever after.", "첫 승 이후 서서히 가라앉다."],
  ababb: ["Fizzle", "Ahead early, empty at the end.", "앞서다가 끝에서 방전."],
  aabbb: ["Reverse Swept", "2–0 up. Then three games of grief.", "2–0 리드. 그리고 3연패의 비극."],
  // 1:3
  abbb: ["False Dawn", "Take game one. Lose everything after.", "1차전 승리는 거짓 새벽이었다."],
  babb: ["Dead Cat Bounce", "One flicker of life in a losing cause.", "지는 싸움 속 단 한 번의 반짝임."],
  bbab: ["Last Gasp", "Stave off the sweep once, fall the next game.", "스윕만 겨우 면한 마지막 숨."],
  // 0:3
  bbb: ["Swept", "Three straight. Nothing to be done.", "3연패. 손쓸 도리가 없었다."],
};

// Bo5 has the full table; Bo3/Bo7 keep only the patterns that generalise.
export function nameFor(key: string, wins: number, lang: Lang): [string, string] | null {
  let e: NameEntry | null = null;
  if (wins === 3 && NAMES[key]) {
    e = NAMES[key];
  } else {
    const A = new Array(wins + 1).join("a");
    const B = new Array(wins + 1).join("b");
    if (key === A) {
      e = ["Sweep", "Straight games. Never in doubt.", "전승. 흔들림 없는 압승."];
    } else if (key === B) {
      e = ["Swept", "Straight games. Nothing to be done.", "전패. 손쓸 도리가 없었다."];
    } else if (key === new Array(wins).join("b") + A) {
      e = [
        "Reverse Sweep",
        `Down 0–${wins - 1}. ${wins} straight. Legend.`,
        `0–${wins - 1}에서 ${wins}연승. 전설.`,
      ];
    } else if (key === new Array(wins).join("a") + B) {
      e = [
        "Reverse Swept",
        `${wins - 1}–0 up. Then ${wins} games of grief.`,
        `${wins - 1}–0 리드. 그리고 ${wins}연패의 비극.`,
      ];
    }
  }
  return e ? [e[0], lang === "ko" ? e[2] : e[1]] : null;
}
