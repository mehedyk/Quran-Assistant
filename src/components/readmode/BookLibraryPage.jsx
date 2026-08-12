import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { fetchAllSurahs, fetchSurahAyat } from "../../utils/api.js";
import { surahsToBooks } from "../../three/bookDescriptors.js";

// Lazy-loaded: three.js is heavy (~1MB) and should only be fetched when the
// person actually opens the 3D shelf, not on every page of the app.
const BookScene = lazy(() => import("../../three/BookScene.jsx").then(m => ({ default: m.BookScene })));

export default function BookLibraryPage({ t, navigate }) {
  const [surahs, setSurahs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // surah meta of the currently-highlighted/opened book
  const [detailOpen, setDetailOpen] = useState(false);
  const sceneRef = useRef(null);

  useEffect(() => {
    fetchAllSurahs().then(s => {
      setSurahs(s);
      setSelected(s[0] || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const books = surahs.length ? surahsToBooks(surahs) : [];

  const handleSelectionChange = useCallback((index) => {
    setSelected(surahs[index] || null);
  }, [surahs]);

  const handleDetailChange = useCallback((book) => {
    setDetailOpen(Boolean(book));
  }, []);

  function beginReading() {
    if (!selected) return;
    fetchSurahAyat(selected.id).then(d => navigate("readmode", { ...d, surahNum: selected.id, _origin: "book" }));
  }

  return (
    <div className="page book-library-page book-library-page-3d">
      <div className="page-header">
        <h2 className="page-title">{t.readMode}</h2>
        <p className="page-sub">{t.bookLibrarySub}</p>
      </div>

      {loading ? (
        <div className="book-shelf-3d-loading">
          <div className="skeleton book-shelf-3d-skeleton" />
        </div>
      ) : (
        <div className="book-shelf-3d-stage">
          <Suspense fallback={<div className="book-shelf-3d-skeleton skeleton" />}>
            <BookScene
              ref={sceneRef}
              books={books}
              onSelectionChange={handleSelectionChange}
              onDetailChange={handleDetailChange}
            />
          </Suspense>

          {/* Accessible HTML chrome layered over the WebGL canvas — same
              pattern the source demo used for its own controls. This is
              real DOM: screen readers, keyboard users, and reduced-motion
              users all get a working experience through this layer even
              though the shelf itself is a canvas. */}
          <div className="book-shelf-3d-chrome" aria-hidden={false}>
            {!detailOpen && (
              <>
                <button
                  className="book-shelf-3d-nav book-shelf-3d-nav-prev"
                  onClick={() => sceneRef.current?.navigate(-1)}
                  aria-label={t.previousSurah || "Previous surah"}
                >‹</button>
                <button
                  className="book-shelf-3d-nav book-shelf-3d-nav-next"
                  onClick={() => sceneRef.current?.navigate(1)}
                  aria-label={t.nextSurah || "Next surah"}
                >›</button>
                {selected && (
                  <div className="book-shelf-3d-label glass-card">
                    <span className="book-shelf-3d-label-num">{selected.id}</span>
                    <span className="book-shelf-3d-label-ar">{selected.name_arabic}</span>
                    <span className="book-shelf-3d-label-en">{selected.name_simple}</span>
                    <button className="book-shelf-3d-open-btn" onClick={() => sceneRef.current?.openDetail()}>
                      {t.inspect || "Inspect"}
                    </button>
                  </div>
                )}
              </>
            )}
            {detailOpen && (
              <div className="book-shelf-3d-detail-bar glass-card">
                <button className="book-shelf-3d-close" onClick={() => sceneRef.current?.closeDetail()} aria-label="Close">✕</button>
                {selected && (
                  <div className="book-shelf-3d-detail-title">
                    <span className="book-shelf-3d-label-ar">{selected.name_arabic}</span>
                    <span className="book-shelf-3d-label-en">{selected.translated_name?.name || selected.name_simple}</span>
                  </div>
                )}
                <button className="book-cover-begin" onClick={beginReading}>
                  {t.beginReading}
                </button>
              </div>
            )}
          </div>

          {/* Real DOM list, visually hidden — keeps the full surah catalog
              keyboard/screen-reader/search-engine navigable even though
              the visible shelf is a 3D carousel that only shows a few
              volumes near the current position at a time. */}
          <ul className="sr-only book-shelf-3d-index" aria-label={t.readMode}>
            {surahs.map((s, index) => (
              <li key={s.id}>
                <button onClick={() => { sceneRef.current?.setSelectedIndex(index); sceneRef.current?.openDetail(); }}>
                  {s.id}. {s.name_arabic} — {s.name_simple}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
