export const QURAN_API      = "https://api.quran.com/api/v4";
export const AUDIO_BASE     = "https://cdn.islamic.network/quran/audio/128/ar.alafasy";
export const TAFSIR_BN      = 165;  // তাফসীর আহসানুল বায়ান
export const TAFSIR_EN      = 169;  // Tafsir Ibn Kathir
export const TRANSLATION_EN = 131;  // Dr. Mustafa Khattab
export const TRANSLATION_BN = 161;  // মুহিউদ্দীন খান
export const TOTAL_AYAT     = 6236;

// ── Themes ──────────────────────────────────────────────────────
export const THEMES = {
  noor: {
    name: "নূর",
    nameEn: "Noor",
    "--bg":        "#f7f0e3",
    "--bg2":       "#ede4cc",
    "--bg3":       "#ffffff",
    "--ink":       "#1a1209",
    "--ink2":      "#4a3728",
    "--ink3":      "#7a6a58",
    "--gold":      "#b8832e",
    "--gold2":     "#d4a855",
    "--green":     "#1e4d30",
    "--green2":    "#2d6b44",
    "--border":    "rgba(184,131,46,0.25)",
    "--shadow":    "rgba(26,18,9,0.12)",
    "--warn":      "#7c3a0e",
    "--warn-bg":   "#fff7ed",
    "--pattern":   "rgba(184,131,46,0.06)",
  },
  layl: {
    name: "লায়ল",
    nameEn: "Layl",
    "--bg":        "#0d1f1a",
    "--bg2":       "#142820",
    "--bg3":       "#1c3328",
    "--ink":       "#f0e8d8",
    "--ink2":      "#c8b898",
    "--ink3":      "#8a7a65",
    "--gold":      "#c8963e",
    "--gold2":     "#e8b660",
    "--green":     "#4a9e6a",
    "--green2":    "#5db87c",
    "--border":    "rgba(200,150,62,0.2)",
    "--shadow":    "rgba(0,0,0,0.4)",
    "--warn":      "#e8a87c",
    "--warn-bg":   "rgba(232,168,124,0.1)",
    "--pattern":   "rgba(200,150,62,0.04)",
  },
  sabz: {
    name: "সবজ",
    nameEn: "Sabz",
    "--bg":        "#f0f7f2",
    "--bg2":       "#ddeee3",
    "--bg3":       "#ffffff",
    "--ink":       "#0d1f16",
    "--ink2":      "#1e4030",
    "--ink3":      "#4a7a5a",
    "--gold":      "#a06820",
    "--gold2":     "#c88a30",
    "--green":     "#1a5c34",
    "--green2":    "#227842",
    "--border":    "rgba(26,92,52,0.2)",
    "--shadow":    "rgba(13,31,22,0.1)",
    "--warn":      "#7c4a0e",
    "--warn-bg":   "#fff8ed",
    "--pattern":   "rgba(26,92,52,0.05)",
  },
};

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
