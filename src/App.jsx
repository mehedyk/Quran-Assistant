import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "./hooks/useTheme.js";
import { useAudio } from "./hooks/useAudio.js";
import { THEMES, getAyahOfTheDay, stripHtml } from "./utils/constants.js";
import {
  fetchAyah, fetchSurahMeta, fetchSurahAyat,
  fetchAllSurahs, searchByWord, callAI, FACTUAL_SYSTEM
} from "./utils/api.js";
import {
  getBookmarks, addBookmark, removeBookmark, isBookmarked,
  getRecentSearches, addRecentSearch, isFirstVisit
} from "./utils/storage.js";

// ── PAGES ────────────────────────────────────────────────────────
// home | search | surah-browser | ayah | surah | bookmarks | ask

export default function App() {
  const { theme, cycleTheme } = useTheme();
  const audio = useAudio();

  const [page, setPage]               = useState("home");
  const [pageData, setPageData]       = useState(null);
  const [showHowTo, setShowHowTo]     = useState(false);
  const [bookmarkTick, setBookmarkTick] = useState(0); // force re-render on bookmark change

  // Show how-to on first visit
  useEffect(() => { if (isFirstVisit()) setShowHowTo(true); }, []);

  function navigate(p, data = null) {
    setPage(p);
    setPageData(data);
    window.scrollTo(0, 0);
  }

  const themeNames = Object.keys(THEMES);
  const themeIcons = { noor: "☀️", layl: "🌙", sabz: "🌿" };

  return (
    <>
      <style>{BASE_CSS}</style>

      {/* HOW TO USE MODAL */}
      {showHowTo && <HowToModal onClose={() => setShowHowTo(false)} />}

      {/* APP SHELL */}
      <div className="app">

        {/* TOP NAV */}
        <nav className="nav">
          <button className="nav-logo" onClick={() => navigate("home")}>
            <span className="nav-logo-ar">هادي</span>
          </button>
          <div className="nav-actions">
            <button className="nav-btn" onClick={() => setShowHowTo(true)} title="কীভাবে ব্যবহার করবেন">?</button>
            <button className="nav-btn" onClick={cycleTheme} title="থিম পরিবর্তন">
              {themeIcons[theme]}
            </button>
          </div>
        </nav>

        {/* BOTTOM TAB BAR */}
        <div className="tab-bar">
          <button className={`tab ${page === "home" ? "active" : ""}`} onClick={() => navigate("home")}>
            <span className="tab-icon">🏠</span>
            <span className="tab-label">হোম</span>
          </button>
          <button className={`tab ${page === "search" ? "active" : ""}`} onClick={() => navigate("search")}>
            <span className="tab-icon">🔍</span>
            <span className="tab-label">অনুসন্ধান</span>
          </button>
          <button className={`tab ${page === "surah-browser" ? "active" : ""}`} onClick={() => navigate("surah-browser")}>
            <span className="tab-icon">📖</span>
            <span className="tab-label">সূরা</span>
          </button>
          <button className={`tab ${page === "ask" ? "active" : ""}`} onClick={() => navigate("ask")}>
            <span className="tab-icon">❓</span>
            <span className="tab-label">জিজ্ঞাসা</span>
          </button>
          <button className={`tab ${page === "bookmarks" ? "active" : ""}`} onClick={() => navigate("bookmarks")}>
            <span className="tab-icon">🔖</span>
            <span className="tab-label">সংরক্ষিত</span>
          </button>
        </div>

        {/* PAGE CONTENT */}
        <main className="main">
          {page === "home"          && <HomePage navigate={navigate} audio={audio} />}
          {page === "search"        && <SearchPage navigate={navigate} audio={audio} />}
          {page === "surah-browser" && <SurahBrowserPage navigate={navigate} />}
          {page === "ayah"          && <AyahPage data={pageData} audio={audio} onBookmarkChange={() => setBookmarkTick(t => t + 1)} />}
          {page === "surah"         && <SurahPage data={pageData} navigate={navigate} audio={audio} onBookmarkChange={() => setBookmarkTick(t => t + 1)} />}
          {page === "bookmarks"     && <BookmarksPage key={bookmarkTick} navigate={navigate} onBookmarkChange={() => setBookmarkTick(t => t + 1)} />}
          {page === "ask"           && <AskPage />}
        </main>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// HOME PAGE
// ════════════════════════════════════════════════════════════════
function HomePage({ navigate, audio }) {
  const [aotd, setAotd]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput]   = useState("");

  useEffect(() => {
    const { surah, ayah } = getAyahOfTheDay();
    fetchAyah(surah, ayah).then(d => { setAotd(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  function handleQuickLookup() {
    const v = input.trim();
    if (!v) return;
    const ayahMatch = v.match(/^(\d{1,3}):(\d{1,3})$/);
    if (ayahMatch) {
      navigate("ayah-loading", null);
      fetchAyah(parseInt(ayahMatch[1]), parseInt(ayahMatch[2]))
        .then(d => navigate("ayah", d))
        .catch(() => alert("আয়াত পাওয়া যায়নি।"));
    } else {
      navigate("search", { initialQuery: v });
    }
    setInput("");
  }

  return (
    <div className="page home-page">
      {/* HERO */}
      <div className="hero">
        <div className="hero-pattern" aria-hidden="true" />
        <div className="bismillah-hero">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        <h1 className="hero-title">هادي</h1>
        <p className="hero-sub">যাচাইকৃত কুরআন রেফারেন্স</p>
      </div>

      {/* QUICK LOOKUP */}
      <div className="section">
        <div className="quick-lookup">
          <input
            className="quick-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleQuickLookup()}
            placeholder="আয়াত লিখুন (২:২৫৫) বা সূরা নম্বর…"
          />
          <button className="quick-btn" onClick={handleQuickLookup}>→</button>
        </div>
        <div className="quick-chips">
          {["2:255", "1:1", "112:1", "36:1"].map(c => (
            <button key={c} className="chip" onClick={() => {
              fetchAyah(...c.split(":").map(Number)).then(d => navigate("ayah", d));
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* AYAH OF THE DAY */}
      <div className="section">
        <div className="section-title">
          <span className="section-title-ar">آية اليوم</span>
          <span>আজকের আয়াত</span>
        </div>
        {loading ? <div className="skeleton" style={{height: 160}} /> : aotd ? (
          <AyahCard ayah={aotd} audio={audio} onTap={() => navigate("ayah", aotd)} />
        ) : null}
      </div>

      {/* NAV CARDS */}
      <div className="section">
        <div className="nav-cards">
          <button className="nav-card" onClick={() => navigate("search")}>
            <span className="nav-card-icon">🔍</span>
            <span className="nav-card-title">শব্দ অনুসন্ধান</span>
            <span className="nav-card-sub">সবর, রহমত, জান্নাত…</span>
          </button>
          <button className="nav-card" onClick={() => navigate("surah-browser")}>
            <span className="nav-card-icon">📖</span>
            <span className="nav-card-title">সূরা ব্রাউজ</span>
            <span className="nav-card-sub">১১৪টি সূরা</span>
          </button>
          <button className="nav-card" onClick={() => navigate("bookmarks")}>
            <span className="nav-card-icon">🔖</span>
            <span className="nav-card-title">সংরক্ষিত</span>
            <span className="nav-card-sub">আপনার আয়াত</span>
          </button>
          <button className="nav-card" onClick={() => navigate("ask")}>
            <span className="nav-card-icon">❓</span>
            <span className="nav-card-title">তথ্য জিজ্ঞাসা</span>
            <span className="nav-card-sub">কী, কখন, কোনটি</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SEARCH PAGE
// ════════════════════════════════════════════════════════════════
function SearchPage({ navigate, audio, initialData }) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const recent = getRecentSearches();

  async function doSearch(q) {
    if (!q.trim()) return;
    addRecentSearch(q.trim());
    setLoading(true);
    setError(null);
    try {
      const r = await searchByWord(q.trim());
      setResults(r);
    } catch { setError("অনুসন্ধান ব্যর্থ হয়েছে।"); }
    finally { setLoading(false); }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">শব্দ অনুসন্ধান</h2>
        <p className="page-sub">বাংলা বা ইংরেজিতে যেকোনো শব্দ লিখুন</p>
      </div>

      <div className="search-bar-wrap">
        <input
          className="search-bar"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && doSearch(query)}
          placeholder="সবর · রহমত · patience · mercy…"
          autoFocus
        />
        <button className="search-go" onClick={() => doSearch(query)} disabled={loading}>
          {loading ? <span className="spin">⟳</span> : "অনুসন্ধান"}
        </button>
      </div>

      {/* RECENT */}
      {!results && recent.length > 0 && (
        <div className="section">
          <div className="label-sm">সাম্প্রতিক অনুসন্ধান</div>
          <div className="chip-row">
            {recent.map(r => (
              <button key={r} className="chip" onClick={() => { setQuery(r); doSearch(r); }}>{r}</button>
            ))}
          </div>
        </div>
      )}

      {/* SUGGESTED */}
      {!results && (
        <div className="section">
          <div className="label-sm">জনপ্রিয় অনুসন্ধান</div>
          <div className="chip-row">
            {["সবর","রহমত","জান্নাত","তাকওয়া","ঈমান","দুয়া","ন্যায়","ক্ষমা"].map(w => (
              <button key={w} className="chip" onClick={() => { setQuery(w); doSearch(w); }}>{w}</button>
            ))}
          </div>
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      {results && (
        <div className="section">
          <div className="results-meta">
            <strong>"{results.query}"</strong>
            {results.mapped && <span className="tag-sm"> → {results.resolvedQuery}</span>}
            <span> — {results.total}টি আয়াত, {results.groups.length}টি সূরায়</span>
          </div>
          {results.groups.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p>কোনো আয়াত পাওয়া যায়নি।<br/>অন্য শব্দ চেষ্টা করুন।</p>
            </div>
          )}
          {results.groups.map(g => (
            <div key={g.surah} className="search-group">
              <div className="search-group-hdr">
                <span className="search-group-name">{g.surahName} <span className="muted">({g.surahNameBn})</span></span>
                <span className="badge">{g.ayat.length}টি</span>
              </div>
              {g.ayat.map(a => (
                <button key={a.key} className="search-ayah-row" onClick={() => {
                  fetchAyah(...a.key.split(":").map(Number)).then(d => navigate("ayah", d));
                }}>
                  <div className="search-ayah-key">{a.key}</div>
                  <div className="search-ayah-ar">{a.arabic}</div>
                  <div className="search-ayah-en">{stripHtml(a.english)}</div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SURAH BROWSER
// ════════════════════════════════════════════════════════════════
function SurahBrowserPage({ navigate }) {
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

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">সূরা ব্রাউজ</h2>
        <p className="page-sub">কুরআনের ১১৪টি সূরা</p>
      </div>
      <div className="search-bar-wrap">
        <input className="search-bar" value={filter} onChange={e => setFilter(e.target.value)} placeholder="সূরার নাম বা নম্বর…" />
      </div>
      {loading ? (
        <div className="surah-grid">
          {Array(12).fill(0).map((_, i) => <div key={i} className="skeleton surah-skeleton" />)}
        </div>
      ) : (
        <div className="surah-grid">
          {filtered.map(s => (
            <button key={s.id} className="surah-card" onClick={() => {
              fetchSurahAyat(s.id).then(d => navigate("surah", { ...d, surahNum: s.id }));
            }}>
              <div className="surah-num">{s.id}</div>
              <div className="surah-ar">{s.name_arabic}</div>
              <div className="surah-en">{s.name_simple}</div>
              <div className="surah-bn">{s.translated_name?.name}</div>
              <div className="surah-meta">
                <span>{s.verses_count} আয়াত</span>
                <span>{s.revelation_place === "makkah" ? "মক্কী" : "মাদানী"}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// AYAH PAGE — full ayah display
// ════════════════════════════════════════════════════════════════
function AyahPage({ data, audio, onBookmarkChange }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied]         = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (data?.key) setBookmarked(isBookmarked(data.key));
  }, [data?.key]);

  if (!data) return <div className="page"><div className="empty-state"><p>আয়াত লোড হয়নি।</p></div></div>;

  function toggleBookmark() {
    if (bookmarked) { removeBookmark(data.key); setBookmarked(false); }
    else            { addBookmark(data);         setBookmarked(true); }
    onBookmarkChange?.();
  }

  function copyText() {
    const text = `${data.arabic}\n\n${stripHtml(data.bengali)}\n\n— ${data.surahName} (${data.key})`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isPlaying = audio.playingUrl === data.audioUrl;

  return (
    <div className="page ayah-page">
      {showShareModal && <ShareModal ayah={data} onClose={() => setShowShareModal(false)} />}

      {/* SURAH BADGE */}
      <div className="ayah-surah-badge">
        <span className="ayah-surah-ar">{data.surahName}</span>
        <span className="ayah-surah-bn">{data.surahNameBn}</span>
        <span className="ayah-key-badge">{data.key}</span>
      </div>

      {/* ARABIC */}
      <div className="arabic-card">
        <div className="arabic-text">{data.arabic}</div>
        <div className="arabic-actions">
          <button className={`action-btn ${isPlaying ? "active" : ""}`} onClick={() => audio.play(data.audioUrl)} title="তিলাওয়াত">
            {isPlaying ? "⏸" : "▶"} {isPlaying ? "বন্ধ" : "তিলাওয়াত"}
          </button>
          <button className={`action-btn ${bookmarked ? "active gold" : ""}`} onClick={toggleBookmark}>
            {bookmarked ? "🔖 সংরক্ষিত" : "🔖 সংরক্ষণ"}
          </button>
          <button className="action-btn" onClick={() => setShowShareModal(true)}>📤 শেয়ার</button>
          <button className="action-btn" onClick={copyText}>{copied ? "✓ কপি" : "📋 কপি"}</button>
        </div>
      </div>

      {/* TRANSLATIONS — Bengali first, then English */}
      {data.bengali && (
        <div className="trans-card">
          <div className="trans-lang">🇧🇩 বাংলা অনুবাদ — মুহিউদ্দীন খান</div>
          <div className="trans-text bangla">{stripHtml(data.bengali)}</div>
        </div>
      )}
      {data.english && (
        <div className="trans-card">
          <div className="trans-lang">🇬🇧 English — Dr. Mustafa Khattab</div>
          <div className="trans-text">{stripHtml(data.english)}</div>
        </div>
      )}

      {/* TAFSIR */}
      {data.tafsir && (
        <div className="tafsir-card">
          <div className="tafsir-title">📚 {data.tafsirName}</div>
          <div className="tafsir-note">(মূল উৎস — AI তৈরি নয়)</div>
          <div className="tafsir-text">{stripHtml(data.tafsir)}</div>
        </div>
      )}

      {/* REFERENCE LINK */}
      <a className="ref-link" href={data.quranComUrl} target="_blank" rel="noopener noreferrer">
        🔗 quran.com-এ যাচাই করুন →
      </a>

      {/* SCHOLAR NOTE */}
      <div className="scholar-note">
        ⚠️ গভীর বোঝার জন্য সর্বদা একজন যোগ্য আলেম ও বিশ্বস্ত তাফসীর দেখুন।
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SURAH PAGE — surah info + all ayat
// ════════════════════════════════════════════════════════════════
function SurahPage({ data, navigate, audio, onBookmarkChange }) {
  const [expanded, setExpanded] = useState({});
  if (!data) return null;
  const { meta, ayat } = data;

  function toggleExpand(key) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const revPlace = meta?.revelation_place === "makkah" ? "মক্কী" : "মাদানী";
  const rows = [
    ["আরবি নাম",      meta?.name_arabic],
    ["উচ্চারণ",       meta?.name_simple],
    ["অর্থ",          meta?.translated_name?.name],
    ["নাজিলের স্থান", revPlace],
    ["মোট আয়াত",     meta?.verses_count],
    ["সূরা নম্বর",    meta?.id],
  ].filter(([, v]) => v);

  return (
    <div className="page surah-page">
      {/* SURAH HEADER */}
      <div className="surah-header-card">
        <div className="surah-header-ar">{meta?.name_arabic}</div>
        <div className="surah-header-en">{meta?.name_simple}</div>
        <div className="surah-header-bn">{meta?.translated_name?.name}</div>
        <table className="info-table">
          <tbody>
            {rows.map(([l, v]) => (
              <tr key={l}><td className="info-lbl">{l}</td><td className="info-val">{v}</td></tr>
            ))}
          </tbody>
        </table>
        <a className="ref-link" href={`https://quran.com/${meta?.id}`} target="_blank" rel="noopener noreferrer">
          🔗 quran.com-এ দেখুন
        </a>
      </div>

      {/* ALL AYAT */}
      <div className="section">
        <div className="section-title"><span>সকল আয়াত</span></div>
        {ayat.map((v, i) => {
          const key  = `${meta?.id}:${v.verse_number}`;
          const isEx = expanded[key];
          const bnTrans = v.translations?.find(t => t.resource_id === 161)?.text || "";
          const enTrans = v.translations?.find(t => t.resource_id === 131)?.text || "";
          return (
            <div key={key} className="surah-ayah-row">
              <div className="surah-ayah-top">
                <span className="surah-ayah-num">{v.verse_number}</span>
                <div className="surah-ayah-ar">{v.text_uthmani}</div>
                <button className="surah-ayah-expand" onClick={() => toggleExpand(key)}>
                  {isEx ? "▲" : "▼"}
                </button>
              </div>
              {isEx && (
                <div className="surah-ayah-detail">
                  {bnTrans && <div className="trans-text bangla" style={{marginBottom:8}}>{stripHtml(bnTrans)}</div>}
                  {enTrans && <div className="trans-text" style={{marginBottom:8, fontStyle:"italic", fontSize:"0.82rem"}}>{stripHtml(enTrans)}</div>}
                  <div className="surah-ayah-actions">
                    <button className="action-btn-sm" onClick={() => navigate("ayah", null) || fetchAyah(meta?.id, v.verse_number).then(d => navigate("ayah", d))}>
                      পূর্ণ বিবরণ →
                    </button>
                    <button className="action-btn-sm" onClick={() => {
                      const url = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${i + (data.surahOffset || 1)}.mp3`;
                      fetchAyah(meta?.id, v.verse_number).then(d => audio.play(d.audioUrl));
                    }}>▶ তিলাওয়াত</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// BOOKMARKS PAGE
// ════════════════════════════════════════════════════════════════
function BookmarksPage({ navigate, onBookmarkChange }) {
  const [bookmarks, setBookmarks] = useState(getBookmarks());

  function remove(key) {
    removeBookmark(key);
    setBookmarks(getBookmarks());
    onBookmarkChange?.();
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">সংরক্ষিত আয়াত</h2>
        <p className="page-sub">{bookmarks.length}টি আয়াত সংরক্ষিত</p>
      </div>
      {bookmarks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔖</div>
          <p>এখনো কোনো আয়াত সংরক্ষণ করা হয়নি।<br/>আয়াত খুলুন এবং সংরক্ষণ বাটন চাপুন।</p>
        </div>
      ) : (
        <div className="section">
          {bookmarks.map(b => (
            <div key={b.key} className="bookmark-row">
              <button className="bookmark-main" onClick={() => fetchAyah(b.surah, b.ayahNum).then(d => navigate("ayah", d))}>
                <div className="bookmark-key">{b.key} — {b.surahName}</div>
                <div className="bookmark-ar">{b.arabic}</div>
                <div className="bookmark-bn">{stripHtml(b.bengali || "")}</div>
              </button>
              <button className="bookmark-del" onClick={() => remove(b.key)} title="মুছুন">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ASK PAGE — factual Q&A only
// ════════════════════════════════════════════════════════════════
function AskPage() {
  const [input, setInput]     = useState("");
  const [answer, setAnswer]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function ask() {
    if (!input.trim()) return;
    setLoading(true); setError(null); setAnswer(null);
    try {
      const a = await callAI(FACTUAL_SYSTEM, input.trim(), 300);
      setAnswer(a);
    } catch { setError("উত্তর দেওয়া সম্ভব হয়নি। ইন্টারনেট সংযোগ চেক করুন।"); }
    finally { setLoading(false); }
  }

  const EXAMPLES = [
    "নামাজের ওয়াক্ত কয়টি ও নাম কী?",
    "ইসলামের পাঁচ স্তম্ভ কী কী?",
    "সবচেয়ে বড় সূরার নাম কী?",
    "আল-বাকারায় কতটি আয়াত আছে?",
    "What are the 5 pillars of Islam?",
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">তথ্য জিজ্ঞাসা</h2>
        <p className="page-sub">শুধু তথ্যভিত্তিক প্রশ্ন — কী, কখন, কোনটি, কে</p>
      </div>

      <div className="ask-note">
        ⚠️ "কেন" ও ব্যাখ্যামূলক প্রশ্ন এখানে উত্তর দেওয়া হয় না। সেগুলোর জন্য একজন আলেমের সাথে পরামর্শ করুন।
      </div>

      <div className="search-bar-wrap">
        <input
          className="search-bar"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && ask()}
          placeholder="প্রশ্ন লিখুন…"
        />
        <button className="search-go" onClick={ask} disabled={loading || !input.trim()}>
          {loading ? <span className="spin">⟳</span> : "জিজ্ঞাসা"}
        </button>
      </div>

      <div className="section">
        <div className="label-sm">উদাহরণ প্রশ্ন</div>
        <div className="chip-col">
          {EXAMPLES.map(e => (
            <button key={e} className="chip chip-full" onClick={() => setInput(e)}>{e}</button>
          ))}
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {answer && (
        <div className="answer-card">
          <div className="answer-label">উত্তর</div>
          <div className="answer-text">{answer}</div>
          <div className="scholar-note">⚠️ একজন যোগ্য ইসলামী আলেমের সাথে যাচাই করুন।</div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// AYAH CARD — reusable
// ════════════════════════════════════════════════════════════════
function AyahCard({ ayah, audio, onTap }) {
  const isPlaying = audio.playingUrl === ayah.audioUrl;
  return (
    <div className="ayah-card" onClick={onTap}>
      <div className="ayah-card-badge">{ayah.key} — {ayah.surahName}</div>
      <div className="ayah-card-ar">{ayah.arabic}</div>
      <div className="ayah-card-bn bangla">{stripHtml(ayah.bengali || "")}</div>
      <div className="ayah-card-actions" onClick={e => e.stopPropagation()}>
        <button className={`action-btn-sm ${isPlaying ? "active" : ""}`}
          onClick={() => audio.play(ayah.audioUrl)}>
          {isPlaying ? "⏸ বন্ধ" : "▶ তিলাওয়াত"}
        </button>
        <span className="ayah-card-tap">বিস্তারিত →</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SHARE MODAL — generates image card
// ════════════════════════════════════════════════════════════════
function ShareModal({ ayah, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 800, H = 500;
    canvas.width = W; canvas.height = H;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#1e4d30");
    grad.addColorStop(1, "#0d1f1a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Gold border
    ctx.strokeStyle = "rgba(200,150,62,0.6)";
    ctx.lineWidth   = 2;
    ctx.strokeRect(16, 16, W - 32, H - 32);

    // Arabic text
    ctx.fillStyle   = "#f0e8d8";
    ctx.font        = "bold 36px serif";
    ctx.direction   = "rtl";
    ctx.textAlign   = "center";
    const arText    = ayah.arabic || "";
    // Word wrap arabic
    wrapText(ctx, arText, W / 2, 100, W - 80, 48);

    // Bengali translation
    ctx.direction   = "ltr";
    ctx.font        = "20px sans-serif";
    ctx.fillStyle   = "#c8b898";
    ctx.textAlign   = "center";
    const bnText    = stripHtml(ayah.bengali || "").slice(0, 120);
    wrapText(ctx, bnText, W / 2, 280, W - 80, 28);

    // Key + surah name
    ctx.font        = "16px monospace";
    ctx.fillStyle   = "#c8963e";
    ctx.textAlign   = "center";
    ctx.fillText(`${ayah.key} — ${ayah.surahName}`, W / 2, H - 60);

    // App name
    ctx.font        = "14px sans-serif";
    ctx.fillStyle   = "rgba(200,184,152,0.5)";
    ctx.fillText("هادي — Hadi Quran Reference", W / 2, H - 32);
  }, [ayah]);

  function wrapText(ctx, text, x, y, maxW, lineH) {
    const words = text.split(" ");
    let line = "";
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, y);
        line = word;
        y   += lineH;
      } else { line = test; }
    }
    ctx.fillText(line, x, y);
  }

  function download() {
    const a = document.createElement("a");
    a.download = `hadi-${ayah.key}.png`;
    a.href = canvasRef.current.toDataURL("image/png");
    a.click();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>শেয়ার কার্ড</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <canvas ref={canvasRef} style={{ width: "100%", borderRadius: 8 }} />
        <div className="modal-actions">
          <button className="btn-primary" onClick={download}>📥 ডাউনলোড করুন</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// HOW TO MODAL
// ════════════════════════════════════════════════════════════════
function HowToModal({ onClose }) {
  const steps = [
    { icon: "📖", title: "আয়াত দেখুন", desc: "হোম পেজে সূরা:আয়াত নম্বর লিখুন। যেমন: ২:২৫৫ বা 2:255" },
    { icon: "🔍", title: "শব্দ অনুসন্ধান", desc: "অনুসন্ধান পেজে যেকোনো বাংলা বা ইংরেজি শব্দ লিখুন — সবর, রহমত, patience…" },
    { icon: "📚", title: "সূরা ব্রাউজ", desc: "সূরা পেজে সব ১১৪টি সূরা দেখুন। সূরা চাপলে সম্পূর্ণ আয়াত আসবে।" },
    { icon: "❓", title: "তথ্য জিজ্ঞাসা", desc: "কী, কখন, কোনটি — তথ্যভিত্তিক প্রশ্ন করুন। ব্যাখ্যামূলক প্রশ্নের জন্য আলেমের কাছে যান।" },
    { icon: "🔖", title: "সংরক্ষণ ও শেয়ার", desc: "যেকোনো আয়াত সংরক্ষণ করুন বা সুন্দর ইমেজ কার্ড তৈরি করে শেয়ার করুন।" },
  ];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>কীভাবে ব্যবহার করবেন</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {steps.map((s, i) => (
          <div key={i} className="howto-step">
            <div className="howto-icon">{s.icon}</div>
            <div>
              <div className="howto-title">{s.title}</div>
              <div className="howto-desc">{s.desc}</div>
            </div>
          </div>
        ))}
        <button className="btn-primary" onClick={onClose} style={{width:"100%",marginTop:16}}>শুরু করুন</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// CSS
// ════════════════════════════════════════════════════════════════
const BASE_CSS = `
  @font-face {
    font-family: 'UthmanNaskh';
    src: url('https://raw.githubusercontent.com/mustafa0x/qpc-fonts/f93bf5f3/various-woff2/UthmanTN1%20Ver10.woff2') format('woff2');
    font-display: swap;
  }
  @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Amiri+Quran&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:      #f7f0e3; --bg2: #ede4cc; --bg3: #ffffff;
    --ink:     #1a1209; --ink2: #4a3728; --ink3: #7a6a58;
    --gold:    #b8832e; --gold2: #d4a855;
    --green:   #1e4d30; --green2: #2d6b44;
    --border:  rgba(184,131,46,0.25);
    --shadow:  rgba(26,18,9,0.12);
    --warn:    #7c3a0e; --warn-bg: #fff7ed;
    --pattern: rgba(184,131,46,0.06);
    --font-bn: 'Hind Siliguri', sans-serif;
    --font-en: 'Playfair Display', Georgia, serif;
    --font-ar: 'UthmanNaskh', 'Amiri Quran', serif;
    --radius:  12px;
    --tab-h:   64px;
    --nav-h:   56px;
  }

  html { font-size: 16px; }
  body {
    font-family: var(--font-bn);
    background: var(--bg);
    color: var(--ink);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  /* ── APP SHELL ─────────────────────────────────────────────── */
  .app { display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh; max-width: 480px; margin: 0 auto; position: relative; }

  /* ── NAV ────────────────────────────────────────────────────── */
  .nav { height: var(--nav-h); display: flex; align-items: center; justify-content: space-between; padding: 0 18px; background: var(--green); position: sticky; top: 0; z-index: 100; }
  .nav-logo { background: none; border: none; cursor: pointer; }
  .nav-logo-ar { font-family: var(--font-ar); font-size: 1.6rem; color: var(--gold2); letter-spacing: 0.05em; }
  .nav-actions { display: flex; gap: 8px; }
  .nav-btn { width: 36px; height: 36px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.08); color: white; font-size: 1rem; cursor: pointer; display: grid; place-items: center; transition: background 0.15s; }
  .nav-btn:hover { background: rgba(255,255,255,0.15); }

  /* ── MAIN ───────────────────────────────────────────────────── */
  .main { flex: 1; overflow-y: auto; padding-bottom: calc(var(--tab-h) + env(safe-area-inset-bottom, 0px)); }

  /* ── TAB BAR ────────────────────────────────────────────────── */
  .tab-bar { height: var(--tab-h); display: flex; background: var(--bg3); border-top: 1px solid var(--border); position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 480px; z-index: 100; padding-bottom: env(safe-area-inset-bottom, 0px); }
  .tab { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; border: none; background: none; cursor: pointer; color: var(--ink3); transition: color 0.15s; padding: 6px 0; }
  .tab.active { color: var(--green); }
  .tab-icon { font-size: 1.2rem; }
  .tab-label { font-family: var(--font-bn); font-size: 0.62rem; font-weight: 500; }
  .tab.active .tab-label { font-weight: 700; }

  /* ── PAGE ───────────────────────────────────────────────────── */
  .page { padding: 0 0 24px; }
  .page-header { padding: 20px 18px 12px; }
  .page-title { font-family: var(--font-en); font-size: 1.4rem; color: var(--green); }
  .page-sub { font-size: 0.8rem; color: var(--ink3); margin-top: 3px; }
  .section { padding: 12px 18px; }
  .section-title { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 0.85rem; font-weight: 600; color: var(--ink2); }
  .section-title-ar { font-family: var(--font-ar); font-size: 1rem; color: var(--gold); }
  .label-sm { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink3); margin-bottom: 8px; }

  /* ── HERO ───────────────────────────────────────────────────── */
  .hero { background: var(--green); padding: 32px 20px 28px; text-align: center; position: relative; overflow: hidden; }
  .hero-pattern { position: absolute; inset: 0; background-image: repeating-linear-gradient(45deg, var(--pattern) 0, var(--pattern) 1px, transparent 0, transparent 50%); background-size: 20px 20px; pointer-events: none; }
  .bismillah-hero { font-family: var(--font-ar); font-size: 1.4rem; color: rgba(212,168,85,0.9); direction: rtl; margin-bottom: 10px; line-height: 2; position: relative; }
  .hero-title { font-family: var(--font-ar); font-size: 3rem; color: var(--gold2); letter-spacing: 0.05em; line-height: 1; position: relative; }
  .hero-sub { font-family: var(--font-bn); font-size: 0.85rem; color: rgba(240,232,216,0.7); margin-top: 6px; position: relative; }

  /* ── QUICK LOOKUP ───────────────────────────────────────────── */
  .quick-lookup { display: flex; gap: 8px; margin-bottom: 10px; }
  .quick-input { flex: 1; font-family: var(--font-bn); font-size: 0.9rem; padding: 12px 14px; border: 1.5px solid var(--border); border-radius: var(--radius); background: var(--bg3); color: var(--ink); outline: none; }
  .quick-input:focus { border-color: var(--gold); }
  .quick-btn { width: 46px; background: var(--green); color: white; border: none; border-radius: var(--radius); font-size: 1.2rem; cursor: pointer; flex-shrink: 0; }
  .quick-chips { display: flex; gap: 6px; flex-wrap: wrap; }

  /* ── CHIPS ──────────────────────────────────────────────────── */
  .chip { font-family: var(--font-bn); font-size: 0.75rem; padding: 5px 12px; border-radius: 20px; border: 1px solid var(--border); background: var(--bg2); color: var(--ink2); cursor: pointer; transition: all 0.14s; }
  .chip:hover { background: var(--gold); color: white; border-color: var(--gold); }
  .chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip-col { display: flex; flex-direction: column; gap: 6px; }
  .chip-full { width: 100%; text-align: left; border-radius: var(--radius); }

  /* ── NAV CARDS ──────────────────────────────────────────────── */
  .nav-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .nav-card { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 16px; background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius); cursor: pointer; text-align: left; transition: all 0.14s; box-shadow: 0 1px 6px var(--shadow); }
  .nav-card:hover { border-color: var(--gold); transform: translateY(-1px); box-shadow: 0 4px 12px var(--shadow); }
  .nav-card-icon { font-size: 1.4rem; }
  .nav-card-title { font-family: var(--font-bn); font-size: 0.85rem; font-weight: 600; color: var(--green); }
  .nav-card-sub { font-size: 0.72rem; color: var(--ink3); }

  /* ── AYAH CARD ──────────────────────────────────────────────── */
  .ayah-card { background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; cursor: pointer; box-shadow: 0 2px 8px var(--shadow); }
  .ayah-card-badge { font-size: 0.68rem; font-weight: 600; color: var(--gold); margin-bottom: 10px; font-family: monospace; }
  .ayah-card-ar { font-family: var(--font-ar); font-size: 1.5rem; line-height: 2.2; direction: rtl; text-align: right; color: var(--ink); margin-bottom: 10px; }
  .ayah-card-bn { font-size: 0.85rem; line-height: 1.75; color: var(--ink2); margin-bottom: 10px; }
  .ayah-card-actions { display: flex; gap: 8px; align-items: center; justify-content: space-between; }
  .ayah-card-tap { font-size: 0.72rem; color: var(--gold); }

  /* ── AYAH PAGE ──────────────────────────────────────────────── */
  .ayah-page { padding-bottom: calc(var(--tab-h) + 24px); }
  .ayah-surah-badge { display: flex; align-items: center; gap: 8px; padding: 14px 18px 8px; flex-wrap: wrap; }
  .ayah-surah-ar { font-family: var(--font-en); font-size: 1rem; font-weight: 700; color: var(--green); }
  .ayah-surah-bn { font-size: 0.8rem; color: var(--ink3); }
  .ayah-key-badge { font-family: monospace; font-size: 0.68rem; background: var(--gold); color: white; padding: 2px 8px; border-radius: 10px; margin-left: auto; }
  .arabic-card { margin: 0 18px 12px; background: linear-gradient(135deg, rgba(30,77,48,0.06), rgba(184,131,46,0.06)); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; }
  .arabic-text { font-family: var(--font-ar); font-size: 1.9rem; line-height: 2.6; direction: rtl; text-align: right; color: var(--ink); margin-bottom: 14px; }
  .arabic-actions { display: flex; gap: 6px; flex-wrap: wrap; }
  .action-btn { font-family: var(--font-bn); font-size: 0.72rem; padding: 5px 10px; border-radius: 20px; border: 1px solid var(--border); background: var(--bg2); color: var(--ink2); cursor: pointer; transition: all 0.14s; }
  .action-btn:hover { border-color: var(--gold); color: var(--gold); }
  .action-btn.active { background: var(--green); color: white; border-color: var(--green); }
  .action-btn.gold { background: var(--gold); color: white; border-color: var(--gold); }
  .action-btn-sm { font-family: var(--font-bn); font-size: 0.7rem; padding: 4px 9px; border-radius: 16px; border: 1px solid var(--border); background: var(--bg2); color: var(--ink2); cursor: pointer; }
  .action-btn-sm.active { background: var(--green); color: white; border-color: var(--green); }
  .trans-card { margin: 0 18px 10px; background: var(--bg3); border: 1px solid var(--border); border-left: 3px solid var(--green2); border-radius: 0 var(--radius) var(--radius) 0; padding: 12px 14px; }
  .trans-lang { font-size: 0.62rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--gold); margin-bottom: 6px; }
  .trans-text { font-size: 0.88rem; line-height: 1.8; color: var(--ink2); }
  .bangla { font-family: var(--font-bn); font-size: 0.95rem; line-height: 1.9; }
  .tafsir-card { margin: 0 18px 10px; background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; }
  .tafsir-title { font-size: 0.72rem; font-weight: 600; color: var(--gold); margin-bottom: 2px; }
  .tafsir-note { font-size: 0.62rem; color: var(--ink3); margin-bottom: 8px; }
  .tafsir-text { font-size: 0.83rem; line-height: 1.85; color: var(--ink2); font-style: italic; }
  .ref-link { display: block; margin: 0 18px 10px; font-size: 0.78rem; color: var(--green2); text-decoration: none; font-weight: 500; }
  .ref-link:hover { text-decoration: underline; }
  .scholar-note { margin: 0 18px 10px; font-size: 0.75rem; color: var(--warn); background: var(--warn-bg); border: 1px solid rgba(124,58,14,0.15); border-radius: 8px; padding: 8px 12px; }

  /* ── SEARCH ─────────────────────────────────────────────────── */
  .search-bar-wrap { display: flex; gap: 8px; padding: 0 18px 14px; }
  .search-bar { flex: 1; font-family: var(--font-bn); font-size: 0.9rem; padding: 12px 14px; border: 1.5px solid var(--border); border-radius: var(--radius); background: var(--bg3); color: var(--ink); outline: none; }
  .search-bar:focus { border-color: var(--gold); }
  .search-go { font-family: var(--font-bn); font-size: 0.8rem; font-weight: 600; padding: 0 14px; background: var(--green); color: white; border: none; border-radius: var(--radius); cursor: pointer; white-space: nowrap; }
  .search-go:disabled { opacity: 0.5; }
  .results-meta { font-size: 0.82rem; color: var(--ink2); margin-bottom: 12px; line-height: 1.6; }
  .tag-sm { font-family: monospace; background: rgba(184,131,46,0.12); padding: 1px 5px; border-radius: 3px; }
  .search-group { margin-bottom: 16px; }
  .search-group-hdr { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border); margin-bottom: 6px; }
  .search-group-name { font-size: 0.82rem; font-weight: 600; color: var(--green); }
  .badge { font-size: 0.62rem; background: rgba(184,131,46,0.12); color: var(--gold); padding: 2px 7px; border-radius: 10px; }
  .search-ayah-row { width: 100%; text-align: left; background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 12px; margin-bottom: 7px; cursor: pointer; transition: border-color 0.14s; display: block; }
  .search-ayah-row:hover { border-color: var(--gold); }
  .search-ayah-key { font-family: monospace; font-size: 0.62rem; color: var(--gold); margin-bottom: 4px; }
  .search-ayah-ar { font-family: var(--font-ar); font-size: 1.2rem; line-height: 2; direction: rtl; text-align: right; color: var(--ink); margin-bottom: 4px; }
  .search-ayah-en { font-size: 0.78rem; color: var(--ink3); font-style: italic; line-height: 1.5; }

  /* ── SURAH BROWSER ──────────────────────────────────────────── */
  .surah-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 0 18px; }
  .surah-card { background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px; text-align: center; cursor: pointer; transition: all 0.14s; }
  .surah-card:hover { border-color: var(--gold); transform: translateY(-1px); }
  .surah-num { font-family: monospace; font-size: 0.65rem; color: var(--gold); margin-bottom: 4px; }
  .surah-ar { font-family: var(--font-ar); font-size: 1.2rem; color: var(--green); direction: rtl; margin-bottom: 4px; }
  .surah-en { font-family: var(--font-en); font-size: 0.75rem; font-weight: 600; color: var(--ink2); }
  .surah-bn { font-size: 0.72rem; color: var(--ink3); margin-bottom: 4px; }
  .surah-meta { display: flex; justify-content: space-between; font-size: 0.62rem; color: var(--ink3); border-top: 1px solid var(--border); padding-top: 6px; margin-top: 4px; }
  .surah-skeleton { height: 110px; border-radius: var(--radius); }

  /* ── SURAH PAGE ─────────────────────────────────────────────── */
  .surah-header-card { margin: 0 18px 16px; background: linear-gradient(135deg, var(--green), #0d2e1c); border-radius: var(--radius); padding: 20px; text-align: center; }
  .surah-header-ar { font-family: var(--font-ar); font-size: 2.2rem; color: var(--gold2); direction: rtl; margin-bottom: 4px; }
  .surah-header-en { font-family: var(--font-en); font-size: 1rem; color: rgba(240,232,216,0.9); margin-bottom: 2px; }
  .surah-header-bn { font-size: 0.82rem; color: rgba(200,184,152,0.7); margin-bottom: 14px; }
  .info-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  .info-lbl { padding: 4px 10px 4px 0; font-size: 0.68rem; color: rgba(200,150,62,0.8); font-family: monospace; white-space: nowrap; }
  .info-val { padding: 4px 0; font-size: 0.82rem; color: rgba(240,232,216,0.9); font-weight: 500; text-align: left; }
  .surah-ayah-row { border-bottom: 1px solid var(--border); padding: 10px 18px; }
  .surah-ayah-top { display: flex; align-items: flex-start; gap: 10px; }
  .surah-ayah-num { font-family: monospace; font-size: 0.65rem; color: var(--gold); background: rgba(184,131,46,0.1); border-radius: 50%; width: 24px; height: 24px; display: grid; place-items: center; flex-shrink: 0; margin-top: 4px; }
  .surah-ayah-ar { flex: 1; font-family: var(--font-ar); font-size: 1.35rem; line-height: 2.2; direction: rtl; text-align: right; color: var(--ink); }
  .surah-ayah-expand { background: none; border: none; color: var(--ink3); cursor: pointer; font-size: 0.7rem; padding: 4px; flex-shrink: 0; }
  .surah-ayah-detail { padding: 8px 0 4px 34px; }
  .surah-ayah-actions { display: flex; gap: 8px; margin-top: 8px; }

  /* ── BOOKMARKS ──────────────────────────────────────────────── */
  .bookmark-row { display: flex; gap: 0; background: var(--bg3); border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 8px; overflow: hidden; }
  .bookmark-main { flex: 1; text-align: left; padding: 12px 14px; background: none; border: none; cursor: pointer; }
  .bookmark-key { font-family: monospace; font-size: 0.65rem; color: var(--gold); margin-bottom: 5px; }
  .bookmark-ar { font-family: var(--font-ar); font-size: 1.1rem; line-height: 2; direction: rtl; text-align: right; color: var(--ink); margin-bottom: 4px; }
  .bookmark-bn { font-size: 0.78rem; color: var(--ink3); line-height: 1.6; }
  .bookmark-del { width: 44px; background: rgba(239,68,68,0.05); border: none; border-left: 1px solid var(--border); color: #ef4444; cursor: pointer; font-size: 0.8rem; }

  /* ── ASK PAGE ───────────────────────────────────────────────── */
  .ask-note { margin: 0 18px 14px; font-size: 0.76rem; color: var(--warn); background: var(--warn-bg); border: 1px solid rgba(124,58,14,0.15); border-radius: 8px; padding: 8px 12px; }
  .answer-card { margin: 0 18px; background: var(--bg3); border: 1px solid var(--border); border-left: 3px solid var(--green2); border-radius: 0 var(--radius) var(--radius) 0; padding: 14px; }
  .answer-label { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; color: var(--green2); margin-bottom: 8px; }
  .answer-text { font-family: var(--font-bn); font-size: 0.92rem; line-height: 1.85; color: var(--ink); margin-bottom: 10px; }

  /* ── MODAL ──────────────────────────────────────────────────── */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
  .modal { background: var(--bg3); border-radius: var(--radius) var(--radius) 0 0; padding: 20px 18px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-weight: 600; font-size: 0.95rem; color: var(--green); }
  .modal-close { background: none; border: none; font-size: 1rem; cursor: pointer; color: var(--ink3); }
  .modal-actions { margin-top: 12px; }
  .howto-step { display: flex; gap: 12px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .howto-icon { font-size: 1.4rem; flex-shrink: 0; }
  .howto-title { font-weight: 600; font-size: 0.88rem; color: var(--green); margin-bottom: 3px; }
  .howto-desc { font-size: 0.78rem; color: var(--ink2); line-height: 1.6; }

  /* ── MISC ───────────────────────────────────────────────────── */
  .skeleton { background: linear-gradient(90deg, var(--bg2) 25%, var(--bg3) 50%, var(--bg2) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: var(--radius); }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .empty-state { text-align: center; padding: 48px 24px; color: var(--ink3); }
  .empty-icon { font-size: 2.5rem; margin-bottom: 12px; }
  .error-box { margin: 0 18px; padding: 10px 14px; background: #fff5f5; border: 1px solid #fca5a5; border-radius: var(--radius); font-size: 0.82rem; color: #7f1d1d; }
  .muted { color: var(--ink3); }
  .spin { display: inline-block; animation: spin 0.8s linear infinite; }
  @keyframes spin { to{transform:rotate(360deg)} }
  .btn-primary { font-family: var(--font-bn); font-size: 0.88rem; font-weight: 600; padding: 12px 20px; background: var(--green); color: white; border: none; border-radius: var(--radius); cursor: pointer; }
  .btn-primary:hover { background: var(--green2); }

  /* ── DESKTOP ────────────────────────────────────────────────── */
  @media (min-width: 480px) {
    .app { box-shadow: 0 0 40px rgba(0,0,0,0.15); }
    .tab-bar { left: 50%; transform: translateX(-50%); }
  }
`;
