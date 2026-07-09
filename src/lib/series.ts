import type { Game, Path } from "../types";

// The diamond is an N×N grid of small squares rotated 45° (N = wins to
// clinch: Bo3→2, Bo5→3, Bo7→4). Path nodes are CELL CENTRES: state (a,b)
// — a games won, b games lost, both <N — sits at the centre of its cell.
// Each game moves centre → next centre; the clinching game exits through
// the winner's edge of the diamond.
export interface Geometry {
  wins: number;
  H: number; // cell half-diagonal
  CY: number; // centre y
  X0: number; // first node x
  nodeX: (gamesPlayed: number) => number;
  sy: (winDiff: number) => number;
}

export function makeGeometry(wins: number): Geometry {
  const H = 192 / wins;
  const X0 = 48 + H;
  const CY = 240;
  return {
    wins,
    H,
    CY,
    X0,
    nodeX: (k) => X0 + k * H,
    sy: (d) => CY - d * H,
  };
}

export function tally(p: Path): { a: number; b: number } {
  let a = 0,
    b = 0;
  for (const g of p) g === "a" ? a++ : b++;
  return { a, b };
}

export function ended(p: Path, wins: number): boolean {
  const t = tally(p);
  return t.a >= wins || t.b >= wins;
}

export function nodeD(p: Path): number {
  const t = tally(p);
  return t.a - t.b;
}

// up (a) if cursor above current node
export function decide(p: Path, vy: number, geo: Geometry): Game {
  return vy < geo.sy(nodeD(p)) ? "a" : "b";
}

// centre of the cell occupied after i games
export function pt(p: Path, i: number, geo: Geometry): { x: number; y: number } {
  let a = 0,
    b = 0;
  for (let k = 0; k < i; k++) p[k] === "a" ? a++ : b++;
  return { x: geo.nodeX(a + b), y: geo.sy(a - b) };
}

export function mirrorKey(k: string): string {
  let s = "";
  for (const c of k) s += c === "a" ? "b" : "a";
  return s;
}

// Catalogue of every finished series for a format, ordered like the
// reference chart: score groups top-to-bottom, mirror-symmetric within.
export function buildCatalog(wins: number): string[] {
  const greens: string[] = [];
  (function gen(prefix: string, a: number, b: number) {
    if (a === wins) {
      greens.push(prefix);
      return;
    }
    if (b === wins) return;
    gen(prefix + "a", a + 1, b);
    gen(prefix + "b", a, b + 1);
  })("", 0, 0);
  greens.sort((x, y) => {
    const bx = tally(x.split("") as Path).b;
    const by = tally(y.split("") as Path).b;
    if (bx !== by) return bx - by;
    return x < y ? -1 : 1;
  });
  return greens.concat(
    greens
      .slice()
      .reverse()
      .map(mirrorKey)
  );
}
