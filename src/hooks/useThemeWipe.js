import { useState, useRef, useEffect, useCallback, createElement } from "react";
import { THEMES } from "../utils/constants.js";

// Shared by every theme control (the prayer-theme tabs on tablet/desktop
// and the floating orb on phones) so a theme change always plays the same
// ripple-wipe, no matter which control triggered it.
//
//   const { wipeEl, triggerWipe } = useThemeWipe(selectTheme);
//   triggerWipe("isha", buttonElement)   // wipe grows out of that element
//
// The real theme swap happens partway through the wipe so the reveal and
// the colour change land together instead of the page catching up after.
export function useThemeWipe(selectTheme) {
  const [wipe, setWipe] = useState(null); // { bg, accent }
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const triggerWipe = useCallback((targetKey, originEl) => {
    const target = THEMES[targetKey];
    if (!target) return;
    const rect = originEl?.getBoundingClientRect?.();
    const root = document.documentElement;
    if (rect) {
      root.style.setProperty("--orb-cx", `${rect.left + rect.width / 2}px`);
      root.style.setProperty("--orb-cy", `${rect.top + rect.height / 2}px`);
    }
    setWipe({ bg: target["--bg"], accent: target["--accent"] });
    timers.current.push(window.setTimeout(() => selectTheme(targetKey), 320));
    timers.current.push(window.setTimeout(() => setWipe(null), 760));
  }, [selectTheme]);

  const wipeEl = wipe
    ? createElement("div", {
        className: "theme-wipe",
        style: { "--wipe-bg": wipe.bg, "--wipe-gold": wipe.accent },
        "aria-hidden": true,
      })
    : null;

  return { wipeEl, triggerWipe };
}
