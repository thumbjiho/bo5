import type { Lang } from "../types";
import { I18N } from "../data/i18n";
import { SegControl } from "./SegControl";

const FORMAT_OPTIONS = [
  { value: "2", label: "Bo3" },
  { value: "3", label: "Bo5" },
  { value: "4", label: "Bo7" },
];

interface SettingsPanelProps {
  wins: number;
  lang: Lang;
  onChangeWins: (wins: number) => void;
}

export function SettingsPanel({ wins, lang, onChangeWins }: SettingsPanelProps) {
  const t = I18N[lang];
  return (
    <div className="settings-panel">
      <p className="panel-label" id="fmt-label">{t.fmtLabel}</p>
      <SegControl
        id="fmt-ctl"
        ariaLabel={t.fmtLabel}
        options={FORMAT_OPTIONS}
        value={String(wins)}
        onChange={(v) => onChangeWins(parseInt(v, 10))}
      />
      <p className="panel-caption" id="fmt-caption">{t.fmtCap(wins)}</p>
    </div>
  );
}
