import type { RefObject } from "react";

export interface DiagramSvgRefs {
  svgRef: RefObject<SVGSVGElement>;
  cellsRef: RefObject<SVGGElement>;
  latticeRef: RefObject<SVGGElement>;
  frameRef: RefObject<SVGPolygonElement>;
  finishARef: RefObject<SVGLineElement>;
  finishBRef: RefObject<SVGLineElement>;
  pathRef: RefObject<SVGGElement>;
  warfrontCellsRef: RefObject<SVGGElement>;
  mountainLabelsRef: RefObject<SVGGElement>;
  valleyLabelsRef: RefObject<SVGGElement>;
  mpWinCellsRef: RefObject<SVGGElement>;
  mpLoseCellsRef: RefObject<SVGGElement>;
  finalCellRef: RefObject<SVGGElement>;
  warpathHitRef: RefObject<SVGPolylineElement>;
  gameMarkersRef: RefObject<SVGGElement>;
  dominanceLabelsRef: RefObject<SVGGElement>;
}

interface DiagramProps extends DiagramSvgRefs {
  wins: number;
}

// The interactive diamond. Structure is a near-verbatim port of the
// original inline SVG — the empty <g> containers (#cells, #lattice,
// #path, ...) are filled imperatively by DiagramEngine, exactly as before.
export function Diagram({
  wins,
  svgRef,
  cellsRef,
  latticeRef,
  frameRef,
  finishARef,
  finishBRef,
  pathRef,
  warfrontCellsRef,
  mountainLabelsRef,
  valleyLabelsRef,
  mpWinCellsRef,
  mpLoseCellsRef,
  finalCellRef,
  warpathHitRef,
  gameMarkersRef,
  dominanceLabelsRef,
}: DiagramProps) {
  const bo = 2 * wins - 1;
  return (
    <div className="board">
      <svg
        id="diagram"
        ref={svgRef}
        viewBox="0 0 480 480"
        role="img"
        aria-label={`Best-of-${bo} series diagram. Move the cursor across the diamond to trace a series.`}
      >
        <defs>
          <marker id="arrow-a" markerWidth={14} markerHeight={14} refX={4} refY={5} orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L9,5 L0,10 Z" className="arrow-a" />
          </marker>
          <marker id="arrow-b" markerWidth={14} markerHeight={14} refX={4} refY={5} orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L9,5 L0,10 Z" className="arrow-b" />
          </marker>
          <marker id="arrow-p" markerWidth={14} markerHeight={14} refX={4} refY={5} orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L9,5 L0,10 Z" className="arrow-p" />
          </marker>
          <pattern id="hatch-w" width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(90)">
            <rect width={6} height={6} className="hatch-w-bg" />
            <line x1={0} y1={0} x2={0} y2={6} className="hatch-w-line" />
          </pattern>
          <pattern id="hatch-l" width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(0)">
            <rect width={6} height={6} className="hatch-l-bg" />
            <line x1={0} y1={0} x2={0} y2={6} className="hatch-l-line" />
          </pattern>
        </defs>
        <g id="cells" ref={cellsRef} />
        <g id="lattice" ref={latticeRef} />
        <polygon id="frame" ref={frameRef} points="" />
        <line id="finish-a" ref={finishARef} className="finish up" x1={240} y1={48} x2={432} y2={240} />
        <line id="finish-b" ref={finishBRef} className="finish down" x1={432} y1={240} x2={240} y2={432} />
        <g id="path" ref={pathRef} />
        <g id="anatomy" aria-hidden="true">
          <g className="ana-part" data-part="battlefield">
            <polygon id="bf-hit" points="48,240 240,48 432,240 240,432" />
          </g>
          <g className="ana-part" data-part="warfront" id="warfront-cells" ref={warfrontCellsRef} />
          <g className="ana-part" data-part="mountain">
            <line className="edge-line up-edge" x1={240} y1={48} x2={432} y2={240} />
            <g className="edge-labels" id="mountain-labels" ref={mountainLabelsRef} />
            <line className="hit" x1={240} y1={48} x2={432} y2={240} />
          </g>
          <g className="ana-part" data-part="valley">
            <line className="edge-line down-edge" x1={432} y1={240} x2={240} y2={432} />
            <g className="edge-labels" id="valley-labels" ref={valleyLabelsRef} />
            <line className="hit" x1={432} y1={240} x2={240} y2={432} />
          </g>
          <g className="ana-part" data-part="mpwin" id="mpwin-cells" ref={mpWinCellsRef} />
          <g className="ana-part" data-part="mplose" id="mplose-cells" ref={mpLoseCellsRef} />
          <g className="ana-part" data-part="final" id="final-cell" ref={finalCellRef} />
          <g className="ana-part" data-part="dominance">
            <line className="lod-line" x1={48} y1={240} x2={432} y2={240} />
            <g className="edge-labels" id="dominance-labels" ref={dominanceLabelsRef} />
            <line className="hit" x1={48} y1={240} x2={432} y2={240} />
          </g>
          <g className="ana-part" data-part="warpath">
            <polyline className="hit-poly" id="warpath-hit" ref={warpathHitRef} points="" />
          </g>
          <g id="game-markers" ref={gameMarkersRef} />
        </g>
      </svg>
    </div>
  );
}
