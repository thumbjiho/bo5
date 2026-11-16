import type { CSSProperties } from "react";
import type { Path } from "../types";
import { makeGeometry, pt } from "../lib/series";

interface Props {
  seriesKey: string; // e.g. "bbab"
  highlight?: number | null; // game index to emphasise
  animate?: boolean; // draw the path in, game by game
  className?: string;
  delay?: number; // ms before the draw-in starts
}

const GEO = makeGeometry(3);
const STEP = 90; // ms between games when animating

// Static, read-only copy of the main diamond for one finished Bo5 series:
// frame, a tinted cell per game, and the centre-to-centre path that exits
// through the winner's edge — same geometry as DiagramEngine.renderPath.
export function MiniDiamond({ seriesKey, highlight = null, animate = false, className = "", delay = 0 }: Props) {
  const path = seriesKey.split("") as Path;
  const n = path.length;
  const H = GEO.H;

  const segs = path.map((g, j) => {
    const p0 = pt(path, j, GEO);
    const p1 =
      j < n - 1
        ? pt(path, j + 1, GEO)
        : { x: p0.x + H * 0.875, y: p0.y + H * 0.875 * (g === "a" ? -1 : 1) };
    return { g, p0, p1, len: Math.hypot(p1.x - p0.x, p1.y - p0.y) };
  });

  return (
    <svg
      className={"mini-diamond" + (animate ? " animate" : "") + (highlight != null ? " has-hl" : "") + " " + className}
      viewBox="28 28 424 424"
      aria-hidden="true"
    >
      <polygon className="md-frame" points="48,240 240,48 432,240 240,432" />
      {path.map((g, i) => {
        const c = pt(path, i, GEO);
        return (
          <polygon
            key={"c" + i}
            className={"md-cell " + (g === "a" ? "up" : "down") + (highlight === i ? " hl" : "")}
            points={`${c.x - H},${c.y} ${c.x},${c.y - H} ${c.x + H},${c.y} ${c.x},${c.y + H}`}
            style={animate ? { animationDelay: `${delay + 120 + i * STEP}ms` } : undefined}
          />
        );
      })}
      {segs.map((s, j) => (
        <line
          key={"s" + j}
          className={"md-seg " + (s.g === "a" ? "up" : "down") + (highlight === j ? " hl" : "")}
          x1={s.p0.x}
          y1={s.p0.y}
          x2={s.p1.x}
          y2={s.p1.y}
          style={
            animate
              ? ({ strokeDasharray: s.len, strokeDashoffset: s.len, animationDelay: `${delay + 160 + j * STEP}ms` } as CSSProperties)
              : undefined
          }
        />
      ))}
      <circle className="md-start" cx={GEO.X0} cy={GEO.CY} r={7} />
    </svg>
  );
}
