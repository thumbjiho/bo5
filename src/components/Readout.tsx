import type { RefObject } from "react";

export interface ReadoutRefs {
  readoutRef: RefObject<HTMLDivElement>;
  scoreARef: RefObject<HTMLSpanElement>;
  scoreBRef: RefObject<HTMLSpanElement>;
  seqRef: RefObject<HTMLDivElement>;
  nameRef: RefObject<HTMLHeadingElement>;
  taglineRef: RefObject<HTMLParagraphElement>;
  pageRef: RefObject<HTMLParagraphElement>;
  navPrevRef: RefObject<HTMLButtonElement>;
  navFlipRef: RefObject<HTMLButtonElement>;
  navNextRef: RefObject<HTMLButtonElement>;
}

interface ReadoutProps extends ReadoutRefs {
  showAllLabel: string;
  onShowAll: () => void;
  showAllActive: boolean;
}

// Score, name, tagline, outcome nav, and pagination. All text/classes here
// are written imperatively by DiagramEngine (animated pop/swap timing),
// so this component only mounts the static shell and initial fallback text.
export function Readout({
  readoutRef,
  scoreARef,
  scoreBRef,
  seqRef,
  nameRef,
  taglineRef,
  pageRef,
  navPrevRef,
  navFlipRef,
  navNextRef,
  showAllLabel,
  onShowAll,
  showAllActive,
}: ReadoutProps) {
  return (
    <div className="readout" ref={readoutRef}>
      <div className="score" id="score">
        <span className="s-a" ref={scoreARef}>0</span>
        <i>:</i>
        <span className="s-b" ref={scoreBRef}>0</span>
      </div>
      <div className="seq" id="seq" ref={seqRef} aria-hidden="true" />
      <h1 className="name" id="name" ref={nameRef}>Trace a series</h1>
      <p className="tagline" id="tagline" ref={taglineRef} />
      <div className="nav-row">
        <button className="nav-btn" ref={navPrevRef} aria-label="Previous outcome" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14.5 6 9 12l5.5 6" />
          </svg>
        </button>
        <button className="nav-btn" ref={navFlipRef} aria-label="Flip perspective" disabled>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 10h10L12 4Z" fill="currentColor" />
            <path d="M7 14h10l-5 6Z" fill="currentColor" opacity={0.45} />
          </svg>
        </button>
        <button
          className={"nav-btn" + (showAllActive ? " active" : "")}
          onClick={onShowAll}
          aria-label={showAllLabel}
          aria-pressed={showAllActive}
          title={showAllLabel}
        >
          {/* the Bo5 board in miniature: a diamond split into its 2×2 lattice */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3.5 20.5 12 12 20.5 3.5 12Z" />
            <path d="M7.75 7.75l8.5 8.5M16.25 7.75l-8.5 8.5" />
          </svg>
        </button>
        <button className="nav-btn" ref={navNextRef} aria-label="Next outcome" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9.5 6 15 12l-5.5 6" />
          </svg>
        </button>
      </div>
      <p className="page" id="page" ref={pageRef}>– / 20</p>
    </div>
  );
}
