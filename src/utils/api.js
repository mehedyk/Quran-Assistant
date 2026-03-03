import { QURAN_API, TAFSIR_BN, TAFSIR_EN, TRANSLATION_EN, TRANSLATION_BN, resolveSearchQuery } from './constants.js';

export async function fetchAyah(surah, ayah) {
  const [arabic, english, bengali, tafsirBn, tafsirEn] = await Promise.all([
    fetch(`${QURAN_API}/verses/by_key/${surah}:${ayah}?words=true&fields=text_uthmani`).then(r => r.json()),
    fetch(`${QURAN_API}/verses/by_key/${surah}:${ayah}?translations=${TRANSLATION_EN}`).then(r => r.json()),
    fetch(`${QURAN_API}/verses/by_key/${surah}:${ayah}?translations=${TRANSLATION_BN}`).then(r => r.json()),
    fetch(`${QURAN_API}/tafsirs/${TAFSIR_BN}/by_ayah/${surah}:${ayah}`).then(r => r.json()).catch(() => null),
    fetch(`${QURAN_API}/tafsirs/${TAFSIR_EN}/by_ayah/${surah}:${ayah}`).then(r => r.json()).catch(() => null),
  ]);

  // Also fetch surah name
  const surahData = await fetch(`${QURAN_API}/chapters/${surah}?language=en`).then(r => r.json()).catch(() => null);
  const surahName = surahData?.chapter?.name_simple || "";
  const surahNameBn = surahData?.chapter?.translated_name?.name || "";

  const tafsirText = tafsirBn?.tafsir?.text || tafsirEn?.tafsir?.text || null;

  return {
    key:        `${surah}:${ayah}`,
    surah:      parseInt(surah),
    ayah:       parseInt(ayah),
    surahName,
    surahNameBn,
    arabic:     arabic?.verse?.text_uthmani || null,
    english:    english?.verse?.translations?.[0]?.text || null,
    bengali:    bengali?.verse?.translations?.[0]?.text || null,
    tafsir:     tafsirText,
    tafsirName: tafsirBn?.tafsir?.text ? "তাফসীর আহসানুল বায়ান" : "Tafsir Ibn Kathir",
    audioUrl:   `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${getAyahNumber(surah, ayah)}.mp3`,
    quranComUrl:`https://quran.com/${surah}/${ayah}`,
  };
}

// Convert surah:ayah to flat ayah number for audio
const SURAH_OFFSETS = (() => {
  const lengths = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
  let offsets = [0];
  for (let i = 0; i < lengths.length; i++) offsets.push(offsets[i] + lengths[i]);
  return offsets;
})();

function getAyahNumber(surah, ayah) {
  return SURAH_OFFSETS[surah - 1] + parseInt(ayah);
}

export async function fetchSurahMeta(num) {
  const res = await fetch(`${QURAN_API}/chapters/${num}?language=en`);
  if (!res.ok) throw new Error("সূরা পাওয়া যায়নি");
  const data = await res.json();
  return data?.chapter || null;
}

export async function fetchSurahAyat(surahNum) {
  const meta = await fetchSurahMeta(surahNum);
  const count = meta?.verses_count || 0;
  // Fetch all ayat in batches
  const res = await fetch(`${QURAN_API}/verses/by_chapter/${surahNum}?translations=${TRANSLATION_EN},${TRANSLATION_BN}&fields=text_uthmani&per_page=${count}`);
  const data = await res.json();
  return { meta, ayat: data?.verses || [] };
}

export async function fetchAllSurahs() {
  const res = await fetch(`${QURAN_API}/chapters?language=en`);
  const data = await res.json();
  return data?.chapters || [];
}

export async function searchByWord(query) {
  const { resolved, mapped, original } = resolveSearchQuery(query);
  const res = await fetch(
    `${QURAN_API}/search?q=${encodeURIComponent(resolved)}&size=50&language=en&translations=${TRANSLATION_EN}`
  );
  if (!res.ok) throw new Error("অনুসন্ধান ব্যর্থ");
  const data  = await res.json();
  const items = data?.search?.results || [];

  const grouped = {};
  for (const r of items) {
    const [s] = r.verse_key.split(":").map(Number);
    if (!grouped[s]) grouped[s] = { surah: s, surahName: "", ayat: [] };
    grouped[s].ayat.push({
      key:     r.verse_key,
      arabic:  r.text,
      english: r.translations?.[0]?.text || null,
    });
  }

  // Enrich with surah names
  const groups = Object.values(grouped).sort((a, b) => a.surah - b.surah);
  await Promise.all(groups.map(async g => {
    try {
      const r = await fetch(`${QURAN_API}/chapters/${g.surah}?language=en`);
      const d = await r.json();
      g.surahName    = d?.chapter?.name_simple || `Surah ${g.surah}`;
      g.surahNameBn  = d?.chapter?.translated_name?.name || "";
    } catch { g.surahName = `Surah ${g.surah}`; }
  }));

  return { query: original, resolvedQuery: resolved, mapped, groups, total: items.length };
}

export async function callAI(system, userContent, maxTokens = 300) {
  const response = await fetch("/api/ask", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model:      "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  if (!response.ok) throw new Error(`AI error: ${response.status}`);
  const data = await response.json();
  return data.content?.[0]?.text || null;
}

export const FACTUAL_SYSTEM = `You are a Quran reference assistant. Primary audience: Bengali-speaking Muslims in Bangladesh.

LANGUAGE: If user writes Bengali → respond Bengali. If English → respond English.

ALLOWED questions only:
- Pillar names, prayer time names, surah identifiers, ayat counts, word definitions, historical facts
- Questions with: কী, কখন, কোনটি, কে, কতটি / what, when, which, who, how many

FORBIDDEN — refuse:
- কেন (why), interpretive, conceptual, rulings, fatwa, scholarly opinion

IF FORBIDDEN (Bengali): "এই প্রশ্নের জন্য আলেমের পরামর্শ নিন। অনুসন্ধান করুন: [শব্দ]"
IF FORBIDDEN (English): "This requires scholarly interpretation. Please consult a qualified scholar."

IF ALLOWED: 2-4 sentences, established facts only, no elaboration.

You are a dictionary and index, not a scholar.`;
