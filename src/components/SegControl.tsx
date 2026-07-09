export interface SegOption {
  value: string;
  label: string;
}

export interface SegControlProps {
  id?: string;
  className?: string;
  ariaLabel: string;
  options: SegOption[];
  value: string;
  onChange: (value: string) => void;
}

// Liquid-glass segmented control: a sliding `.thumb` behind the active
// option. The original drove this with manual class/aria toggling and a
// computed translateX%; here it's just derived from `value` each render —
// same CSS transition in styles.css does the animating either way.
export function SegControl({ id, className, ariaLabel, options, value, onChange }: SegControlProps) {
  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  return (
    <nav
      id={id}
      className={["seg-ctl", `n${options.length}`, className].filter(Boolean).join(" ")}
      role="tablist"
      aria-label={ariaLabel}
    >
      <span className="thumb" aria-hidden="true" style={{ transform: `translateX(${activeIndex * 100}%)` }} />
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          className={"opt" + (i === activeIndex ? " active" : "")}
          aria-selected={i === activeIndex}
          data-value={o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </nav>
  );
}
