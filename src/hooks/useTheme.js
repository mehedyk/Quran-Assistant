import { useState, useEffect } from "react";
import { THEMES, WAQT_ORDER, WAQT_ANGLES } from "../utils/constants.js";
import { getSavedTheme, saveTheme } from "../utils/storage.js";

export function useTheme() {
  const [theme, setTheme] = useState(getSavedTheme());

  useEffect(() => {
    const t = THEMES[theme];
    if (!t) return;
    const root = document.documentElement;
    Object.entries(t).forEach(([k, v]) => {
      if (k.startsWith("--")) root.style.setProperty(k, v);
    });
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Follows WAQT_ORDER (dawn -> night), wrapping back to Fajr after Isha.
  function cycleTheme() {
    const next = WAQT_ORDER[(WAQT_ORDER.indexOf(theme) + 1) % WAQT_ORDER.length];
    selectTheme(next);
  }

  function selectTheme(key) {
    if (!THEMES[key]) return;
    setTheme(key);
    saveTheme(key);
  }

  return {
    theme,
    cycleTheme,
    selectTheme,
    themeMeta: THEMES[theme],
    themeAngle: WAQT_ANGLES[theme] ?? 90,
    themeList: WAQT_ORDER.map(key => ({ key, ...THEMES[key], angle: WAQT_ANGLES[key] })),
  };
}
