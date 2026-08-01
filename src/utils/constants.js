export const QURAN_API      = "https://api.quran.com/api/v4";
export const AUDIO_BASE     = "https://cdn.islamic.network/quran/audio/128/ar.alafasy";
export const TAFSIR_BN      = 165;  // তাফসীর আহসানুল বায়ান
export const TAFSIR_EN      = 169;  // Tafsir Ibn Kathir
export const TRANSLATION_EN = 131;  // Dr. Mustafa Khattab
export const TRANSLATION_BN = 161;  // মুহিউদ্দীন খান
export const TOTAL_AYAT     = 6236;

// ── Themes: the 5 waqt (prayer-time) palette ─────────────────────
// Adopted from the "Hadi Waqt Themes" / "Neo-Islamic Twilight" design
// package: each waqt supplies surface/primary/secondary/accent roles,
// mapped here as surface->--bg, accent->--ink (the high-contrast
// reading color), secondary->--gold (vivid highlight), primary->--green
// (secondary brand accent). Dhuhr and Asr are genuinely LIGHT themes —
// noon and afternoon are the brightest parts of the day — so the arc
// has real light/dark contrast as you sweep across it.
//
// Exception: Isha's own "secondary" (#1e293b) sits too close to its
// near-black surface to work as an interactive accent, so Isha borrows
// the design system's own Soft Gold / Celestial Teal pair instead of
// its literal spec values for --gold/--green.
export const THEMES = {
  fajr: {
    name: "ফজর",
    nameEn: "Fajr",
    "--bg":        "#0f172a",
    "--bg2":       "#16213a",
    "--bg3":       "#1c2b47",
    "--ink":       "#f1f5f9",
    "--ink2":      "#cbd5e1",
    "--ink3":      "#94a3b8",
    "--gold":      "#38bdf8",
    "--gold2":     "#7dd3fc",
    "--green":     "#94a3b8",
    "--green2":    "#b0bcc9",
    "--fill":      "#164e63",
    "--border":    "rgba(56,189,248,0.18)",
    "--shadow":    "rgba(0,0,0,0.50)",
    "--warn":      "#f0a868",
    "--warn-bg":   "rgba(240,168,104,0.08)",
    "--pattern":   "rgba(56,189,248,0.04)",
  },
  dhuhr: {
    name: "যুহর",
    nameEn: "Dhuhr",
    "--bg":        "#fffbeb",
    "--bg2":       "#fef3c7",
    "--bg3":       "#ffffff",
    "--ink":       "#78350f",
    "--ink2":      "#92400e",
    "--ink3":      "#b45309",
    "--gold":      "#f59e0b",
    "--gold2":     "#fbbf24",
    "--green":     "#92400e",
    "--green2":    "#b45309",
    "--fill":      "#78350f",
    "--border":    "rgba(146,64,14,0.18)",
    "--shadow":    "rgba(120,53,15,0.10)",
    "--warn":      "#b91c1c",
    "--warn-bg":   "#fff1e6",
    "--pattern":   "rgba(245,158,11,0.05)",
  },
  asr: {
    name: "আসর",
    nameEn: "Asr",
    "--bg":        "#fff7ed",
    "--bg2":       "#ffedd5",
    "--bg3":       "#fffbf5",
    "--ink":       "#431407",
    "--ink2":      "#c2410c",
    "--ink3":      "#9a3412",
    "--gold":      "#ea580c",
    "--gold2":     "#fb923c",
    "--green":     "#c2410c",
    "--green2":    "#f97316",
    "--fill":      "#7c2d12",
    "--border":    "rgba(234,88,12,0.22)",
    "--shadow":    "rgba(67,20,7,0.14)",
    "--warn":      "#7c2d12",
    "--warn-bg":   "#fff0e6",
    "--pattern":   "rgba(234,88,12,0.06)",
  },
  maghrib: {
    name: "মাগরিব",
    nameEn: "Maghrib",
    "--bg":        "#2d1b36",
    "--bg2":       "#382345",
    "--bg3":       "#452a54",
    "--ink":       "#fdf2f8",
    "--ink2":      "#f9d5e8",
    "--ink3":      "#d9a8c9",
    "--gold":      "#fb923c",
    "--gold2":     "#fdba74",
    "--green":     "#f472b6",
    "--green2":    "#f9a8d4",
    "--fill":      "#831843",
    "--border":    "rgba(244,114,182,0.22)",
    "--shadow":    "rgba(20,10,20,0.50)",
    "--warn":      "#fdba74",
    "--warn-bg":   "rgba(253,186,116,0.10)",
    "--pattern":   "rgba(244,114,182,0.06)",
  },
  isha: {
    name: "এশা",
    nameEn: "Isha",
    "--bg":        "#020617",
    "--bg2":       "#0a0f1f",
    "--bg3":       "#1e293b",
    "--ink":       "#f8fafc",
    "--ink2":      "#cbd5e1",
    "--ink3":      "#64748b",
    "--gold":      "#d4af37",
    "--gold2":     "#e8c968",
    "--green":     "#2dd4bf",
    "--green2":    "#5eead4",
    "--fill":      "#0f766e",
    "--border":    "rgba(212,175,55,0.18)",
    "--shadow":    "rgba(0,0,0,0.60)",
    "--warn":      "#f0a868",
    "--warn-bg":   "rgba(240,168,104,0.08)",
    "--pattern":   "rgba(212,175,55,0.04)",
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
