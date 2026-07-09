import { useEffect, useRef } from "react";

// Replaces the native pointer everywhere on real (fine) pointers with the
// same small ring that used to live only inside the diagram's SVG, so the
// cursor reads as one consistent element across the whole page instead of
// something that only exists over the canvas. Position is written straight
// to the DOM on every pointermove (no React state) to stay perfectly in
// sync with the real cursor, same performance approach as the diagram engine.
export function CursorRing() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      el.classList.add("active");
      el.style.transform = `translate3d(${e.clientX - 8}px, ${e.clientY - 8}px, 0)`;
    };
    const onLeave = () => el.classList.remove("active");

    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <div className="cursor-ring" ref={ref} aria-hidden="true" />;
}
