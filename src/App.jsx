import { useState, useEffect, useRef, createContext, useContext } from "react";
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

// ════════════════════════════════════════════════════════════════
// LANGUAGE CONTEXT
// ════════════════════════════════════════════════════════════════
const LangContext = createContext("bn");
const useLang = () => useContext(LangContext);
function getSavedLang() { return localStorage.getItem("hadi_lang") || "bn"; }
function saveLang(l) { localStorage.setItem("hadi_lang", l); }

const T = {
  bn: {
    appTagline:     "যাচাইকৃত কুরআন রেফারেন্স",
    home:           "হোম",
    search:         "অনুসন্ধান",
    surah:          "সূরা",
    ask:            "জিজ্ঞাসা",
    saved:          "সংরক্ষিত",
    about:          "পরিচয়",
    howToUse:       "কীভাবে ব্যবহার করবেন",
    todayAyah:      "আজকের আয়াত",
    todayAyahAr:    "آية اليوم",
    quickLookup:    "দ্রুত লুকআপ",
    quickPlaceholder:"আয়াত লিখুন (২:২৫৫) বা সূরা নম্বর...",
    wordSearch:     "শব্দ অনুসন্ধান",
    wordSearchSub:  "বাংলা বা ইংরেজিতে যেকোনো শব্দ লিখুন",
    searchPlaceholder:"সবর - রহমত - patience - mercy...",
    searchBtn:      "অনুসন্ধান",
    recentSearches: "সাম্প্রতিক অনুসন্ধান",
    popularSearches:"জনপ্রিয় অনুসন্ধান",
    popularWords:   ["সবর","রহমত","জান্নাত","তাকওয়া","ঈমান","দুয়া","ন্যায়","আলো"],
    surahBrowse:    "সূরা ব্রাউজ",
    surahBrowseSub: "কুরআনের ১১৪টি সূরা",
    surahPlaceholder:"সূরার নাম বা নম্বর...",
    allAyat:        "সকল আয়াত",
    savedAyat:      "সংরক্ষিত আয়াত",
    savedSub:       (n) => `${n}টি আয়াত সংরক্ষিত`,
    noSaved:        "এখনো কোনো আয়াত সংরক্ষণ করা হয়নি।\nআয়াত খুলুন এবং সংরক্ষণ বাটন চাপুন।",
    askTitle:       "তথ্য জিজ্ঞাসা",
    askSub:         "শুধু তথ্যভিত্তিক প্রশ্ন - কী, কখন, কোনটি, কে",
    askPlaceholder: "প্রশ্ন লিখুন...",
    askBtn:         "জিজ্ঞাসা",
    askNote:        'কেন এবং ব্যাখ্যামূলক প্রশ্ন এখানে উত্তর দেওয়া হয় না। সেগুলোর জন্য একজন আলেমের সাথে পরামর্শ করুন।',
    exampleQs:      ["নামাজের ওয়াক্ত কয়টি ও নাম কী?","ইসলামের পাঁচ স্তম্ভ কী কী?","সবচেয়ে বড় সূরার নাম কী?","আল-বাকারায় কতটি আয়াত আছে?"],
    answerLabel:    "উত্তর",
    recite:         "▶ তিলাওয়াত",
    stop:           "⏸ বন্ধ",
    save:           "🔖 সংরক্ষণ",
    saved2:         "🔖 সংরক্ষিত",
    share:          "📤 শেয়ার",
    copy:           "📋 কপি",
    copied:         "✓ কপি",
    detail:         "বিস্তারিত →",
    verify:         "🔗 quran.com-এ যাচাই করুন →",
    verifyShort:    "🔗 quran.com-এ দেখুন",
    scholarNote:    "⚠️ গভীর বোঝার জন্য সর্বদা একজন যোগ্য আলেম ও বিশ্বস্ত তাফসীর দেখুন।",
    scholarVerify:  "⚠️ একজন যোগ্য ইসলামী আলেমের সাথে যাচাই করুন।",
    tafsirNote:     "(মূল উৎস — AI তৈরি নয়)",
    noResults:      "কোনো আয়াত পাওয়া যায়নি।\nঅন্য শব্দ চেষ্টা করুন।",
    ayatIn:         (n, s) => `${n}টি আয়াত, ${s}টি সূরায়`,
    ayatCount:      (n) => `${n}টি`,
    arabicName:     "আরবি নাম",
    transliteration:"উচ্চারণ",
    meaning:        "অর্থ",
    revPlace:       "নাজিলের স্থান",
    totalAyat:      "মোট আয়াত",
    surahNum:       "সূরা নম্বর",
    makki:          "মক্কী",
    madani:         "মাদানী",
    shareCard:      "শেয়ার কার্ড",
    download:       "📥 ডাউনলোড করুন",
    start:          "শুরু করুন",
    searchFailed:   "অনুসন্ধান ব্যর্থ হয়েছে।",
    loadFailed:     "আয়াত লোড হয়নি।",
    connError:      "ডেটা আনতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।",
    aiError:        "উত্তর দেওয়া সম্ভব হয়নি। ইন্টারনেট সংযোগ চেক করুন।",
    bnTrans:        "🇧🇩 বাংলা অনুবাদ — মুহিউদ্দীন খান",
    enTrans:        "🇬🇧 English — Dr. Mustafa Khattab",
    noAI:           "AI ব্যাখ্যা নেই",
    howTo: [
      { icon:"📖", title:"আয়াত দেখুন",     desc:"হোম পেজে সূরা:আয়াত নম্বর লিখুন। যেমন: ২:২৫৫" },
      { icon:"🔍", title:"শব্দ অনুসন্ধান",  desc:"বাংলা বা ইংরেজি শব্দ লিখুন — সবর, রহমত, patience..." },
      { icon:"📚", title:"সূরা ব্রাউজ",    desc:"১১৪টি সূরা দেখুন। সূরা চাপলে সম্পূর্ণ আয়াত আসবে।" },
      { icon:"❓", title:"তথ্য জিজ্ঞাসা",  desc:"কী, কখন, কোনটি — তথ্যভিত্তিক প্রশ্ন করুন।" },
      { icon:"🔖", title:"সংরক্ষণ ও শেয়ার",desc:"আয়াত সংরক্ষণ করুন বা ইমেজ কার্ড শেয়ার করুন।" },
    ],
  },
  en: {
    appTagline:     "Verified Quran Reference",
    home:           "Home",
    search:         "Search",
    surah:          "Surahs",
    ask:            "Ask",
    saved:          "Saved",
    about:          "About",
    howToUse:       "How to Use",
    todayAyah:      "Ayah of the Day",
    todayAyahAr:    "آية اليوم",
    quickLookup:    "Quick Lookup",
    quickPlaceholder:"Enter ayah (2:255) or surah number...",
    wordSearch:     "Word Search",
    wordSearchSub:  "Search any word in Bengali or English",
    searchPlaceholder:"sabr - mercy - patience - jannah...",
    searchBtn:      "Search",
    recentSearches: "Recent Searches",
    popularSearches:"Popular Searches",
    popularWords:   ["sabr","mercy","jannah","taqwa","iman","dua","justice","light"],
    surahBrowse:    "Surah Browser",
    surahBrowseSub: "All 114 Surahs of the Quran",
    surahPlaceholder:"Surah name or number...",
    allAyat:        "All Verses",
    savedAyat:      "Saved Verses",
    savedSub:       (n) => `${n} verse${n !== 1 ? "s" : ""} saved`,
    noSaved:        "No verses saved yet.\nOpen a verse and tap Save.",
    askTitle:       "Ask a Question",
    askSub:         "Factual questions only — what, when, which, who",
    askPlaceholder: "Type your question...",
    askBtn:         "Ask",
    askNote:        'Why and interpretive questions are not answered here. Please consult a qualified Islamic scholar for those.',
    exampleQs:      ["What are the 5 pillars of Islam?","What are the names of the prayer times?","What is the longest surah?","How many ayat are in Al-Baqarah?"],
    answerLabel:    "Answer",
    recite:         "▶ Recite",
    stop:           "⏸ Stop",
    save:           "🔖 Save",
    saved2:         "🔖 Saved",
    share:          "📤 Share",
    copy:           "📋 Copy",
    copied:         "✓ Copied",
    detail:         "Full details →",
    verify:         "🔗 Verify on quran.com →",
    verifyShort:    "🔗 View on quran.com",
    scholarNote:    "⚠️ Always consult a qualified scholar and verified tafsir for deeper understanding.",
    scholarVerify:  "⚠️ Please verify with a qualified Islamic scholar.",
    tafsirNote:     "(source text — not AI generated)",
    noResults:      "No verses found.\nTry a different word.",
    ayatIn:         (n, s) => `${n} verse${n!==1?"s":""} in ${s} surah${s!==1?"s":""}`,
    ayatCount:      (n) => `${n}`,
    arabicName:     "Arabic Name",
    transliteration:"Transliteration",
    meaning:        "Meaning",
    revPlace:       "Revealed In",
    totalAyat:      "Total Verses",
    surahNum:       "Surah Number",
    makki:          "Makki",
    madani:         "Madani",
    shareCard:      "Share Card",
    download:       "📥 Download",
    start:          "Get Started",
    searchFailed:   "Search failed. Please try again.",
    loadFailed:     "Could not load verse.",
    connError:      "Could not fetch data. Check your connection.",
    aiError:        "Could not get an answer. Check your connection.",
    bnTrans:        "🇧🇩 Bengali — Muhiuddin Khan",
    enTrans:        "🇬🇧 English — Dr. Mustafa Khattab",
    noAI:           "NO AI INTERPRETATION",
    howTo: [
      { icon:"📖", title:"Verse Lookup",    desc:"Type a reference like 2:255 on the home screen." },
      { icon:"🔍", title:"Word Search",     desc:"Type any word — sabr, mercy, patience..." },
      { icon:"📚", title:"Surah Browser",   desc:"Browse all 114 surahs and read complete surahs." },
      { icon:"❓", title:"Ask a Question",  desc:"Factual questions only — what, when, which, who." },
      { icon:"🔖", title:"Save and Share",  desc:"Save verses or generate a beautiful share card." },
    ],
  },
};

// ════════════════════════════════════════════════════════════════
// APP
// ════════════════════════════════════════════════════════════════
export default function App() {
  const { theme, cycleTheme } = useTheme();
  const audio = useAudio();
  const [lang, setLang]             = useState(getSavedLang());
  const t                           = T[lang];
  const [page, setPage]             = useState("home");
  const [pageData, setPageData]     = useState(null);
  const [showHowTo, setShowHowTo]   = useState(false);
  const [bookmarkTick, setBookmarkTick] = useState(0);

  useEffect(() => { if (isFirstVisit()) setShowHowTo(true); }, []);

  function toggleLang() {
    const next = lang === "bn" ? "en" : "bn";
    setLang(next); saveLang(next);
  }

  function navigate(p, data = null) {
    setPage(p); setPageData(data); window.scrollTo(0, 0);
  }

  const themeIcons = { noor: "☀️", layl: "🌙", sabz: "📜" };

  const NAV_ITEMS = [
    { id: "home",          icon: "🏠", label: t.home },
    { id: "search",        icon: "🔍", label: t.search },
    { id: "surah-browser", icon: "📖", label: t.surah },
    { id: "ask",           icon: "❓", label: t.ask },
    { id: "bookmarks",     icon: "🔖", label: t.saved },
    { id: "about",         icon: "✨", label: t.about },
  ];

  return (
    <LangContext.Provider value={lang}>
      <style>{BASE_CSS}</style>
      {showHowTo && <HowToModal t={t} onClose={() => setShowHowTo(false)} />}

      <div className="app">
        {/* SIDEBAR — desktop */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <button className="sidebar-logo" onClick={() => navigate("home")}>هادي</button>
            <div className="sidebar-tagline">{t.appTagline}</div>
          </div>
          <nav className="sidebar-nav">
            {NAV_ITEMS.map(item => (
              <button key={item.id} className={`sidebar-link ${page === item.id ? "active" : ""}`} onClick={() => navigate(item.id)}>
                <span className="sidebar-link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <button className="sidebar-ctrl" onClick={() => setShowHowTo(true)}>? {t.howToUse}</button>
            <button className="sidebar-ctrl" onClick={cycleTheme}>{themeIcons[theme]} Theme</button>
            <button className="sidebar-ctrl" onClick={toggleLang}>{lang === "bn" ? "EN" : "বাং"} Language</button>
          </div>
        </aside>

        {/* CONTENT */}
        <div className="content-wrap">
          {/* TOP NAV — mobile */}
          <nav className="topnav">
            <button className="topnav-logo" onClick={() => navigate("home")}>هادي</button>
            <div className="topnav-actions">
              <button className="nav-btn" onClick={() => setShowHowTo(true)}>?</button>
              <button className="nav-btn" onClick={toggleLang}>{lang === "bn" ? "EN" : "বাং"}</button>
              <button className="nav-btn" onClick={cycleTheme}>{themeIcons[theme]}</button>
            </div>
          </nav>

          <main className="main">
            {page === "home"          && <HomePage t={t} navigate={navigate} audio={audio} />}
            {page === "search"        && <SearchPage t={t} navigate={navigate} />}
            {page === "surah-browser" && <SurahBrowserPage t={t} navigate={navigate} />}
            {page === "ayah"          && <AyahPage t={t} data={pageData} audio={audio} onBookmarkChange={() => setBookmarkTick(x=>x+1)} />}
            {page === "surah"         && <SurahPage t={t} data={pageData} navigate={navigate} audio={audio} />}
            {page === "bookmarks"     && <BookmarksPage key={bookmarkTick} t={t} navigate={navigate} onBookmarkChange={() => setBookmarkTick(x=>x+1)} />}
            {page === "ask"           && <AskPage t={t} />}
            {page === "about"         && <AboutPage t={t} lang={lang} />}
          </main>

          {/* BOTTOM TAB BAR — mobile */}
          <div className="tab-bar">
            {NAV_ITEMS.map(item => (
              <button key={item.id} className={`tab ${page === item.id ? "active" : ""}`} onClick={() => navigate(item.id)}>
                <span className="tab-icon">{item.icon}</span>
                <span className="tab-label">{item.label}</span>
              </button>
            ))}
          </div>

          <footer className="footer">
            <span>© {new Date().getFullYear()} Hadi Quran Reference</span>
            <span className="footer-sep">·</span>
            <span>{lang === "bn" ? "সৎ উদ্দেশ্যে বিনামূল্যে ব্যবহারযোগ্য" : "Free to use with good intention"}</span>
            <span className="footer-sep">·</span>
            <a href="https://github.com/mehedyk/hadi-quran" target="_blank" rel="noopener noreferrer">MIT License</a>
          </footer>
        </div>
      </div>
    </LangContext.Provider>
  );
}

// ════════════════════════════════════════════════════════════════
// HOME PAGE
// ════════════════════════════════════════════════════════════════
function HomePage({ t, navigate, audio }) {
  const [aotd, setAotd]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput]     = useState("");

  useEffect(() => {
    const { surah, ayah } = getAyahOfTheDay();
    fetchAyah(surah, ayah)
      .then(d => { setAotd(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleQuickLookup() {
    const v = input.trim();
    if (!v) return;
    const m = v.match(/^(\d{1,3}):(\d{1,3})$/);
    if (m) {
      fetchAyah(parseInt(m[1]), parseInt(m[2]))
        .then(d => navigate("ayah", d))
        .catch(() => alert(t.loadFailed));
    } else {
      navigate("search", { initialQuery: v });
    }
    setInput("");
  }

  return (
    <div className="page home-page">
      <div className="hero">
        <div className="hero-pattern" aria-hidden />
        <div className="bismillah-hero">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        <h1 className="hero-title">هادي</h1>
        <p className="hero-sub">{t.appTagline}</p>
      </div>

      <div className="section">
        <div className="section-label">{t.quickLookup}</div>
        <div className="quick-lookup">
          <input className="quick-input" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleQuickLookup()}
            placeholder={t.quickPlaceholder} />
          <button className="quick-btn" onClick={handleQuickLookup}>→</button>
        </div>
        <div className="chip-row">
          {["2:255","1:1","112:1","36:1"].map(c => (
            <button key={c} className="chip"
              onClick={() => fetchAyah(...c.split(":").map(Number)).then(d => navigate("ayah", d))}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">
          <span className="section-title-ar">{t.todayAyahAr}</span>
          <span>{t.todayAyah}</span>
        </div>
        {loading
          ? <div className="skeleton" style={{height:160}} />
          : aotd
            ? <AyahCard t={t} ayah={aotd} audio={audio} onTap={() => navigate("ayah", aotd)} />
            : null}
      </div>

      <div className="section">
        <div className="nav-cards">
          {[
            { id:"search",        icon:"🔍", title:t.wordSearch,  sub:"সবর, রহমত, mercy..." },
            { id:"surah-browser", icon:"📖", title:t.surahBrowse, sub:t.surahBrowseSub },
            { id:"bookmarks",     icon:"🔖", title:t.savedAyat,   sub:t.saved },
            { id:"ask",           icon:"❓", title:t.askTitle,    sub:t.askSub },
          ].map(c => (
            <button key={c.id} className="nav-card" onClick={() => navigate(c.id)}>
              <span className="nav-card-icon">{c.icon}</span>
              <span className="nav-card-title">{c.title}</span>
              <span className="nav-card-sub">{c.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SEARCH PAGE
// ════════════════════════════════════════════════════════════════
function SearchPage({ t, navigate }) {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const recent                = getRecentSearches();

  async function doSearch(q) {
    if (!q.trim()) return;
    addRecentSearch(q.trim());
    setLoading(true); setError(null);
    try { const r = await searchByWord(q.trim()); setResults(r); }
    catch { setError(t.searchFailed); }
    finally { setLoading(false); }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">{t.wordSearch}</h2>
        <p className="page-sub">{t.wordSearchSub}</p>
      </div>
      <div className="search-bar-wrap">
        <input className="search-bar" value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && doSearch(query)}
          placeholder={t.searchPlaceholder} autoFocus />
        <button className="search-go" onClick={() => doSearch(query)} disabled={loading}>
          {loading ? <span className="spin">⟳</span> : t.searchBtn}
        </button>
      </div>

      {!results && recent.length > 0 && (
        <div className="section">
          <div className="section-label">{t.recentSearches}</div>
          <div className="chip-row">
            {recent.map(r => <button key={r} className="chip" onClick={() => { setQuery(r); doSearch(r); }}>{r}</button>)}
          </div>
        </div>
      )}
      {!results && (
        <div className="section">
          <div className="section-label">{t.popularSearches}</div>
          <div className="chip-row">
            {t.popularWords.map(w => <button key={w} className="chip" onClick={() => { setQuery(w); doSearch(w); }}>{w}</button>)}
          </div>
        </div>
      )}

      {error && <div className="error-box">{error}</div>}

      {results && (
        <div className="section">
          <div className="results-meta">
            <strong>"{results.query}"</strong>
            {results.mapped && <span className="tag-sm"> → {results.resolvedQuery}</span>}
            <span> — {t.ayatIn(results.total, results.groups.length)}</span>
          </div>
          {results.groups.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p style={{whiteSpace:"pre-line"}}>{t.noResults}</p>
            </div>
          )}
          {results.groups.map(g => (
            <div key={g.surah} className="search-group">
              <div className="search-group-hdr">
                <span className="search-group-name">{g.surahName} <span className="muted">({g.surahNameBn})</span></span>
                <span className="badge">{t.ayatCount(g.ayat.length)}</span>
              </div>
              {g.ayat.map(a => (
                <button key={a.key} className="search-ayah-row"
                  onClick={() => fetchAyah(...a.key.split(":").map(Number)).then(d => navigate("ayah", d))}>
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
function SurahBrowserPage({ t, navigate }) {
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
        <h2 className="page-title">{t.surahBrowse}</h2>
        <p className="page-sub">{t.surahBrowseSub}</p>
      </div>
      <div className="search-bar-wrap">
        <input className="search-bar" value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder={t.surahPlaceholder} />
      </div>
      {loading ? (
        <div className="surah-grid">
          {Array(12).fill(0).map((_,i) => <div key={i} className="skeleton surah-skeleton" />)}
        </div>
      ) : (
        <div className="surah-grid">
          {filtered.map(s => (
            <button key={s.id} className="surah-card"
              onClick={() => fetchSurahAyat(s.id).then(d => navigate("surah", { ...d, surahNum: s.id }))}>
              <div className="surah-num">{s.id}</div>
              <div className="surah-ar">{s.name_arabic}</div>
              <div className="surah-en">{s.name_simple}</div>
              <div className="surah-bn">{s.translated_name?.name}</div>
              <div className="surah-meta">
                <span>{s.verses_count}</span>
                <span>{s.revelation_place === "makkah" ? t.makki : t.madani}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// AYAH PAGE
// ════════════════════════════════════════════════════════════════
function AyahPage({ t, data, audio, onBookmarkChange }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [copied, setCopied]         = useState(false);
  const [showShare, setShowShare]   = useState(false);

  useEffect(() => { if (data?.key) setBookmarked(isBookmarked(data.key)); }, [data?.key]);

  if (!data) return <div className="page"><div className="empty-state"><p>{t.loadFailed}</p></div></div>;

  function toggleBookmark() {
    if (bookmarked) { removeBookmark(data.key); setBookmarked(false); }
    else            { addBookmark(data);         setBookmarked(true); }
    onBookmarkChange?.();
  }

  function copyText() {
    navigator.clipboard?.writeText(`${data.arabic}\n\n${stripHtml(data.bengali)}\n\n— ${data.surahName} (${data.key})`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const isPlaying = audio.playingUrl === data.audioUrl;

  return (
    <div className="page ayah-page">
      {showShare && <ShareModal t={t} ayah={data} onClose={() => setShowShare(false)} />}

      <div className="ayah-surah-badge">
        <span className="ayah-surah-ar">{data.surahName}</span>
        <span className="ayah-surah-bn">{data.surahNameBn}</span>
        <span className="ayah-key-badge">{data.key}</span>
      </div>

      <div className="arabic-card">
        <div className="arabic-text">{data.arabic}</div>
        <div className="arabic-actions">
          <button className={`action-btn ${isPlaying ? "active" : ""}`} onClick={() => audio.play(data.audioUrl)}>
            {isPlaying ? t.stop : t.recite}
          </button>
          <button className={`action-btn ${bookmarked ? "active gold" : ""}`} onClick={toggleBookmark}>
            {bookmarked ? t.saved2 : t.save}
          </button>
          <button className="action-btn" onClick={() => setShowShare(true)}>{t.share}</button>
          <button className="action-btn" onClick={copyText}>{copied ? t.copied : t.copy}</button>
        </div>
      </div>

      {data.bengali && (
        <div className="trans-card">
          <div className="trans-lang">{t.bnTrans}</div>
          <div className="trans-text bangla">{stripHtml(data.bengali)}</div>
        </div>
      )}
      {data.english && (
        <div className="trans-card">
          <div className="trans-lang">{t.enTrans}</div>
          <div className="trans-text">{stripHtml(data.english)}</div>
        </div>
      )}
      {data.tafsir && (
        <div className="tafsir-card">
          <div className="tafsir-title">📚 {data.tafsirName}</div>
          <div className="tafsir-note">{t.tafsirNote}</div>
          <div className="tafsir-text">{stripHtml(data.tafsir)}</div>
        </div>
      )}

      <a className="ref-link" href={data.quranComUrl} target="_blank" rel="noopener noreferrer">{t.verify}</a>
      <div className="scholar-note">{t.scholarNote}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SURAH PAGE
// ════════════════════════════════════════════════════════════════
function SurahPage({ t, data, navigate, audio }) {
  const [expanded, setExpanded] = useState({});
  if (!data) return null;
  const { meta, ayat } = data;
  const revPlace = meta?.revelation_place === "makkah" ? t.makki : t.madani;
  const rows = [
    [t.arabicName,      meta?.name_arabic],
    [t.transliteration, meta?.name_simple],
    [t.meaning,         meta?.translated_name?.name],
    [t.revPlace,        revPlace],
    [t.totalAyat,       meta?.verses_count],
    [t.surahNum,        meta?.id],
  ].filter(([,v]) => v);

  return (
    <div className="page">
      <div className="surah-header-card">
        <div className="surah-header-ar">{meta?.name_arabic}</div>
        <div className="surah-header-en">{meta?.name_simple}</div>
        <div className="surah-header-bn">{meta?.translated_name?.name}</div>
        <table className="info-table"><tbody>
          {rows.map(([l,v]) => <tr key={l}><td className="info-lbl">{l}</td><td className="info-val">{v}</td></tr>)}
        </tbody></table>
        <a className="ref-link-light" href={`https://quran.com/${meta?.id}`} target="_blank" rel="noopener noreferrer">{t.verifyShort}</a>
      </div>

      <div className="section">
        <div className="section-title"><span>{t.allAyat}</span></div>
        {ayat.map((v) => {
          const key  = `${meta?.id}:${v.verse_number}`;
          const isEx = expanded[key];
          const bn   = v.translations?.find(tr => tr.resource_id === 161)?.text || "";
          const en   = v.translations?.find(tr => tr.resource_id === 131)?.text || "";
          return (
            <div key={key} className="surah-ayah-row">
              <div className="surah-ayah-top">
                <span className="surah-ayah-num">{v.verse_number}</span>
                <div className="surah-ayah-ar">{v.text_uthmani}</div>
                <button className="surah-ayah-expand"
                  onClick={() => setExpanded(p => ({...p,[key]:!p[key]}))}>
                  {isEx ? "▲" : "▼"}
                </button>
              </div>
              {isEx && (
                <div className="surah-ayah-detail">
                  {bn && <div className="trans-text bangla" style={{marginBottom:6}}>{stripHtml(bn)}</div>}
                  {en && <div className="trans-text" style={{marginBottom:6,fontStyle:"italic",fontSize:"0.82rem"}}>{stripHtml(en)}</div>}
                  <div className="surah-ayah-actions">
                    <button className="action-btn-sm"
                      onClick={() => fetchAyah(meta?.id, v.verse_number).then(d => navigate("ayah", d))}>
                      {t.detail}
                    </button>
                    <button className="action-btn-sm"
                      onClick={() => fetchAyah(meta?.id, v.verse_number).then(d => audio.play(d.audioUrl))}>
                      {t.recite}
                    </button>
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
// BOOKMARKS
// ════════════════════════════════════════════════════════════════
function BookmarksPage({ t, navigate, onBookmarkChange }) {
  const [bookmarks, setBookmarks] = useState(getBookmarks());

  function remove(key) {
    removeBookmark(key);
    setBookmarks(getBookmarks());
    onBookmarkChange?.();
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">{t.savedAyat}</h2>
        <p className="page-sub">{t.savedSub(bookmarks.length)}</p>
      </div>
      {bookmarks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔖</div>
          <p style={{whiteSpace:"pre-line"}}>{t.noSaved}</p>
        </div>
      ) : (
        <div className="section">
          {bookmarks.map(b => (
            <div key={b.key} className="bookmark-row">
              <button className="bookmark-main"
                onClick={() => fetchAyah(b.surah, b.ayahNum).then(d => navigate("ayah", d))}>
                <div className="bookmark-key">{b.key} — {b.surahName}</div>
                <div className="bookmark-ar">{b.arabic}</div>
                <div className="bookmark-bn">{stripHtml(b.bengali || "")}</div>
              </button>
              <button className="bookmark-del" onClick={() => remove(b.key)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ASK PAGE
// ════════════════════════════════════════════════════════════════
function AskPage({ t }) {
  const [input, setInput]     = useState("");
  const [answer, setAnswer]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function ask() {
    if (!input.trim()) return;
    setLoading(true); setError(null); setAnswer(null);
    try { const a = await callAI(FACTUAL_SYSTEM, input.trim(), 300); setAnswer(a); }
    catch { setError(t.aiError); }
    finally { setLoading(false); }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">{t.askTitle}</h2>
        <p className="page-sub">{t.askSub}</p>
      </div>
      <div className="ask-note">{t.askNote}</div>
      <div className="search-bar-wrap">
        <input className="search-bar" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && ask()}
          placeholder={t.askPlaceholder} />
        <button className="search-go" onClick={ask} disabled={loading || !input.trim()}>
          {loading ? <span className="spin">⟳</span> : t.askBtn}
        </button>
      </div>
      <div className="section">
        <div className="section-label">{t.howToUse}</div>
        <div className="chip-col">
          {t.exampleQs.map(q => (
            <button key={q} className="chip chip-full" onClick={() => setInput(q)}>{q}</button>
          ))}
        </div>
      </div>
      {error && <div className="error-box">{error}</div>}
      {answer && (
        <div className="answer-card">
          <div className="answer-label">{t.answerLabel}</div>
          <div className="answer-text">{answer}</div>
          <div className="scholar-note">{t.scholarVerify}</div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ABOUT PAGE
// ════════════════════════════════════════════════════════════════
function AboutPage({ t, lang }) {
  const isBn = lang === "bn";
  return (
    <div className="page about-page">

      {/* OPENING AYAH 6:162 */}
      <div className="about-hero">
        <div className="about-ayah-ar">قُلْ إِنَّ صَلَاتِي وَنُسُكِي وَمَحْيَايَ وَمَمَاتِي لِلَّهِ رَبِّ الْعَالَمِينَ</div>
        <div className="about-ayah-bn">
          {isBn
            ? "বলুন, নিশ্চয়ই আমার নামাজ, আমার কোরবানি, আমার জীবন ও আমার মরণ — সবই আল্লাহর জন্য, যিনি সমগ্র জগতের পালনকর্তা।"
            : "Say: Indeed my prayer, my sacrifice, my living and my dying are for Allah, Lord of all the worlds."}
        </div>
        <div className="about-ref">— {isBn ? "সূরা আল-আনআম" : "Surah Al-An'am"} (৬:১৬২)</div>
      </div>

      {/* DUROOD */}
      <div className="about-section">
        <div className="about-section-title">{isBn ? "দুরূদ শরীফ" : "Durood Ibrahimi"}</div>
        <div className="about-arabic">
          اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ
        </div>
        <div className="about-text">
          {isBn
            ? "হে আল্লাহ, মুহাম্মদ (ﷺ) ও তাঁর পরিবারের উপর রহমত বর্ষণ করুন, যেমন ইবরাহিম (আ.) ও তাঁর পরিবারের উপর করেছিলেন। নিশ্চয়ই আপনি প্রশংসিত ও মহিমান্বিত।"
            : "O Allah, send blessings upon Muhammad and the family of Muhammad, as You sent blessings upon Ibrahim and the family of Ibrahim. Indeed You are Praiseworthy and Glorious."}
        </div>
      </div>

      {/* DUA FOR PARENTS — 17:24 */}
      <div className="about-section">
        <div className="about-section-title">{isBn ? "পিতামাতার জন্য দোয়া" : "Dua for Parents"}</div>
        <div className="about-arabic">رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا</div>
        <div className="about-text">
          {isBn
            ? "হে আমার রব, তাদের উপর রহম করুন যেভাবে তারা আমাকে শৈশবে লালন-পালন করেছেন।"
            : "My Lord, have mercy on them as they raised me when I was small."}
        </div>
        <div className="about-ref">— {isBn ? "সূরা আল-ইসরা" : "Surah Al-Isra"} (১৭:২৪)</div>
        <div className="about-dua-note">
          {isBn
            ? "যারা এই অ্যাপ ব্যবহার করছেন — একটু সময় নিয়ে আমার পিতামাতার জন্য এই দোয়াটি পড়ুন। আল্লাহ আপনাদের উত্তম প্রতিদান দিন।"
            : "To everyone using this app — please take a moment to recite this dua for my parents. May Allah reward you with goodness."}
        </div>
      </div>

      {/* DUA FOR MARRIAGE — 25:74 */}
      <div className="about-section">
        <div className="about-section-title">{isBn ? "নেক জীবনসঙ্গীর জন্য দোয়া" : "Dua for a Righteous Spouse"}</div>
        <div className="about-arabic">رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا</div>
        <div className="about-text">
          {isBn
            ? "হে আমাদের রব, আমাদের স্ত্রী ও সন্তানদের থেকে আমাদের নয়নপ্রীতি দান করুন এবং আমাদের মুত্তাকীদের নেতা বানান।"
            : "Our Lord, grant us from our spouses and offspring comfort to our eyes, and make us a leader for the righteous."}
        </div>
        <div className="about-ref">— {isBn ? "সূরা আল-ফুরকান" : "Surah Al-Furqan"} (২৫:৭৪)</div>
        <div className="about-dua-note">
          {isBn
            ? "যারা দোয়া করতে চান — আমার জন্য একজন দ্বীনদার জীবনসঙ্গীর দোয়াও করবেন। আল্লাহ আপনাদেরও উত্তম জীবনসঙ্গী দিন। 🤲"
            : "If you are willing — please also make dua that Allah grants me a righteous spouse. May He grant you the same. 🤲"}
        </div>
      </div>

      {/* BUILT BY */}
      <div className="about-section">
        <div className="about-section-title">{isBn ? "বানিয়েছেন" : "Built by"}</div>
        <div className="about-builder">
          <a className="about-builder-link" href="https://github.com/mehedyk" target="_blank" rel="noopener noreferrer">মেহেদী</a>
          <a className="about-builder-link secondary" href="https://mehedy.netlify.app/" target="_blank" rel="noopener noreferrer">
            {isBn ? "পোর্টফোলিও ↗" : "Portfolio ↗"}
          </a>
        </div>
        <div className="about-text" style={{marginTop:8}}>
          {isBn
            ? "আল্লাহর সন্তুষ্টির জন্য, এবং এই উম্মাহর জন্য — যাতে যে কেউ যেকোনো জায়গা থেকে কুরআনের কাছে যেতে পারে।"
            : "For the pleasure of Allah, and for this Ummah — so that anyone, anywhere, can access the Quran easily."}
        </div>
      </div>

      {/* CREDITS */}
      <div className="about-section">
        <div className="about-section-title">{isBn ? "কৃতজ্ঞতা" : "With Gratitude"}</div>
        <div className="about-text">
          {isBn
            ? "পরিবার, বন্ধু ও ভাইয়েরা — যারা পরীক্ষা করেছেন, মতামত দিয়েছেন, সাহায্য করেছেন এবং দোয়া করেছেন। আল্লাহ আপনাদের সবাইকে উত্তম প্রতিদান দিন।"
            : "Family, friends and brothers — who tested, gave feedback, helped and made dua. May Allah reward you all with the best."}
        </div>
      </div>

      {/* DATA SOURCES */}
      <div className="about-section">
        <div className="about-section-title">{isBn ? "ডেটা উৎস" : "Data Sources"}</div>
        <div className="about-sources">
          {[
            { name:"api.quran.com",   desc:isBn?"আরবি টেক্সট, অনুবাদ, তাফসীর":"Arabic text, translations, tafsir", url:"https://api.quran.com" },
            { name:"Islamic.Network", desc:isBn?"অডিও তিলাওয়াত (Mishary Alafasy)":"Audio recitation (Mishary Alafasy)", url:"https://islamic.network" },
            { name:"Anthropic Claude",desc:isBn?"সীমিত তথ্যভিত্তিক প্রশ্নোত্তর":"Limited factual Q&A only", url:"https://anthropic.com" },
          ].map(s => (
            <a key={s.name} className="about-source-row" href={s.url} target="_blank" rel="noopener noreferrer">
              <span className="about-source-name">{s.name}</span>
              <span className="about-source-desc">{s.desc}</span>
            </a>
          ))}
        </div>
      </div>

      {/* TECH */}
      <div className="about-section">
        <div className="about-section-title">{isBn ? "প্রযুক্তি" : "Tech Stack"}</div>
        <div className="about-tech">
          {["React 18","Vite","Vercel","Hind Siliguri","KFGQPC Uthman Taha Naskh"].map(tech => (
            <span key={tech} className="about-tech-tag">{tech}</span>
          ))}
        </div>
      </div>

      <div className="about-closing">بَارَكَ اللَّهُ فِيكُمْ</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// REUSABLE AYAH CARD
// ════════════════════════════════════════════════════════════════
function AyahCard({ t, ayah, audio, onTap }) {
  const isPlaying = audio.playingUrl === ayah.audioUrl;
  return (
    <div className="ayah-card" onClick={onTap}>
      <div className="ayah-card-badge">{ayah.key} — {ayah.surahName}</div>
      <div className="ayah-card-ar">{ayah.arabic}</div>
      <div className="ayah-card-bn bangla">{stripHtml(ayah.bengali || "")}</div>
      <div className="ayah-card-actions" onClick={e => e.stopPropagation()}>
        <button className={`action-btn-sm ${isPlaying ? "active" : ""}`}
          onClick={() => audio.play(ayah.audioUrl)}>
          {isPlaying ? t.stop : t.recite}
        </button>
        <span className="ayah-card-tap">{t.detail}</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SHARE MODAL
// ════════════════════════════════════════════════════════════════
function ShareModal({ t, ayah, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 800, H = 520;
    canvas.width = W; canvas.height = H;
    const g = ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,"#1a3d28"); g.addColorStop(1,"#0a1e14");
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = "rgba(200,150,62,0.12)"; ctx.lineWidth = 1;
    for (let i=0; i<W; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,H); ctx.stroke(); }
    for (let i=0; i<H; i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(W,i); ctx.stroke(); }
    ctx.strokeStyle = "rgba(200,150,62,0.5)"; ctx.lineWidth = 2;
    ctx.strokeRect(20,20,W-40,H-40); ctx.strokeRect(26,26,W-52,H-52);
    ctx.fillStyle = "#f0e8d8"; ctx.font = "bold 34px serif";
    ctx.direction = "rtl"; ctx.textAlign = "center";
    wrapCanvas(ctx, ayah.arabic || "", W/2, 110, W-100, 46);
    ctx.direction = "ltr"; ctx.font = "22px sans-serif";
    ctx.fillStyle = "#c8b898"; ctx.textAlign = "center";
    wrapCanvas(ctx, stripHtml(ayah.bengali || "").slice(0,140), W/2, 290, W-100, 30);
    ctx.font = "bold 16px monospace"; ctx.fillStyle = "#c8963e";
    ctx.fillText(`${ayah.key} — ${ayah.surahName}`, W/2, H-56);
    ctx.font = "13px sans-serif"; ctx.fillStyle = "rgba(200,184,152,0.45)";
    ctx.fillText("هادي · Hadi Quran Reference", W/2, H-30);
  }, [ayah]);

  function wrapCanvas(ctx, text, x, y, maxW, lineH) {
    const words = text.split(" "); let line = "";
    for (const w of words) {
      const test = line ? line+" "+w : w;
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line,x,y); line = w; y += lineH; }
      else line = test;
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
          <span>{t.shareCard}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <canvas ref={canvasRef} style={{width:"100%",borderRadius:8,display:"block"}} />
        <div style={{marginTop:12}}>
          <button className="btn-primary" style={{width:"100%"}} onClick={download}>{t.download}</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// HOW TO MODAL
// ════════════════════════════════════════════════════════════════
function HowToModal({ t, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>{t.howToUse}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {t.howTo.map((s,i) => (
          <div key={i} className="howto-step">
            <div className="howto-icon">{s.icon}</div>
            <div>
              <div className="howto-title">{s.title}</div>
              <div className="howto-desc">{s.desc}</div>
            </div>
          </div>
        ))}
        <button className="btn-primary" style={{width:"100%",marginTop:16}} onClick={onClose}>{t.start}</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// CSS
// ════════════════════════════════════════════════════════════════
const BASE_CSS = `
  @font-face { font-family:'UthmanNaskh'; src:url('https://raw.githubusercontent.com/mustafa0x/qpc-fonts/f93bf5f3/various-woff2/UthmanTN1%20Ver10.woff2') format('woff2'); font-display:swap; }
  @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,700&display=swap');

  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

  :root{
    --bg:#f5ede0;--bg2:#ede0c8;--bg3:#fdfaf5;
    --ink:#1c1108;--ink2:#3d2c1a;--ink3:#7a6654;
    --gold:#b07828;--gold2:#d4a040;--green:#1c4a2e;--green2:#2a6840;
    --border:rgba(176,120,40,0.22);--shadow:rgba(28,17,8,0.10);
    --warn:#7a3610;--warn-bg:#fff8f0;--pattern:rgba(176,120,40,0.07);
    --sidebar-bg:#1c4a2e;--sidebar-ink:rgba(253,250,245,0.9);--sidebar-border:rgba(212,160,64,0.2);
  }
  [data-theme="layl"]{
    --bg:#0b1f1a;--bg2:#122820;--bg3:#192e26;
    --ink:#ede8de;--ink2:#c4b89a;--ink3:#7a6e5a;
    --gold:#d4a040;--gold2:#f0c060;--green:#3a9060;--green2:#4aac74;
    --border:rgba(212,160,64,0.18);--shadow:rgba(0,0,0,0.45);
    --warn:#e8a870;--warn-bg:rgba(232,168,112,0.08);--pattern:rgba(212,160,64,0.05);
    --sidebar-bg:#081612;--sidebar-ink:rgba(237,232,222,0.9);--sidebar-border:rgba(212,160,64,0.15);
  }
  [data-theme="sabz"]{
    --bg:#f0ece0;--bg2:#e2d8c4;--bg3:#faf8f2;
    --ink:#141e10;--ink2:#253520;--ink3:#5a6e50;
    --gold:#8a6818;--gold2:#b08828;--green:#1a4e28;--green2:#226634;
    --border:rgba(138,104,24,0.2);--shadow:rgba(20,30,16,0.10);
    --warn:#6e3810;--warn-bg:#fdf6ec;--pattern:rgba(26,78,40,0.06);
    --sidebar-bg:#142010;--sidebar-ink:rgba(250,248,242,0.9);--sidebar-border:rgba(176,136,40,0.2);
  }

  html{font-size:16px;scroll-behavior:smooth;}
  body{font-family:'Hind Siliguri',sans-serif;background:var(--bg);color:var(--ink);min-height:100vh;-webkit-font-smoothing:antialiased;}

  .app{display:flex;min-height:100vh;min-height:100dvh;}
  .sidebar{display:none;}

  @media(min-width:768px){
    .sidebar{display:flex;flex-direction:column;width:240px;min-height:100vh;background:var(--sidebar-bg);border-right:1px solid var(--sidebar-border);position:sticky;top:0;height:100vh;overflow-y:auto;flex-shrink:0;}
    .sidebar-brand{padding:28px 20px 20px;border-bottom:1px solid var(--sidebar-border);}
    .sidebar-logo{font-family:'UthmanNaskh',serif;font-size:2.2rem;color:var(--gold2);cursor:pointer;line-height:1;display:block;background:none;border:none;}
    .sidebar-tagline{font-size:0.68rem;color:var(--sidebar-ink);opacity:0.55;margin-top:4px;}
    .sidebar-nav{flex:1;padding:16px 0;}
    .sidebar-link{display:flex;align-items:center;gap:10px;width:100%;padding:11px 20px;background:none;border:none;cursor:pointer;color:var(--sidebar-ink);opacity:0.65;font-family:'Hind Siliguri',sans-serif;font-size:0.88rem;text-align:left;transition:all 0.15s;}
    .sidebar-link:hover{opacity:1;background:rgba(255,255,255,0.05);}
    .sidebar-link.active{opacity:1;background:rgba(255,255,255,0.1);color:var(--gold2);font-weight:600;border-left:3px solid var(--gold2);}
    .sidebar-link-icon{font-size:1rem;width:20px;text-align:center;}
    .sidebar-footer{padding:12px 0 20px;border-top:1px solid var(--sidebar-border);}
    .sidebar-ctrl{display:flex;align-items:center;gap:8px;width:100%;padding:9px 20px;background:none;border:none;cursor:pointer;color:var(--sidebar-ink);opacity:0.5;font-family:'Hind Siliguri',sans-serif;font-size:0.78rem;text-align:left;transition:opacity 0.15s;}
    .sidebar-ctrl:hover{opacity:0.85;}
    .topnav{display:none!important;}
    .tab-bar{display:none!important;}
    .content-wrap{flex:1;display:flex;flex-direction:column;min-height:100vh;overflow-y:auto;}
    .main{flex:1;}
    .page{max-width:780px;margin:0 auto;}
    .surah-grid{grid-template-columns:repeat(3,1fr)!important;}
    .nav-cards{grid-template-columns:repeat(4,1fr)!important;}
    .hero{border-radius:0 0 16px 16px;}
  }
  @media(min-width:1100px){
    .sidebar{width:260px;}
    .page{max-width:860px;}
    .surah-grid{grid-template-columns:repeat(4,1fr)!important;}
  }

  .content-wrap{flex:1;display:flex;flex-direction:column;min-height:100vh;min-height:100dvh;}
  .topnav{height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;background:var(--green);position:sticky;top:0;z-index:100;}
  .topnav-logo{font-family:'UthmanNaskh',serif;font-size:1.6rem;color:var(--gold2);background:none;border:none;cursor:pointer;}
  .topnav-actions{display:flex;gap:6px;}
  .nav-btn{width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.08);color:white;font-size:0.9rem;cursor:pointer;display:grid;place-items:center;transition:background 0.15s;}
  .nav-btn:hover{background:rgba(255,255,255,0.16);}
  .main{flex:1;padding-bottom:calc(64px + env(safe-area-inset-bottom,0px));}
  @media(min-width:768px){.main{padding-bottom:0;}}
  .tab-bar{height:60px;display:flex;background:var(--bg3);border-top:1px solid var(--border);position:fixed;bottom:0;left:0;right:0;z-index:100;padding-bottom:env(safe-area-inset-bottom,0px);}
  .tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;border:none;background:none;cursor:pointer;color:var(--ink3);transition:color 0.15s;padding:5px 0;}
  .tab.active{color:var(--green);}
  .tab-icon{font-size:1.15rem;}
  .tab-label{font-size:0.58rem;font-weight:500;}
  .tab.active .tab-label{font-weight:700;}
  .footer{padding:14px 20px;font-size:0.68rem;color:var(--ink3);border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:6px;align-items:center;}
  .footer a{color:var(--ink3);text-decoration:none;}
  .footer a:hover{color:var(--gold);}
  .footer-sep{opacity:0.4;}

  .page{padding-bottom:24px;}
  .page-header{padding:20px 18px 10px;}
  .page-title{font-family:'Playfair Display',serif;font-size:1.5rem;color:var(--green);font-style:italic;}
  .page-sub{font-size:0.78rem;color:var(--ink3);margin-top:3px;}
  .section{padding:10px 18px;}
  .section-title{display:flex;align-items:center;gap:10px;margin-bottom:12px;font-size:0.85rem;font-weight:600;color:var(--ink2);}
  .section-title-ar{font-family:'UthmanNaskh',serif;font-size:1rem;color:var(--gold);}
  .section-label{font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink3);margin-bottom:8px;}

  .hero{background:var(--green);padding:28px 20px 24px;text-align:center;position:relative;overflow:hidden;}
  .hero-pattern{position:absolute;inset:0;background-image:repeating-linear-gradient(45deg,var(--pattern) 0,var(--pattern) 1px,transparent 0,transparent 50%);background-size:18px 18px;pointer-events:none;}
  .bismillah-hero{font-family:'UthmanNaskh',serif;font-size:1.3rem;color:rgba(212,160,64,0.85);direction:rtl;margin-bottom:8px;line-height:2;position:relative;}
  .hero-title{font-family:'UthmanNaskh',serif;font-size:3rem;color:var(--gold2);letter-spacing:0.05em;line-height:1;position:relative;}
  .hero-sub{font-size:0.8rem;color:rgba(237,232,222,0.6);margin-top:5px;position:relative;}

  .quick-lookup{display:flex;gap:8px;margin-bottom:10px;}
  .quick-input{flex:1;font-family:'Hind Siliguri',sans-serif;font-size:0.9rem;padding:11px 14px;border:1.5px solid var(--border);border-radius:10px;background:var(--bg3);color:var(--ink);outline:none;transition:border-color 0.18s;}
  .quick-input:focus{border-color:var(--gold);}
  .quick-btn{width:44px;background:var(--green);color:white;border:none;border-radius:10px;font-size:1.2rem;cursor:pointer;flex-shrink:0;transition:background 0.15s;}
  .quick-btn:hover{background:var(--green2);}

  .chip{font-family:'Hind Siliguri',sans-serif;font-size:0.76rem;padding:5px 12px;border-radius:20px;border:1px solid var(--border);background:var(--bg2);color:var(--ink2);cursor:pointer;transition:all 0.14s;white-space:nowrap;}
  .chip:hover{background:var(--gold);color:white;border-color:var(--gold);}
  .chip-row{display:flex;flex-wrap:wrap;gap:6px;}
  .chip-col{display:flex;flex-direction:column;gap:6px;}
  .chip-full{width:100%;text-align:left;border-radius:10px;padding:8px 14px;}

  .nav-cards{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .nav-card{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:14px;background:var(--bg3);border:1px solid var(--border);border-radius:12px;cursor:pointer;text-align:left;transition:all 0.15s;box-shadow:0 1px 6px var(--shadow);}
  .nav-card:hover{border-color:var(--gold);transform:translateY(-2px);box-shadow:0 4px 16px var(--shadow);}
  .nav-card-icon{font-size:1.3rem;}
  .nav-card-title{font-size:0.82rem;font-weight:600;color:var(--green);}
  .nav-card-sub{font-size:0.68rem;color:var(--ink3);}

  .ayah-card{background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:16px;cursor:pointer;box-shadow:0 2px 10px var(--shadow);transition:box-shadow 0.15s;}
  .ayah-card:hover{box-shadow:0 4px 20px var(--shadow);}
  .ayah-card-badge{font-size:0.65rem;font-weight:700;color:var(--gold);margin-bottom:10px;font-family:monospace;letter-spacing:0.04em;}
  .ayah-card-ar{font-family:'UthmanNaskh',serif;font-size:1.55rem;line-height:2.3;direction:rtl;text-align:right;color:var(--ink);margin-bottom:10px;}
  .ayah-card-bn{font-size:0.85rem;line-height:1.78;color:var(--ink2);margin-bottom:10px;}
  .ayah-card-actions{display:flex;justify-content:space-between;align-items:center;}
  .ayah-card-tap{font-size:0.7rem;color:var(--gold);}

  .ayah-surah-badge{display:flex;align-items:center;gap:8px;padding:16px 18px 8px;flex-wrap:wrap;}
  .ayah-surah-ar{font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;color:var(--green);}
  .ayah-surah-bn{font-size:0.78rem;color:var(--ink3);}
  .ayah-key-badge{font-family:monospace;font-size:0.65rem;background:var(--gold);color:white;padding:2px 9px;border-radius:10px;margin-left:auto;letter-spacing:0.04em;}
  .arabic-card{margin:0 18px 12px;background:linear-gradient(135deg,rgba(28,74,46,0.07),rgba(176,120,40,0.07));border:1px solid var(--border);border-radius:12px;padding:18px;}
  .arabic-text{font-family:'UthmanNaskh',serif;font-size:2rem;line-height:2.7;direction:rtl;text-align:right;color:var(--ink);margin-bottom:14px;}
  .arabic-actions{display:flex;gap:6px;flex-wrap:wrap;}
  .action-btn{font-family:'Hind Siliguri',sans-serif;font-size:0.72rem;padding:5px 11px;border-radius:20px;border:1px solid var(--border);background:var(--bg2);color:var(--ink2);cursor:pointer;transition:all 0.14s;white-space:nowrap;}
  .action-btn:hover{border-color:var(--gold);color:var(--gold);}
  .action-btn.active{background:var(--green);color:white;border-color:var(--green);}
  .action-btn.gold{background:var(--gold);color:white;border-color:var(--gold);}
  .action-btn-sm{font-family:'Hind Siliguri',sans-serif;font-size:0.7rem;padding:4px 10px;border-radius:16px;border:1px solid var(--border);background:var(--bg2);color:var(--ink2);cursor:pointer;transition:all 0.14s;}
  .action-btn-sm.active{background:var(--green);color:white;border-color:var(--green);}
  .trans-card{margin:0 18px 10px;background:var(--bg3);border:1px solid var(--border);border-left:3px solid var(--green2);border-radius:0 12px 12px 0;padding:12px 14px;}
  .trans-lang{font-size:0.6rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--gold);margin-bottom:6px;}
  .trans-text{font-size:0.88rem;line-height:1.82;color:var(--ink2);}
  .bangla{font-family:'Hind Siliguri',sans-serif;font-size:0.96rem!important;line-height:1.92!important;}
  .tafsir-card{margin:0 18px 10px;background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:14px;}
  .tafsir-title{font-size:0.72rem;font-weight:700;color:var(--gold);margin-bottom:2px;}
  .tafsir-note{font-size:0.6rem;color:var(--ink3);margin-bottom:8px;}
  .tafsir-text{font-size:0.82rem;line-height:1.88;color:var(--ink2);font-style:italic;}
  .ref-link{display:block;margin:0 18px 10px;font-size:0.78rem;color:var(--green2);text-decoration:none;font-weight:600;}
  .ref-link:hover{text-decoration:underline;}
  .ref-link-light{display:block;margin-top:10px;font-size:0.75rem;color:rgba(212,160,64,0.8);text-decoration:none;}
  .ref-link-light:hover{color:var(--gold2);text-decoration:underline;}
  .scholar-note{margin:0 18px 12px;font-size:0.74rem;color:var(--warn);background:var(--warn-bg);border:1px solid rgba(122,54,16,0.12);border-radius:8px;padding:8px 12px;line-height:1.6;}

  .search-bar-wrap{display:flex;gap:8px;padding:0 18px 12px;}
  .search-bar{flex:1;font-family:'Hind Siliguri',sans-serif;font-size:0.9rem;padding:11px 14px;border:1.5px solid var(--border);border-radius:10px;background:var(--bg3);color:var(--ink);outline:none;transition:border-color 0.18s;}
  .search-bar:focus{border-color:var(--gold);}
  .search-go{font-family:'Hind Siliguri',sans-serif;font-size:0.8rem;font-weight:600;padding:0 16px;background:var(--green);color:white;border:none;border-radius:10px;cursor:pointer;white-space:nowrap;transition:background 0.15s;}
  .search-go:hover{background:var(--green2);}
  .search-go:disabled{opacity:0.5;cursor:not-allowed;}
  .results-meta{font-size:0.82rem;color:var(--ink2);margin-bottom:12px;line-height:1.6;}
  .tag-sm{font-family:monospace;background:rgba(176,120,40,0.1);padding:1px 5px;border-radius:3px;font-size:0.78rem;}
  .search-group{margin-bottom:16px;}
  .search-group-hdr{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border);margin-bottom:6px;}
  .search-group-name{font-size:0.82rem;font-weight:600;color:var(--green);}
  .badge{font-size:0.6rem;background:rgba(176,120,40,0.1);color:var(--gold);padding:2px 8px;border-radius:10px;}
  .search-ayah-row{width:100%;text-align:left;background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:7px;cursor:pointer;display:block;transition:border-color 0.14s;}
  .search-ayah-row:hover{border-color:var(--gold);}
  .search-ayah-key{font-family:monospace;font-size:0.6rem;color:var(--gold);margin-bottom:4px;letter-spacing:0.04em;}
  .search-ayah-ar{font-family:'UthmanNaskh',serif;font-size:1.25rem;line-height:2.1;direction:rtl;text-align:right;color:var(--ink);margin-bottom:4px;}
  .search-ayah-en{font-size:0.76rem;color:var(--ink3);font-style:italic;line-height:1.55;}

  .surah-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 18px;}
  .surah-card{background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;cursor:pointer;transition:all 0.15s;}
  .surah-card:hover{border-color:var(--gold);transform:translateY(-2px);box-shadow:0 4px 14px var(--shadow);}
  .surah-num{font-family:monospace;font-size:0.62rem;color:var(--gold);margin-bottom:4px;letter-spacing:0.04em;}
  .surah-ar{font-family:'UthmanNaskh',serif;font-size:1.2rem;color:var(--green);direction:rtl;margin-bottom:3px;}
  .surah-en{font-family:'Playfair Display',serif;font-size:0.75rem;font-weight:500;color:var(--ink2);}
  .surah-bn{font-size:0.7rem;color:var(--ink3);margin-bottom:5px;}
  .surah-meta{display:flex;justify-content:space-between;font-size:0.6rem;color:var(--ink3);border-top:1px solid var(--border);padding-top:5px;margin-top:4px;}
  .surah-skeleton{height:108px;border-radius:12px;}

  .surah-header-card{margin:0 18px 16px;background:linear-gradient(135deg,var(--green),#081a10);border-radius:12px;padding:22px 18px;text-align:center;}
  .surah-header-ar{font-family:'UthmanNaskh',serif;font-size:2.2rem;color:var(--gold2);direction:rtl;margin-bottom:4px;}
  .surah-header-en{font-family:'Playfair Display',serif;font-size:1rem;color:rgba(237,232,222,0.9);margin-bottom:2px;}
  .surah-header-bn{font-size:0.82rem;color:rgba(196,184,154,0.7);margin-bottom:14px;}
  .info-table{width:100%;border-collapse:collapse;margin-bottom:10px;text-align:left;}
  .info-lbl{padding:4px 10px 4px 0;font-size:0.65rem;color:rgba(212,160,64,0.75);font-family:monospace;white-space:nowrap;}
  .info-val{padding:4px 0;font-size:0.82rem;color:rgba(237,232,222,0.9);font-weight:500;}
  .surah-ayah-row{border-bottom:1px solid var(--border);padding:10px 18px;}
  .surah-ayah-top{display:flex;align-items:flex-start;gap:10px;}
  .surah-ayah-num{font-family:monospace;font-size:0.62rem;color:var(--gold);background:rgba(176,120,40,0.1);border-radius:50%;width:24px;height:24px;display:grid;place-items:center;flex-shrink:0;margin-top:6px;}
  .surah-ayah-ar{flex:1;font-family:'UthmanNaskh',serif;font-size:1.38rem;line-height:2.3;direction:rtl;text-align:right;color:var(--ink);}
  .surah-ayah-expand{background:none;border:none;color:var(--ink3);cursor:pointer;font-size:0.68rem;padding:4px;flex-shrink:0;}
  .surah-ayah-detail{padding:8px 0 6px 34px;}
  .surah-ayah-actions{display:flex;gap:8px;margin-top:8px;}

  .bookmark-row{display:flex;background:var(--bg3);border:1px solid var(--border);border-radius:10px;margin-bottom:8px;overflow:hidden;}
  .bookmark-main{flex:1;text-align:left;padding:12px 14px;background:none;border:none;cursor:pointer;}
  .bookmark-key{font-family:monospace;font-size:0.62rem;color:var(--gold);margin-bottom:5px;letter-spacing:0.04em;}
  .bookmark-ar{font-family:'UthmanNaskh',serif;font-size:1.1rem;line-height:2;direction:rtl;text-align:right;color:var(--ink);margin-bottom:4px;}
  .bookmark-bn{font-size:0.78rem;color:var(--ink3);line-height:1.6;}
  .bookmark-del{width:42px;background:rgba(239,68,68,0.04);border:none;border-left:1px solid var(--border);color:#ef4444;cursor:pointer;font-size:0.78rem;flex-shrink:0;}

  .ask-note{margin:0 18px 14px;font-size:0.75rem;color:var(--warn);background:var(--warn-bg);border:1px solid rgba(122,54,16,0.12);border-radius:8px;padding:8px 12px;line-height:1.6;}
  .answer-card{margin:0 18px;background:var(--bg3);border:1px solid var(--border);border-left:3px solid var(--green2);border-radius:0 12px 12px 0;padding:14px;}
  .answer-label{font-size:0.62rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--green2);margin-bottom:8px;}
  .answer-text{font-size:0.92rem;line-height:1.88;color:var(--ink);margin-bottom:10px;}

  .about-hero{background:linear-gradient(135deg,var(--green),#081a10);padding:32px 22px;text-align:center;}
  .about-ayah-ar{font-family:'UthmanNaskh',serif;font-size:1.5rem;line-height:2.2;direction:rtl;color:var(--gold2);margin-bottom:14px;}
  .about-ayah-bn{font-size:0.88rem;line-height:1.85;color:rgba(237,232,222,0.85);margin-bottom:8px;}
  .about-ref{font-family:monospace;font-size:0.65rem;color:rgba(212,160,64,0.65);}
  .about-section{padding:18px 18px 8px;border-bottom:1px solid var(--border);}
  .about-section:last-of-type{border-bottom:none;}
  .about-section-title{font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;font-style:italic;color:var(--green);margin-bottom:12px;}
  .about-arabic{font-family:'UthmanNaskh',serif;font-size:1.45rem;line-height:2.2;direction:rtl;text-align:right;color:var(--ink);margin-bottom:10px;background:linear-gradient(135deg,rgba(28,74,46,0.06),rgba(176,120,40,0.06));padding:14px 16px;border-radius:10px;border:1px solid var(--border);}
  .about-text{font-size:0.88rem;line-height:1.85;color:var(--ink2);}
  .about-dua-note{margin-top:10px;font-size:0.8rem;line-height:1.75;color:var(--ink3);font-style:italic;background:var(--bg2);border-radius:8px;padding:10px 14px;}
  .about-builder{display:flex;align-items:center;gap:12px;margin-bottom:4px;}
  .about-builder-link{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:var(--green);text-decoration:none;}
  .about-builder-link:hover{color:var(--gold);text-decoration:underline;}
  .about-builder-link.secondary{font-size:0.8rem;font-family:'Hind Siliguri',sans-serif;font-weight:400;color:var(--ink3);}
  .about-sources{display:flex;flex-direction:column;gap:6px;}
  .about-source-row{display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:var(--bg2);border-radius:8px;text-decoration:none;transition:background 0.14s;}
  .about-source-row:hover{background:var(--bg3);}
  .about-source-name{font-family:monospace;font-size:0.78rem;color:var(--green);font-weight:600;}
  .about-source-desc{font-size:0.72rem;color:var(--ink3);}
  .about-tech{display:flex;flex-wrap:wrap;gap:6px;}
  .about-tech-tag{font-family:monospace;font-size:0.72rem;padding:4px 10px;background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--ink2);}
  .about-closing{text-align:center;padding:28px 18px 16px;font-family:'UthmanNaskh',serif;font-size:1.4rem;color:var(--gold);direction:rtl;}

  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:200;display:flex;align-items:flex-end;justify-content:center;}
  .modal{background:var(--bg3);border-radius:16px 16px 0 0;padding:20px 18px;width:100%;max-width:520px;max-height:88vh;overflow-y:auto;}
  @media(min-width:768px){.modal{align-self:center;border-radius:16px;}.modal-overlay{align-items:center;}}
  .modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;font-weight:600;font-size:0.95rem;color:var(--green);}
  .modal-close{background:none;border:none;font-size:1rem;cursor:pointer;color:var(--ink3);padding:4px;}
  .howto-step{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--border);}
  .howto-icon{font-size:1.35rem;flex-shrink:0;}
  .howto-title{font-weight:600;font-size:0.86rem;color:var(--green);margin-bottom:3px;}
  .howto-desc{font-size:0.76rem;color:var(--ink2);line-height:1.6;}

  .skeleton{background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:12px;}
  @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
  .empty-state{text-align:center;padding:52px 24px;color:var(--ink3);}
  .empty-icon{font-size:2.4rem;margin-bottom:12px;}
  .empty-state p{font-size:0.85rem;line-height:1.7;}
  .error-box{margin:0 18px;padding:10px 14px;background:#fff5f5;border:1px solid #fca5a5;border-radius:10px;font-size:0.82rem;color:#7f1d1d;}
  .muted{color:var(--ink3);}
  .spin{display:inline-block;animation:spin 0.8s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .btn-primary{font-family:'Hind Siliguri',sans-serif;font-size:0.88rem;font-weight:600;padding:12px 20px;background:var(--green);color:white;border:none;border-radius:10px;cursor:pointer;transition:background 0.15s;}
  .btn-primary:hover{background:var(--green2);}
`;
