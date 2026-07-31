export const QURAN_API      = "https://api.quran.com/api/v4";
export const AUDIO_BASE     = "https://cdn.islamic.network/quran/audio/128/ar.alafasy";
export const TAFSIR_BN      = 165;  // তাফসীর আহসানুল বায়ান
export const TAFSIR_EN      = 169;  // Tafsir Ibn Kathir
export const TRANSLATION_EN = 131;  // Dr. Mustafa Khattab
export const TRANSLATION_BN = 161;  // মুহিউদ্দীন খান
export const TOTAL_AYAT     = 6236;

// ── Themes: the 5 waqt (prayer-time) palette ─────────────────────
// Chromatic progression across the day, engineered for eye comfort
// (see design notes): Fajr's pre-dawn mist -> Zuhr's sky-grounded
// zenith gold -> Asr's amber/copper afternoon -> Maghrib's coral/
// violet dusk -> Isha's midnight navy/gold. Each stage's anchor
// colors come straight from the palette brief; the rest of the
// variable set is derived to stay tonally continuous with its
// neighbours so the arc reads as one unbroken sky, not five
// unrelated swatches.
export const THEMES = {
  fajr: {
    name: "ফজর",
    nameEn: "Fajr",
    "--bg":        "#ece6da",
    "--bg2":       "#dfd6c4",
    "--bg3":       "#fffdf8",
    "--ink":       "#20272f",
    "--ink2":      "#3b4856",
    "--ink3":      "#6e7885",
    "--gold":      "#b49b76",
    "--gold2":     "#d2ba92",
    "--green":     "#33574a",
    "--green2":    "#47705f",
    "--border":    "rgba(59,72,86,0.18)",
    "--shadow":    "rgba(35,43,51,0.10)",
    "--warn":      "#7c4a2e",
    "--warn-bg":   "#fbf3e9",
    "--pattern":   "rgba(59,72,86,0.05)",
  },
  zuhr: {
    name: "যুহর",
    nameEn: "Zuhr",
    "--bg":        "#f7f2e1",
    "--bg2":       "#efe4c4",
    "--bg3":       "#ffffff",
    "--ink":       "#12293c",
    "--ink2":      "#2c5e8a",
    "--ink3":      "#5a82a0",
    "--gold":      "#d9a83b",
    "--gold2":     "#f3ca63",
    "--green":     "#1f6b4a",
    "--green2":    "#2e8b63",
    "--border":    "rgba(44,94,138,0.20)",
    "--shadow":    "rgba(22,50,74,0.12)",
    "--warn":      "#7c3a0e",
    "--warn-bg":   "#fff7ed",
    "--pattern":   "rgba(44,94,138,0.05)",
  },
  asr: {
    name: "আসর",
    nameEn: "Asr",
    "--bg":        "#f5e4ce",
    "--bg2":       "#ead0ae",
    "--bg3":       "#fffbf5",
    "--ink":       "#341a0f",
    "--ink2":      "#6b3420",
    "--ink3":      "#9c6a4e",
    "--gold":      "#d9822b",
    "--gold2":     "#e8a34f",
    "--green":     "#3e5c34",
    "--green2":    "#547a46",
    "--border":    "rgba(156,67,40,0.22)",
    "--shadow":    "rgba(59,31,18,0.14)",
    "--warn":      "#7c2a0e",
    "--warn-bg":   "#fff3ea",
    "--pattern":   "rgba(217,130,43,0.06)",
  },
  maghrib: {
    name: "মাগরিব",
    nameEn: "Maghrib",
    "--bg":        "#2a1e2b",
    "--bg2":       "#35263a",
    "--bg3":       "#402e46",
    "--ink":       "#f3e6e2",
    "--ink2":      "#e0c2bc",
    "--ink3":      "#a98a93",
    "--gold":      "#c85250",
    "--gold2":     "#e0776f",
    "--green":     "#3f6b57",
    "--green2":    "#578c73",
    "--border":    "rgba(200,82,80,0.22)",
    "--shadow":    "rgba(20,10,20,0.45)",
    "--warn":      "#f0a87c",
    "--warn-bg":   "rgba(240,168,124,0.12)",
    "--pattern":   "rgba(200,82,80,0.06)",
  },
  isha: {
    name: "এশা",
    nameEn: "Isha",
    "--bg":        "#0f172a",
    "--bg2":       "#16213a",
    "--bg3":       "#1e2b47",
    "--ink":       "#f1ead9",
    "--ink2":      "#c9bfa0",
    "--ink3":      "#7c8698",
    "--gold":      "#eab308",
    "--gold2":     "#f4c430",
    "--green":     "#34b27a",
    "--green2":    "#4ccb90",
    "--border":    "rgba(234,179,8,0.18)",
    "--shadow":    "rgba(0,0,0,0.55)",
    "--warn":      "#f0a868",
    "--warn-bg":   "rgba(240,168,104,0.08)",
    "--pattern":   "rgba(234,179,8,0.04)",
  },
};

// Order matters: this is the sequence the sun-path arc and the
// corner orb's cycle button follow, left (dawn) to right (night).
export const WAQT_ORDER = ["fajr", "zuhr", "asr", "maghrib", "isha"];

// Angle (degrees) of each waqt's node along the semicircular arc,
// measured like a protractor sitting on the horizon: 180 deg = far
// left (Fajr), 90 deg = the top of the arc, 0 deg = far right (Isha).
export const WAQT_ANGLES = { fajr: 180, zuhr: 135, asr: 90, maghrib: 45, isha: 0 };

export const THEME_ICONS = { fajr: "🌅", zuhr: "☀️", asr: "🌤️", maghrib: "🌇", isha: "🌙" };

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
