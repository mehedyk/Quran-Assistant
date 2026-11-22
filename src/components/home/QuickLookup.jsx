import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { fetchAyah } from "../../utils/api.js";
import { localizeDigits, normalizeDigits } from "../../utils/constants.js";

const QUICK_REFS = ["2:255", "1:1", "112:1", "36:1"];

// Figma "Quick lookup" panel. Behaviour is the original Home quick lookup:
//   "surah:ayah"  -> opens that ayah   |  anything else -> word search.
// New: Bengali numerals (২:২৫৫) are accepted, as the Figma placeholder shows.
export default function QuickLookup({ t, lang, navigate }) {
  const [input, setInput] = useState("");

  function openRef(surah, ayah) {
    return fetchAyah(surah, ayah)
      .then(d => navigate("ayah", d))
      .catch(() => alert(t.loadFailed));
  }

  function submit() {
    const v = normalizeDigits(input.trim());
    if (!v) return;
    const m = v.match(/^(\d{1,3})\s*:\s*(\d{1,3})$/);
    if (m) openRef(parseInt(m[1]), parseInt(m[2]));
    else navigate("search", { initialQuery: input.trim() });
    setInput("");
  }

  return (
    <section className="home-section lookup-section" aria-labelledby="lookup-title">
      <div className="lookup-panel">
        <div className="lookup-intro">
          <h2 id="lookup-title" className="lookup-title">{t.lookupTitle}</h2>
          <p className="lookup-hint">{t.lookupHint}</p>
        </div>
        <div className="lookup-controls">
          <div className="search-field">
            <Search size={20} strokeWidth={1.5} className="search-field-icon" aria-hidden />
            <input
              className="search-field-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder={t.lookupPlaceholder}
              aria-label={t.quickLookup}
              enterKeyHint="search"
            />
            <button type="button" className="search-field-submit" onClick={submit} aria-label={t.lookupSubmit}>
              <ArrowRight size={20} strokeWidth={1.5} aria-hidden />
            </button>
          </div>
          <div className="quick-refs">
            <span className="quick-refs-label">{t.quickFind}</span>
            {QUICK_REFS.map(ref => (
              <button
                key={ref}
                type="button"
                className="ref-chip"
                onClick={() => { const [s, a] = ref.split(":").map(Number); openRef(s, a); }}
              >
                {localizeDigits(ref, lang)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
