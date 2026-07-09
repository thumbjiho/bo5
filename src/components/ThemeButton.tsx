export function ThemeButton() {
  const toggle = () => {
    const root = document.documentElement;
    const current = root.getAttribute("data-theme");
    const dark = current ? current === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", dark ? "light" : "dark");
  };
  return (
    <button className="theme-btn" id="theme-btn" aria-label="Toggle dark or light mode" onClick={toggle}>
      <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
        <circle cx={12} cy={12} r={4} fill="currentColor" stroke="none" />
        <path d="M12 2.8v2.2M12 19v2.2M2.8 12H5M19 12h2.2M5.4 5.4 7 7M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6" />
      </svg>
      <svg className="icon-moon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.2 14.4A8.4 8.4 0 0 1 9.6 3.8 8.8 8.8 0 1 0 20.2 14.4Z" />
      </svg>
    </button>
  );
}
