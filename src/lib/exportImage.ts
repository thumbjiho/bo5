const SVG_NS = "http://www.w3.org/2000/svg";
const SCALE = 2; // retina-ish output

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

function readNameSegments(nameEl: HTMLElement, up: string, down: string, muted: string, ink: string): NameSegment[] {
  const spans = nameEl.querySelectorAll("span");
  if (spans.length === 0) {
    return [{ text: nameEl.textContent || "", color: ink }];
  }
  return Array.from(nameEl.childNodes).map((node) => {
    if (node.nodeType === Node.TEXT_NODE) return { text: node.textContent || "", color: ink };
    const el = node as HTMLElement;
    const color = el.classList.contains("w") ? up : el.classList.contains("l") ? down : muted;
    return { text: el.textContent || "", color };
  });
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

// Draws the score / name / tagline cluster with plain canvas text — avoids
// the foreignObject-taints-canvas problem entirely (see rasterizeDiagram).
function drawReadout(readoutEl: HTMLElement, width: number): HTMLCanvasElement {
  const sans = cssVar("--sans", "sans-serif");
  const mono = cssVar("--mono", "monospace");
  const up = cssVar("--up", "#2f9e5f");
  const down = cssVar("--down", "#cc3f5c");
  const ink = cssVar("--ink", "#191d1b");
  const muted = cssVar("--muted", "#6a726e");

  const scoreA = readoutEl.querySelector(".s-a")?.textContent || "0";
  const scoreB = readoutEl.querySelector(".s-b")?.textContent || "0";
  const nameEl = readoutEl.querySelector(".name") as HTMLElement | null;
  const nameSegments = nameEl ? readNameSegments(nameEl, up, down, muted, ink) : [];
  const tagline = readoutEl.querySelector(".tagline")?.textContent || "";

  const maxTextWidth = width - 64;

  // measure pass (1x canvas, font metrics only) to lay out lines
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = `600 40px ${sans}`;
  const nameLineWidth = nameSegments.reduce((w, s) => w + measure.measureText(s.text).width, 0);
  const nameScale = nameLineWidth > maxTextWidth ? maxTextWidth / nameLineWidth : 1;
  const nameFontSize = Math.max(22, Math.floor(40 * nameScale));

  measure.font = `14.5px ${sans}`;
  const taglineLines = tagline ? wrapText(measure, tagline, maxTextWidth) : [];

  const scoreH = 34;
  const nameH = nameFontSize + 20;
  const taglineLineH = 21;
  const gap = 14;
  const height =
    24 + scoreH + gap + nameH + (taglineLines.length ? gap + taglineLines.length * taglineLineH : 0) + 24;

  const canvas = document.createElement("canvas");
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  let y = 24 + scoreH * 0.7;
  const cx = width / 2;

  // score: "A : B", each half coloured, centred as a unit
  ctx.font = `500 15px ${mono}`;
  const scoreAw = ctx.measureText(scoreA).width;
  const sepW = ctx.measureText(" : ").width;
  const scoreBw = ctx.measureText(scoreB).width;
  const scoreTotal = scoreAw + sepW + scoreBw;
  let sx = cx - scoreTotal / 2;
  ctx.textAlign = "left";
  ctx.fillStyle = up;
  ctx.fillText(scoreA, sx, y);
  sx += scoreAw;
  ctx.fillStyle = muted;
  ctx.fillText(" : ", sx, y);
  sx += sepW;
  ctx.fillStyle = down;
  ctx.fillText(scoreB, sx, y);
  ctx.textAlign = "center";

  y += scoreH * 0.3 + gap + nameFontSize * 0.85;
  ctx.font = `600 ${nameFontSize}px ${sans}`;
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
    y += nameH * 0.35 + gap;
    ctx.font = `14.5px ${sans}`;
    ctx.fillStyle = muted;
    for (const line of taglineLines) {
      ctx.fillText(line, cx, y);
      y += taglineLineH;
    }
  }

  return canvas;
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
