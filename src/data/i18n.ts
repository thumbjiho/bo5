import type { Lang } from "../types";

export interface I18nStrings {
  eyebrow: () => string;
  trace: string;
  hint: string;
  fmtLabel: string;
  fmtCap: (n: number) => string;
  anaLabel: string;
  anaDefault: [string, string];
  modes: [string, string, string];
}

export const I18N: Record<Lang, I18nStrings> = {
  en: {
    // literal "N": identical whatever the format, so the title never shifts
    eyebrow: () => "Faker's Bo5 Series · 13 Years, Visualized",
    trace: "Trace a series",
    hint:
      'Move the cursor across the diamond — high in a column for a ' +
      '<b class="up">win</b>, low for a <b class="down">loss</b>.',
    fmtLabel: "Series format",
    fmtCap: (n) => `${n}×${n} grid · first to ${n} wins`,
    anaLabel: "Anatomy",
    anaDefault: ["Hover the diagram", "Point at a part to see what it does."],
    modes: ["Home", "Anatomy", "Settings"],
  },
  ko: {
    eyebrow: () => "13년에 걸친 페이커의 Bo5 시각적 분석",
    trace: "시리즈를 그려보세요",
    hint:
      "다이아몬드 위에서 커서를 움직여 보세요 — 칸의 위쪽은 " +
      '<b class="up">승리</b>, 아래쪽은 <b class="down">패배</b>입니다.',
    fmtLabel: "시리즈 형식",
    fmtCap: (n) => `${n}×${n} 격자 · ${n}선승제`,
    anaLabel: "해부도",
    anaDefault: ["다이어그램에 마우스를 올려보세요", "부위를 가리키면 역할을 알려드립니다."],
    modes: ["홈", "해부도", "설정"],
  },
};
