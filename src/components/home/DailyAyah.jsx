import { useState, useEffect } from "react";
import { Play, Pause, Bookmark, BookmarkCheck, ArrowRight } from "lucide-react";
import { fetchAyah } from "../../utils/api.js";
import { getAyahOfTheDay, stripHtml, localizeDigits } from "../../utils/constants.js";
import { addBookmark, removeBookmark, isBookmarked } from "../../utils/storage.js";

// Figma "Daily ayah" card, fed by the same ayah-of-the-day lookup as the
// original Home page. Recite uses the shared audio hook; Save uses the same
// bookmark store as the Ayah page (the original Home card had no Save).
export default function DailyAyah({ t, lang, navigate, audio, onBookmarkChange }) {
  const [ayah, setAyah]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    const { surah, ayah: n } = getAyahOfTheDay();
    fetchAyah(surah, n)
      .then(d => { setAyah(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { if (ayah?.key) setSaved(isBookmarked(ayah.key)); }, [ayah?.key]);

  function toggleSave() {
    if (!ayah) return;
    if (saved) { removeBookmark(ayah.key); setSaved(false); }
    else       { addBookmark(ayah);        setSaved(true); }
    onBookmarkChange?.();
  }

  const isPlaying = !!ayah && audio.playingUrl === ayah.audioUrl;
  const bengali   = ayah ? stripHtml(ayah.bengali || "") : "";
  // Long verses (e.g. 2:282) get smaller type so the card never explodes.
  const size = ayah && ((ayah.arabic || "").length > 110 || bengali.length > 190)
    ? "long"
    : ayah && ((ayah.arabic || "").length > 55 || bengali.length > 100) ? "medium" : "short";

  return (
    <section className="home-section daily-section" aria-labelledby="daily-title">
      <div className="daily-card" data-size={size}>
        {loading && <div className="skeleton daily-skeleton" />}
        {!loading && !ayah && <div className="daily-error">{t.loadFailed}</div>}
        {!loading && ayah && (
          <>
            <div className="daily-meta">
              <span className="eyebrow">{t.ayahEyebrow}</span>
              <h2 id="daily-title" className="daily-title">{t.todayAyah}</h2>
              <p className="daily-source">{ayah.surahName} · {localizeDigits(ayah.key, lang)}</p>
              <p className="daily-note">{t.ayahVerified}</p>
            </div>
            <div className="daily-divider" aria-hidden />
            <div className="daily-verse">
              <p className="daily-arabic" lang="ar" dir="rtl">{ayah.arabic}</p>
              {bengali && <p className="daily-translation">{bengali}</p>}
              <div className="daily-actions">
                <div className="daily-buttons">
                  <button type="button" className="btn-accent btn-sm" onClick={() => audio.play(ayah.audioUrl)}>
                    {isPlaying ? <Pause size={20} strokeWidth={1.5} aria-hidden /> : <Play size={20} strokeWidth={1.5} aria-hidden />}
                    {isPlaying ? t.stopShort : t.reciteShort}
                  </button>
                  <button type="button" className={`btn-raised btn-sm ${saved ? "is-on" : ""}`} onClick={toggleSave} aria-pressed={saved}>
                    {saved ? <BookmarkCheck size={20} strokeWidth={1.5} aria-hidden /> : <Bookmark size={20} strokeWidth={1.5} aria-hidden />}
                    {saved ? t.savedShort : t.saveShort}
                  </button>
                </div>
                <button type="button" className="text-link" onClick={() => navigate("ayah", ayah)}>
                  {t.ayahDetails}
                  <ArrowRight size={18} strokeWidth={1.5} aria-hidden />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
