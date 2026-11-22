import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { fetchAllSurahs, fetchSurahAyat } from "../../utils/api.js";
import { localizeDigits } from "../../utils/constants.js";

const AUTO_ADVANCE_MS = 4500;

function sampleEight(list) {
  const pool = [...list];
  const picked = [];
  for (let i = 0; i < 8 && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked;
}

// Figma "Surah discovery carousel": section header with "all surahs" link and
// prev/next buttons, a row of surah cards, position dots and a swipe hint.
//
// Data and behaviour carried over from the original carousel: a random
// sample of eight real surahs from the Quran API, tap -> opens the full
// surah, gentle automatic movement that pauses on hover/touch/focus.
// Adapted to the design: the old endless marquee is now a scroll-snap track
// (native swipe + arrow buttons), so the position dots are meaningful.
export default function SurahCarousel({ t, lang, navigate }) {
  const [surahs, setSurahs]   = useState(null); // null = loading
  const [visible, setVisible] = useState(false);
  const [active, setActive]   = useState(0);
  const [pages, setPages]     = useState(1);
  const trackRef  = useRef(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetchAllSurahs().then(list => {
      if (cancelled) return;
      setSurahs(sampleEight(list));
      requestAnimationFrame(() => setVisible(true));
    }).catch(() => { if (!cancelled) setSurahs([]); });
    return () => { cancelled = true; };
  }, []);

  // distance between card starts, and how many snap positions exist
  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.children.length < 2) return null;
    const step = track.children[1].offsetLeft - track.children[0].offsetLeft;
    const max  = track.scrollWidth - track.clientWidth;
    return { step, max, count: step > 0 ? Math.max(1, Math.round(max / step) + 1) : 1 };
  }, []);

  const sync = useCallback(() => {
    const m = measure();
    const track = trackRef.current;
    if (!m || !track) return;
    setPages(m.count);
    setActive(Math.min(m.count - 1, Math.max(0, Math.round(track.scrollLeft / m.step))));
  }, [measure]);

  useEffect(() => {
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [sync, surahs]);

  function goTo(index) {
    const m = measure();
    const track = trackRef.current;
    if (!m || !track) return;
    const clamped = Math.max(0, Math.min(m.count - 1, index));
    track.scrollTo({ left: clamped * m.step, behavior: "smooth" });
  }

  // Gentle auto-advance; wraps to the start; never while the person is
  // interacting, when the tab is hidden, or if they prefer reduced motion.
  useEffect(() => {
    if (!surahs || surahs.length === 0) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (pausedRef.current || document.hidden) return;
      const m = measure();
      const track = trackRef.current;
      if (!m || !track || m.count < 2) return;
      const cur = Math.round(track.scrollLeft / m.step);
      track.scrollTo({ left: (cur >= m.count - 1 ? 0 : cur + 1) * m.step, behavior: "smooth" });
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [surahs, measure]);

  const pause  = useCallback(() => { pausedRef.current = true; }, []);
  const resume = useCallback(() => { pausedRef.current = false; }, []);

  function open(s) {
    fetchSurahAyat(s.id).then(d => navigate("surah", { ...d, surahNum: s.id }));
  }

  const list = surahs || Array(4).fill(null);

  return (
    <section className="home-section carousel-section" aria-labelledby="carousel-title">
      <div className="section-head">
        <div>
          <h2 id="carousel-title" className="section-heading">{t.discoverSurahs}</h2>
          <p className="section-subtitle">{t.discoverSub}</p>
        </div>
        <div className="section-head-actions">
          <button type="button" className="text-link" onClick={() => navigate("surah-browser")}>{t.allSurahs}</button>
          <div className="round-btns">
            <button type="button" className="round-btn" onClick={() => goTo(active - 1)} disabled={active <= 0} aria-label={t.prevSurahs}>
              <ArrowLeft size={22} strokeWidth={1.5} aria-hidden />
            </button>
            <button type="button" className="round-btn" onClick={() => goTo(active + 1)} disabled={active >= pages - 1} aria-label={t.nextSurahs}>
              <ArrowRight size={22} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div
        className="surah-track"
        ref={trackRef}
        onScroll={sync}
        onPointerEnter={pause}
        onPointerLeave={resume}
        onPointerDown={pause}
        onTouchStart={pause}
        onTouchEnd={resume}
        onFocus={pause}
        onBlur={resume}
      >
        {list.map((s, i) => s ? (
          <button
            key={s.id}
            type="button"
            className={`surah-tile ${visible ? "surah-tile-in" : ""} ${i === active ? "is-active" : ""}`}
            style={{ transitionDelay: `${Math.min(i, 5) * 55}ms` }}
            onClick={() => open(s)}
          >
            <span className="surah-tile-top">
              <span className="surah-tile-num">{localizeDigits(String(s.id).padStart(2, "0"), lang)}</span>
              <span className="surah-tile-ar" lang="ar">{s.name_arabic}</span>
            </span>
            <span className="surah-tile-name">{s.name_simple}</span>
            <span className="surah-tile-meaning">{s.translated_name?.name}</span>
            <span className="surah-tile-foot">
              <span>{localizeDigits(s.verses_count, lang)} {t.ayatUnit} · {s.revelation_place === "makkah" ? t.makki : t.madani}</span>
              <ArrowRight size={18} strokeWidth={1.5} aria-hidden />
            </span>
          </button>
        ) : (
          <div key={`sk-${i}`} className="skeleton surah-tile-skeleton" />
        ))}
      </div>

      <div className="carousel-foot">
        <span className="carousel-hint">{t.swipeHint}</span>
        <div className="carousel-dots" aria-hidden>
          {Array.from({ length: pages }, (_, i) => (
            <span key={i} className={`dot ${i === active ? "on" : ""}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
