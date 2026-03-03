const KEYS = {
  BOOKMARKS: "hadi_bookmarks",
  RECENT:    "hadi_recent",
  THEME:     "hadi_theme",
  FIRST:     "hadi_first_visit",
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
  return localStorage.getItem(KEYS.THEME) || "noor";
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
