import { Check, BookOpen } from "lucide-react";
import { THEME_ICON_COMPONENTS } from "../layout/themeIcons.js";

// Figma "Hero": verified badge, headline, description, two CTAs, note on
// the left; the "dawn arch" illustration and the live theme badge on the right.
export default function HeroSection({ t, lang, navigate, theme, themeMeta }) {
  const ThemeIcon = THEME_ICON_COMPONENTS[theme] || THEME_ICON_COMPONENTS.fajr;
  const themeName    = lang === "bn" ? themeMeta.name : themeMeta.nameEn;
  const themeTagline = lang === "bn" ? themeMeta.tagline : themeMeta.taglineEn;

  return (
    <section className="home-hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <span className="verified-badge">
          <Check size={16} strokeWidth={1.5} aria-hidden />
          {t.appTagline}
        </span>
        <h1 id="hero-title" className="hero-headline">
          {t.heroTitle[0]}<br />{t.heroTitle[1]}
        </h1>
        <p className="hero-description">
          {t.heroDesc[0]}<br />{t.heroDesc[1]}
        </p>
        <div className="hero-actions">
          <button type="button" className="btn-accent" onClick={() => navigate("book")}>
            <BookOpen size={23} strokeWidth={1.5} aria-hidden />
            {t.heroStart}
          </button>
          <button type="button" className="btn-outline" onClick={() => navigate("surah-browser")}>
            {t.heroBrowse}
          </button>
        </div>
        <p className="hero-note">{t.heroNote}</p>
      </div>

      <div className="hero-visual">
        <div className="dawn-arch" aria-hidden>
          <div className="dawn-arch-inner" />
          <div className="dawn-light" />
          <div className="arch-bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
          <div className="arch-title">القرآن الكريم</div>
          <div className="arch-caption">{t.archCaption}</div>
          <div className="arch-rule" />
          <div className="arch-english">{t.archEnglish}</div>
        </div>
        <div className="theme-badge" role="status" aria-live="polite">
          <ThemeIcon size={20} strokeWidth={1.5} aria-hidden />
          <span>{themeName} · {themeTagline}</span>
        </div>
      </div>
    </section>
  );
}
