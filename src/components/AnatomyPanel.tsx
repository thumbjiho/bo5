import type { RefObject } from "react";
import type { Lang } from "../types";
import { I18N } from "../data/i18n";

interface AnatomyPanelProps {
  lang: Lang;
  anaNameRef: RefObject<HTMLHeadingElement>;
  anaDescRef: RefObject<HTMLParagraphElement>;
}

// ana-name / ana-desc text is written imperatively by DiagramEngine on
// part hover (with a swap animation); only the panel label reacts to lang.
export function AnatomyPanel({ lang, anaNameRef, anaDescRef }: AnatomyPanelProps) {
  return (
    <div className="anatomy-panel">
      <p className="panel-label" id="ana-label">{I18N[lang].anaLabel}</p>
      <h2 className="ana-name" id="ana-name" ref={anaNameRef}>Hover the diagram</h2>
      <p className="ana-desc" id="ana-desc" ref={anaDescRef}>Point at a part to see what it does.</p>
    </div>
  );
}
