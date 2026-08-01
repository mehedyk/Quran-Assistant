const KEYS = {
  BOOKMARKS: "hadi_bookmarks",
  RECENT:    "hadi_recent",
  THEME:     "hadi_theme",
  FIRST:     "hadi_first_visit",
  SIDEBAR:   "hadi_sidebar_collapsed",
  READ_LANG: "hadi_read_lang",
  VERSES_READ: "hadi_verses_read",
  ACTIVE_DAYS: "hadi_active_days",
};

// ── Bookmarks ────────────────────────────────────────────────────
export function getBookmarks() {
  try { return JSON.parse(localStorage.getItem(KEYS.BOOKMARKS) || "[]"); }
  catch { return []; }
}

export function addBookmark(ayah) {
  const list = getBookmarks().filter(b => b.key !== ayah.key);
  list.unshift({ key: ayah.key, surah: ayah.surah, ayahNum: ayah.ayah, surahName: ayah.surahName, arabic: ayah.arabic, bengali: ayah.bengali, savedAt: Date.now() });
  localStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(list.slice(0, 100)));
}

export function removeBookmark(key) {
  const list = getBookmarks().filter(b => b.key !== key);
  localStorage.setItem(KEYS.BOOKMARKS, JSON.stringify(list));
}

export function isBookmarked(key) {
  return getBookmarks().some(b => b.key === key);
}

// ── Recent Searches ──────────────────────────────────────────────
export function getRecentSearches() {
  try { return JSON.parse(localStorage.getItem(KEYS.RECENT) || "[]"); }
  catch { return []; }
}

export function addRecentSearch(query) {
  const list = getRecentSearches().filter(q => q !== query);
  list.unshift(query);
  localStorage.setItem(KEYS.RECENT, JSON.stringify(list.slice(0, 15)));
}

// ── Theme ────────────────────────────────────────────────────────
export function getSavedTheme() {
  return localStorage.getItem(KEYS.THEME) || "dhuhr";
}

export function saveTheme(theme) {
  localStorage.setItem(KEYS.THEME, theme);
}

// ── First Visit ──────────────────────────────────────────────────
export function isFirstVisit() {
  const v = !localStorage.getItem(KEYS.FIRST);
  if (v) localStorage.setItem(KEYS.FIRST, "1");
  return v;
}

// ── Sidebar collapse state ───────────────────────────────────────
export function getSavedSidebarState() {
  return localStorage.getItem(KEYS.SIDEBAR) === "1";
}

export function saveSidebarState(collapsed) {
  localStorage.setItem(KEYS.SIDEBAR, collapsed ? "1" : "0");
}

// ── Read Mode translation-strip language ─────────────────────────
// "off" | "bn" | "en" — which translation (if any) shows beneath
// the Arabic in the book reader.
export function getSavedReadLang() {
  return localStorage.getItem(KEYS.READ_LANG) || "off";
}

export function saveReadLang(v) {
  localStorage.setItem(KEYS.READ_LANG, v);
}

// ── Journey stats: distinct verses read + distinct active days ───
// Both stored as JSON arrays acting as dedup sets — simple counters,
// not a rigorous reading tracker, just enough for the Journey page's
// progress ring and stat chips.
export function recordVerseRead(key) {
  try {
    const set = new Set(JSON.parse(localStorage.getItem(KEYS.VERSES_READ) || "[]"));
    set.add(key);
    localStorage.setItem(KEYS.VERSES_READ, JSON.stringify([...set]));
  } catch { /* storage unavailable — skip silently */ }
}

export function getVersesReadCount() {
  try { return new Set(JSON.parse(localStorage.getItem(KEYS.VERSES_READ) || "[]")).size; }
  catch { return 0; }
}

export function recordActiveDay() {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const set = new Set(JSON.parse(localStorage.getItem(KEYS.ACTIVE_DAYS) || "[]"));
    set.add(today);
    localStorage.setItem(KEYS.ACTIVE_DAYS, JSON.stringify([...set]));
  } catch { /* storage unavailable — skip silently */ }
}

export function getActiveDaysCount() {
  try { return new Set(JSON.parse(localStorage.getItem(KEYS.ACTIVE_DAYS) || "[]")).size; }
  catch { return 0; }
}
