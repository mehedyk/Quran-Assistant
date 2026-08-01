import { useState, useEffect } from "react";
import { Bookmark, Share2, PinOff, Flame, BookOpenCheck } from "lucide-react";
import { getBookmarks, removeBookmark, getVersesReadCount, getActiveDaysCount } from "../../utils/storage.js";
import { stripHtml } from "../../utils/constants.js";

const TOTAL_AYAT = 6236;

export default function JourneyPage({ t, navigate, onShare, tick }) {
  const [bookmarks, setBookmarks] = useState(getBookmarks());
  const versesRead = getVersesReadCount();
  const daysActive = getActiveDaysCount();
  const pct = Math.min(100, Math.round((versesRead / TOTAL_AYAT) * 1000) / 10);

  useEffect(() => { setBookmarks(getBookmarks()); }, [tick]);

  function unpin(key) {
    removeBookmark(key);
    setBookmarks(getBookmarks());
  }

  const circumference = 2 * Math.PI * 68;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="page journey-page">
      <div className="journey-hero glass-card">
        <h2 className="journey-hello">{t.journeyHello}</h2>
        <p className="journey-sub">{t.journeySub}</p>

        <div className="journey-stats-row">
          <div className="glass-card journey-stat">
            <span className="journey-stat-label"><BookOpenCheck size={14}/> {t.versesRead}</span>
            <div className="journey-stat-num">{versesRead.toLocaleString()}</div>
          </div>
          <div className="glass-card journey-stat">
            <span className="journey-stat-label"><Flame size={14}/> {t.daysActive}</span>
            <div className="journey-stat-num">{daysActive}</div>
          </div>
        </div>

        <div className="journey-ring-wrap">
          <div className="journey-ring-glow" aria-hidden />
          <svg width="176" height="176" viewBox="0 0 176 176">
            <circle className="ring-track" cx="88" cy="88" r="68" fill="none" strokeWidth="8" />
            <circle className="ring-fill" cx="88" cy="88" r="68" fill="none" strokeWidth="8"
              strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
              transform="rotate(-90 88 88)" />
          </svg>
          <div className="journey-ring-center">
            <span className="journey-ring-pct">{pct}%</span>
            <span className="journey-ring-label">{t.journeyProgress}</span>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">
          <span><Bookmark size={16} style={{verticalAlign:"-3px", marginRight:6}}/>{t.pinnedVerses}</span>
        </div>
        {bookmarks.length === 0 && <div className="empty-state" style={{whiteSpace:"pre-line"}}>{t.noSaved}</div>}
        {bookmarks.map(b => (
          <div key={b.key} className="glass-card pinned-verse-card">
            <div className="pinned-verse-top">
              <span className="pinned-verse-badge">{b.surahName} ({b.key})</span>
              <div className="pinned-verse-actions">
                <button onClick={() => onShare(b)} aria-label={t.share}><Share2 size={16} /></button>
                <button onClick={() => unpin(b.key)} aria-label="Unpin"><PinOff size={16} /></button>
              </div>
            </div>
            <p className="pinned-verse-ar">{b.arabic}</p>
            {b.bengali && <p className="pinned-verse-trans bangla">{stripHtml(b.bengali)}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
