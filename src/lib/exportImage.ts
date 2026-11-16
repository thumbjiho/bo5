const SVG_NS = "http://www.w3.org/2000/svg";
const SCALE = 4; // 2x retina baseline, doubled again for crisp downloads

function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function rasterizeSvgString(svgString: string, pxWidth: number, pxHeight: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pxWidth;
      canvas.height = pxHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, pxWidth, pxHeight);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

// The diagram itself (markers, patterns, paths) rasterizes cleanly through
// an <img> of a serialized SVG. Text is handled separately (see below)
// because a foreignObject anywhere in that SVG — even off in a sibling
// subtree — taints the canvas in Chromium/WebKit, so toBlob() throws
// SecurityError. Sticking to plain SVG shapes here keeps this half safe.
async function rasterizeDiagram(svgEl: SVGSVGElement): Promise<HTMLCanvasElement> {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.querySelector("#cursor")?.remove();
  clone.querySelector("#anatomy")?.remove();
  clone.removeAttribute("class");
  clone.setAttribute("width", String(480 * SCALE));
  clone.setAttribute("height", String(480 * SCALE));

  const style = document.createElementNS(SVG_NS, "style");
  style.textContent = `
    #frame{fill:none;stroke:${cssVar("--frame", "#d6dbd8")};stroke-width:1.5;stroke-linejoin:round}
    .cell.up{fill:${cssVar("--up-band", "rgba(47,158,95,.16)")}}
    .cell.down{fill:${cssVar("--down-band", "rgba(204,63,92,.13)")}}
    .seg{fill:none;stroke:${cssVar("--muted", "#6a726e")};stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round}
    #path.won-up .seg{stroke:${cssVar("--up", "#2f9e5f")}}
    #path.won-down .seg{stroke:${cssVar("--down", "#cc3f5c")}}
    .finish{opacity:0;stroke-width:3;stroke-linecap:round}
    .finish.up{stroke:${cssVar("--up", "#2f9e5f")}}
    .finish.down{stroke:${cssVar("--down", "#cc3f5c")}}
    .finish.show{opacity:1}
    .arrow-a{fill:${cssVar("--up", "#2f9e5f")}}
    .arrow-b{fill:${cssVar("--down", "#cc3f5c")}}
    .arrow-p{fill:${cssVar("--muted", "#6a726e")}}
    #start{fill:${cssVar("--muted", "#6a726e")}}
    #lattice{opacity:0}
  `;
  clone.insertBefore(style, clone.firstChild);

  const xml = new XMLSerializer().serializeToString(clone);
  return rasterizeSvgString(xml, 480 * SCALE, 480 * SCALE);
}

interface NameSegment {
  text: string;
  color: string;
}

function readNameSegments(nameEl: HTMLElement): NameSegment[] {
  const spans = nameEl.querySelectorAll("span");
  if (spans.length === 0) {
    return [{ text: nameEl.textContent || "", color: getComputedStyle(nameEl).color }];
  }
  return Array.from(nameEl.childNodes).map((node) => {
    if (node.nodeType === Node.TEXT_NODE) return { text: node.textContent || "", color: getComputedStyle(nameEl).color };
    const el = node as HTMLElement;
    return { text: el.textContent || "", color: getComputedStyle(el).color };
  });
}

// Reads the live, currently-rendered font shorthand off a real element, so
// the export matches whatever is actually on screen (responsive clamp()
// sizes included) instead of a hand-picked size.
function fontOf(el: Element, weight?: string): string {
  const cs = getComputedStyle(el);
  return `${weight ?? cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? line + " " + word : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function readSeqChips(readoutEl: HTMLElement): { colors: string[]; size: number; gap: number; radius: number } {
  const chips = Array.from(readoutEl.querySelectorAll(".seq span"));
  const seqEl = readoutEl.querySelector(".seq");
  const first = chips[0] ? getComputedStyle(chips[0]) : null;
  return {
    colors: chips.map((c) => getComputedStyle(c).backgroundColor),
    size: first ? parseFloat(first.width) : 13,
    gap: seqEl ? parseFloat(getComputedStyle(seqEl).columnGap) : 7,
    radius: first ? parseFloat(first.borderRadius) : 3,
  };
}

// Draws the score / sequence chips / name / tagline cluster with plain
// canvas text — avoids the foreignObject-taints-canvas problem entirely
// (see rasterizeDiagram). Every size/weight/color here is read straight off
// the live, on-screen elements via getComputedStyle, so the export matches
// exactly what's currently rendered rather than a hand-picked layout.
function drawReadout(readoutEl: HTMLElement, width: number): HTMLCanvasElement {
  const muted = cssVar("--muted", "#6a726e");

  const scoreAEl = readoutEl.querySelector(".s-a");
  const scoreBEl = readoutEl.querySelector(".s-b");
  const scoreA = scoreAEl?.textContent || "0";
  const scoreB = scoreBEl?.textContent || "0";
  const scoreFont = scoreAEl ? fontOf(scoreAEl) : "500 14px sans-serif";
  const scoreColorA = scoreAEl ? getComputedStyle(scoreAEl).color : muted;
  const scoreColorB = scoreBEl ? getComputedStyle(scoreBEl).color : muted;

  const seq = readSeqChips(readoutEl);

  const nameEl = readoutEl.querySelector(".name") as HTMLElement | null;
  const nameSegments = nameEl ? readNameSegments(nameEl) : [];
  const nameFont = nameEl ? fontOf(nameEl, "600") : "600 40px sans-serif";

  const taglineEl = readoutEl.querySelector(".tagline") as HTMLElement | null;
  const tagline = taglineEl?.textContent || "";
  const taglineFont = taglineEl ? fontOf(taglineEl) : "14.5px sans-serif";
  const taglineColor = taglineEl ? getComputedStyle(taglineEl).color : muted;

  const maxTextWidth = width - 64;

  // measure pass (1x canvas, font metrics only) to lay out lines
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = scoreFont;
  const scoreSize = parseFloat(scoreFont.split(" ")[1]) || 14;

  measure.font = nameFont;
  const nameSize = parseFloat(nameFont.split(" ")[1]) || 40;

  measure.font = taglineFont;
  const taglineLines = tagline ? wrapText(measure, tagline, maxTextWidth) : [];
  const taglineLineH = Math.round(taglineEl ? parseFloat(getComputedStyle(taglineEl).lineHeight) : taglineSize(taglineFont) * 1.4);

  const gap = readoutEl ? parseFloat(getComputedStyle(readoutEl).rowGap || getComputedStyle(readoutEl).gap) || 12 : 12;
  const scoreH = scoreSize * 1.2;
  const seqH = seq.colors.length ? seq.size : 0;
  const nameH = nameSize * 1.15;
  const height =
    28 +
    scoreH +
    (seqH ? gap + seqH : 0) +
    gap +
    nameH +
    (taglineLines.length ? gap + taglineLines.length * taglineLineH : 0) +
    28;

  const canvas = document.createElement("canvas");
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const cx = width / 2;
  let y = 28 + scoreH * 0.8;

  // score: "A : B", each half coloured, centred as a unit
  ctx.font = scoreFont;
  const scoreAw = ctx.measureText(scoreA).width;
  const sepW = ctx.measureText(" : ").width;
  const scoreBw = ctx.measureText(scoreB).width;
  let sx = cx - (scoreAw + sepW + scoreBw) / 2;
  ctx.textAlign = "left";
  ctx.fillStyle = scoreColorA;
  ctx.fillText(scoreA, sx, y);
  sx += scoreAw;
  ctx.fillStyle = muted;
  ctx.fillText(" : ", sx, y);
  sx += sepW;
  ctx.fillStyle = scoreColorB;
  ctx.fillText(scoreB, sx, y);
  ctx.textAlign = "center";

  if (seq.colors.length) {
    y += seqH * 0.5 + gap;
    const totalChipW = seq.colors.length * seq.size + (seq.colors.length - 1) * seq.gap;
    let chipX = cx - totalChipW / 2;
    const chipY = y - seq.size * 0.85;
    for (const color of seq.colors) {
      ctx.fillStyle = color;
      if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(chipX, chipY, seq.size, seq.size, seq.radius);
        ctx.fill();
      } else {
        ctx.fillRect(chipX, chipY, seq.size, seq.size);
      }
      chipX += seq.size + seq.gap;
    }
  }

  y += gap + nameH * 0.72;
  ctx.font = nameFont;
  const totalNameW = nameSegments.reduce((w, s) => w + ctx.measureText(s.text).width, 0);
  let nx = cx - totalNameW / 2;
  ctx.textAlign = "left";
  for (const seg of nameSegments) {
    ctx.fillStyle = seg.color;
    ctx.fillText(seg.text, nx, y);
    nx += ctx.measureText(seg.text).width;
  }
  ctx.textAlign = "center";

  if (taglineLines.length) {
    y += nameH * 0.3 + gap;
    ctx.font = taglineFont;
    ctx.fillStyle = taglineColor;
    for (const line of taglineLines) {
      ctx.fillText(line, cx, y);
      y += taglineLineH;
    }
  }

  return canvas;
}

function taglineSize(font: string): number {
  return parseFloat(font.split(" ")[1]) || 14.5;
}

// Composites the live diagram SVG and the score/name/tagline readout into
// one PNG and triggers a download.
export async function exportDiagramImage(svgEl: SVGSVGElement, readoutEl: HTMLElement, filename: string): Promise<void> {
  const diagramCanvas = await rasterizeDiagram(svgEl);
  const panelWidth = 480;
  const readoutCanvas = drawReadout(readoutEl, panelWidth);
  const readoutHeight = readoutCanvas.height / SCALE;

  const gap = 20;
  const pad = 40;
  const totalW = panelWidth + pad * 2;
  const totalH = 480 + gap + readoutHeight + pad * 2;

  const canvas = document.createElement("canvas");
  canvas.width = totalW * SCALE;
  canvas.height = totalH * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = cssVar("--bg", "#f6f8f7");
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(diagramCanvas, pad * SCALE, pad * SCALE, 480 * SCALE, 480 * SCALE);
  ctx.drawImage(readoutCanvas, pad * SCALE, (pad + 480 + gap) * SCALE, panelWidth * SCALE, readoutHeight * SCALE);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png")
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
