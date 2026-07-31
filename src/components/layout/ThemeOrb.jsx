import { useState, useRef, useEffect } from "react";
import WaqtArcPicker from "./WaqtArcPicker.jsx";
import { THEMES, WAQT_ORDER, THEME_ICONS } from "../../utils/constants.js";

const LONG_PRESS_MS = 480;

// Persistent, present on every screen regardless of sidebar state.
// A quick tap opens the waqt arc panel; a press-and-hold cycles
// straight to the next waqt theme. Either path fires the same
// ripple-wipe so a theme change always reads as one physical event.
export default function ThemeOrb({ theme, themeMeta, themeList, selectTheme, cycleTheme, label }) {
  const [open, setOpen]   = useState(false);
  const [wipe, setWipe]   = useState(null); // { bg, gold }
  const orbRef   = useRef(null);
  const wrapRef  = useRef(null);
  const pressTimer   = useRef(null);
  const longPressFired = useRef(false);

  useEffect(() => {
    if (!open) return;
    function onDown(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); }
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function fireWipe(targetKey) {
    const target = THEMES[targetKey];
    if (!target) return;
    const rect = orbRef.current?.getBoundingClientRect();
    const root = document.documentElement;
    if (rect) {
      root.style.setProperty("--orb-cx", `${rect.left + rect.width / 2}px`);
      root.style.setProperty("--orb-cy", `${rect.top + rect.height / 2}px`);
    }
    setWipe({ bg: target["--bg"], gold: target["--gold2"] });
    // Swap the real theme partway through the wipe so the reveal and
    // the actual color-change land together, not the wipe finishing
    // and *then* the page catching up.
    window.setTimeout(() => selectTheme(targetKey), 320);
    window.setTimeout(() => setWipe(null), 760);
  }

  function pick(key) {
    setOpen(false);
    if (key !== theme) fireWipe(key);
  }

  function handlePointerDown() {
    longPressFired.current = false;
    pressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      const next = WAQT_ORDER[(WAQT_ORDER.indexOf(theme) + 1) % WAQT_ORDER.length];
      fireWipe(next);
    }, LONG_PRESS_MS);
  }
  function clearPressTimer() {
    if (pressTimer.current) { window.clearTimeout(pressTimer.current); pressTimer.current = null; }
  }
  function handleClick() {
    clearPressTimer();
    if (longPressFired.current) { longPressFired.current = false; return; }
    setOpen(o => !o);
  }

  return (
    <div className="theme-orb-wrap" ref={wrapRef}>
      {wipe && (
        <div className="theme-wipe" style={{ "--wipe-bg": wipe.bg, "--wipe-gold": wipe.gold }} aria-hidden />
      )}

      {open && (
        <div className="theme-orb-panel" role="dialog" aria-label={label || "Theme"}>
          <div className="theme-orb-panel-hdr">{label || "Waqt Theme"}</div>
          <WaqtArcPicker theme={theme} themeList={themeList} onSelect={pick} labelTheme={label} />
        </div>
      )}

      <button
        ref={orbRef}
        type="button"
        className="theme-orb"
        style={{ background: `radial-gradient(circle at 35% 30%, ${themeMeta["--gold2"]}, ${themeMeta["--gold"]} 55%, ${themeMeta["--green"]} 130%)` }}
        onPointerDown={handlePointerDown}
        onPointerUp={clearPressTimer}
        onPointerLeave={clearPressTimer}
        onClick={handleClick}
        aria-label={label || "Change theme"}
        aria-expanded={open}
      >
        <span className="theme-orb-icon">{THEME_ICONS[theme] || "🎨"}</span>
      </button>
    </div>
  );
}
