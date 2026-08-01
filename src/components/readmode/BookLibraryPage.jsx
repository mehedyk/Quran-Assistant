import { useState, useEffect } from "react";
import { fetchAllSurahs, fetchSurahAyat } from "../../utils/api.js";

export default function BookLibraryPage({ t, navigate }) {
  const [surahs, setSurahs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("");

  useEffect(() => {
    fetchAllSurahs().then(s => { setSurahs(s); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = surahs.filter(s =>
    !filter ||
    s.name_simple.toLowerCase().includes(filter.toLowerCase()) ||
    s.translated_name?.name?.toLowerCase().includes(filter.toLowerCase()) ||
    String(s.id).includes(filter)
  );

  function openBook(s) {
    // _origin marks that Read Mode was entered from the library shelf,
    // so its close button returns here instead of the flat surah list.
    fetchSurahAyat(s.id).then(d => navigate("readmode", { ...d, surahNum: s.id, _origin: "book" }));
  }

  return (
    <div className="page book-library-page">
      <div className="page-header">
        <h2 className="page-title">{t.readMode}</h2>
        <p className="page-sub">{t.bookLibrarySub}</p>
      </div>
      <div className="search-bar-wrap">
        <input className="search-bar" value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder={t.surahPlaceholder} />
      </div>
      {loading ? (
        <div className="book-shelf">
          {Array(10).fill(0).map((_, i) => <div key={i} className="skeleton book-spine" />)}
        </div>
      ) : (
        <div className="book-shelf">
          {filtered.map(s => (
            <button key={s.id} className="book-spine glass-card" onClick={() => openBook(s)}>
              <span className="book-spine-num">{s.id}</span>
              <span className="book-spine-ar">{s.name_arabic}</span>
              <span className="book-spine-en">{s.name_simple}</span>
              <span className="book-spine-meta">{s.verses_count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
