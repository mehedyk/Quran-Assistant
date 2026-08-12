// Converts Quran.com surah metadata (as returned by fetchAllSurahs /
// fetchSurahAyat's `meta`) into the `book` descriptor shape textures.js /
// bookRig.js expect. One deterministic cover per surah — same surah always
// looks the same across visits, no hand-authored art needed for all 114.

// A small rotation of motifs + a curated cloth/foil pair list, indexed by
// each surah's own seed so the whole shelf reads as one coherent "Hadi"
// edition (like a real matched set) rather than 114 random colors.
const MOTIF_KEYS = ["brackets", "paths", "caret", "orbits", "modules", "frames", "default"];
const CLOTH_FOIL_PAIRS = [
  { cloth: "#1f4d3d", foil: "#d4af37" }, // emerald / gold — primary Hadi identity
  { cloth: "#0f3b3a", foil: "#c9a24b" }, // deep teal / antique gold
  { cloth: "#2b3a52", foil: "#c7a869" }, // indigo / warm gold
  { cloth: "#3a2a1f", foil: "#c9a24b" }  // walnut brown / gold
];

const STANDARD_DIMENSIONS = { width: 0.62, height: 0.86, depth: 0.072 };

/**
 * @param {object} surahMeta - one entry from fetchAllSurahs(): { id, name_arabic, name_simple, translated_name, verses_count, revelation_place }
 * @returns {object} book descriptor for textures.js / bookRig.js / BookSceneEngine
 */
export function surahToBook(surahMeta) {
  const seed = `surah-${surahMeta.id}`;
  const paletteIndex = surahMeta.id % CLOTH_FOIL_PAIRS.length;
  const motifIndex = (surahMeta.id * 7) % MOTIF_KEYS.length; // *7 just to decorrelate from paletteIndex's own cycling

  return {
    seed,
    cloth: CLOTH_FOIL_PAIRS[paletteIndex].cloth,
    foil: CLOTH_FOIL_PAIRS[paletteIndex].foil,
    motifKey: MOTIF_KEYS[motifIndex],
    titleAr: surahMeta.name_arabic,
    titleSub: surahMeta.translated_name?.name || surahMeta.name_simple,
    eyebrow: "AL-HADI",
    ...STANDARD_DIMENSIONS,
    palette: {
      paperPale: "#e8e1d3",
      shelfDark: "#4a3222",
      inkSoft: "#5c4c37"
    },
    // Carried through unchanged so React-side code (nav, accessible labels,
    // "Begin Reading" transition) can get back to the real surah record
    // without re-deriving it from the seed string.
    surahId: surahMeta.id,
    verseCount: surahMeta.verses_count,
    revelationPlace: surahMeta.revelation_place
  };
}

export function surahsToBooks(surahList) {
  return surahList.map(surahToBook);
}
