import { useState, useMemo, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { getAyahAudioUrl } from "../../utils/api.js";
import { stripHtml } from "../../utils/constants.js";
import { getSavedReadLang, saveReadLang } from "../../utils/storage.js";
import { surahToBook } from "../../three/bookDescriptors.js";

const BookScene = lazy(() => import("../../three/BookScene.jsx").then(m => ({ default: m.BookScene })));

const PAGE_SIZE = 6; // must match pageContentTexture.js's PAGE_SIZE

export default function ReadMode({ t, data, audio, onClose }) {
  const { meta, ayat } = data;
  const [readLang, setReadLang]         = useState(getSavedReadLang());
  const [readingOpen, setReadingOpenUi] = useState(false); // mirrors the engine's readingOpen, for chrome switching
  const [visibleAyahs, setVisibleAyahs] = useState([]);
  const sceneRef = useRef(null);
  const contentLoadedRef = useRef(false);

  // Local mirror of the exact same pagination the engine computes, purely
  // for the "N / total" display and the accessible fallback list below —
  // not a second source of truth for what's rendered on the pages.
  const pages = useMemo(() => {
    const out = [];
    for (let i = 0; i < ayat.length; i += PAGE_SIZE) out.push(ayat.slice(i, i + PAGE_SIZE));
    return out;
  }, [ayat]);
  const currentPageIdx = visibleAyahs.length
    ? pages.findIndex(p => p[0]?.verse_number === visibleAyahs[0]?.verse_number)
    : 0;

  const queueItems = useMemo(() => ayat.map(v => ({
    url: getAyahAudioUrl(meta.id, v.verse_number),
    key: `${meta.id}:${v.verse_number}`,
    surahNum: meta.id,
    ayahNum: v.verse_number,
    surahName: meta.name_simple,
  })), [ayat, meta]);

  function setLang(v) {
    setReadLang(v);
    saveReadLang(v);
    sceneRef.current?.setReadLang(v);
  }

  function playFromHere(verseNumber) {
    const startIndex = ayat.findIndex(v => v.verse_number === verseNumber);
    audio.playQueue(queueItems, startIndex < 0 ? 0 : startIndex);
  }

  const book = useMemo(() => (meta ? [surahToBook(meta)] : []), [meta]);

  const handleDetailChange = useCallback((_book, _spread, isReadingOpen, ayahs) => {
    setReadingOpenUi(isReadingOpen);
    setVisibleAyahs(ayahs || []);
  }, []);

  // Auto-open the cover ceremony as soon as the scene mounts, then feed it
  // real content once — this is a single-volume view (no shelf browsing
  // here), so it should present already mid-opening.
  //
  // BookScene is lazy-loaded (see import at top), so on a fresh visit the
  // chunk may not have resolved and sceneRef.current may still be null on
  // the very next frame — a single rAF attempt would silently no-op via
  // optional chaining and then wrongly mark itself done, leaving the book
  // permanently empty. Poll every frame until the ref is actually populated
  // instead of assuming one frame is enough.
  useEffect(() => {
    if (contentLoadedRef.current) return undefined;
    let cancelled = false;
    let frameId = 0;
    function tryInit() {
      if (cancelled) return;
      if (sceneRef.current) {
        sceneRef.current.openDetail();
        sceneRef.current.setReadingContent(ayat, readLang, meta?.name_arabic);
        contentLoadedRef.current = true;
      } else {
        frameId = requestAnimationFrame(tryInit);
      }
    }
    frameId = requestAnimationFrame(tryInit);
    return () => { cancelled = true; cancelAnimationFrame(frameId); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto page-turn: follow the actively-playing ayah to its page, same
  // behavior the flat reader had — only while this surah's queue is the
  // one actually playing.
  useEffect(() => {
    if (!audio.isPlaying || !audio.current || audio.current.surahNum !== meta.id) return;
    sceneRef.current?.goToVerse(audio.current.ayahNum);
  }, [audio.current, audio.isPlaying, meta.id]);

  // Playback highlight on the 3D pages — mirrors the flat reader's
  // active/next ayah styling.
  useEffect(() => {
    if (!audio.current || audio.current.surahNum !== meta.id) {
      sceneRef.current?.setActiveVerse(null, null);
      return;
    }
    const activeIdx = queueItems.findIndex(q => q.key === audio.activeKey);
    const nextAyah = activeIdx >= 0 ? queueItems[activeIdx + 1]?.ayahNum ?? null : null;
    sceneRef.current?.setActiveVerse(audio.current.ayahNum, nextAyah);
  }, [audio.activeKey, audio.current, meta.id, queueItems]);

  const revPlace = meta?.revelation_place === "makkah" ? t.makki : t.madani;
  const isPlayingThis = audio.isPlaying && audio.current?.surahNum === meta.id;

  return (
    <div className={`readmode readmode-3d ${readingOpen ? "is-reading" : "is-cover"}`}>
      <button className="readmode-close" onClick={onClose} aria-label="Close">✕</button>

      <div className="book-cover-3d-stage">
        <Suspense fallback={<div className="skeleton book-cover-3d-skeleton" />}>
          <BookScene ref={sceneRef} books={book} onDetailChange={handleDetailChange} onAyahTap={playFromHere} />
        </Suspense>

        {/* Real DOM overlay chrome — title/meta/controls stay screen-reader
            and keyboard operable regardless of the 3D canvas underneath. */}
        {!readingOpen && (
          <div className="book-cover-3d-chrome glass-card">
            <div className="book-cover-ar">{meta?.name_arabic}</div>
            <div className="book-cover-en">{meta?.name_simple}</div>
            <div className="book-cover-bn">{meta?.translated_name?.name}</div>
            <div className="book-cover-meta">
              <span>{meta?.verses_count} {t.allAyat}</span>
              <span className="book-cover-dot">·</span>
              <span>{revPlace}</span>
            </div>
            <button className="book-cover-begin" onClick={() => sceneRef.current?.setReadingOpen(true)}>
              {t.beginReading}
            </button>
          </div>
        )}

        {readingOpen && (
          <>
            <div className="reader-3d-topbar glass-card">
              <div className="reader-titles">
                <span className="reader-title-ar">{meta?.name_arabic}</span>
                <span className="reader-title-en">{meta?.name_simple}</span>
              </div>
              <button className="reader-play-btn" onClick={() => isPlayingThis ? audio.togglePause() : playFromHere(visibleAyahs[0]?.verse_number)}>
                {isPlayingThis ? `⏸ ${t.stop}` : `▶ ${t.playSurah}`}
              </button>
              <div className="reader-lang-toggle" style={{ "--active-index": ["off","bn","en"].indexOf(readLang) }}>
                <div className="reader-lang-thumb" aria-hidden="true" />
                {["off","bn","en"].map(v => (
                  <button key={v} className={`reader-lang-pill ${readLang===v?"active":""}`} onClick={() => setLang(v)}>
                    {v === "off" ? "AR" : v.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="reader-3d-pager glass-card">
              <button onClick={() => sceneRef.current?.turnPage(-1)} aria-label={t.previousPage || "Previous page"}>‹</button>
              <span className="reader-pager-count">{currentPageIdx + 1} / {pages.length || 1}</span>
              <button onClick={() => sceneRef.current?.turnPage(1)} aria-label={t.nextPage || "Next page"}>›</button>
            </div>

            {/* Accessible fallback: the currently-open spread's real ayah
                text/translation as actual DOM — screen readers, in-page
                find, and text selection all work through this even though
                the visible pages are canvas. Tapping an ayah here plays it,
                same as tapping it on the 3D page. */}
            <div className="sr-only reader-3d-a11y-mirror" aria-live="polite">
              {visibleAyahs.map(v => {
                const bn = v.translations?.find(tr => Number(tr.resource_id) === 161)?.text || "";
                const en = v.translations?.find(tr => Number(tr.resource_id) === 131)?.text || "";
                return (
                  <button key={v.verse_number} onClick={() => playFromHere(v.verse_number)}>
                    {v.verse_number}. {v.text_uthmani}
                    {readLang === "bn" && bn && ` — ${stripHtml(bn)}`}
                    {readLang === "en" && en && ` — ${stripHtml(en)}`}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
