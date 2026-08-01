import { useState, useEffect, useRef, useCallback } from "react";
import { fetchAllSurahs, fetchSurahAyat } from "../../utils/api.js";

const PX_PER_SEC = 34; // gentle, readable drift speed

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

export default function SurahCarousel({ t, navigate }) {
  const [surahs, setSurahs]   = useState(null); // null = loading
  const [visible, setVisible] = useState(false);
  const trackRef  = useRef(null);
  const pausedRef = useRef(false);
  const rafRef    = useRef(null);
  const lastTsRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetchAllSurahs().then(list => {
      if (cancelled) return;
      setSurahs(sampleEight(list));
      requestAnimationFrame(() => setVisible(true));
    }).catch(() => { if (!cancelled) setSurahs([]); });
    return () => { cancelled = true; };
  }, []);

  // Continuous left -> right drift. The track renders the surah list
  // twice back-to-back; once we've scrolled past exactly one copy's
  // width we snap scrollLeft back by that same width, which is
  // invisible since the content repeats — a classic seamless marquee.
  useEffect(() => {
    if (!surahs || surahs.length === 0) return;
    const track = trackRef.current;
    if (!track) return;

    function step(ts) {
      rafRef.current = requestAnimationFrame(step);
      if (pausedRef.current) { lastTsRef.current = ts; return; }
      if (lastTsRef.current == null) { lastTsRef.current = ts; return; }
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      const halfWidth = track.scrollWidth / 2;
      if (halfWidth <= 0) return;
      track.scrollLeft += PX_PER_SEC * dt;
      if (track.scrollLeft >= halfWidth) track.scrollLeft -= halfWidth;
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [surahs]);

  const pause  = useCallback(() => { pausedRef.current = true; }, []);
  const resume = useCallback(() => { pausedRef.current = false; }, []);

  function open(s) {
    fetchSurahAyat(s.id).then(d => navigate("surah", { ...d, surahNum: s.id }));
  }

  function renderCard(s, i, keySuffix) {
    if (!s) return <div key={`sk-${i}`} className="skeleton carousel-card carousel-skeleton" />;
    return (
      <button
        key={`${s.id}-${keySuffix}`}
        className={`carousel-card ${visible ? "carousel-card-in" : ""}`}
        style={{ transitionDelay: `${i * 55}ms` }}
        onClick={() => open(s)}
      >
        <div className="carousel-num">{s.id}</div>
        <div className="carousel-ar">{s.name_arabic}</div>
        <div className="carousel-en">{s.name_simple}</div>
        <div className="carousel-bn">{s.translated_name?.name}</div>
        <div className="carousel-meta">
          <span>{s.verses_count}</span>
          <span>{s.revelation_place === "makkah" ? t.makki : t.madani}</span>
        </div>
      </button>
    );
  }

  const list = surahs || Array(6).fill(null);

  return (
    <div className="section">
      <div className="section-label">{t.discoverSurahs}</div>
      <div
        className="carousel"
        ref={trackRef}
        onPointerEnter={pause}
        onPointerLeave={resume}
        onPointerDown={pause}
        onPointerUp={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
      >
        {list.map((s, i) => renderCard(s, i, "a"))}
        {/* duplicate set for the seamless loop — hidden from AT since it's a visual repeat */}
        {surahs && list.map((s, i) => renderCard(s, i, "b"))}
      </div>
    </div>
  );
}
