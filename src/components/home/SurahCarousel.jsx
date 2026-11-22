import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { fetchAllSurahs, fetchSurahAyat } from "../../utils/api.js";
import { localizeDigits } from "../../utils/constants.js";

const DRIFT_PX_PER_SEC = 26;   // the original marquee's slow, continuous glide
const COPIES = 3;              // cards are rendered 3x so the loop never shows an edge
const RESUME_AFTER_MS = 1800;  // drift resumes this long after the person stops swiping

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
// Original behaviour is kept: a random sample of eight real surahs from the
// Quran API that drifts endlessly and seamlessly, pausing on hover / touch /
// focus, with tap -> opens the full surah. The design's controls work on top
// of it: arrows glide one card, a swipe takes over (drift resumes shortly
// after), dots show which card leads. Reduced-motion users get no drift.
export default function SurahCarousel({ t, lang, navigate }) {
  const [surahs, setSurahs]   = useState(null); // null = loading
  const [visible, setVisible] = useState(false);
  const [active, setActive]   = useState(0);
  const trackRef  = useRef(null);
  const pausedRef = useRef(false);
  const posRef    = useRef(0);       // authoritative scroll position (float)
  const targetRef = useRef(null);    // arrow-glide destination, or null
  const resumeAt  = useRef(0);       // timestamp before which drift stays off
  const activeRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    fetchAllSurahs().then(list => {
      if (cancelled) return;
      setSurahs(sampleEight(list));
      requestAnimationFrame(() => setVisible(true));
    }).catch(() => { if (!cancelled) setSurahs([]); });
    return () => { cancelled = true; };
  }, []);

  const count = surahs?.length || 0;

  // geometry: distance between card starts, and the width of one full set
  const geometry = useCallback(() => {
    const track = trackRef.current;
    if (!track || count < 2 || track.children.length < count + 1) return null;
    const step = track.children[1].offsetLeft - track.children[0].offsetLeft;
    const set  = track.children[count].offsetLeft - track.children[0].offsetLeft;
    return step > 0 && set > 0 ? { step, set } : null;
  }, [count]);

  // start in the middle copy so there is room to move both ways
  useEffect(() => {
    const g = geometry();
    const track = trackRef.current;
    if (!g || !track) return;
    posRef.current = g.set;
    track.scrollLeft = g.set;
    const onResize = () => {
      const m = geometry();
      if (!m) return;
      posRef.current = m.set + (((posRef.current % m.set) + m.set) % m.set);
      track.scrollLeft = posRef.current;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [geometry, surahs]);

  // the single animation loop: drift, arrow glide, seamless wrap, active index
  useEffect(() => {
    if (!count) return;
    const track = trackRef.current;
    if (!track) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = performance.now();

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = geometry();
      if (g) {
        let pos = posRef.current;
        if (targetRef.current != null) {
          pos += (targetRef.current - pos) * 0.16;
          if (Math.abs(targetRef.current - pos) < 0.5) { pos = targetRef.current; targetRef.current = null; }
        } else if (!reduce && !pausedRef.current && !document.hidden && now > resumeAt.current) {
          pos += DRIFT_PX_PER_SEC * dt;
        }
        // seamless wrap: keep inside the middle copy
        while (pos >= g.set * 2) { pos -= g.set; if (targetRef.current != null) targetRef.current -= g.set; }
        while (pos < g.set)      { pos += g.set; if (targetRef.current != null) targetRef.current += g.set; }
        if (pos !== posRef.current) { posRef.current = pos; track.scrollLeft = pos; }
        const idx = Math.round((pos - g.set) / g.step) % count;
        const norm = (idx + count) % count;
        if (norm !== activeRef.current) { activeRef.current = norm; setActive(norm); }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [count, geometry]);

  // a manual swipe / wheel moves scrollLeft itself: adopt it and hold the drift briefly
  const onScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    if (Math.abs(track.scrollLeft - posRef.current) > 1.5) {
      posRef.current = track.scrollLeft;
      targetRef.current = null;
      resumeAt.current = performance.now() + RESUME_AFTER_MS;
    }
  }, []);

  function glide(dir) {
    const g = geometry();
    if (!g) return;
    const base = targetRef.current != null ? targetRef.current : posRef.current;
    targetRef.current = Math.round(base / g.step) * g.step + dir * g.step;
    resumeAt.current = performance.now() + RESUME_AFTER_MS;
  }

  const pause  = useCallback(() => { pausedRef.current = true; }, []);
  const resume = useCallback(() => { pausedRef.current = false; }, []);

  function open(s) {
    fetchSurahAyat(s.id).then(d => navigate("surah", { ...d, surahNum: s.id }));
  }

  // three copies (the 2nd and 3rd are decorative duplicates for the loop)
  const rendered = surahs && surahs.length
    ? Array.from({ length: COPIES }, (_, c) => surahs.map((s, i) => ({ s, i, c }))).flat()
    : null;

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
            <button type="button" className="round-btn" onClick={() => glide(-1)} aria-label={t.prevSurahs}>
              <ArrowLeft size={22} strokeWidth={1.5} aria-hidden />
            </button>
            <button type="button" className="round-btn" onClick={() => glide(1)} aria-label={t.nextSurahs}>
              <ArrowRight size={22} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div
        className="surah-track"
        ref={trackRef}
        onScroll={onScroll}
        onPointerEnter={pause}
        onPointerLeave={resume}
        onPointerDown={pause}
        onTouchStart={pause}
        onTouchEnd={resume}
        onFocus={pause}
        onBlur={resume}
      >
        {rendered ? rendered.map(({ s, i, c }) => (
          <button
            key={`${c}-${s.id}`}
            type="button"
            className={`surah-tile ${visible ? "surah-tile-in" : ""} ${i === active ? "is-active" : ""}`}
            style={{ transitionDelay: `${Math.min(i, 5) * 55}ms` }}
            aria-hidden={c !== 1 ? true : undefined}
            tabIndex={c !== 1 ? -1 : undefined}
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
        )) : Array(4).fill(null).map((_, i) => (
          <div key={`sk-${i}`} className="skeleton surah-tile-skeleton" />
        ))}
      </div>

      <div className="carousel-foot">
        <span className="carousel-hint">{t.swipeHint}</span>
        <div className="carousel-dots" aria-hidden>
          {Array.from({ length: count || 5 }, (_, i) => (
            <span key={i} className={`dot ${i === active ? "on" : ""}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
