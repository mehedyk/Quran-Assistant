import { useState, useEffect } from "react";
import { THEMES } from "../utils/constants.js";
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

  function cycleTheme() {
    const keys  = Object.keys(THEMES);
    const next  = keys[(keys.indexOf(theme) + 1) % keys.length];
    setTheme(next);
    saveTheme(next);
  }

  return { theme, cycleTheme, themeMeta: THEMES[theme] };
}
