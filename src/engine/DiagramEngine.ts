import type { Game, Lang, Mode, Path, PartKey } from "../types";
import { nameFor } from "../data/names";
import { I18N } from "../data/i18n";
import { PARTS } from "../data/parts";
import { ended, makeGeometry, mirrorKey, pt, tally, buildCatalog, type Geometry, decide as decideGame } from "../lib/series";

const NS = "http://www.w3.org/2000/svg";

export interface DiagramRefs {
  svg: SVGSVGElement;
  cells: SVGGElement;
  path: SVGGElement;
  frame: SVGPolygonElement;
  finishA: SVGLineElement;
  finishB: SVGLineElement;
  warpathHit: SVGPolylineElement;
  lattice: SVGGElement;
  mountainLabels: SVGGElement;
  valleyLabels: SVGGElement;
  mpWinCells: SVGGElement;
  mpLoseCells: SVGGElement;
  finalCell: SVGGElement;
  warfrontCells: SVGGElement;

  scoreA: HTMLElement;
  scoreB: HTMLElement;
  seq: HTMLElement;
  name: HTMLElement;
  tagline: HTMLElement;
  page: HTMLElement;
  navPrev: HTMLButtonElement;
  navFlip: HTMLButtonElement;
  navNext: HTMLButtonElement;

  anaName: HTMLElement;
  anaDesc: HTMLElement;
}

// Ports the original vanilla-JS tracer/anatomy widget almost verbatim: this
// stays a single imperative, ref-driven engine (rather than React state)
// because the drawing depends on precise animation timing — staggered
// enter-delays, a deferred arrowhead attach on `animationend`, a two-frame
// deferred colour flush on clinch — that's fragile to reproduce through
// React's render cycle. React only owns the static markup and the
// mode/format/lang controls; everything below is a faithful port.
export class DiagramEngine {
  private refs: DiagramRefs;
  private reduced: boolean;

  private wins = 3;
  private geo: Geometry = makeGeometry(3);
  private mode: Mode = "home";
  private lang: Lang = "en";

  private frozen: Path = [];
  private lastKey: string | null = null;
  private flushSeq = 0;
  private seeded = false;
  private shownName = "";
  private catalog: string[] = [];
  private curPart: PartKey | null = null;
  onPathChange: ((hasPath: boolean) => void) | null = null;

  private onPointerMove = (e: PointerEvent) => {
    if (this.mode === "anatomy") return; // anatomy is inspect-only
    const v = this.toViewBox(e);
    this.recompute(v.x, v.y);
  };
  private onPointerDown = (e: PointerEvent) => {
    if (this.mode === "anatomy") return;
    const v = this.toViewBox(e);
    this.recompute(v.x, v.y);
  };
  private onNavPrev = () => this.step(-1);
  private onNavNext = () => this.step(1);
  private onNavFlip = () => {
    if (this.lastKey) this.showKey(mirrorKey(this.lastKey));
  };
  private partHandlers: { part: Element; enter: () => void; leave: () => void }[] = [];

  constructor(refs: DiagramRefs) {
    this.refs = refs;
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.refs.frame.setAttribute("points", "48,240 240,48 432,240 240,432");
  }

  mount() {
    const { svg, navPrev, navFlip, navNext } = this.refs;
    svg.addEventListener("pointermove", this.onPointerMove);
    svg.addEventListener("pointerdown", this.onPointerDown);
    navPrev.addEventListener("click", this.onNavPrev);
    navNext.addEventListener("click", this.onNavNext);
    navFlip.addEventListener("click", this.onNavFlip);

    svg.querySelectorAll<SVGGElement>(".ana-part").forEach((part) => {
      const key = part.getAttribute("data-part") as PartKey;
      const enter = () => {
        svg.classList.add("ana-dim");
        svg.classList.add("focus-" + key);
        part.classList.add("focused");
        this.curPart = key;
        const fn = PARTS[key];
        if (fn) this.setAna(fn(this.wins, this.lang), true);
      };
      const leave = () => {
        svg.classList.remove("ana-dim");
        svg.classList.remove("focus-" + key);
        part.classList.remove("focused");
        this.curPart = null;
        this.setAna(I18N[this.lang].anaDefault, true);
      };
      part.addEventListener("pointerenter", enter);
      part.addEventListener("pointerleave", leave);
      this.partHandlers.push({ part, enter, leave });
    });
  }

  destroy() {
    const { svg, navPrev, navFlip, navNext } = this.refs;
    svg.removeEventListener("pointermove", this.onPointerMove);
    svg.removeEventListener("pointerdown", this.onPointerDown);
    navPrev.removeEventListener("click", this.onNavPrev);
    navNext.removeEventListener("click", this.onNavNext);
    navFlip.removeEventListener("click", this.onNavFlip);
    this.partHandlers.forEach(({ part, enter, leave }) => {
      part.removeEventListener("pointerenter", enter);
      part.removeEventListener("pointerleave", leave);
    });
    this.partHandlers = [];

    // undo the DOM writes from renders, so a StrictMode dev remount
    // (mount -> destroy -> mount) starts from a clean slate
    const groups = [
      this.refs.cells,
      this.refs.path,
      this.refs.lattice,
      this.refs.mountainLabels,
      this.refs.valleyLabels,
      this.refs.mpWinCells,
      this.refs.mpLoseCells,
      this.refs.finalCell,
      this.refs.warfrontCells,
    ];
    groups.forEach((g) => {
      while (g.firstChild) g.removeChild(g.firstChild);
    });
  }

  // ---- public controls (called from React effects) ----

  setFormat(n: number) {
    this.wins = n;
    this.geo = makeGeometry(n);
    this.flushSeq++;
    this.buildLattice();
    this.buildAnatomyTicks();
    this.catalog = buildCatalog(n);
    this.seeded = false;
    this.frozen = [];
    this.lastKey = "";
    this.renderPath([], "");
    if (this.mode === "anatomy") this.seedWarpath(); // keep the exhibit alive across format changes
    this.refreshLangDependent();
  }

  setMode(m: Mode) {
    this.mode = m;
    if (m === "anatomy" && this.lastKey === "") {
      this.seedWarpath(); // nothing traced yet: give anatomy a path
    } else if (m !== "anatomy" && this.seeded) {
      this.seeded = false; // leaving with the seed untouched: back to empty
      this.frozen = [];
      this.lastKey = "";
      this.renderPath([], "");
    }
  }

  setLang(lang: Lang) {
    this.lang = lang;
    this.refreshLangDependent();
  }

  // current traced/shown key, for callers that need it (e.g. image export)
  getCurrentPath(): Path {
    return this.lastKey ? (this.lastKey.split("") as Path) : [];
  }
  getCurrentKey(): string {
    return this.lastKey || "";
  }
  getCatalogIndex(): number {
    return this.lastKey ? this.catalog.indexOf(this.lastKey) : -1;
  }
  getCatalogLength(): number {
    return this.catalog.length;
  }

  private refreshLangDependent() {
    const t = I18N[this.lang];
    const fn = this.curPart ? PARTS[this.curPart] : null;
    this.setAna(fn ? fn(this.wins, this.lang) : t.anaDefault, false);
    this.shownName = ""; // force the big label to re-render
    this.updateReadout(this.lastKey ? (this.lastKey.split("") as Path) : []);
  }

  private seedWarpath() {
    // one win, so there is a warpath to inspect
    this.seeded = true;
    this.frozen = ["a"];
    this.lastKey = "a";
    this.renderPath(["a"], "");
  }

  // ---- pointer tracing ----

  private toViewBox(evt: PointerEvent) {
    const p = this.refs.svg.createSVGPoint();
    p.x = evt.clientX;
    p.y = evt.clientY;
    return p.matrixTransform(this.refs.svg.getScreenCTM()!.inverse());
  }

  private decide(p: Path, vy: number): Game {
    return decideGame(p, vy, this.geo);
  }

  private recompute(vx: number, vy: number) {
    this.seeded = false; // the user is tracing now
    const g = (vx - this.geo.X0) / this.geo.H;
    const liveCol = Math.max(0, Math.min(2 * this.wins - 2, Math.floor(g)));

    // cursor retreated: drop frozen columns to the right
    while (this.frozen.length > liveCol) this.frozen.pop();
    // cursor advanced across skipped columns: fill using current height
    while (this.frozen.length < liveCol && !ended(this.frozen, this.wins)) {
      this.frozen.push(this.decide(this.frozen, vy));
    }

    const path = this.frozen.slice();
    if (!ended(path, this.wins) && path.length < 2 * this.wins - 1) {
      path.push(this.decide(path, vy)); // live step under the cursor
    }
    const key = path.join("");
    if (key !== this.lastKey) {
      this.renderPath(path, this.lastKey || ""); // rebuild only when the series changes,
      this.lastKey = key; // so enter-animations play uninterrupted
    }
  }

  private renderPath(path: Path, prevKey: string) {
    const { cells, path: gPath, finishA, finishB, warpathHit } = this.refs;
    while (gPath.firstChild) gPath.removeChild(gPath.firstChild);
    while (cells.firstChild) cells.removeChild(cells.firstChild);

    const n = path.length;
    const done = ended(path, this.wins);
    const t = tally(path);
    const key = path.join("");
    // games shared with the previous render keep their final state;
    // everything from `fresh` onward gets an enter animation
    let fresh = 0;
    while (fresh < key.length && fresh < prevKey.length && key[fresh] === prevKey[fresh]) fresh++;

    // shade the cell each game was played from, in that game's winner colour
    const H = this.geo.H;
    for (let i = 0; i < n; i++) {
      const c = pt(path, i, this.geo);
      const poly = document.createElementNS(NS, "polygon");
      poly.setAttribute(
        "points",
        `${c.x - H},${c.y} ${c.x},${c.y - H} ${c.x + H},${c.y} ${c.x},${c.y + H}`
      );
      poly.setAttribute("class", "cell " + (path[i] === "a" ? "up" : "down") + (i >= fresh ? " enter" : ""));
      if (i > fresh) (poly as unknown as HTMLElement).style.animationDelay = (i - fresh) * 70 + "ms";
      cells.appendChild(poly);
    }

    // segments centre → centre; the clinching game becomes the exit arrow.
    // the live (unconfirmed) segment stays grey until the series is decided
    const inner = done ? n - 1 : n;
    for (let j = 0; j < inner; j++) {
      const live = !done && j === inner - 1;
      this.addSeg(path[j], pt(path, j, this.geo), pt(path, j + 1, this.geo), live, j >= fresh, j - fresh, live);
    }
    if (done && n > 0) {
      const p0 = pt(path, n - 1, this.geo);
      const dir = path[n - 1] === "a" ? -1 : 1;
      const ov = H * 0.875;
      this.addSeg(
        path[n - 1],
        p0,
        { x: p0.x + ov, y: p0.y + ov * dir },
        true,
        n - 1 >= fresh,
        n - 1 - fresh,
        false
      );
    }

    // winner's finish edge
    finishA.classList.toggle("show", done && t.a === this.wins);
    finishB.classList.toggle("show", done && t.b === this.wins);

    // the anatomy warpath hover follows whatever series is actually drawn
    let wpPts = "";
    if (n > 0) {
      wpPts = `${this.geo.nodeX(0)},${this.geo.CY}`;
      const lastNode = done ? n - 1 : n;
      for (let q = 1; q <= lastNode; q++) {
        const pq = pt(path, q, this.geo);
        wpPts += ` ${pq.x},${pq.y}`;
      }
      if (done) {
        const pe = pt(path, n - 1, this.geo);
        const ov2 = H * 0.875;
        const d2 = path[n - 1] === "a" ? -1 : 1;
        wpPts += ` ${pe.x + ov2},${pe.y + ov2 * d2}`;
      }
    }
    warpathHit.setAttribute("points", wpPts);

    // on the clinch, flush the whole grey path in the winner's colour.
    // applied one frame late so freshly built segments transition from grey
    const seq = ++this.flushSeq;
    if (done) {
      const wonUp = t.a === this.wins;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (seq !== this.flushSeq) return; // a newer render superseded us
          gPath.classList.toggle("won-up", wonUp);
          gPath.classList.toggle("won-down", !wonUp);
        });
      });
    } else {
      gPath.classList.remove("won-up");
      gPath.classList.remove("won-down");
    }

    // start dot
    const s = document.createElementNS(NS, "circle");
    s.setAttribute("id", "start");
    s.setAttribute("cx", String(this.geo.nodeX(0)));
    s.setAttribute("cy", String(this.geo.CY));
    s.setAttribute("r", "4");
    gPath.insertBefore(s, gPath.firstChild);

    this.updateReadout(path);
  }

  private addSeg(
    type: Game,
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    isLast: boolean,
    entering: boolean,
    order: number,
    pending: boolean
  ) {
    const ln = document.createElementNS(NS, "line");
    ln.setAttribute("x1", String(p0.x));
    ln.setAttribute("y1", String(p0.y));
    ln.setAttribute("x2", String(p1.x));
    ln.setAttribute("y2", String(p1.y));
    ln.setAttribute(
      "class",
      "seg " + (type === "a" ? "up" : "down") + (pending ? " pending" : "") + (entering ? " enter" : "")
    );
    if (entering) {
      ln.style.setProperty("--len", (Math.hypot(p1.x - p0.x, p1.y - p0.y) + 1).toFixed(1));
      if (order > 0) ln.style.animationDelay = order * 70 + "ms";
    }
    if (isLast) {
      // the arrowhead is a marker, which SVG places instantly — attach it only
      // once the draw animation has finished so it rides in with the line
      const m = `url(#arrow-${pending ? "p" : type === "a" ? "a" : "b"})`;
      if (entering && !this.reduced) {
        const attach = () => ln.setAttribute("marker-end", m);
        ln.addEventListener("animationend", attach, { once: true });
        setTimeout(attach, 700); // safety net if the event never fires
      } else {
        ln.setAttribute("marker-end", m);
      }
    }
    this.refs.path.appendChild(ln);
  }

  private retrigger(el: Element, cls: string) {
    el.classList.remove(cls);
    void (el as HTMLElement).offsetWidth;
    el.classList.add(cls);
  }

  private updateReadout(path: Path) {
    const { scoreA, scoreB, seq, name, tagline, navPrev, navFlip, navNext, page } = this.refs;
    const t = tally(path);
    const key = path.join("");
    const done = ended(path, this.wins);

    if (scoreA.textContent !== String(t.a)) {
      scoreA.textContent = String(t.a);
      this.retrigger(scoreA, "pop");
    }
    if (scoreB.textContent !== String(t.b)) {
      scoreB.textContent = String(t.b);
      this.retrigger(scoreB, "pop");
    }
    // sequence chips
    while (seq.firstChild) seq.removeChild(seq.firstChild);
    for (const g of path) {
      const sp = document.createElement("span");
      sp.className = g === "a" ? "up" : "down";
      seq.appendChild(sp);
    }

    const entry = done ? nameFor(key, this.wins, this.lang) : null;
    const nameKey = entry ? "n:" + entry[0] : path.length ? "s:" + key : "idle";

    if (nameKey !== this.shownName) {
      this.shownName = nameKey;
      while (name.firstChild) name.removeChild(name.firstChild);
      if (entry) {
        name.appendChild(document.createTextNode(entry[0]));
        tagline.textContent = entry[1];
        this.retrigger(tagline, "swap");
      } else if (path.length > 0) {
        // running W–L tape of the series so far
        for (let k = 0; k < path.length; k++) {
          if (k > 0) {
            const sep = document.createElement("span");
            sep.className = "sep";
            sep.textContent = "–";
            name.appendChild(sep);
          }
          const g = document.createElement("span");
          g.className = path[k] === "a" ? "w" : "l";
          g.textContent = path[k] === "a" ? "W" : "L";
          name.appendChild(g);
        }
        tagline.textContent = "";
      } else {
        name.appendChild(document.createTextNode(I18N[this.lang].trace));
        tagline.innerHTML = I18N[this.lang].hint; // the how-to lives in the subtitle slot
        this.retrigger(tagline, "swap");
      }
      this.retrigger(name, "swap");
    }
    name.classList.toggle("pending", !entry);

    // outcome navigation is only meaningful on a finished series
    navPrev.disabled = !done;
    navNext.disabled = !done;
    navFlip.disabled = path.length === 0;
    this.onPathChange?.(path.length > 0);

    // pagination: position within all possible outcomes of this format
    if (done) {
      const idx = this.catalog.indexOf(key);
      page.textContent = `${idx + 1} / ${this.catalog.length}`;
    } else {
      page.textContent = `– / ${this.catalog.length}`;
    }
  }

  // ---- outcome navigation (◀ flip ▶) ----

  private showKey(key: string) {
    this.seeded = false;
    this.frozen = key.split("") as Path;
    const prev = this.lastKey;
    this.lastKey = key;
    this.renderPath(key.split("") as Path, prev || "");
  }

  private step(dir: 1 | -1) {
    if (!this.lastKey || !ended(this.lastKey.split("") as Path, this.wins)) return;
    const i = this.catalog.indexOf(this.lastKey);
    if (i < 0) return;
    this.showKey(this.catalog[(i + dir + this.catalog.length) % this.catalog.length]);
  }

  // ---- lattice + anatomy ticks (format-dependent) ----

  private latLine(x1: number, y1: number, x2: number, y2: number) {
    const ln = document.createElementNS(NS, "line");
    ln.setAttribute("x1", String(x1));
    ln.setAttribute("y1", String(y1));
    ln.setAttribute("x2", String(x2));
    ln.setAttribute("y2", String(y2));
    this.refs.lattice.appendChild(ln);
  }

  private buildLattice() {
    // interior N×N cell boundaries
    const { lattice } = this.refs;
    while (lattice.firstChild) lattice.removeChild(lattice.firstChild);
    const c = 192 / this.wins;
    for (let j = 1; j < this.wins; j++) {
      this.latLine(48 + j * c, 240 + j * c, 240 + j * c, 48 + j * c); // parallel to the up-right edges
      this.latLine(48 + j * c, 240 - j * c, 240 + j * c, 432 - j * c); // parallel to the down-right edges
    }
  }

  private tick(group: SVGGElement, x: number, y: number, label: string) {
    const t = document.createElementNS(NS, "text");
    t.setAttribute("x", String(x));
    t.setAttribute("y", String(y));
    t.textContent = label;
    group.appendChild(t);
  }

  private anaCell(group: SVGGElement, a: number, b: number, cls: string) {
    const H = this.geo.H;
    const cx = 48 + (a + b + 1) * H;
    const cy = 240 - (a - b) * H;
    const poly = document.createElementNS(NS, "polygon");
    poly.setAttribute("points", `${cx - H},${cy} ${cx},${cy - H} ${cx + H},${cy} ${cx},${cy + H}`);
    poly.setAttribute("class", "ana-cell " + cls);
    group.appendChild(poly);
  }

  // score ticks along the finish edges — one per possible exit crossing —
  // plus the match-point cell regions
  private buildAnatomyTicks() {
    const { mountainLabels, valleyLabels, mpWinCells, mpLoseCells, finalCell, warfrontCells } = this.refs;
    const H = this.geo.H;
    [mountainLabels, valleyLabels, mpWinCells, mpLoseCells, finalCell, warfrontCells].forEach((g) => {
      while (g.firstChild) g.removeChild(g.firstChild);
    });
    // the opening warfront: every series starts its first game in cell (0,0)
    this.anaCell(warfrontCells, 0, 0, "wf");
    for (let i = 0; i < this.wins; i++) {
      // the clinching win comes from cell (WINS-1, i): crossing on the mountain edge
      this.tick(mountainLabels, 48 + (this.wins + i) * H + H / 2 + 10, 240 - (this.wins - 1 - i) * H - H / 2 - 8, `${this.wins}:${i}`);
      // the final loss comes from cell (i, WINS-1): crossing on the valley edge
      this.tick(valleyLabels, 48 + (this.wins + i) * H + H / 2 + 10, 240 + (this.wins - 1 - i) * H + H / 2 + 14, `${i}:${this.wins}`);
      // match-point cell bands (the shared corner cell is its own part, on top)
      this.anaCell(mpWinCells, this.wins - 1, i, "w");
      this.anaCell(mpLoseCells, i, this.wins - 1, "l");
    }
    // the delta carries BOTH hatchings — ridge and cliff overlap here
    this.anaCell(finalCell, this.wins - 1, this.wins - 1, "w");
    this.anaCell(finalCell, this.wins - 1, this.wins - 1, "l");
  }

  private setAna(entry: [string, string], animate: boolean) {
    const { anaName, anaDesc } = this.refs;
    anaName.textContent = entry[0];
    anaDesc.textContent = entry[1];
    if (animate) {
      this.retrigger(anaName, "swap");
      this.retrigger(anaDesc, "swap");
    }
  }

  // exposes internal geometry for the image-export helper
  getGeometry(): Geometry {
    return this.geo;
  }
  getWins(): number {
    return this.wins;
  }
}
