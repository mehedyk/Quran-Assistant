import { useState, useEffect } from "react";
import { fetchAllSurahs, fetchSurahAyat } from "../../utils/api.js";

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

  useEffect(() => {
    let cancelled = false;
    fetchAllSurahs().then(list => {
      if (cancelled) return;
      setSurahs(sampleEight(list));
      requestAnimationFrame(() => setVisible(true));
    }).catch(() => { if (!cancelled) setSurahs([]); });
    return () => { cancelled = true; };
  }, []);

  function open(s) {
    fetchSurahAyat(s.id).then(d => navigate("surah", { ...d, surahNum: s.id }));
  }

  return (
    <div className="section">
      <div className="section-label">{t.discoverSurahs}</div>
      <div className="carousel">
        {(surahs || Array(6).fill(null)).map((s, i) => (
          s ? (
            <button
              key={s.id}
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
          ) : (
            <div key={i} className="skeleton carousel-card carousel-skeleton" />
          )
        ))}
      </div>
    </div>
  );
}
