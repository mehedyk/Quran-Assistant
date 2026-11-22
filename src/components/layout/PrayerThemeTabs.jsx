import { useRef } from "react";
import { Sun } from "lucide-react";
import { THEME_ICON_COMPONENTS } from "./themeIcons.js";
import { useThemeWipe } from "../../hooks/useThemeWipe.js";

// "Prayer theme selector" row from Figma: label on the left, five-waqt
// pill on the right. Shown from 768px up; phones keep the floating
// ThemeOrb (see styles). Switching plays the shared ripple-wipe, swaps
// CSS variables only, and persists through useTheme -> saveTheme, so no
// app state, form input or session is reset.
export default function PrayerThemeTabs({ t, lang, theme, themeList, selectTheme }) {
  const { wipeEl, triggerWipe } = useThemeWipe(selectTheme);
  const refs = useRef({});

  function pick(key) {
    if (key === theme) return;
    triggerWipe(key, refs.current[key]);
  }

  function onKeyDown(e, index) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = themeList[(index + dir + themeList.length) % themeList.length];
    refs.current[next.key]?.focus();
    pick(next.key);
  }

  return (
    <div className="theme-bar">
      {wipeEl}
      <div className="theme-bar-inner">
        <p className="theme-bar-label">{t.themeBarLabel}</p>
        <div className="theme-tabs" role="radiogroup" aria-label={t.themeSelectorAria}>
          {themeList.map((th, i) => {
            const Icon = THEME_ICON_COMPONENTS[th.key] || Sun;
            const active = th.key === theme;
            return (
              <button
                key={th.key}
                ref={el => { refs.current[th.key] = el; }}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                className={`theme-tab ${active ? "active" : ""}`}
                onClick={() => pick(th.key)}
                onKeyDown={e => onKeyDown(e, i)}
              >
                <Icon size={18} strokeWidth={1.5} aria-hidden />
                <span>{lang === "bn" ? th.name : th.nameEn}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
