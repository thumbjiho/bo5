import type { Lang, PartKey } from "../types";

type PartEntry = [string, string];

// Anatomy part name + description per language, format-aware (depends on WINS).
export const PARTS: Record<PartKey, (wins: number, lang: Lang) => PartEntry> = {
  dominance: (_wins, lang) =>
    lang === "ko"
      ? [
          "우세의 강줄기",
          "두 꼭짓점을 잇는 동률의 물길 — 이 강에 닿은 시리즈는 동점입니다. " +
            "강의 위쪽은 리드, 아래쪽은 열세입니다.",
        ]
      : [
          "River of Dominance",
          "The tie river between the two points. A series touching " +
            "it is level; above it you lead, below it you trail.",
        ],

  mountain: (wins, lang) =>
    lang === "ko"
      ? [
          "승리의 산맥",
          `승리의 결승 능선 — 이기는 시리즈는 모두 이 변을 뚫고 나갑니다. ` +
            `높이가 곧 격차: 정상은 ${wins}:0, 산기슭은 ${wins}:${wins - 1}.`,
        ]
      : [
          "Mountains of Victory",
          `The winning edge. Every victorious series exits through it, ` +
            `and altitude is margin: ${wins}:0 at the summit, down to ${wins}:${wins - 1}` +
            ` at the base.`,
        ],

  valley: (wins, lang) =>
    lang === "ko"
      ? [
          "패배의 절벽",
          `패배의 결승 벽 — 지는 시리즈는 모두 이 절벽 아래로 떨어집니다. ` +
            `깊이가 곧 격차: 최저점은 0:${wins}, 가장자리는 ${wins - 1}:${wins}.`,
        ]
      : [
          "Cliff of Defeat",
          `The losing edge. Every defeated series falls over it, ` +
            `and depth is margin: 0:${wins} at the lowest point, up to ${wins - 1}:${wins}` +
            ` near the rim.`,
        ],

  mpwin: (wins, lang) =>
    lang === "ko"
      ? [
          "환희의 능선",
          `정상까지 단 한 승만 남긴 매치포인트 칸들 — ${wins - 1}승을 ` +
            `쌓아둔 상태. 여기서 한 걸음만 오르면 승리의 산을 넘습니다.`,
        ]
      : [
          "Ridge of Joy",
          `The match-point cells, one win from the summit — ` +
            `${wins - 1} wins banked. A single up-step here exits through the Mountains of Victory.`,
        ],

  mplose: (_wins, lang) =>
    lang === "ko"
      ? [
          "공포의 골짜기",
          "탈락까지 단 한 패만 남은 칸들 — 여기서 한 번만 미끄러지면 " +
            "패배의 절벽 아래로 떨어집니다.",
        ]
      : [
          "Valley of Fear",
          "The cells one loss from elimination — a single slip here " +
            "sends the series over the Cliff of Defeat.",
        ],

  final: (wins, lang) => {
    const s = `${wins - 1}:${wins - 1}`;
    return lang === "ko"
      ? [
          "최후의 곶",
          `전장의 동쪽 끝, 능선과 골짜기가 강어귀에서 만나는 돌출부 — ${s}, ` +
            `승리도 패배도 단 한 경기 앞. 다음 경기가 모든 것을 결정합니다.`,
        ]
      : [
          "The Final Cape",
          `The easternmost headland of the war zone, where Ridge and ` +
            `Valley converge at the river's mouth — ${s}, one game from glory and one ` +
            `from ruin. The next game decides everything.`,
        ];
  },

  warpath: (_wins, lang) =>
    lang === "ko"
      ? [
          "진군로",
          "당신이 그린 시리즈의 행군 — 서쪽 꼭짓점에서 출발해 게임마다 격전지에 " +
            "진을 치고, 결승 변을 뚫을 때까지 진격합니다.",
        ]
      : [
          "The Warpath",
          "The march of the series you traced — it sets out from the western " +
            "point, camps on one battlefield per game, and pushes until it breaks through a " +
            "finish edge.",
        ],

  battlefield: (wins, lang) =>
    lang === "ko"
      ? [
          "전장",
          `꼭짓점으로 세워진 ${wins}×${wins}개의 격전지 — 가능한 모든 시리즈가 ` +
            `이 네 변 안에서 벌어집니다.`,
        ]
      : [
          "The War Zone",
          `The whole theatre of war — ${wins}×${wins} battlefields stood ` +
            `on a point. Every possible series is fought inside these four edges.`,
        ],

  warfront: (_wins, lang) =>
    lang === "ko"
      ? [
          "격전지",
          "전장의 칸 하나 — 한 경기가 벌어지는 땅입니다. 모든 시리즈는 이 첫 " +
            "격전지(0:0)에서 시작해, 이기면 우상으로, 지면 우하로 진격합니다.",
        ]
      : [
          "The Battlefield",
          "One cell of the war zone — the ground where a single game is " +
            "fought. Every series opens on this first battlefield (0:0), then pushes " +
            "up-right on a win, down-right on a loss.",
        ],
};
