import { useState, useEffect, useRef, useMemo, createContext, useContext } from "react";
import { Home, Search, BookOpen, HelpCircle, Compass, Sparkles, Bookmark, Library } from "lucide-react";
import { useTheme } from "./hooks/useTheme.js";
import { useAudioQueue } from "./hooks/useAudioQueue.js";
import { useSidebar } from "./hooks/useSidebar.js";
import { stripHtml } from "./utils/constants.js";
import {
  fetchAyah, fetchSurahMeta, fetchSurahAyat,
  fetchAllSurahs, searchByWord, callAI, getAyahAudioUrl
} from "./utils/api.js";
import {
  getBookmarks, addBookmark, removeBookmark, isBookmarked,
  getRecentSearches, addRecentSearch, isFirstVisit, recordActiveDay, recordVerseRead
} from "./utils/storage.js";
import ThemeOrb from "./components/layout/ThemeOrb.jsx";
import SiteHeader from "./components/layout/SiteHeader.jsx";
import PrayerThemeTabs from "./components/layout/PrayerThemeTabs.jsx";
import SiteFooter from "./components/layout/SiteFooter.jsx";
import HeroSection from "./components/home/HeroSection.jsx";
import QuickLookup from "./components/home/QuickLookup.jsx";
import DailyAyah from "./components/home/DailyAyah.jsx";
import SurahCarousel from "./components/home/SurahCarousel.jsx";
import ExploreSection from "./components/home/ExploreSection.jsx";
import JourneyInvite from "./components/home/JourneyInvite.jsx";
import DESIGN_CSS from "./styles/design.css?inline";
import ReadMode from "./components/readmode/ReadMode.jsx";
import NowPlayingBar from "./components/surah/NowPlayingBar.jsx";
import JourneyPage from "./components/journey/JourneyPage.jsx";
import ShareCardModal from "./components/share/ShareCardModal.jsx";
import BookLibraryPage from "./components/readmode/BookLibraryPage.jsx";

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
    theme:          "থিম",
    discoverSurahs: "সূরা আবিষ্কার করুন",
    playSurah:      "সম্পূর্ণ সূরা শুনুন",
    readMode:       "পড়ার মোড",
    bookLibrarySub: "একটি সূরা বেছে নিন এবং বই আকারে পড়া শুরু করুন",
    beginReading:   "পড়া শুরু করুন →",
    collapseSidebar:"সাইডবার লুকান",
    expandSidebar:  "সাইডবার দেখান",
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
    journey:        "যাত্রা",
    journeyHello:   "আসসালামু আলাইকুম",
    journeySub:     "আপনার আধ্যাত্মিক যাত্রা আলোর পথ। প্রতিদিন একটু একটু করে এগিয়ে যান।",
    versesRead:     "আয়াত পঠিত",
    daysActive:     "সক্রিয় দিন",
    journeyProgress:"যাত্রার অগ্রগতি",
    pinnedVerses:   "পিন করা আয়াত",
    otherWorks:     "আমাদের অন্যান্য কাজ দেখুন",
    askTitle:       "তথ্য জিজ্ঞাসা",
    askSub:         "শুধু তথ্যভিত্তিক প্রশ্ন - কী, কখন, কোনটি, কে",
    askPlaceholder: "প্রশ্ন লিখুন...",
    askBtn:         "জিজ্ঞাসা",
    askNote:        'কেন এবং ব্যাখ্যামূলক প্রশ্ন এখানে উত্তর দেওয়া হয় না। সেগুলোর জন্য একজন আলেমের সাথে পরামর্শ করুন।',
    askPoweredBy:   "⚙️ শুধু কুরআন সম্পর্কিত তথ্যভিত্তিক প্রশ্নের জন্য — অন্য কোনো বিষয়ে উত্তর দেওয়া হয় না।",
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
    download:       "ডাউনলোড করুন",
    start:          "শুরু করুন",
    searchFailed:   "অনুসন্ধান ব্যর্থ হয়েছে।",
    loadFailed:     "আয়াত লোড হয়নি।",
    connError:      "ডেটা আনতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন।",
    aiError:        "উত্তর দেওয়া সম্ভব হয়নি। ইন্টারনেট সংযোগ চেক করুন।",
    bnTrans:        "🇧🇩 বাংলা অনুবাদ — মুহিউদ্দীন খান",
    enTrans:        "🇬🇧 English — Dr. Mustafa Khattab",
    noAI:           "AI ব্যাখ্যা নেই",
    // ── Redesign (Figma "Al Hadi remake") ─────────────────────────
    brandDescriptor:"কুরআন রেফারেন্স",
    openMenu:       "মেনু খুলুন",
    closeMenu:      "মেনু বন্ধ করুন",
    langToggle:     "ভাষা পরিবর্তন",
    themeBarLabel:  "দিনের সাথে রঙ বদলাক",
    themeSelectorAria:"নামাজের সময় অনুযায়ী থিম",
    heroTitle:      ["প্রতিদিন একটু সময়,", "কুরআনের আলোয়।"],
    heroDesc:       ["আয়াত পড়ুন, অর্থ জানুন, তাফসীরে গভীরে যান।", "কুরআনের সাথে আপনার প্রতিদিনের পথচলা শুরু হোক এখানে।"],
    heroStart:      "পড়া শুরু করুন",
    heroBrowse:     "সূরা আবিষ্কার করুন",
    heroNote:       "১১৪টি সূরা  ·  বাংলা অনুবাদ  ·  বিশ্বস্ত তাফসীর",
    archCaption:    "পড়ুন · বুঝুন · জীবনে গড়ুন",
    archEnglish:    "A LIGHT FOR EVERY HEART",
    lookupTitle:    "কোন আয়াতটি খুঁজছেন?",
    lookupHint:     "আয়াতের রেফারেন্স, সূরা অথবা একটি শব্দ",
    lookupPlaceholder:"আয়াত লিখুন (২:২৫৫) বা শব্দ দিয়ে খুঁজুন...",
    lookupSubmit:   "খুঁজুন",
    quickFind:      "দ্রুত খুঁজুন",
    ayahEyebrow:    "আলোর একটি আয়াত",
    ayahVerified:   "আরবি পাঠ ও বাংলা অর্থ একসাথে",
    reciteShort:    "তিলাওয়াত",
    stopShort:      "বন্ধ করুন",
    saveShort:      "সংরক্ষণ",
    savedShort:     "সংরক্ষিত",
    ayahDetails:    "তাফসীর ও বিস্তারিত",
    discoverSub:    "পরিচিত সূরা থেকে শুরু হোক নতুন করে জানা।",
    allSurahs:      "সকল ১১৪টি সূরা",
    swipeHint:      "সোয়াইপ করে আরও সূরা দেখুন",
    prevSurahs:     "আগের সূরাগুলো",
    nextSurahs:     "পরের সূরাগুলো",
    ayatUnit:       "আয়াত",
    exploreTitle:   "আপনার পথ, আপনার মতো",
    exploreSub:     "কুরআনের সাথে যুক্ত থাকার সবকিছু, এক জায়গায়।",
    exploreSearchDesc:"সবর, রহমত, mercy…\nএকটি শব্দ থেকে খুঁজুন আয়াত।",
    exploreReadDesc:"বইয়ের মতো পড়ুন,\nতিলাওয়াত শুনুন মন দিয়ে।",
    exploreSavedDesc:"প্রিয় আয়াতগুলো রাখুন\nআবার ফিরে আসার জন্য।",
    exploreAskDesc: "কী, কখন, কোনটি, কে—\nজানুন তথ্যভিত্তিক উত্তর।",
    journeyEyebrow: "অল্প অল্প করে, প্রতিদিন",
    journeyHeadline:"আপনার আধ্যাত্মিক যাত্রা আলোর পথ।",
    journeyDesc:    "পড়ার অভ্যাস গড়ুন, অগ্রগতি দেখুন, ফিরে আসুন আপনার প্রিয় আয়াতে।",
    journeyCta:     "আমার যাত্রা দেখুন",
    footerMission:  "কুরআনের কাছে, প্রতিদিন।",
    footerPurpose:  "সৎ উদ্দেশ্যে বিনামূল্যে ব্যবহারযোগ্য",
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
    theme:          "Theme",
    discoverSurahs: "Discover Surahs",
    playSurah:      "Play Whole Surah",
    readMode:       "Read Mode",
    bookLibrarySub: "Pick a surah and start reading it as a book",
    beginReading:   "Begin Reading →",
    collapseSidebar:"Hide Sidebar",
    expandSidebar:  "Show Sidebar",
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
    journey:        "Journey",
    journeyHello:   "Assalamu Alaikum",
    journeySub:     "Your spiritual journey is a path of light. A little every day.",
    versesRead:     "Verses Read",
    daysActive:     "Days Active",
    journeyProgress:"Journey Progress",
    pinnedVerses:   "Pinned Verses",
    otherWorks:     "View other works from us",
    askTitle:       "Ask a Question",
    askSub:         "Factual questions only — what, when, which, who",
    askPlaceholder: "Type your question...",
    askBtn:         "Ask",
    askNote:        'Why and interpretive questions are not answered here. Please consult a qualified Islamic scholar for those.',
    askPoweredBy:   "⚙️ Answers basic Qur'an facts only — nothing else, on any topic, no exceptions.",
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
    download:       "Download",
    start:          "Get Started",
    searchFailed:   "Search failed. Please try again.",
    loadFailed:     "Could not load verse.",
    connError:      "Could not fetch data. Check your connection.",
    aiError:        "Could not get an answer. Check your connection.",
    bnTrans:        "🇧🇩 Bengali — Muhiuddin Khan",
    enTrans:        "🇬🇧 English — Dr. Mustafa Khattab",
    noAI:           "NO AI INTERPRETATION",
    // ── Redesign (Figma "Al Hadi remake") ─────────────────────────
    brandDescriptor:"Quran Reference",
    openMenu:       "Open menu",
    closeMenu:      "Close menu",
    langToggle:     "Switch language",
    themeBarLabel:  "Let the colors follow the day",
    themeSelectorAria:"Prayer-time theme",
    heroTitle:      ["A little time each day,", "in the light of the Quran."],
    heroDesc:       ["Read verses, learn their meaning, go deeper with tafsir.", "Begin your daily walk with the Quran right here."],
    heroStart:      "Start reading",
    heroBrowse:     "Discover surahs",
    heroNote:       "114 surahs  ·  Bengali translation  ·  Trusted tafsir",
    archCaption:    "Read · Understand · Live it",
    archEnglish:    "A LIGHT FOR EVERY HEART",
    lookupTitle:    "Which verse are you looking for?",
    lookupHint:     "A verse reference, a surah, or a single word",
    lookupPlaceholder:"Enter a verse (2:255) or search by a word...",
    lookupSubmit:   "Search",
    quickFind:      "Quick find",
    ayahEyebrow:    "A verse of light",
    ayahVerified:   "Arabic text and Bengali meaning, together",
    reciteShort:    "Recite",
    stopShort:      "Stop",
    saveShort:      "Save",
    savedShort:     "Saved",
    ayahDetails:    "Tafsir & details",
    discoverSub:    "Start anew from the surahs you already know.",
    allSurahs:      "All 114 surahs",
    swipeHint:      "Swipe to see more surahs",
    prevSurahs:     "Previous surahs",
    nextSurahs:     "Next surahs",
    ayatUnit:       "verses",
    exploreTitle:   "Your path, your way",
    exploreSub:     "Everything for staying connected with the Quran, in one place.",
    exploreSearchDesc:"Sabr, mercy, rahma…\nFind verses from a single word.",
    exploreReadDesc:"Read it like a book,\nand listen to the recitation.",
    exploreSavedDesc:"Keep your favourite verses\nto return to again.",
    exploreAskDesc: "What, when, which, who —\nget fact-based answers.",
    journeyEyebrow: "A little at a time, every day",
    journeyHeadline:"Your spiritual journey is a path of light.",
    journeyDesc:    "Build a reading habit, watch your progress, and return to the verses you love.",
    journeyCta:     "View my journey",
    footerMission:  "Close to the Quran, every day.",
    footerPurpose:  "Free to use with good intention",
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
  const { theme, selectTheme, cycleTheme, themeMeta, themeList } = useTheme();
  const audio    = useAudioQueue();
  const sidebar  = useSidebar();
  const [lang, setLang]             = useState(getSavedLang());
  const t                           = T[lang];
  const [page, setPage]             = useState("home");
  const [pageData, setPageData]     = useState(null);
  const [showHowTo, setShowHowTo]   = useState(false);
  const [bookmarkTick, setBookmarkTick] = useState(0);
  const [shareTarget, setShareTarget]   = useState(null);

  useEffect(() => { if (isFirstVisit()) setShowHowTo(true); }, []);
  useEffect(() => { recordActiveDay(); }, []);

  function toggleLang() {
    const next = lang === "bn" ? "en" : "bn";
    setLang(next); saveLang(next);
  }

  function navigate(p, data = null) {
    setPage(p); setPageData(data); window.scrollTo(0, 0);
    sidebar.closeMobile();
  }

  const NAV_ITEMS = [
    { id: "home",          icon: Home,       label: t.home },
    { id: "search",        icon: Search,     label: t.search },
    { id: "surah-browser", icon: BookOpen,   label: t.surah },
    { id: "book",          icon: Library,    label: t.readMode },
    { id: "journey",       icon: Compass,    label: t.journey },
    { id: "ask",           icon: HelpCircle, label: t.ask },
    { id: "bookmarks",     icon: Bookmark,   label: t.saved },
    { id: "about",         icon: Sparkles,   label: t.about },
  ];

  // Sub-pages light up the nav item they belong to.
  const activeNav =
    page === "surah"    ? "surah-browser" :
    page === "readmode" ? (pageData?._origin === "book" ? "book" : "surah-browser") :
    page;

  return (
    <LangContext.Provider value={lang}>
      <style>{BASE_CSS}</style>
      <style>{DESIGN_CSS}</style>
      {showHowTo && <HowToModal t={t} onClose={() => setShowHowTo(false)} />}
      {shareTarget && <ShareCardModal t={t} ayah={shareTarget} onClose={() => setShareTarget(null)} />}

      {/* Phones: persistent corner theme control (tap = waqt arc, hold = next waqt).
          Tablet/desktop use the Figma prayer-theme tabs below the header. */}
      <ThemeOrb theme={theme} themeMeta={themeMeta} themeList={themeList}
        selectTheme={selectTheme} label={t.theme} />

      <div className="app">
        <SiteHeader
          t={t} lang={lang} items={NAV_ITEMS} activeId={activeNav}
          navigate={navigate} onToggleLang={toggleLang} onHowTo={() => setShowHowTo(true)}
          drawerOpen={sidebar.mobileOpen}
          onToggleDrawer={sidebar.toggleMobile}
          onCloseDrawer={sidebar.closeMobile}
        />
        <PrayerThemeTabs t={t} lang={lang} theme={theme} themeList={themeList} selectTheme={selectTheme} />

        <main className="main">
          {page === "home"          && <HomePage t={t} lang={lang} navigate={navigate} audio={audio} theme={theme} themeMeta={themeMeta} onBookmarkChange={() => setBookmarkTick(x=>x+1)} />}
          {page === "search"        && <SearchPage t={t} navigate={navigate} data={pageData} />}
          {page === "surah-browser" && <SurahBrowserPage t={t} navigate={navigate} />}
          {page === "book"          && <BookLibraryPage t={t} navigate={navigate} />}
          {page === "ayah"          && <AyahPage t={t} data={pageData} audio={audio} onBookmarkChange={() => setBookmarkTick(x=>x+1)} />}
          {page === "surah"         && <SurahPage t={t} data={pageData} navigate={navigate} audio={audio} />}
          {page === "readmode"      && <ReadMode t={t} data={pageData} audio={audio} onClose={() => navigate(pageData?._origin === "book" ? "book" : "surah", pageData)} />}
          {page === "bookmarks"     && <BookmarksPage key={bookmarkTick} t={t} navigate={navigate} onBookmarkChange={() => setBookmarkTick(x=>x+1)} />}
          {page === "journey"       && <JourneyPage t={t} navigate={navigate} tick={bookmarkTick} onShare={setShareTarget} />}
          {page === "ask"           && <AskPage t={t} lang={lang} />}
          {page === "about"         && <AboutPage t={t} lang={lang} />}
        </main>

        <NowPlayingBar t={t} audio={audio} />

        {/* BOTTOM TAB BAR — phones */}
        <div className="tab-bar">
          {NAV_ITEMS.map(item => (
            <button key={item.id} className={`tab ${activeNav === item.id ? "active" : ""}`} onClick={() => navigate(item.id)}>
              <span className="tab-icon"><item.icon size={20} /></span>
              <span className="tab-label">{item.label}</span>
            </button>
          ))}
        </div>

        <SiteFooter t={t} navigate={navigate} onHowTo={() => setShowHowTo(true)} />
      </div>
    </LangContext.Provider>
  );
}

// ════════════════════════════════════════════════════════════════
// HOME PAGE
// ════════════════════════════════════════════════════════════════
function HomePage({ t, lang, navigate, audio, theme, themeMeta, onBookmarkChange }) {
  return (
    <div className="page home-page">
      <HeroSection t={t} lang={lang} navigate={navigate} theme={theme} themeMeta={themeMeta} />
      <QuickLookup t={t} lang={lang} navigate={navigate} />
      <DailyAyah t={t} lang={lang} navigate={navigate} audio={audio} onBookmarkChange={onBookmarkChange} />
      <SurahCarousel t={t} lang={lang} navigate={navigate} />
      <ExploreSection t={t} navigate={navigate} />
      <JourneyInvite t={t} navigate={navigate} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SEARCH PAGE
// ════════════════════════════════════════════════════════════════
function SearchPage({ t, navigate, data }) {
  const initialQuery          = data?.initialQuery || "";
  const [query, setQuery]     = useState(initialQuery);
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

  // Arriving from the Home quick lookup with a word: run it straight away.
  useEffect(() => { if (initialQuery) doSearch(initialQuery); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
  useEffect(() => { if (data?.key) recordVerseRead(data.key); }, [data?.key]);

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
      {showShare && <ShareCardModal t={t} ayah={data} onClose={() => setShowShare(false)} />}

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
  const queueItems = useMemo(() => {
    if (!data) return [];
    return data.ayat.map(v => ({
      url: getAyahAudioUrl(data.meta.id, v.verse_number),
      key: `${data.meta.id}:${v.verse_number}`,
      surahNum: data.meta.id,
      ayahNum: v.verse_number,
      surahName: data.meta.name_simple,
    }));
  }, [data]);

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

  const isThisSurahPlaying = audio.isPlaying && audio.current?.surahNum === meta?.id;

  function togglePlaySurah() {
    if (isThisSurahPlaying) { audio.togglePause(); return; }
    if (audio.current?.surahNum === meta?.id && audio.current) { audio.togglePause(); return; }
    audio.playQueue(queueItems, 0);
  }

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
        <button className="surah-play-btn" onClick={togglePlaySurah}>
          {isThisSurahPlaying ? `⏸ ${t.stop}` : `▶ ${t.playSurah}`}
        </button>
        <button className="ref-link-light" style={{marginTop:8, cursor:"pointer", background:"none", border:"none", width:"100%"}}
          onClick={() => navigate("readmode", data)}>
          📖 {t.readMode}
        </button>
      </div>

      <div className="section">
        <div className="section-title"><span>{t.allAyat}</span></div>
        {ayat.map((v) => {
          const key  = `${meta?.id}:${v.verse_number}`;
          const isEx = expanded[key];
          const isActive = audio.activeKey === key;
          const isNext   = audio.nextKey === key;
          const bn   = v.translations?.find(tr => Number(tr.resource_id) === 161)?.text || "";
          const en   = v.translations?.find(tr => Number(tr.resource_id) === 131)?.text || "";
          return (
            <div key={key} className={`surah-ayah-row ${isActive ? "ayah-active" : ""} ${isNext ? "ayah-next" : ""}`}>
              <div className="surah-ayah-top">
                <span className="surah-ayah-num">{v.verse_number}</span>
                <div className="surah-ayah-ar">{v.text_uthmani}</div>
                <button className="surah-ayah-expand"
                  onClick={() => { setExpanded(p => ({...p,[key]:!p[key]})); recordVerseRead(key); }}>
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
                    <button className={`action-btn-sm ${isActive ? "active" : ""}`}
                      onClick={() => isActive ? audio.togglePause() : audio.playQueue(queueItems, ayat.findIndex(a => a.verse_number === v.verse_number))}>
                      {isActive ? (audio.isPlaying ? t.stop : t.recite) : t.recite}
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
function AskPage({ t, lang }) {
  const [input, setInput]     = useState("");
  const [answer, setAnswer]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function ask() {
    if (!input.trim()) return;
    setLoading(true); setError(null); setAnswer(null);
    try { const a = await callAI(input.trim(), lang); setAnswer(a); }
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
        <input className="search-bar" value={input} maxLength={300}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && ask()}
          placeholder={t.askPlaceholder} />
        <button className="search-go" onClick={ask} disabled={loading || !input.trim()}>
          {loading ? <span className="spin">⟳</span> : t.askBtn}
        </button>
      </div>
      <div className="ask-powered">{t.askPoweredBy}</div>
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
          <a className="about-builder-link secondary" href="https://fusesw.vercel.app/" target="_blank" rel="noopener noreferrer">
            {t.otherWorks} ↗
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
            ? "পরিবার, বন্ধু ও ভাই— যারা পরীক্ষা করেছেন, মতামত দিয়েছেন, সাহায্য করেছেন এবং দোয়া করেছেন। আল্লাহ আপনাদের সবাইকে উত্তম প্রতিদান দিন।"
            : "Family, friends and brother — who tested, gave feedback, helped and made dua. May Allah reward you all with the best."}
        </div>
      </div>

      {/* DATA SOURCES */}
      <div className="about-section">
        <div className="about-section-title">{isBn ? "ডেটা উৎস" : "Data Sources"}</div>
        <div className="about-sources">
          {[
            { name:"api.quran.com",   desc:isBn?"আরবি টেক্সট, অনুবাদ, তাফসীর":"Arabic text, translations, tafsir", url:"https://api.quran.com" },
            { name:"Islamic.Network", desc:isBn?"অডিও তিলাওয়াত (Mishary Alafasy)":"Audio recitation (Mishary Alafasy)", url:"https://islamic.network" },
            { name:"Groq",desc:isBn?"সীমিত তথ্যভিত্তিক প্রশ্নোত্তর":"Limited factual Q&A only", url:"https://groq.com" },
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
  @font-face { font-family:'UthmanNaskh'; src:url('/fonts/UthmanTN1.woff2') format('woff2'); font-display:swap; }

  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

  :root{
    /* Pre-hydration fallback only (the default Dhuhr palette) — useTheme.js
       sets the real values for the active waqt at runtime. */
    --bg:#f6f8f4;--surface:#ffffff;--surface2:#e8eee8;--line:#d5dfd9;
    --text:#1f3439;--muted:#5d7277;--accent:#2c697a;--on-accent:#ffffff;--accent-hover:#3f7686;
    --ornament:#796234;--danger:#b3261e;--danger-bg:rgba(179,38,30,0.10);
    --bg2:#e8eee8;--bg3:#ffffff;--ink:#1f3439;--ink2:#3d5258;--ink3:#5d7277;
    --gold:#2c697a;--gold2:#2c697a;--green:#2c697a;--green2:#3f7686;--fill:#2c697a;
    --border:#d5dfd9;--shadow:rgba(31,52,57,0.10);
    --warn:#b91c1c;--warn-bg:rgba(185,28,28,0.09);--pattern:rgba(44,105,122,0.06);
  }

  html{font-size:16px;scroll-behavior:smooth;overflow-x:hidden;}
  body{font-family:'Hind Siliguri',sans-serif;background:var(--bg);color:var(--ink);min-height:100vh;-webkit-font-smoothing:antialiased;overflow-x:hidden;overflow-wrap:break-word;}

  .app{display:flex;min-height:100vh;min-height:100dvh;max-width:100vw;min-width:0;}

  @media(min-width:768px){

    .tab-bar{display:none!important;}

  }

  .tab-bar{height:60px;display:flex;background:var(--bg3);border-top:1px solid var(--border);position:fixed;bottom:0;left:0;right:0;z-index:100;padding-bottom:env(safe-area-inset-bottom,0px);}
  .tab{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;border:none;background:none;cursor:pointer;color:var(--ink3);transition:color 0.15s;padding:5px 2px;}
  .tab.active{color:var(--green);}
  .tab-icon{display:flex;align-items:center;justify-content:center;}
  .tab-label{font-size:0.56rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}
  @media(max-width:359.98px){
    .tab-icon svg{width:18px;height:18px;}
    .tab-label{font-size:0.5rem;}
  }
  .tab.active .tab-label{font-weight:700;}

  .page-header{padding:20px 18px 10px;}
  .page-title{font-family:'Hind Siliguri',sans-serif;font-size:1.9rem;font-weight:600;color:var(--text);line-height:1.35;}
  .page-sub{font-size:0.78rem;color:var(--ink3);margin-top:3px;}
  .section{padding:10px 18px;}
  .section-title{display:flex;align-items:center;gap:10px;margin-bottom:12px;font-size:0.85rem;font-weight:600;color:var(--ink2);}
  .section-title-ar{font-family:'UthmanNaskh',serif;font-size:1rem;color:var(--gold);}
  .section-label{font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink3);margin-bottom:8px;}

  .chip{font-family:'Hind Siliguri',sans-serif;font-size:0.76rem;padding:5px 12px;border-radius:20px;border:1px solid var(--border);background:var(--bg2);color:var(--ink2);cursor:pointer;transition:all 0.14s;white-space:nowrap;}
  .chip:hover{background:var(--accent);color:var(--on-accent);border-color:var(--accent);}
  .chip-row{display:flex;flex-wrap:wrap;gap:6px;}
  .chip-col{display:flex;flex-direction:column;gap:6px;}
  .chip-full{width:100%;text-align:left;border-radius:10px;padding:8px 14px;}

  .ayah-surah-badge{display:flex;align-items:center;gap:8px;padding:16px 18px 8px;flex-wrap:wrap;}
  .ayah-surah-ar{font-family:'Hind Siliguri',sans-serif;font-size:1rem;font-weight:700;color:var(--green);}
  .ayah-surah-bn{font-size:0.78rem;color:var(--ink3);}
  .ayah-key-badge{font-family:monospace;font-size:0.65rem;background:var(--accent);color:var(--on-accent);padding:2px 9px;border-radius:10px;margin-left:auto;letter-spacing:0.04em;}
  .arabic-card{margin:0 18px 12px;background:linear-gradient(135deg,color-mix(in srgb, var(--green) 7%, transparent),color-mix(in srgb, var(--gold) 7%, transparent));border:1px solid var(--border);border-radius:12px;padding:18px;}
  .arabic-text{font-family:'UthmanNaskh',serif;font-size:2rem;line-height:2.7;direction:rtl;text-align:right;color:var(--ink);margin-bottom:14px;}
  .arabic-actions{display:flex;gap:6px;flex-wrap:wrap;}
  .action-btn{font-family:'Hind Siliguri',sans-serif;font-size:0.72rem;padding:5px 11px;border-radius:20px;border:1px solid var(--border);background:var(--bg2);color:var(--ink2);cursor:pointer;transition:all 0.14s;white-space:nowrap;}
  .action-btn:hover{border-color:var(--gold);color:var(--gold);}
  .action-btn.active{background:var(--accent);color:var(--on-accent);border-color:var(--accent);}
  .action-btn.gold{background:var(--accent);color:var(--on-accent);border-color:var(--accent);}
  .action-btn-sm{font-family:'Hind Siliguri',sans-serif;font-size:0.7rem;padding:4px 10px;border-radius:16px;border:1px solid var(--border);background:var(--bg2);color:var(--ink2);cursor:pointer;transition:all 0.14s;}
  .action-btn-sm.active{background:var(--accent);color:var(--on-accent);border-color:var(--accent);}
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
  .ref-link-light{display:block;margin-top:10px;font-size:0.75rem;color:color-mix(in srgb, var(--gold) 80%, transparent);text-decoration:none;}
  .ref-link-light:hover{color:var(--gold2);text-decoration:underline;}
  .scholar-note{margin:0 18px 12px;font-size:0.74rem;color:var(--warn);background:var(--warn-bg);border:1px solid rgba(122,54,16,0.12);border-radius:8px;padding:8px 12px;line-height:1.6;}

  .search-bar-wrap{display:flex;gap:8px;padding:0 18px 12px;}
  .search-bar{flex:1;font-family:'Hind Siliguri',sans-serif;font-size:0.9rem;padding:11px 14px;border:1.5px solid var(--border);border-radius:10px;background:var(--bg3);color:var(--ink);outline:none;transition:border-color 0.18s;}
  .search-bar:focus{border-color:var(--gold);}
  .search-go{font-family:'Hind Siliguri',sans-serif;font-size:0.8rem;font-weight:600;padding:0 16px;background:var(--accent);color:var(--on-accent);border:none;border-radius:12px;cursor:pointer;white-space:nowrap;transition:background 0.15s;}
  .search-go:hover{background:var(--accent-hover);}
  .search-go:disabled{opacity:0.5;cursor:not-allowed;}
  .results-meta{font-size:0.82rem;color:var(--ink2);margin-bottom:12px;line-height:1.6;}
  .tag-sm{font-family:monospace;background:color-mix(in srgb, var(--gold) 10%, transparent);padding:1px 5px;border-radius:3px;font-size:0.78rem;}
  .search-group{margin-bottom:16px;}
  .search-group-hdr{display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border);margin-bottom:6px;}
  .search-group-name{font-size:0.82rem;font-weight:600;color:var(--green);}
  .badge{font-size:0.6rem;background:color-mix(in srgb, var(--gold) 10%, transparent);color:var(--gold);padding:2px 8px;border-radius:10px;}
  .search-ayah-row{width:100%;text-align:left;background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:7px;cursor:pointer;display:block;transition:border-color 0.14s;}
  .search-ayah-row:hover{border-color:var(--gold);}
  .search-ayah-key{font-family:monospace;font-size:0.6rem;color:var(--gold);margin-bottom:4px;letter-spacing:0.04em;}
  .search-ayah-ar{font-family:'UthmanNaskh',serif;font-size:1.25rem;line-height:2.1;direction:rtl;text-align:right;color:var(--ink);margin-bottom:4px;}
  .search-ayah-en{font-size:0.76rem;color:var(--ink3);font-style:italic;line-height:1.55;}

  .surah-card{background:var(--bg3);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;cursor:pointer;transition:all 0.15s;}
  .surah-card:hover{border-color:var(--gold);transform:translateY(-2px);box-shadow:0 4px 14px var(--shadow);}
  .surah-num{font-family:monospace;font-size:0.62rem;color:var(--gold);margin-bottom:4px;letter-spacing:0.04em;}
  .surah-ar{font-family:'UthmanNaskh',serif;font-size:1.2rem;color:var(--green);direction:rtl;margin-bottom:3px;}
  .surah-en{font-family:'Hind Siliguri',sans-serif;font-size:0.75rem;font-weight:500;color:var(--ink2);}
  .surah-bn{font-size:0.7rem;color:var(--ink3);margin-bottom:5px;}
  .surah-meta{display:flex;justify-content:space-between;font-size:0.6rem;color:var(--ink3);border-top:1px solid var(--border);padding-top:5px;margin-top:4px;}
  .surah-skeleton{height:108px;border-radius:12px;}

  .surah-header-card{margin:0 18px 16px;background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:22px 18px;text-align:center;}
  .surah-header-ar{font-family:'UthmanNaskh',serif;font-size:2.2rem;color:var(--gold2);direction:rtl;margin-bottom:4px;}
  .surah-header-en{font-family:'Hind Siliguri',sans-serif;font-size:1rem;color:var(--ink);margin-bottom:2px;}
  .surah-header-bn{font-size:0.82rem;color:var(--ink3);margin-bottom:14px;}
  .info-table{width:100%;border-collapse:collapse;margin-bottom:10px;text-align:left;}
  .info-lbl{padding:4px 10px 4px 0;font-size:0.65rem;color:color-mix(in srgb, var(--gold) 75%, transparent);font-family:monospace;white-space:nowrap;}
  .info-val{padding:4px 0;font-size:0.82rem;color:color-mix(in srgb, var(--ink) 90%, transparent);font-weight:500;}
  .surah-ayah-row{border-bottom:1px solid var(--border);padding:10px 18px;}
  .surah-ayah-top{display:flex;align-items:flex-start;gap:10px;}
  .surah-ayah-num{font-family:monospace;font-size:0.62rem;color:var(--gold);background:color-mix(in srgb, var(--gold) 10%, transparent);border-radius:50%;width:24px;height:24px;display:grid;place-items:center;flex-shrink:0;margin-top:6px;}
  .surah-ayah-ar{flex:1;font-family:'UthmanNaskh',serif;font-size:1.38rem;line-height:2.3;direction:rtl;text-align:right;color:var(--ink);}
  .surah-ayah-expand{background:none;border:none;color:var(--ink3);cursor:pointer;font-size:0.68rem;padding:4px;flex-shrink:0;}
  .surah-ayah-detail{padding:8px 0 6px 34px;}
  .surah-ayah-actions{display:flex;gap:8px;margin-top:8px;}

  .bookmark-row{display:flex;background:var(--bg3);border:1px solid var(--border);border-radius:10px;margin-bottom:8px;overflow:hidden;}
  .bookmark-main{flex:1;text-align:left;padding:12px 14px;background:none;border:none;cursor:pointer;}
  .bookmark-key{font-family:monospace;font-size:0.62rem;color:var(--gold);margin-bottom:5px;letter-spacing:0.04em;}
  .bookmark-ar{font-family:'UthmanNaskh',serif;font-size:1.1rem;line-height:2;direction:rtl;text-align:right;color:var(--ink);margin-bottom:4px;}
  .bookmark-bn{font-size:0.78rem;color:var(--ink3);line-height:1.6;}
  .bookmark-del{width:42px;background:var(--danger-bg);border:none;border-left:1px solid var(--line);color:var(--danger);cursor:pointer;font-size:0.78rem;flex-shrink:0;}

  .ask-note{margin:0 18px 14px;font-size:0.75rem;color:var(--warn);background:var(--warn-bg);border:1px solid rgba(122,54,16,0.12);border-radius:8px;padding:8px 12px;line-height:1.6;}
  .ask-powered{margin:10px 18px 14px;font-size:0.68rem;color:var(--ink3);opacity:0.75;}
  .answer-card{margin:0 18px;background:var(--bg3);border:1px solid var(--border);border-left:3px solid var(--green2);border-radius:0 12px 12px 0;padding:14px;}
  .answer-label{font-size:0.62rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--green2);margin-bottom:8px;}
  .answer-text{font-size:0.92rem;line-height:1.88;color:var(--ink);margin-bottom:10px;}

  .about-hero{background:var(--surface2);border:1px solid var(--line);border-radius:18px;margin:8px 18px 4px;padding:32px 22px;text-align:center;}
  .about-ayah-ar{font-family:'UthmanNaskh',serif;font-size:1.5rem;line-height:2.2;direction:rtl;color:var(--gold2);margin-bottom:14px;}
  .about-ayah-bn{font-size:0.88rem;line-height:1.85;color:var(--ink2);margin-bottom:8px;}
  .about-ref{font-family:monospace;font-size:0.65rem;color:color-mix(in srgb, var(--gold) 65%, transparent);}
  .about-section{padding:18px 18px 8px;border-bottom:1px solid var(--border);}
  .about-section:last-of-type{border-bottom:none;}
  .about-section-title{font-family:'Hind Siliguri',sans-serif;font-size:1.1rem;font-weight:600;color:var(--text);margin-bottom:12px;}
  .about-arabic{font-family:'UthmanNaskh',serif;font-size:1.45rem;line-height:2.2;direction:rtl;text-align:right;color:var(--ink);margin-bottom:10px;background:linear-gradient(135deg,color-mix(in srgb, var(--green) 6%, transparent),color-mix(in srgb, var(--gold) 6%, transparent));padding:14px 16px;border-radius:10px;border:1px solid var(--border);}
  .about-text{font-size:0.88rem;line-height:1.85;color:var(--ink2);}
  .about-dua-note{margin-top:10px;font-size:0.8rem;line-height:1.75;color:var(--ink3);font-style:italic;background:var(--bg2);border-radius:8px;padding:10px 14px;}
  .about-builder{display:flex;align-items:center;gap:12px;margin-bottom:4px;}
  .about-builder-link{font-family:'Hind Siliguri',sans-serif;font-size:1.1rem;font-weight:700;color:var(--green);text-decoration:none;}
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
  .error-box{margin:0 18px;padding:10px 14px;background:var(--danger-bg);border:1px solid var(--danger);border-radius:12px;font-size:0.82rem;color:var(--danger);}
  .muted{color:var(--ink3);}
  .spin{display:inline-block;animation:spin 0.8s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .btn-primary{font-family:'Hind Siliguri',sans-serif;font-size:0.88rem;font-weight:600;padding:12px 20px;background:var(--accent);color:var(--on-accent);border:none;border-radius:12px;cursor:pointer;transition:background 0.15s;}
  .btn-primary:hover{background:var(--accent-hover);}

  /* ── UI upgrade pass ─────────────────────────────────────────── */

  /* Brand mark: gentle glow + a slow star twinkle so it reads as alive,
     without being distracting. */
  .brand-logo{filter:drop-shadow(0 1px 4px rgba(0,0,0,0.25));flex-shrink:0;}
  .brand-logo-star{transform-origin:40px 26px;animation:logoTwinkle 3.2s ease-in-out infinite;}
  .brand-logo-crescent{transform-origin:63px 34px;animation:logoDrift 6s ease-in-out infinite;}
  @keyframes logoTwinkle{0%,100%{opacity:0.55;transform:scale(0.85);}50%{opacity:1;transform:scale(1.05);}}
  @keyframes logoDrift{0%,100%{transform:rotate(0deg);}50%{transform:rotate(6deg);}}
  @media (prefers-reduced-motion: reduce){
    .brand-logo-star, .brand-logo-crescent{animation:none;}
  }

  /* Glass topnav on mobile — subtle depth instead of a flat block. */

  /* Page transition: content fades/slides in on every navigation so the
     app feels responsive rather than snapping between screens. */
  
  @keyframes pageIn{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}

  /* Consistent, visible focus rings for keyboard users (accessibility +
     a small security/UX win: never rely on outline:none without a
     replacement). */
  a:focus-visible, button:focus-visible, input:focus-visible{
    outline:2px solid var(--gold2); outline-offset:2px; border-radius:4px;
  }

  /* Nicer buttons + cards: consistent easing, subtle lift, no jank. */
  .surah-card, .search-ayah-row, .bookmark-row, .answer-card, .about-source-row{
    transition:transform 0.18s cubic-bezier(.22,.61,.36,1), box-shadow 0.18s ease, border-color 0.15s ease;
  }
  .surah-card:hover{box-shadow:0 6px 18px var(--shadow);}
  .answer-card{animation:answerIn 0.3s cubic-bezier(.22,.61,.36,1);}
  @keyframes answerIn{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);}}

  .btn-primary, .search-go, .tab{
    transition:background 0.15s ease, color 0.15s ease, opacity 0.15s ease, transform 0.15s ease;
  }
  .btn-primary:active, .search-go:active{transform:scale(0.97);}

  /* Scrollbar polish (harmless progressive enhancement). */
  ::-webkit-scrollbar{width:10px;height:10px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:var(--border);border-radius:8px;}
  ::-webkit-scrollbar-thumb:hover{background:var(--gold);}

  /* ══════════════════════════════════════════════════════════════
     UI REBOOT — motion tokens, hamburger + collapsible sidebar,
     theme orb + waqt arc, carousel, play-surah / read mode
     ══════════════════════════════════════════════════════════════ */

  /* Shared motion tokens: one easing + duration scale reused by every
     interactive element so morphs read as one consistent language. */
  :root{
    --ease:cubic-bezier(.22,.61,.36,1);
    --ease-bounce:cubic-bezier(.34,1.56,.64,1);
    --dur-fast:0.15s; --dur-base:0.28s; --dur-slow:0.5s;
  }
  @font-face{ font-family:'Reem Kufi'; font-display:swap; src:local('Reem Kufi'); }
  @import url('https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400;600&family=Aref+Ruqaa:wght@400;700&display=swap');

  /* ── Hamburger (three lines <-> X) ───────────────────────────── */

  /* ── Collapsible sidebar (desktop) ───────────────────────────── */

  /* ── Mobile drawer + scrim ────────────────────────────────────── */

  /* ── Persistent corner theme orb ─────────────────────────────── */
  .theme-orb-wrap{position:fixed;right:18px;bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:250;}
  @media(min-width:768px){.theme-orb-wrap{bottom:22px;}}
  .theme-orb{
    width:52px;height:52px;border-radius:50%;border:2px solid rgba(255,255,255,0.4);
    box-shadow:0 6px 20px var(--shadow), 0 0 0 0 rgba(255,255,255,0);
    cursor:pointer;display:grid;place-items:center;font-size:1.35rem;
    animation:orbPulse 3.6s ease-in-out infinite;
    transition:transform var(--dur-fast) var(--ease);
  }
  .theme-orb:active{transform:scale(0.92);}
  @keyframes orbPulse{0%,100%{box-shadow:0 6px 20px var(--shadow), 0 0 0 0 rgba(255,255,255,0.25);}50%{box-shadow:0 6px 24px var(--shadow), 0 0 0 6px rgba(255,255,255,0);}}
  .theme-orb-icon{filter:drop-shadow(0 1px 3px rgba(0,0,0,0.4));}

  .theme-orb-panel{
    position:absolute;bottom:calc(100% + 14px);right:0;width:min(320px,86vw);
    background:var(--bg3);border:1px solid var(--border);border-radius:18px;
    box-shadow:0 16px 40px var(--shadow);padding:16px 14px 8px;
    transform-origin:bottom right;
    animation:orbPanelIn var(--dur-base) var(--ease);
  }
  @keyframes orbPanelIn{from{opacity:0;transform:scale(0.9) translateY(8px);}to{opacity:1;transform:scale(1) translateY(0);}}
  .theme-orb-panel-hdr{font-size:0.78rem;font-weight:700;color:var(--ink2);text-align:center;margin-bottom:4px;}
  .theme-orb-panel svg text{fill:var(--ink2);}

  /* Ripple-wipe: a fixed circle that grows from the orb's screen
     position, revealing the incoming theme's colors as one physical
     event instead of an instant CSS-variable snap. */
  .theme-wipe{
    position:fixed;inset:0;z-index:400;pointer-events:none;
    background:radial-gradient(circle at var(--orb-cx,100%) var(--orb-cy,100%), var(--wipe-gold), var(--wipe-bg) 55%);
    clip-path:circle(0% at var(--orb-cx,100%) var(--orb-cy,100%));
    animation:themeWipeGrow 0.76s var(--ease) forwards;
  }
  @keyframes themeWipeGrow{
    0%{clip-path:circle(0% at var(--orb-cx,100%) var(--orb-cy,100%));opacity:1;}
    60%{clip-path:circle(140% at var(--orb-cx,100%) var(--orb-cy,100%));opacity:1;}
    100%{clip-path:circle(150% at var(--orb-cx,100%) var(--orb-cy,100%));opacity:0;}
  }
  @media (prefers-reduced-motion: reduce){
    .theme-orb{animation:none;} .theme-wipe{display:none;}
  }

  /* ── Surah carousel (home page) ──────────────────────────────── */

  /* ── Play-surah + now-playing bar + per-ayah highlight ───────── */
  .surah-play-btn{
    display:flex;align-items:center;justify-content:center;gap:8px;width:100%;
    margin-top:10px;padding:12px;border-radius:12px;border:none;cursor:pointer;
    background:var(--accent);color:var(--on-accent);font-weight:600;
    font-family:'Hind Siliguri',sans-serif;font-size:0.9rem;
    transition:transform var(--dur-fast) var(--ease), box-shadow var(--dur-fast) ease;
    box-shadow:0 4px 14px var(--shadow);
  }
  .surah-play-btn:active{transform:scale(0.97);}

  .now-playing-bar{
    position:sticky;bottom:calc(64px + env(safe-area-inset-bottom,0px));left:0;right:0;z-index:150;
    display:flex;align-items:center;justify-content:space-between;gap:10px;
    background:var(--surface2);color:var(--text);border-top:1px solid var(--line);padding:10px 14px;
    animation:nowPlayingIn var(--dur-base) var(--ease);
  }
  @media(min-width:768px){.now-playing-bar{position:sticky;bottom:0;}}
  @keyframes nowPlayingIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
  .now-playing-info{display:flex;flex-direction:column;line-height:1.3;font-size:0.78rem;overflow:hidden;}
  .now-playing-surah{font-weight:700;color:var(--gold2);}
  .now-playing-ayah{font-family:monospace;font-size:0.66rem;opacity:0.75;}
  .now-playing-progress{font-size:0.6rem;opacity:0.6;}
  .now-playing-controls{display:flex;gap:4px;flex-shrink:0;}
  .now-playing-controls button{width:30px;height:30px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--text);cursor:pointer;transition:background var(--dur-fast) ease;}
  .now-playing-controls button:hover{background:var(--surface);}
  .now-playing-controls button:disabled{opacity:0.35;cursor:default;}

  .surah-ayah-row{transition:background var(--dur-base) ease, box-shadow var(--dur-base) ease;}
  .surah-ayah-row.ayah-active{background:linear-gradient(90deg,color-mix(in srgb, var(--gold) 14%, transparent),transparent);box-shadow:inset 3px 0 0 var(--gold);}
  .surah-ayah-row.ayah-next{background:color-mix(in srgb, var(--gold) 5%, transparent);}
  .surah-ayah-row.ayah-active .surah-ayah-ar{color:var(--gold2);}

  /* ── Read Mode ────────────────────────────────────────────────── */
  .readmode{position:fixed;inset:0;z-index:260;background:var(--bg);overflow-y:auto;animation:pageIn var(--dur-base) var(--ease);}
  .readmode-close{position:absolute;top:16px;right:16px;z-index:2;width:34px;height:34px;border-radius:50%;border:1px solid var(--border);background:var(--bg3);color:var(--ink2);cursor:pointer;font-size:0.9rem;}

  .book-cover{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;background:linear-gradient(160deg,var(--surface2),var(--bg) 70%);}
  .book-cover-frame{position:absolute;inset:24px;pointer-events:none;}
  .book-cover-frame svg{width:100%;height:100%;}
  .book-cover-content{position:relative;text-align:center;color:var(--text);max-width:340px;}
  .book-cover-ar{font-family:'Aref Ruqaa',serif;font-size:3.4rem;color:var(--accent);line-height:1.2;margin-bottom:8px;}
  .book-cover-en{font-family:'Reem Kufi',sans-serif;font-size:1.3rem;color:var(--text);opacity:0.92;}
  .book-cover-bn{font-size:0.9rem;color:var(--muted);margin-top:2px;}
  .book-cover-meta{display:flex;justify-content:center;gap:8px;font-size:0.72rem;color:color-mix(in srgb, var(--gold) 80%, transparent);margin:14px 0 26px;}
  .book-cover-dot{opacity:0.5;}
  .book-cover-begin{
    font-family:'Hind Siliguri',sans-serif;font-weight:600;font-size:0.88rem;
    padding:12px 26px;border-radius:30px;border:1.5px solid var(--accent);background:transparent;color:var(--accent);
    cursor:pointer;transition:background var(--dur-fast) ease, color var(--dur-fast) ease, transform var(--dur-fast) var(--ease);
  }
  .book-cover-begin:hover{background:var(--accent);color:var(--on-accent);transform:translateY(-2px);}

  .readmode-reading{display:flex;flex-direction:column;height:100vh;height:100dvh;}
  .reader-topbar{display:flex;align-items:center;justify-content:center;gap:10px;padding:14px 56px 6px 16px;position:relative;flex-shrink:0;}
  .reader-titles{display:flex;flex-direction:column;align-items:center;line-height:1.2;text-align:center;min-width:0;}
  .reader-title-ar{font-family:'Aref Ruqaa',serif;font-size:1.2rem;color:var(--green);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}
  .reader-title-en{font-size:0.66rem;color:var(--ink3);}
  .reader-controls-row{display:flex;align-items:center;gap:8px;padding:0 16px 10px;flex-shrink:0;}
  .reader-lang-toggle{position:relative;display:flex;gap:3px;flex-shrink:0;background:var(--bg2);border-radius:20px;padding:3px;isolation:isolate;}
  .reader-lang-thumb{
    position:absolute;top:3px;left:3px;bottom:3px;width:calc((100% - 6px) / 3);border-radius:16px;
    background:var(--accent);
    box-shadow:0 2px 8px var(--shadow);z-index:0;
    transform:translateX(calc(var(--active-index, 0) * 100%));
    transition:transform var(--dur-base) cubic-bezier(.34,1.56,.64,1);
  }
  .reader-lang-pill{position:relative;z-index:1;font-size:0.62rem;font-weight:700;padding:4px 10px;border-radius:16px;border:none;background:none;color:var(--ink3);cursor:pointer;transition:color var(--dur-fast) ease, transform var(--dur-fast) ease;}
  .reader-lang-pill:active{transform:scale(0.88);}
  .reader-lang-pill.active{color:var(--on-accent);}
  @media (prefers-reduced-motion: reduce){.reader-lang-thumb{transition:none;}}

  .reader-play-btn{
    flex:1;min-width:0;padding:11px;border-radius:12px;border:none;cursor:pointer;
    background:var(--accent);color:var(--on-accent);font-weight:600;font-size:0.86rem;
    font-family:'Hind Siliguri',sans-serif;
  }

  .reader-surface{position:relative;flex:1;overflow-y:auto;padding:8px 20px 20px;}
  .reader-cursor-glow{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity var(--dur-base) ease;}
  @media(hover:hover){
    .reader-surface:hover .reader-cursor-glow{opacity:1;}
    .reader-cursor-glow{background:radial-gradient(circle 180px at var(--cursor-x,50%) var(--cursor-y,50%), color-mix(in srgb, var(--gold) 10%, transparent), transparent 70%);}
  }
  .reader-page{animation:pageFlip var(--dur-slow) var(--ease);}
  @keyframes pageFlip{from{opacity:0;transform:rotateY(6deg) translateX(10px);}to{opacity:1;transform:rotateY(0) translateX(0);}}
  .reader-ayah{
    padding:16px 4px;border-bottom:1px solid var(--border);cursor:pointer;border-radius:8px;
    transition:background var(--dur-base) ease, transform var(--dur-fast) ease;
  }
  .reader-ayah-ar{display:block;font-family:'UthmanNaskh',serif;font-size:1.9rem;line-height:2.5;direction:rtl;text-align:right;color:var(--ink);}
  .reader-ayah-num{font-family:monospace;font-size:0.6rem;color:var(--gold);}
  .reader-ayah-trans{margin-top:8px;font-size:0.82rem;color:var(--ink2);line-height:1.75;}
  .reader-ayah-active{background:linear-gradient(90deg,color-mix(in srgb, var(--gold) 16%, transparent),transparent);}
  .reader-ayah-active .reader-ayah-ar{color:var(--gold2);}
  .reader-ayah-next{background:color-mix(in srgb, var(--gold) 5%, transparent);}
  .reader-ayah-next .reader-ayah-ar{text-decoration:underline;text-decoration-color:color-mix(in srgb, var(--gold) 40%, transparent);text-underline-offset:6px;}

  .reader-pager{display:flex;align-items:center;justify-content:center;gap:18px;padding:10px;flex-shrink:0;border-top:1px solid var(--border);}
  .reader-pager button{width:36px;height:36px;border-radius:50%;border:1px solid var(--border);background:var(--bg3);color:var(--ink2);font-size:1.1rem;cursor:pointer;}
  .reader-pager button:disabled{opacity:0.3;cursor:default;}
  .reader-pager-count{font-size:0.72rem;color:var(--ink3);font-family:monospace;}

  /* ── Lang pill toggle (topnav) ───────────────────────────── */

  /* ── Share-card export (multi-template) ──────────────────────── */
  .share-style-row{display:flex;gap:8px;margin:4px 0 14px;overflow-x:auto;padding-bottom:2px;}
  .share-style-swatch{
    width:34px;height:34px;border-radius:50%;flex-shrink:0;border:2px solid transparent;
    cursor:pointer;transition:transform var(--dur-fast) var(--ease), box-shadow var(--dur-fast) ease;
  }
  .share-style-swatch:hover{transform:scale(1.1);}
  .share-style-swatch.active{box-shadow:0 0 0 2px var(--bg3), 0 0 0 4px var(--gold);transform:scale(1.08);}
  .share-actions-row{display:flex;gap:10px;margin-top:14px;}

  /* ── Glass-card primitive (used by Journey + future re-skin) ─── */
  .glass-card{
    background:var(--surface);
    border:1px solid var(--line);border-radius:18px;
  }

  /* ── Journey page ─────────────────────────────────────────────── */
  .journey-page{padding-bottom:8px;}
  .journey-hero{padding:22px 20px 26px;text-align:center;position:relative;overflow:hidden;}
  .journey-hello{font-family:'Hind Siliguri',sans-serif;font-size:1.5rem;color:var(--gold2);margin-bottom:4px;}
  .journey-sub{font-size:0.82rem;color:var(--ink3);max-width:320px;margin:0 auto 16px;line-height:1.5;}
  .journey-stats-row{display:flex;gap:10px;margin-bottom:20px;}
  .journey-stat{flex:1;padding:12px;text-align:center;}
  .journey-stat-label{display:flex;align-items:center;justify-content:center;gap:5px;font-size:0.68rem;color:var(--ink3);text-transform:uppercase;letter-spacing:0.04em;}
  .journey-stat-num{font-family:'Hind Siliguri',sans-serif;font-size:1.6rem;color:var(--ink);margin-top:4px;}
  .journey-ring-wrap{position:relative;width:176px;height:176px;margin:0 auto;display:grid;place-items:center;}
  .journey-ring-glow{position:absolute;inset:-20px;border-radius:50%;background:radial-gradient(circle, var(--gold) 0%, transparent 70%);opacity:0.18;filter:blur(18px);animation:orbPulse 4s ease-in-out infinite;}
  .ring-track{stroke:var(--border);}
  .ring-fill{stroke:var(--gold);transition:stroke-dashoffset 0.8s var(--ease);}
  .journey-ring-center{position:absolute;display:flex;flex-direction:column;align-items:center;}
  .journey-ring-pct{font-family:'Hind Siliguri',sans-serif;font-size:1.8rem;color:var(--ink);}
  .journey-ring-label{font-size:0.62rem;color:var(--ink3);text-transform:uppercase;letter-spacing:0.05em;margin-top:2px;}

  .pinned-verse-card{padding:16px;margin-bottom:10px;border-left:3px solid var(--gold);}
  .pinned-verse-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
  .pinned-verse-badge{font-size:0.68rem;font-weight:700;color:var(--gold2);text-transform:uppercase;letter-spacing:0.03em;}
  .pinned-verse-actions{display:flex;gap:8px;}
  .pinned-verse-actions button{width:30px;height:30px;border-radius:50%;border:1px solid var(--border);background:transparent;color:var(--ink2);cursor:pointer;display:grid;place-items:center;transition:background var(--dur-fast) ease;}
  .pinned-verse-actions button:hover{background:var(--bg2);}
  .pinned-verse-ar{font-family:'UthmanNaskh',serif;font-size:1.4rem;direction:rtl;text-align:right;color:var(--ink);line-height:1.9;margin-bottom:8px;}
  .pinned-verse-trans{font-size:0.82rem;color:var(--ink3);line-height:1.6;}

  /* ══════════════════════════════════════════════════════════════
     MOBILE APP-FEEL PASS — the concrete "shrunk desktop website"
     tells on phones were: an actual HTML <table> for verse info,
     flat 1px-hairline cards with no elevation, and small
     hover-tuned tap targets. Fixed here without touching any JSX.
     ══════════════════════════════════════════════════════════════ */

  /* Info table -> label/value stat chips, no table chrome at all */
  .info-table, .info-table tbody{display:block;border:none;}
  .info-table{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;}
  .info-table tbody{display:contents;}
  .info-table tr{display:flex;flex-direction:column;background:color-mix(in srgb, var(--bg2) 60%, transparent);border:1px solid var(--border);border-radius:10px;padding:8px 10px;}
  .info-table tr:last-child:nth-child(odd){grid-column:1 / -1;}
  .info-lbl, .info-val{display:block;padding:0!important;}
  .info-lbl{font-size:0.6rem;letter-spacing:0.05em;text-transform:uppercase;white-space:normal;}
  .info-val{margin-top:2px;font-size:0.9rem;}


  /* Bigger, more comfortable touch targets on phones */
  @media(max-width:767.98px){
    .action-btn, .chip{padding:8px 15px;font-size:0.8rem;min-height:38px;display:inline-flex;align-items:center;}
    .action-btn-sm{padding:7px 14px;font-size:0.76rem;min-height:36px;display:inline-flex;align-items:center;}
    
    .surah-ayah-expand{padding:10px;min-width:36px;min-height:36px;display:flex;align-items:center;justify-content:center;}
    .tab{padding:8px 4px;min-height:52px;}
  }

  /* ── Book Mode library shelf ──────────────────────────────────── */
  .book-shelf{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px;padding:0 18px 24px;}
  .book-spine{
    aspect-ratio:2/3;display:flex;flex-direction:column;align-items:center;justify-content:center;
    gap:6px;padding:14px 8px;border:1px solid var(--border);border-radius:10px 14px 14px 10px;
    cursor:pointer;position:relative;overflow:hidden;
    transition:transform var(--dur-base) var(--ease), box-shadow var(--dur-base) ease;
  }
  .book-spine::before{content:"";position:absolute;left:0;top:0;bottom:0;width:6px;background:linear-gradient(180deg,var(--gold),var(--gold2));}
  .book-spine:hover, .book-spine:active{transform:translateY(-3px) rotate(-0.5deg);box-shadow:0 10px 24px var(--shadow);}
  .book-spine-num{font-family:monospace;font-size:0.62rem;color:var(--gold);}
  .book-spine-ar{font-family:'UthmanNaskh',serif;font-size:1.3rem;color:var(--green);direction:rtl;text-align:center;}
  .book-spine-en{font-family:'Hind Siliguri',sans-serif;font-size:0.7rem;color:var(--ink);text-align:center;}
  .book-spine-meta{font-size:0.58rem;color:var(--ink3);}
  .book-spine.skeleton::before{display:none;}

  /* ── 3D book shelf (Read Mode reboot) ─────────────────────────── */
  .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}
  .book-shelf-3d-stage{position:relative;height:calc(100vh - 160px);min-height:420px;border-radius:16px;overflow:hidden;background:#e9dfcb;}
  .book-shelf-3d-loading{padding:0 18px;}
  .book-shelf-3d-skeleton{height:calc(100vh - 220px);min-height:380px;border-radius:16px;}
  .book-shelf-3d-chrome{position:absolute;inset:0;pointer-events:none;}
  .book-shelf-3d-chrome > *{pointer-events:auto;}
  .book-shelf-3d-nav{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;
    border:1px solid var(--border);background:var(--bg2);color:var(--ink);font-size:1.4rem;line-height:1;cursor:pointer;
    display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px var(--shadow);}
  .book-shelf-3d-nav-prev{left:12px;}
  .book-shelf-3d-nav-next{right:12px;}
  .book-shelf-3d-label{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;
    padding:10px 16px;border-radius:14px;max-width:calc(100% - 100px);}
  .book-shelf-3d-label-num{font-family:monospace;font-size:0.68rem;color:var(--gold);}
  .book-shelf-3d-label-ar{font-family:'UthmanNaskh',serif;font-size:1.15rem;color:var(--green);}
  .book-shelf-3d-label-en{font-family:'Hind Siliguri',sans-serif;font-size:0.72rem;color:var(--ink3);}
  .book-shelf-3d-open-btn{margin-inline-start:6px;padding:7px 14px;border-radius:999px;border:none;background:var(--accent);color:var(--on-accent);font-size:0.7rem;font-weight:600;cursor:pointer;}
  .book-shelf-3d-detail-bar{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);display:flex;align-items:center;gap:12px;
    padding:10px 14px;border-radius:14px;max-width:calc(100% - 32px);}
  .book-shelf-3d-close{width:32px;height:32px;border-radius:50%;border:1px solid var(--border);background:var(--bg2);color:var(--ink);cursor:pointer;}
  .book-shelf-3d-detail-title{display:flex;flex-direction:column;gap:1px;}
  @media(max-width:767.98px){
    .book-shelf-3d-stage{height:calc(100vh - 130px);border-radius:0;}
    .book-shelf-3d-label,.book-shelf-3d-detail-bar{bottom:12px;}
  }
  .book-cover-3d-stage{position:relative;width:100%;height:100%;}
  .book-cover-3d-skeleton{position:absolute;inset:0;border-radius:0;}
  .book-cover-3d-chrome{position:absolute;left:50%;bottom:32px;transform:translateX(-50%);text-align:center;padding:18px 28px;border-radius:18px;max-width:min(420px,88vw);}

  .readmode-3d{position:fixed;inset:0;z-index:260;background:var(--bg);}
  .readmode-3d .book-cover-3d-stage{position:absolute;inset:0;width:100%;height:100%;}
  .reader-3d-topbar{position:absolute;top:16px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;
    padding:8px 16px;border-radius:16px;max-width:calc(100% - 90px);flex-wrap:wrap;justify-content:center;}
  .reader-3d-pager{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);display:flex;align-items:center;gap:16px;padding:8px 16px;border-radius:999px;}
  .reader-3d-pager button{width:32px;height:32px;border-radius:50%;border:1px solid var(--border);background:var(--bg3);color:var(--ink2);font-size:1.05rem;cursor:pointer;}
  @media(max-width:767.98px){
    .reader-3d-topbar{top:12px;gap:8px;}
    .reader-3d-pager{bottom:12px;}
  }
`;
