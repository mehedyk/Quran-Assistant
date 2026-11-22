import { useState, useRef, useEffect } from "react";
import WaqtArcPicker from "./WaqtArcPicker.jsx";
import { useThemeWipe } from "../../hooks/useThemeWipe.js";
import { WAQT_ORDER, THEME_ICONS } from "../../utils/constants.js";

const LONG_PRESS_MS = 480;

// Phone-width theme control (tablet/desktop use PrayerThemeTabs, which
// follows the Figma header). A quick tap opens the waqt arc panel; a
// press-and-hold cycles straight to the next waqt theme. Both paths fire
// the same ripple-wipe so a theme change always reads as one physical event.
export default function ThemeOrb({ theme, themeMeta, themeList, selectTheme, label }) {
  const [open, setOpen]   = useState(false);
  const orbRef   = useRef(null);
  const wrapRef  = useRef(null);
  const pressTimer   = useRef(null);
  const longPressFired = useRef(false);
  const { wipeEl, triggerWipe } = useThemeWipe(selectTheme);

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

  function pick(key) {
    setOpen(false);
    if (key !== theme) triggerWipe(key, orbRef.current);
  }

  function handlePointerDown() {
    longPressFired.current = false;
    pressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      const next = WAQT_ORDER[(WAQT_ORDER.indexOf(theme) + 1) % WAQT_ORDER.length];
      triggerWipe(next, orbRef.current);
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
      {wipeEl}

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
        style={{ background: `radial-gradient(circle at 35% 30%, ${themeMeta["--accent-hover"]}, ${themeMeta["--accent"]} 60%, ${themeMeta["--surface2"]} 140%)` }}
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
