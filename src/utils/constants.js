export const QURAN_API      = "https://api.quran.com/api/v4";
export const AUDIO_BASE     = "https://cdn.islamic.network/quran/audio/128/ar.alafasy";
export const TAFSIR_BN      = 165;  // তাফসীর আহসানুল বায়ান
export const TAFSIR_EN      = 169;  // Tafsir Ibn Kathir
export const TRANSLATION_EN = 131;  // Dr. Mustafa Khattab
export const TRANSLATION_BN = 161;  // মুহিউদ্দীন খান
export const TOTAL_AYAT     = 6236;

// ── Themes: the 5 waqt (prayer-time) palette ─────────────────────
// Source of truth: the "Al Hadi remake" Figma file. Each waqt has its
// own frame; layout is identical across all five, only these colour
// roles change:
//   fajr    -> dark teal / green      dhuhr -> light
//   asr     -> warm beige / cream     maghrib -> dark purple
//   isha    -> dark navy / blue
//
// Two groups of CSS variables are set on <html> by useTheme.js:
//   1. The semantic Figma tokens  (--surface, --line, --text, --muted,
//      --accent, --on-accent, ...) which the redesigned shell and Home
//      page use directly.
//   2. The LEGACY names (--bg2, --bg3, --ink*, --gold*, --green*, --fill,
//      --border) remapped onto the same palette, so every pre-existing
//      component (Read Mode, Journey, Share card modal, Ask, About ...)
//      re-themes without being rewritten.
export const THEMES = {
  fajr: {
    name: "ফজর",
    nameEn: "Fajr",
    tagline: "ভোরের প্রশান্তি",
    taglineEn: "Dawn calm",
    isDark: true,
    // ── Figma design tokens (Al Hadi remake.fig, "Fajr" frame) ──
    "--bg":        "#101f26",   // page background
    "--surface":   "#172b33",   // panels, cards, nav pill, inputs' container
    "--surface2":  "#1e363f",   // raised: chips, active card, secondary buttons
    "--line":      "#30464c",   // borders and dividers
    "--text":      "#f1f0e7",   // headings and primary text
    "--muted":     "#aabbb9",   // secondary text
    "--accent":    "#b8dcca",   // primary buttons, active states, links
    "--on-accent": "#102a26",   // text/icons on --accent
    "--accent-hover": "#c3e0d0",
    "--ornament":  "#d6be8b",   // fine decorative detail (arch rule, caption)
    "--danger":    "#f4a29b",
    "--danger-bg": "rgba(244,162,155,0.12)",
    // ── Legacy names, remapped so every existing component re-themes ──
    "--bg2":       "#1e363f",
    "--bg3":       "#172b33",
    "--ink":       "#f1f0e7",
    "--ink2":      "#d1d8d2",
    "--ink3":      "#aabbb9",
    "--gold":      "#b8dcca",
    "--gold2":     "#b8dcca",
    "--green":     "#b8dcca",
    "--green2":    "#c3e0d0",
    "--fill":      "#b8dcca",
    "--border":    "#30464c",
    "--shadow":    "rgba(0,0,0,0.45)",
    "--warn":      "#f0a868",
    "--warn-bg":   "rgba(240,168,104,0.1)",
    "--pattern":   "rgba(184,220,202,0.05)",
  },
  dhuhr: {
    name: "যুহর",
    nameEn: "Dhuhr",
    tagline: "দিনের স্বচ্ছতা",
    taglineEn: "Midday clarity",
    isDark: false,
    // ── Figma design tokens (Al Hadi remake.fig, "Dhuhr" frame) ──
    "--bg":        "#f6f8f4",   // page background
    "--surface":   "#ffffff",   // panels, cards, nav pill, inputs' container
    "--surface2":  "#e8eee8",   // raised: chips, active card, secondary buttons
    "--line":      "#d5dfd9",   // borders and dividers
    "--text":      "#1f3439",   // headings and primary text
    "--muted":     "#5d7277",   // secondary text
    "--accent":    "#2c697a",   // primary buttons, active states, links
    "--on-accent": "#ffffff",   // text/icons on --accent
    "--accent-hover": "#295e6d",
    "--ornament":  "#796234",   // fine decorative detail (arch rule, caption)
    "--danger":    "#b3261e",
    "--danger-bg": "rgba(179,38,30,0.1)",
    // ── Legacy names, remapped so every existing component re-themes ──
    "--bg2":       "#e8eee8",
    "--bg3":       "#ffffff",
    "--ink":       "#1f3439",
    "--ink2":      "#3b5055",
    "--ink3":      "#5d7277",
    "--gold":      "#2c697a",
    "--gold2":     "#2c697a",
    "--green":     "#2c697a",
    "--green2":    "#295e6d",
    "--fill":      "#2c697a",
    "--border":    "#d5dfd9",
    "--shadow":    "rgba(31,52,57,0.1)",
    "--warn":      "#b91c1c",
    "--warn-bg":   "rgba(185,28,28,0.09)",
    "--pattern":   "rgba(44,105,122,0.06)",
  },
  asr: {
    name: "আসর",
    nameEn: "Asr",
    tagline: "বিকেলের উষ্ণতা",
    taglineEn: "Afternoon warmth",
    isDark: false,
    // ── Figma design tokens (Al Hadi remake.fig, "Asr" frame) ──
    "--bg":        "#fbf3e5",   // page background
    "--surface":   "#fffaf1",   // panels, cards, nav pill, inputs' container
    "--surface2":  "#f1e4cf",   // raised: chips, active card, secondary buttons
    "--line":      "#deceb5",   // borders and dividers
    "--text":      "#473829",   // headings and primary text
    "--muted":     "#7a6852",   // secondary text
    "--accent":    "#885c37",   // primary buttons, active states, links
    "--on-accent": "#fff9ef",   // text/icons on --accent
    "--accent-hover": "#7b5534",
    "--ornament":  "#8b632b",   // fine decorative detail (arch rule, caption)
    "--danger":    "#b3261e",
    "--danger-bg": "rgba(179,38,30,0.1)",
    // ── Legacy names, remapped so every existing component re-themes ──
    "--bg2":       "#f1e4cf",
    "--bg3":       "#fffaf1",
    "--ink":       "#473829",
    "--ink2":      "#5e4e3b",
    "--ink3":      "#7a6852",
    "--gold":      "#885c37",
    "--gold2":     "#885c37",
    "--green":     "#885c37",
    "--green2":    "#7b5534",
    "--fill":      "#885c37",
    "--border":    "#deceb5",
    "--shadow":    "rgba(71,56,41,0.1)",
    "--warn":      "#7c2d12",
    "--warn-bg":   "rgba(124,45,18,0.09)",
    "--pattern":   "rgba(136,92,55,0.06)",
  },
  maghrib: {
    name: "মাগরিব",
    nameEn: "Maghrib",
    tagline: "গোধূলির মায়া",
    taglineEn: "Twilight charm",
    isDark: true,
    // ── Figma design tokens (Al Hadi remake.fig, "Maghrib" frame) ──
    "--bg":        "#281d32",   // page background
    "--surface":   "#33253e",   // panels, cards, nav pill, inputs' container
    "--surface2":  "#44304e",   // raised: chips, active card, secondary buttons
    "--line":      "#5a405e",   // borders and dividers
    "--text":      "#fff0e9",   // headings and primary text
    "--muted":     "#c7afc7",   // secondary text
    "--accent":    "#eeb2ad",   // primary buttons, active states, links
    "--on-accent": "#392233",   // text/icons on --accent
    "--accent-hover": "#f1beb9",
    "--ornament":  "#dab58e",   // fine decorative detail (arch rule, caption)
    "--danger":    "#f4a29b",
    "--danger-bg": "rgba(244,162,155,0.12)",
    // ── Legacy names, remapped so every existing component re-themes ──
    "--bg2":       "#44304e",
    "--bg3":       "#33253e",
    "--ink":       "#fff0e9",
    "--ink2":      "#e6d3da",
    "--ink3":      "#c7afc7",
    "--gold":      "#eeb2ad",
    "--gold2":     "#eeb2ad",
    "--green":     "#eeb2ad",
    "--green2":    "#f1beb9",
    "--fill":      "#eeb2ad",
    "--border":    "#5a405e",
    "--shadow":    "rgba(0,0,0,0.45)",
    "--warn":      "#f0a868",
    "--warn-bg":   "rgba(240,168,104,0.1)",
    "--pattern":   "rgba(238,178,173,0.05)",
  },
  isha: {
    name: "এশা",
    nameEn: "Isha",
    tagline: "রাতের নীরবতা",
    taglineEn: "Night stillness",
    isDark: true,
    // ── Figma design tokens (Al Hadi remake.fig, "Isha" frame) ──
    "--bg":        "#101524",   // page background
    "--surface":   "#192035",   // panels, cards, nav pill, inputs' container
    "--surface2":  "#232c46",   // raised: chips, active card, secondary buttons
    "--line":      "#35405c",   // borders and dividers
    "--text":      "#eff0fb",   // headings and primary text
    "--muted":     "#acb6d0",   // secondary text
    "--accent":    "#bac6f0",   // primary buttons, active states, links
    "--on-accent": "#171f39",   // text/icons on --accent
    "--accent-hover": "#c5cef2",
    "--ornament":  "#cdbd92",   // fine decorative detail (arch rule, caption)
    "--danger":    "#f4a29b",
    "--danger-bg": "rgba(244,162,155,0.12)",
    // ── Legacy names, remapped so every existing component re-themes ──
    "--bg2":       "#232c46",
    "--bg3":       "#192035",
    "--ink":       "#eff0fb",
    "--ink2":      "#d1d6e8",
    "--ink3":      "#acb6d0",
    "--gold":      "#bac6f0",
    "--gold2":     "#bac6f0",
    "--green":     "#bac6f0",
    "--green2":    "#c5cef2",
    "--fill":      "#bac6f0",
    "--border":    "#35405c",
    "--shadow":    "rgba(0,0,0,0.45)",
    "--warn":      "#f0a868",
    "--warn-bg":   "rgba(240,168,104,0.1)",
    "--pattern":   "rgba(186,198,240,0.05)",
  },
};

// Order matters: this is the sequence the sun-path arc and the
// corner orb's cycle button follow, left (dawn) to right (night).
export const WAQT_ORDER = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

// Angle (degrees) of each waqt's node along the semicircular arc,
// measured like a protractor sitting on the horizon: 180 deg = far
// left (Fajr), 90 deg = the top of the arc, 0 deg = far right (Isha).
export const WAQT_ANGLES = { fajr: 180, dhuhr: 135, asr: 90, maghrib: 45, isha: 0 };

export const THEME_ICONS = { fajr: "🌅", dhuhr: "☀️", asr: "🌤️", maghrib: "🌇", isha: "🌙" };

// ── Word → Arabic map ────────────────────────────────────────────
export const WORD_TO_ARABIC = {
  // Bengali
  "সবর":"صبر","ধৈর্য":"صبر",
  "সালাত":"صلاة","নামাজ":"صلاة","নামায":"صلاة",
  "জাকাত":"زكاة","যাকাত":"زكاة",
  "হজ":"حج","হজ্জ":"حج",
  "রোজা":"صوم","সিয়াম":"صيام","সওম":"صوم",
  "জান্নাত":"جنة","বেহেশত":"جنة",
  "জাহান্নাম":"جهنم","দোজখ":"جهنم",
  "তাকওয়া":"تقوى","পরহেজগারি":"تقوى",
  "ইলম":"علم","জ্ঞান":"علم",
  "দুয়া":"دعاء","দোয়া":"دعاء",
  "জিহাদ":"جهاد",
  "রহমত":"رحمة","দয়া":"رحمة","করুণা":"رحمة",
  "শুকর":"شكر","কৃতজ্ঞতা":"شكر",
  "তাওবা":"توبة","তওবা":"توبة",
  "হেদায়াত":"هداية","হিদায়াত":"هداية",
  "ঈমান":"إيمان","ইমান":"إيمان",
  "কুফর":"كفر","শিরক":"شرك",
  "আল্লাহ":"الله","রাসূল":"رسول",
  "নবী":"نبي","ফেরেশতা":"ملائكة",
  "কিয়ামত":"قيامة","কেয়ামত":"قيامة",
  "আখিরাত":"آخرة","দুনিয়া":"دنيا",
  "জুলুম":"ظلم","অত্যাচার":"ظلم",
  "ন্যায়":"عدل","ইনসাফ":"عدل",
  "ফাসাদ":"فساد","দুর্নীতি":"فساد",
  "শয়তান":"شيطان","ইবলিস":"إبليس",
  "মুসা":"موسى","ঈসা":"عيسى",
  "ইবরাহিম":"إبراهيم","মুহাম্মদ":"محمد",
  "নূহ":"نوح","ইউসুফ":"يوسف",
  "দাউদ":"داود","সুলায়মান":"سليمان",
  "মারিয়াম":"مريم","ভালোবাসা":"حب",
  "ভয়":"خوف","আশা":"رجاء",
  "সত্য":"حق","আলো":"نور","নূর":"نور",
  "হৃদয":"قلب","অন্তর":"قلب",
  "আত্মা":"نفس","নফস":"نفس",
  "সুদ":"ربا","রিবা":"ربا",
  "হালাল":"حلال","হারাম":"حرام",
  "ইসলাম":"إسلام","মুসলিম":"مسلم",
  "কুরআন":"قرآن","সুন্নাহ":"سنة",
  // English
  "sabr":"صبر","patience":"صبر",
  "salah":"صلاة","salat":"صلاة","prayer":"صلاة",
  "zakat":"زكاة","hajj":"حج",
  "sawm":"صوم","fasting":"صوم",
  "jannah":"جنة","paradise":"جنة",
  "jahannam":"جهنم","hell":"جهنم",
  "taqwa":"تقوى","piety":"تقوى",
  "knowledge":"علم","ilm":"علم",
  "dua":"دعاء","supplication":"دعاء",
  "jihad":"جهاد",
  "mercy":"رحمة","rahma":"رحمة",
  "gratitude":"شكر","shukr":"شكر",
  "repentance":"توبة","tawba":"توبة",
  "guidance":"هداية","hidayah":"هداية",
  "faith":"إيمان","iman":"إيمان",
  "disbelief":"كفر","kufr":"كفر",
  "shirk":"شرك","allah":"الله",
  "messenger":"رسول","prophet":"نبي",
  "angels":"ملائكة","qiyamah":"قيامة",
  "hereafter":"آخرة","akhirah":"آخرة",
  "world":"دنيا","dunya":"دنيا",
  "oppression":"ظلم","zulm":"ظلم",
  "justice":"عدل","adl":"عدل",
  "corruption":"فساد","fasad":"فساد",
  "satan":"شيطان","shaytan":"شيطان",
  "moses":"موسى","musa":"موسى",
  "jesus":"عيسى","isa":"عيسى",
  "abraham":"إبراهيم","ibrahim":"إبراهيم",
  "muhammad":"محمد","noah":"نوح","nuh":"نوح",
  "joseph":"يوسف","yusuf":"يوسف",
  "david":"داود","dawud":"داود",
  "solomon":"سليمان","sulayman":"سليمان",
  "mary":"مريم","maryam":"مريم",
  "love":"حب","fear":"خوف","hope":"رجاء",
  "truth":"حق","haqq":"حق",
  "light":"نور","noor":"نور",
  "heart":"قلب","qalb":"قلب",
  "soul":"نفس","nafs":"نفس",
  "usury":"ربا","riba":"ربا","interest":"ربا",
  "halal":"حلال","haram":"حرام",
  "quran":"قرآن","sunnah":"سنة","islam":"إسلام",
};

export function resolveSearchQuery(query) {
  const t = query.trim();
  const mapped = WORD_TO_ARABIC[t] || WORD_TO_ARABIC[t.toLowerCase()];
  if (mapped) return { resolved: mapped, mapped: true, original: t };
  if (/[\u0600-\u06FF]/.test(t)) return { resolved: t, mapped: false, original: t };
  return { resolved: t, mapped: false, original: t };
}

export function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<sup[^>]*>.*?<\/sup>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, "").replace(/\s+/g, " ").trim();
}

// Ayah of the Day — deterministic, same for everyone on same date
export function getAyahOfTheDay() {
  const today = new Date();
  const seed  = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const n     = ((seed * 2654435761) >>> 0) % TOTAL_AYAT;
  // Convert flat ayah index to surah:ayah
  // Simplified: use a known distribution
  const SURAH_LENGTHS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
  let remaining = n;
  for (let s = 0; s < SURAH_LENGTHS.length; s++) {
    if (remaining < SURAH_LENGTHS[s]) return { surah: s + 1, ayah: remaining + 1 };
    remaining -= SURAH_LENGTHS[s];
  }
  return { surah: 2, ayah: 255 };
}

// ── Digits ───────────────────────────────────────────────────────
// The Figma shows Bengali numerals (২:২৫৫, ১১৪টি সূরা). Display helpers
// convert to the active UI language; lookups accept either numeral set.
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export function localizeDigits(value, lang) {
  const str = String(value);
  return lang === "bn" ? str.replace(/\d/g, d => BN_DIGITS[d]) : str;
}
export function normalizeDigits(str) {
  return String(str).replace(/[০-৯]/g, d => String(BN_DIGITS.indexOf(d)));
}
