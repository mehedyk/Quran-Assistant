import { useState, useMemo, useEffect, useRef } from "react";
import { getAyahAudioUrl } from "../../utils/api.js";
import { stripHtml } from "../../utils/constants.js";
import { getSavedReadLang, saveReadLang } from "../../utils/storage.js";

const PAGE_SIZE = 6;

export default function ReadMode({ t, data, audio, onClose }) {
  const { meta, ayat } = data;
  const [stage, setStage]       = useState("cover"); // "cover" | "reading"
  const [pageIdx, setPageIdx]   = useState(0);
  const [readLang, setReadLang] = useState(getSavedReadLang());
  const surfaceRef = useRef(null);
  const userTurnedRef = useRef(false); // suppress auto page-jump right after a manual turn

  const pages = useMemo(() => {
    const out = [];
    for (let i = 0; i < ayat.length; i += PAGE_SIZE) out.push(ayat.slice(i, i + PAGE_SIZE));
    return out;
  }, [ayat]);

  const queueItems = useMemo(() => ayat.map(v => ({
    url: getAyahAudioUrl(meta.id, v.verse_number),
    key: `${meta.id}:${v.verse_number}`,
    surahNum: meta.id,
    ayahNum: v.verse_number,
    surahName: meta.name_simple,
  })), [ayat, meta]);

  function setLang(v) { setReadLang(v); saveReadLang(v); }

  function playFromHere(verseNumber) {
    const startIndex = ayat.findIndex(v => v.verse_number === verseNumber);
    audio.playQueue(queueItems, startIndex < 0 ? 0 : startIndex);
  }

  // Auto page-turn: when the actively-playing ayah moves onto a page
  // the reader isn't currently viewing, follow it — but only while
  // this surah's queue is the one actually playing.
  useEffect(() => {
    if (!audio.isPlaying || !audio.current || audio.current.surahNum !== meta.id) return;
    const targetPage = pages.findIndex(p => p.some(v => v.verse_number === audio.current.ayahNum));
    if (targetPage >= 0 && targetPage !== pageIdx) setPageIdx(targetPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio.current, audio.isPlaying]);

  // Cursor glow on the reading surface (desktop / hover-capable only — see CSS).
  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    function onMove(e) {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--cursor-x", `${e.clientX - r.left}px`);
      el.style.setProperty("--cursor-y", `${e.clientY - r.top}px`);
    }
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, [stage]);

  const revPlace = meta?.revelation_place === "makkah" ? t.makki : t.madani;

  if (stage === "cover") {
    return (
      <div className="readmode readmode-cover">
        <button className="readmode-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="book-cover">
          <div className="book-cover-frame" aria-hidden>
            <svg viewBox="0 0 300 400" preserveAspectRatio="none">
              <rect x="10" y="10" width="280" height="380" fill="none" stroke="var(--gold2)" strokeWidth="1.5" />
              <rect x="16" y="16" width="268" height="368" fill="none" stroke="var(--gold2)" strokeWidth="0.75" opacity="0.6" />
              {[[10,10],[290,10],[10,390],[290,390]].map(([x,y],i) => (
                <path key={i}
                  d={`M ${x} ${y} m ${x<150?18:-18} 0 a 18 18 0 0 ${x<150?1:0} ${x<150?-18:18} ${y<200?18:-18}`}
                  fill="none" stroke="var(--gold2)" strokeWidth="1.5" />
              ))}
            </svg>
          </div>
          <div className="book-cover-content">
            <div className="book-cover-ar">{meta?.name_arabic}</div>
            <div className="book-cover-en">{meta?.name_simple}</div>
            <div className="book-cover-bn">{meta?.translated_name?.name}</div>
            <div className="book-cover-meta">
              <span>{meta?.verses_count} {t.allAyat}</span>
              <span className="book-cover-dot">·</span>
              <span>{revPlace}</span>
            </div>
            <button className="book-cover-begin" onClick={() => setStage("reading")}>
              {t.beginReading}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const page = pages[pageIdx] || [];

  return (
    <div className="readmode readmode-reading">
      <div className="reader-topbar">
        <button className="readmode-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="reader-titles">
          <span className="reader-title-ar">{meta?.name_arabic}</span>
          <span className="reader-title-en">{meta?.name_simple}</span>
        </div>
        <div className="reader-lang-toggle">
          {["off","bn","en"].map(v => (
            <button key={v} className={`reader-lang-pill ${readLang===v?"active":""}`} onClick={() => setLang(v)}>
              {v === "off" ? "AR" : v.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <button className="reader-play-btn" onClick={() => audio.isPlaying && audio.current?.surahNum === meta.id ? audio.togglePause() : playFromHere(page[0]?.verse_number)}>
        {audio.isPlaying && audio.current?.surahNum === meta.id ? `⏸ ${t.stop}` : `▶ ${t.playSurah}`}
      </button>

      <div className="reader-surface" ref={surfaceRef}>
        <div className="reader-cursor-glow" aria-hidden />
        <div key={pageIdx} className="reader-page">
          {page.map(v => {
            const key = `${meta.id}:${v.verse_number}`;
            const isActive = audio.activeKey === key;
            const isNext   = audio.nextKey === key;
            const bn = v.translations?.find(tr => tr.resource_id === 161)?.text || "";
            const en = v.translations?.find(tr => tr.resource_id === 131)?.text || "";
            return (
              <div key={key}
                className={`reader-ayah ${isActive ? "reader-ayah-active" : ""} ${isNext ? "reader-ayah-next" : ""}`}
                onClick={() => playFromHere(v.verse_number)}
              >
                <span className="reader-ayah-num">{v.verse_number}</span>
                <span className="reader-ayah-ar">{v.text_uthmani}</span>
                {readLang === "bn" && bn && <div className="reader-ayah-trans bangla">{stripHtml(bn)}</div>}
                {readLang === "en" && en && <div className="reader-ayah-trans">{stripHtml(en)}</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="reader-pager">
        <button disabled={pageIdx===0} onClick={() => { userTurnedRef.current = true; setPageIdx(p => Math.max(0,p-1)); }}>‹</button>
        <span className="reader-pager-count">{pageIdx+1} / {pages.length}</span>
        <button disabled={pageIdx===pages.length-1} onClick={() => { userTurnedRef.current = true; setPageIdx(p => Math.min(pages.length-1,p+1)); }}>›</button>
      </div>
    </div>
  );
}
