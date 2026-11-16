export type Lang = "en" | "ko";
export type Mode = "home" | "anatomy" | "settings";
export type Game = "a" | "b"; // "a" = win, "b" = loss, from the traced team's perspective
export type Path = Game[];

// [English name, English tagline, Korean tagline, Korean name]
export type NameEntry = [string, string, string, string];

export type PartKey =
  | "battlefield"
  | "warfront"
  | "mountain"
  | "valley"
  | "mpwin"
  | "mplose"
  | "final"
  | "dominance"
  | "warpath";
