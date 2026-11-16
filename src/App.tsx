import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "./types";
import { I18N } from "./data/i18n";
import { DiagramEngine, type DiagramRefs } from "./engine/DiagramEngine";
import { exportDiagramImage } from "./lib/exportImage";
import { Diagram } from "./components/Diagram";
import { Readout } from "./components/Readout";
import { AnatomyPanel } from "./components/AnatomyPanel";
import { ThemeButton } from "./components/ThemeButton";
import { DownloadButton } from "./components/DownloadButton";
import { LangButton } from "./components/LangButton";
import { CursorRing } from "./components/CursorRing";
import { MatchList } from "./components/MatchList";
import { MatchDetail } from "./components/MatchDetail";
import { PatternGrid } from "./components/PatternGrid";
import type { FakerSeries } from "./data/faker";

export function App() {
  // Faker edition: Bo5 only, home view only (anatomy/settings parked for now)
  const wins = 3;
  const [lang, setLang] = useState<Lang>("ko");
  const [hasPath, setHasPath] = useState(false);
  const [seriesKey, setSeriesKey] = useState<string | null>(null);
  const [detail, setDetail] = useState<FakerSeries | null>(null);
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  const [showAll, setShowAll] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null!);
  const cellsRef = useRef<SVGGElement>(null!);
  const latticeRef = useRef<SVGGElement>(null!);
  const frameRef = useRef<SVGPolygonElement>(null!);
  const finishARef = useRef<SVGLineElement>(null!);
  const finishBRef = useRef<SVGLineElement>(null!);
  const pathRef = useRef<SVGGElement>(null!);
  const warfrontCellsRef = useRef<SVGGElement>(null!);
  const mountainLabelsRef = useRef<SVGGElement>(null!);
  const valleyLabelsRef = useRef<SVGGElement>(null!);
  const mpWinCellsRef = useRef<SVGGElement>(null!);
  const mpLoseCellsRef = useRef<SVGGElement>(null!);
  const finalCellRef = useRef<SVGGElement>(null!);
  const warpathHitRef = useRef<SVGPolylineElement>(null!);
  const gameMarkersRef = useRef<SVGGElement>(null!);
  const dominanceLabelsRef = useRef<SVGGElement>(null!);

  const readoutRef = useRef<HTMLDivElement>(null!);
  const scoreARef = useRef<HTMLSpanElement>(null!);
  const scoreBRef = useRef<HTMLSpanElement>(null!);
  const seqRef = useRef<HTMLDivElement>(null!);
  const nameRef = useRef<HTMLHeadingElement>(null!);
  const taglineRef = useRef<HTMLParagraphElement>(null!);
  const pageRef = useRef<HTMLParagraphElement>(null!);
  const navPrevRef = useRef<HTMLButtonElement>(null!);
  const navFlipRef = useRef<HTMLButtonElement>(null!);
  const navNextRef = useRef<HTMLButtonElement>(null!);

  const anaNameRef = useRef<HTMLHeadingElement>(null!);
  const anaDescRef = useRef<HTMLParagraphElement>(null!);

  const engineRef = useRef<DiagramEngine | null>(null);

  // mount the imperative engine once, wired to every ref above
  useEffect(() => {
    const refs: DiagramRefs = {
      svg: svgRef.current,
      cells: cellsRef.current,
      path: pathRef.current,
      frame: frameRef.current,
      finishA: finishARef.current,
      finishB: finishBRef.current,
      warpathHit: warpathHitRef.current,
      lattice: latticeRef.current,
      mountainLabels: mountainLabelsRef.current,
      valleyLabels: valleyLabelsRef.current,
      mpWinCells: mpWinCellsRef.current,
      mpLoseCells: mpLoseCellsRef.current,
      finalCell: finalCellRef.current,
      warfrontCells: warfrontCellsRef.current,
      gameMarkers: gameMarkersRef.current,
      dominanceLabels: dominanceLabelsRef.current,
      scoreA: scoreARef.current,
      scoreB: scoreBRef.current,
      seq: seqRef.current,
      name: nameRef.current,
      tagline: taglineRef.current,
      page: pageRef.current,
      navPrev: navPrevRef.current,
      navFlip: navFlipRef.current,
      navNext: navNextRef.current,
      anaName: anaNameRef.current,
      anaDesc: anaDescRef.current,
    };
    const engine = new DiagramEngine(refs);
    engine.onPathChange = setHasPath;
    engine.onSeriesChange = setSeriesKey;
    engine.mount();
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // format, mode, and language each drive the engine independently, same
  // as the original's setFormat()/setMode()/applyLang()
  useEffect(() => {
    engineRef.current?.setFormat(wins);
  }, [wins]);

  useEffect(() => {
    engineRef.current?.setLang(lang);
  }, [lang]);

  const handleDownload = async () => {
    const svg = svgRef.current;
    const readout = readoutRef.current;
    const engine = engineRef.current;
    if (!svg || !readout || !engine) return;
    const key = engine.getCurrentKey();
    const wl = key ? key.replace(/a/g, "w").replace(/b/g, "l") : "diagram";
    try {
      await exportDiagramImage(svg, readout, `bo5-${wl}.png`);
    } catch (err) {
      console.error("Failed to export diagram image", err);
    }
  };

  const openDetail = useCallback((s: FakerSeries, from: DOMRect) => {
    setOrigin(from);
    setDetail(s);
  }, []);
  const closeDetail = useCallback(() => setDetail(null), []);
  const toggleAll = useCallback(() => setShowAll((v) => !v), []);
  const closeAll = useCallback(() => setShowAll(false), []);
  // picking a pattern keeps the grid open: the right-hand list follows the
  // pick, and only the "모두 보기" toggle (or Esc) returns to the diagram
  const pickPattern = useCallback((key: string) => {
    engineRef.current?.showSeries(key);
  }, []);

  // the page behind an open overlay shouldn't scroll or take the cursor
  useEffect(() => {
    document.body.classList.toggle("overlay-open", detail != null);
  }, [detail]);

  useEffect(() => {
    document.body.classList.toggle("grid-mode", showAll);
  }, [showAll]);

  const t = I18N[lang];

  return (
    <>
      <section className="stage">
        <p className="eyebrow" id="eyebrow">{t.eyebrow()}</p>

        <div className="board-stack">
        <Diagram
          wins={wins}
          svgRef={svgRef}
          cellsRef={cellsRef}
          latticeRef={latticeRef}
          frameRef={frameRef}
          finishARef={finishARef}
          finishBRef={finishBRef}
          pathRef={pathRef}
          warfrontCellsRef={warfrontCellsRef}
          mountainLabelsRef={mountainLabelsRef}
          valleyLabelsRef={valleyLabelsRef}
          mpWinCellsRef={mpWinCellsRef}
          mpLoseCellsRef={mpLoseCellsRef}
          finalCellRef={finalCellRef}
          warpathHitRef={warpathHitRef}
          gameMarkersRef={gameMarkersRef}
          dominanceLabelsRef={dominanceLabelsRef}
        />
        <PatternGrid open={showAll} lang={lang} current={seriesKey} onPick={pickPattern} onClose={closeAll} />
        </div>

        <div className="panels">
          <Readout
            readoutRef={readoutRef}
            scoreARef={scoreARef}
            scoreBRef={scoreBRef}
            seqRef={seqRef}
            nameRef={nameRef}
            taglineRef={taglineRef}
            pageRef={pageRef}
            navPrevRef={navPrevRef}
            navFlipRef={navFlipRef}
            navNextRef={navNextRef}
            showAllLabel={lang === "ko" ? "모두 보기" : "Show all"}
            onShowAll={toggleAll}
            showAllActive={showAll}
          />
          {/* kept mounted (hidden by CSS outside anatomy mode) only because the engine holds its refs */}
          <AnatomyPanel lang={lang} anaNameRef={anaNameRef} anaDescRef={anaDescRef} />
        </div>

        <MatchList
          seriesKey={seriesKey}
          lang={lang}
          onOpen={openDetail}
        />
      </section>

      <p className="credit">
        <a href="https://umjo.me" target="_blank" rel="noopener noreferrer">umjo.me</a> · 2026
      </p>

      <ThemeButton />
      <LangButton lang={lang} onClick={() => setLang(lang === "en" ? "ko" : "en")} />
      <DownloadButton disabled={!hasPath} onClick={handleDownload} />
      {detail && <MatchDetail series={detail} lang={lang} origin={origin} onClose={closeDetail} />}
      <CursorRing />
    </>
  );
}
