import { useState, useEffect, useRef } from "react";

// ════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════
const QURAN_API      = "https://api.quran.com/api/v4";
const TAFSIR_BN      = 165;  // তাফসীর আহসানুল বায়ান
const TAFSIR_EN      = 169;  // Tafsir Ibn Kathir — fallback
const TRANSLATION_EN = 131;  // Dr. Mustafa Khattab
const TRANSLATION_BN = 161;  // মুহিউদ্দীন খান

// ════════════════════════════════════════════════════════════════
// WORD → ARABIC MAP
// quran.com searches Arabic text only.
// Maps Bengali AND English common words to Arabic for accurate results.
// ════════════════════════════════════════════════════════════════
const WORD_TO_ARABIC = {
  // Bengali → Arabic
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
  "শুকর":"شكر","কৃতজ্ঞতা":"شكر","শোকর":"شكر",
  "তাওবা":"توبة","তওবা":"توبة",
  "হেদায়াত":"هداية","হিদায়াত":"هداية",
  "ঈমান":"إيمان","ইমান":"إيمان",
  "কুফর":"كفر",
  "শিরক":"شرك",
  "আল্লাহ":"الله",
  "রাসূল":"رسول","রাসুল":"رسول",
  "নবী":"نبي","নাবী":"نبي",
  "ফেরেশতা":"ملائكة","মালাইকা":"ملائكة",
  "কিয়ামত":"قيامة","কেয়ামত":"قيامة",
  "আখিরাত":"آخرة","আখেরাত":"آخرة",
  "দুনিয়া":"دنيا",
  "জুলুম":"ظلم","অত্যাচার":"ظلم","জুলুম":"ظلم",
  "ন্যায়":"عدل","ইনসাফ":"عدل",
  "ফাসাদ":"فساد","দুর্নীতি":"فساد",
  "শয়তান":"شيطان","শয়তানি":"شيطان",
  "ইবলিস":"إبليس",
  "মুসা":"موسى",
  "ঈসা":"عيسى",
  "ইবরাহিম":"إبراهيم","ইব্রাহিম":"إبراهيم",
  "মুহাম্মদ":"محمد","মুহাম্মাদ":"محمد",
  "নূহ":"نوح",
  "ইউসুফ":"يوسف","ইউছুফ":"يوسف",
  "দাউদ":"داود","দাঊদ":"داود",
  "সুলায়মান":"سليمان","সোলায়মান":"سليمان",
  "মারিয়াম":"مريم","মরিয়ম":"مريم",
  "ভালোবাসা":"حب","ভালবাসা":"حب","মহব্বত":"حب",
  "ভয়":"خوف","খাওফ":"خوف",
  "আশা":"رجاء","রাজা":"رجاء",
  "সত্য":"حق","হক":"حق",
  "মিথ্যা":"باطل","বাতিল":"باطل",
  "পানি":"ماء","মা":"ماء",
  "আলো":"نور","নূর":"نور",
  "অন্ধকার":"ظلمة","আন্ধার":"ظلمة",
  "হৃদয":"قلب","অন্তর":"قلب","কলব":"قلب",
  "আত্মা":"نفس","নফস":"نفس",
  "সুদ":"ربا","রিবা":"ربا",
  "হালাল":"حلال",
  "হারাম":"حرام",
  "তাসবিহ":"تسبيح",
  "ইসলাম":"إسلام",
  "মুসলিম":"مسلم","মুসলমান":"مسلم",
  "কুরআন":"قرآن","কোরআন":"قرآن",
  "সুন্নাহ":"سنة","সুন্নত":"سنة",
  // English → Arabic
  "sabr":"صبر","patience":"صبر","steadfastness":"صبر",
  "salah":"صلاة","salat":"صلاة","prayer":"صلاة",
  "zakat":"زكاة","zakah":"زكاة",
  "hajj":"حج",
  "sawm":"صوم","fasting":"صوم","siyam":"صيام",
  "jannah":"جنة","paradise":"جنة","heaven":"جنة",
  "jahannam":"جهنم","hell":"جهنم","hellfire":"جهنم",
  "taqwa":"تقوى","piety":"تقوى",
  "ilm":"علم","knowledge":"علم",
  "dua":"دعاء","supplication":"دعاء",
  "jihad":"جهاد",
  "rahma":"رحمة","mercy":"رحمة","compassion":"رحمة",
  "shukr":"شكر","gratitude":"شكر",
  "tawba":"توبة","repentance":"توبة",
  "hidayah":"هداية","guidance":"هداية",
  "iman":"إيمان","faith":"إيمان","belief":"إيمان",
  "kufr":"كفر","disbelief":"كفر",
  "shirk":"شرك",
  "allah":"الله",
  "rasul":"رسول","messenger":"رسول",
  "prophet":"نبي","nabi":"نبي",
  "angels":"ملائكة","malaika":"ملائكة",
  "qiyamah":"قيامة","judgment day":"قيامة",
  "akhirah":"آخرة","hereafter":"آخرة",
  "dunya":"دنيا","world":"دنيا",
  "zulm":"ظلم","oppression":"ظلم","injustice":"ظلم",
  "adl":"عدل","justice":"عدل",
  "fasad":"فساد","corruption":"فساد",
  "shaytan":"شيطان","satan":"شيطان","devil":"شيطان",
  "iblis":"إبليس",
  "musa":"موسى","moses":"موسى",
  "isa":"عيسى","jesus":"عيسى",
  "ibrahim":"إبراهيم","abraham":"إبراهيم",
  "muhammad":"محمد",
  "nuh":"نوح","noah":"نوح",
  "yusuf":"يوسف","joseph":"يوسف",
  "dawud":"داود","david":"داود",
  "sulayman":"سليمان","solomon":"سليمان",
  "maryam":"مريم","mary":"مريم",
  "love":"حب","hubb":"حب",
  "fear":"خوف","khawf":"خوف",
  "hope":"رجاء",
  "truth":"حق","haqq":"حق",
  "light":"نور","noor":"نور",
  "heart":"قلب","qalb":"قلب",
  "soul":"نفس","nafs":"نفس",
  "riba":"ربا","usury":"ربا","interest":"ربا",
  "halal":"حلال",
  "haram":"حرام",
  "quran":"قرآن",
  "sunnah":"سنة",
  "islam":"إسلام",
  "muslim":"مسلم",
};

function resolveQuery(query) {
  const t = query.trim();
  const lower = t.toLowerCase();
  const arabic = WORD_TO_ARABIC[t] || WORD_TO_ARABIC[lower];
  if (arabic) return { resolved: arabic, mapped: true, original: t };
  if (/[\u0600-\u06FF]/.test(t)) return { resolved: t, mapped: false, original: t };
  return { resolved: t, mapped: false, original: t };
}

// ════════════════════════════════════════════════════════════════
// FACTUAL Q&A — Bengali-first system prompt
// ════════════════════════════════════════════════════════════════
const FACTUAL_SYSTEM = `You are a Quran reference assistant. Your primary audience is Bengali-speaking Muslims in Bangladesh.

RESPONSE LANGUAGE RULE — CRITICAL:
- If the user writes in Bengali (বাংলা), ALWAYS respond in Bengali
- If the user writes in English, respond in English
- Default to Bengali if unclear

ALLOWED — answer ONLY:
- ইসলামের পাঁচ স্তম্ভ কী? / What are the 5 pillars?
- নামাজের ওয়াক্তের নাম কী? / Prayer time names?
- সবচেয়ে বড় সূরার নাম কী? / Longest surah name?
- আল-বাকারায় কতটি আয়াত? / How many ayat in Al-Baqarah?
- 'সবর' শব্দের অর্থ কী? / Word definitions
- কোন সূরা প্রথম নাজিল হয়েছিল? / Which surah revealed first?
- Questions: কী, কখন, কোনটি, কে, কতটি / what, when, which, who, how many

FORBIDDEN — refuse these completely:
- কেন (why) questions
- ব্যাখ্যামূলক প্রশ্ন (interpretive/conceptual)
- ফতোয়া বা রুলিং সংক্রান্ত প্রশ্ন
- একাধিক আয়াত সংশ্লেষণ প্রয়োজন এমন প্রশ্ন

IF FORBIDDEN, respond in Bengali:
"এই প্রশ্নের উত্তরের জন্য আলেমের পরামর্শ নেওয়া প্রয়োজন। একজন যোগ্য ইসলামী আলেম বা বিশ্বস্ত তাফসীর দেখুন। আপনি নির্দিষ্ট শব্দ খুঁজতে পারেন: search: [শব্দ]"

IF ALLOWED:
- সর্বোচ্চ ২-৪ বাক্যে উত্তর দিন
- কেবল সুপ্রতিষ্ঠিত তথ্য বলুন
- সামান্য সন্দেহ হলেও বলুন "একজন আলেমের সাথে যাচাই করুন"
- মতামত বা ব্যাখ্যা দেবেন না

আপনি একটি অভিধান ও সূচি — আলেম নন।`;

// ════════════════════════════════════════════════════════════════
// ANTHROPIC PROXY
// ════════════════════════════════════════════════════════════════
async function callAI(system, userContent, maxTokens = 300) {
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
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI error ${response.status}: ${err}`);
  }
  const data = await response.json();
  return data.content?.[0]?.text || null;
}

// ════════════════════════════════════════════════════════════════
// QURAN API
// ════════════════════════════════════════════════════════════════
async function fetchAyah(surah, ayah) {
  const [arabic, english, bengali, tafsirBn, tafsirEn] = await Promise.all([
    fetch(`${QURAN_API}/verses/by_key/${surah}:${ayah}?words=true&fields=text_uthmani`).then(r => r.json()),
    fetch(`${QURAN_API}/verses/by_key/${surah}:${ayah}?translations=${TRANSLATION_EN}`).then(r => r.json()),
    fetch(`${QURAN_API}/verses/by_key/${surah}:${ayah}?translations=${TRANSLATION_BN}`).then(r => r.json()),
    fetch(`${QURAN_API}/tafsirs/${TAFSIR_BN}/by_ayah/${surah}:${ayah}`).then(r => r.json()).catch(() => null),
    fetch(`${QURAN_API}/tafsirs/${TAFSIR_EN}/by_ayah/${surah}:${ayah}`).then(r => r.json()).catch(() => null),
  ]);
  const tafsirText = tafsirBn?.tafsir?.text || tafsirEn?.tafsir?.text || null;
  return {
    arabic:     arabic?.verse?.text_uthmani || null,
    english:    english?.verse?.translations?.[0]?.text || null,
    bengali:    bengali?.verse?.translations?.[0]?.text || null,
    tafsir:     tafsirText,
    tafsirName: tafsirBn?.tafsir?.text ? "তাফসীর আহসানুল বায়ান" : "Tafsir Ibn Kathir",
    key:        `${surah}:${ayah}`,
  };
}

async function fetchSurahMeta(num) {
  const res = await fetch(`${QURAN_API}/chapters/${num}?language=en`);
  if (!res.ok) throw new Error("সূরা পাওয়া যায়নি");
  const data = await res.json();
  return data?.chapter || null;
}

async function searchByWord(query) {
  const { resolved, mapped, original } = resolveQuery(query);
  const res = await fetch(
    `${QURAN_API}/search?q=${encodeURIComponent(resolved)}&size=50&language=en&translations=${TRANSLATION_EN}`
  );
  if (!res.ok) throw new Error("অনুসন্ধান ব্যর্থ হয়েছে");
  const data  = await res.json();
  const items = data?.search?.results || [];
  const grouped = {};
  for (const r of items) {
    const [s] = r.verse_key.split(":").map(Number);
    if (!grouped[s]) grouped[s] = { surah: s, ayat: [] };
    grouped[s].ayat.push({ key: r.verse_key, arabic: r.text, english: r.translations?.[0]?.text || null });
  }
  return {
    query: original, resolvedQuery: resolved, mapped,
    groups: Object.values(grouped).sort((a, b) => a.surah - b.surah),
    total: items.length,
  };
}

const nameCache = {};
async function getSurahName(num) {
  if (nameCache[num]) return nameCache[num];
  try {
    const res  = await fetch(`${QURAN_API}/chapters/${num}?language=en`);
    const data = await res.json();
    const name = `${data?.chapter?.name_simple} (${data?.chapter?.translated_name?.name || ""})`;
    nameCache[num] = name;
    return name;
  } catch { return `সূরা ${num}`; }
}

// ════════════════════════════════════════════════════════════════
// INPUT PARSER — Bengali keywords supported
// ════════════════════════════════════════════════════════════════
function parseInput(raw) {
  const s = raw.trim();
  // Ayah: 2:255
  if (/^\d{1,3}:\d{1,3}$/.test(s)) {
    const [su, ay] = s.split(":").map(Number);
    return { mode: "ayah", surah: su, ayah: ay };
  }
  // Surah: "সূরা ১৮" or "Surah 18"
  const surahM = s.match(/^(?:surah|sura|সূরা|সুরা)\s+(\d+)$/i);
  if (surahM) return { mode: "surah", num: parseInt(surahM[1]) };
  // Search: "খোঁজ: সবর" or "search: patience"
  const searchM = s.match(/^(?:search|find|খোঁজ|খোঁজুন|অনুসন্ধান)[:\s]+(.+)$/i);
  if (searchM) return { mode: "search", query: searchM[1].trim() };
  // Everything else → factual Q&A
  return { mode: "factual", question: s };
}

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<sup[^>]*>.*?<\/sup>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, "").replace(/\s+/g, " ").trim();
}

// ════════════════════════════════════════════════════════════════
// VOICE SEARCH
// ════════════════════════════════════════════════════════════════
function useVoiceSearch(onResult) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recogRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = "bn-BD"; // Bengali primary — works on Android Chrome
    r.onresult = (e) => {
      let t = e.results[0][0].transcript.trim();
      // Fix spoken ayah patterns
      t = t.replace(/(\d+)\s*[:|।]\s*(\d+)/, "$1:$2");
      onResult(t);
      setListening(false);
    };
    r.onerror = () => setListening(false);
    r.onend   = () => setListening(false);
    recogRef.current = r;
  }, []);

  function toggle() {
    if (!supported || !recogRef.current) return;
    if (listening) { recogRef.current.stop(); setListening(false); }
    else           { recogRef.current.start(); setListening(true); }
  }

  return { listening, supported, toggle };
}

// ════════════════════════════════════════════════════════════════
// APP
// ════════════════════════════════════════════════════════════════
export default function App() {
  const [messages, setMessages] = useState([{ role: "assistant", msgType: "welcome" }]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);

  const { listening, supported: voiceSupported, toggle: toggleVoice } = useVoiceSearch(setInput);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const parsed = parseInput(userMsg);
      if (parsed.mode === "ayah") {
        const data = await fetchAyah(parsed.surah, parsed.ayah);
        setMessages(prev => [...prev, { role: "assistant", msgType: "ayah", data }]);
      } else if (parsed.mode === "surah") {
        const chapter = await fetchSurahMeta(parsed.num);
        setMessages(prev => [...prev, { role: "assistant", msgType: "surah", data: chapter }]);
      } else if (parsed.mode === "search") {
        const result   = await searchByWord(parsed.query);
        const enriched = await Promise.all(
          result.groups.map(async g => ({ ...g, surahName: await getSurahName(g.surah) }))
        );
        setMessages(prev => [...prev, { role: "assistant", msgType: "search", data: { ...result, groups: enriched } }]);
      } else {
        const answer = await callAI(FACTUAL_SYSTEM, parsed.question, 300);
        setMessages(prev => [...prev, {
          role: "assistant", msgType: "factual",
          content: answer || "দুঃখিত, উত্তর দেওয়া সম্ভব হয়নি। একজন আলেমের সাথে পরামর্শ করুন।",
        }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: "assistant", msgType: "error",
        content: "ডেটা আনতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করুন এবং আবার চেষ্টা করুন।",
      }]);
    } finally {
      setLoading(false);
    }
  }

  // Bengali-first chips
  const CHIPS = ["2:255", "25:27", "সূরা ৩৬", "খোঁজ: সবর", "খোঁজ: রহমত", "নামাজের ওয়াক্ত কয়টি?"];

  return (
    <>
      <style>{CSS}</style>
      <div className="header">
        <div className="header-top">
          <div className="logo">🕌</div>
          <div>
            <div className="title">القرآن الكريم</div>
            <div className="subtitle">কুরআন রেফারেন্স — যাচাইকৃত · বাংলা · কোনো ব্যাখ্যা নয়</div>
          </div>
          <div className="integrity-badge">
            <div className="integrity-dot" />
            AI ব্যাখ্যা নেই
          </div>
        </div>
      </div>

      <div className="messages">
        {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
        {loading && (
          <div className="msg">
            <div className="avatar ai">📖</div>
            <div className="bubble ai"><div className="dots"><span /><span /><span /></div></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <div className="mode-hints">
          <span className="hint">2:255 → আয়াত</span>
          <span className="hint">সূরা ১৮ → সূরা তথ্য</span>
          <span className="hint">খোঁজ: সবর → শব্দ অনুসন্ধান</span>
          <span className="hint">কী/কখন/কোনটি → তথ্যভিত্তিক প্রশ্ন</span>
        </div>
        <div className="chips">
          {CHIPS.map(ex => (
            <button key={ex} className="chip" onClick={() => setInput(ex)}>{ex}</button>
          ))}
        </div>
        <div className="input-row">
          <textarea
            className="input-box"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder='২:২৫৫ · সূরা ১৮ · খোঁজ: সবর · "নামাজের ওয়াক্ত কয়টি?"'
            rows={1}
          />
          {voiceSupported && (
            <button className={`voice-btn ${listening ? "listening" : ""}`} onClick={toggleVoice} title={listening ? "বন্ধ করুন" : "ভয়েস অনুসন্ধান"}>
              {listening ? "🔴" : "🎙️"}
            </button>
          )}
          <button className="send-btn" onClick={handleSubmit} disabled={loading || !input.trim()}>
            {loading ? "⏳" : "➤"}
          </button>
        </div>
        {listening && <div className="voice-hint">শুনছি… এখন বলুন</div>}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// BUBBLE
// ════════════════════════════════════════════════════════════════
function Bubble({ msg }) {
  if (msg.role === "user") return (
    <div className="msg user">
      <div className="avatar user-av">👤</div>
      <div className="bubble user">{msg.content}</div>
    </div>
  );

  if (msg.msgType === "welcome") return (
    <div className="msg">
      <div className="avatar ai">📖</div>
      <div className="bubble ai">
        <div className="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
        <p className="greeting">আস-সালামু আলাইকুম। এটি একটি কুরআন রেফারেন্স টুল — ব্যাখ্যাকারী নয়।</p>
        <div className="mode-list">
          <div className="mode-item"><span className="tag">📖 আয়াত</span><span><code>2:255</code> লিখুন — আরবি, বাংলা, ইংরেজি ও তাফসীর।</span></div>
          <div className="mode-item"><span className="tag">📚 সূরা</span><span><code>সূরা ৩৬</code> লিখুন — সূরার তথ্য।</span></div>
          <div className="mode-item"><span className="tag">🔍 অনুসন্ধান</span><span><code>খোঁজ: সবর</code> লিখুন — সেই শব্দসহ সব আয়াত, সূরা অনুযায়ী।</span></div>
          <div className="mode-item"><span className="tag">❓ তথ্য</span><span><em>কী, কখন, কোনটি, কে</em> — শুধু তথ্যভিত্তিক প্রশ্ন। "কেন" ও ব্যাখ্যামূলক প্রশ্ন গ্রহণযোগ্য নয়।</span></div>
          <div className="mode-item"><span className="tag">🎙️ ভয়েস</span><span>মাইক্রোফোন বাটন চাপুন এবং বলুন।</span></div>
        </div>
        <div className="warn-box">⚠️ এই টুল শুধু যাচাইকৃত তথ্য দেখায়। অর্থ ও ব্যাখ্যার জন্য সর্বদা একজন যোগ্য আলেম ও বিশ্বস্ত তাফসীর দেখুন।</div>
      </div>
    </div>
  );

  if (msg.msgType === "error") return (
    <div className="msg">
      <div className="avatar ai">📖</div>
      <div className="bubble ai error-bubble">{msg.content}</div>
    </div>
  );

  if (msg.msgType === "factual") return (
    <div className="msg">
      <div className="avatar ai">📖</div>
      <div className="bubble ai">
        <div className="section-label gold">❓ তথ্যভিত্তিক উত্তর</div>
        <p className="factual-answer">{msg.content}</p>
        <div className="warn-box">⚠️ একজন যোগ্য ইসলামী আলেমের সাথে যাচাই করুন।</div>
      </div>
    </div>
  );

  if (msg.msgType === "ayah") {
    const d = msg.data;
    return (
      <div className="msg">
        <div className="avatar ai">📖</div>
        <div className="bubble ai">
          <span className="ayah-badge">আয়াত {d.key}</span>
          {d.arabic  && <div className="arabic">{d.arabic}</div>}
          {d.bengali && <div className="trans-block"><div className="trans-label">🇧🇩 বাংলা — মুহিউদ্দীন খান</div><div className="bangla">{stripHtml(d.bengali)}</div></div>}
          {d.english && <div className="trans-block"><div className="trans-label">🇬🇧 English — Dr. Mustafa Khattab</div><div>{stripHtml(d.english)}</div></div>}
          {d.tafsir  && (
            <>
              <div className="divider" />
              <div className="section-label gold">📚 {d.tafsirName} <span className="muted">(মূল টেক্সট — AI তৈরি নয়)</span></div>
              <div className="tafsir-text">{stripHtml(d.tafsir).slice(0, 700)}{stripHtml(d.tafsir).length > 700 ? "…" : ""}</div>
            </>
          )}
          <div className="warn-box">ℹ️ তাফসীর সম্পূর্ণ প্রসঙ্গে পড়ুন। গভীর বোঝার জন্য যোগ্য আলেমের পরামর্শ নিন।</div>
        </div>
      </div>
    );
  }

  if (msg.msgType === "surah") {
    const c = msg.data;
    if (!c) return null;
    const rows = [
      ["আরবি নাম",        c.name_arabic],
      ["উচ্চারণ",         c.name_simple],
      ["অর্থ",            c.translated_name?.name],
      ["নাজিলের স্থান",   c.revelation_place ? (c.revelation_place === "makkah" ? "মক্কা" : "মদিনা") : null],
      ["মোট আয়াত",       c.verses_count],
      ["সূরা নম্বর",      c.id],
    ].filter(([, v]) => v);
    return (
      <div className="msg">
        <div className="avatar ai">📖</div>
        <div className="bubble ai">
          <div className="section-label gold">📚 সূরার তথ্য</div>
          <div className="surah-name-ar">{c.name_arabic}</div>
          <table className="info-table"><tbody>
            {rows.map(([label, val]) => (
              <tr key={label}><td className="info-label">{label}</td><td className="info-val">{val}</td></tr>
            ))}
          </tbody></table>
          <div className="warn-box">ℹ️ গভীর বোঝার জন্য বিশ্বস্ত তাফসীর দেখুন।</div>
        </div>
      </div>
    );
  }

  if (msg.msgType === "search") {
    const { query, resolvedQuery, mapped, groups, total } = msg.data;
    return (
      <div className="msg">
        <div className="avatar ai">📖</div>
        <div className="bubble ai">
          <div className="section-label green">
            🔍 &ldquo;{query}&rdquo;{mapped ? ` → ${resolvedQuery}` : ""} — {groups.length}টি সূরায় {total}টি আয়াত
          </div>
          {mapped && (
            <div className="transliteration-note">ℹ️ আরবিতে অনুসন্ধান করা হয়েছে: <strong>{resolvedQuery}</strong></div>
          )}
          {groups.length === 0 && (
            <p className="no-results">কোনো আয়াত পাওয়া যায়নি। চেষ্টা করুন: <code>খোঁজ: সবর</code>, <code>খোঁজ: রহমত</code>, <code>খোঁজ: জান্নাত</code></p>
          )}
          {groups.map(g => (
            <div key={g.surah} className="search-group">
              <div className="search-group-hdr">
                <span>{g.surahName || `সূরা ${g.surah}`}</span>
                <span className="count-badge">{g.ayat.length}টি আয়াত</span>
              </div>
              {g.ayat.map(a => (
                <div key={a.key} className="search-ayah">
                  <div className="search-key">{a.key}</div>
                  {a.arabic  && <div className="search-ar">{a.arabic}</div>}
                  {a.english && <div className="search-en">{stripHtml(a.english)}</div>}
                </div>
              ))}
            </div>
          ))}
          <div className="warn-box">ℹ️ প্রতিটি আয়াত পূর্ণ প্রসঙ্গে পড়ুন। অনুবাদ ও তাফসীরের জন্য আয়াত লুকআপ ব্যবহার করুন (যেমন 2:255)।</div>
        </div>
      </div>
    );
  }

  return null;
}

// ════════════════════════════════════════════════════════════════
// CSS
// ════════════════════════════════════════════════════════════════
const CSS = `
  @font-face {
    font-family: 'UthmanNaskh';
    src: url('https://raw.githubusercontent.com/mustafa0x/qpc-fonts/f93bf5f3/various-woff2/UthmanTN1%20Ver10.woff2') format('woff2');
    font-display: swap;
  }
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink: #1a1209; --parch: #f5efe0; --gold: #c8963e;
    --green: #2d5a3d; --green2: #3d7a52;
    --border: rgba(200,150,62,0.28); --shadow: rgba(26,18,9,0.12);
    --warn: #92400e; --warn-bg: #fffbeb;
  }
  html, body { height: 100%; }
  body { font-family: 'Lora', Georgia, serif; background: var(--parch); color: var(--ink); min-height: 100vh;
    background-image: radial-gradient(ellipse at 20% 0%, rgba(200,150,62,0.08) 0%, transparent 50%),
                      radial-gradient(ellipse at 80% 100%, rgba(45,90,61,0.06) 0%, transparent 50%); }
  #root { height: 100vh; display: flex; flex-direction: column; max-width: 860px; margin: 0 auto; }

  .header { padding: 16px 26px 14px; border-bottom: 1px solid var(--border); background: rgba(245,239,224,0.97); position: sticky; top: 0; z-index: 10; backdrop-filter: blur(8px); }
  .header-top { display: flex; align-items: center; gap: 13px; }
  .logo { width: 42px; height: 42px; background: var(--green); border-radius: 10px; display: grid; place-items: center; font-size: 20px; box-shadow: 0 2px 10px rgba(45,90,61,0.3); flex-shrink: 0; }
  .title { font-size: 1.4rem; font-weight: 600; color: var(--green); line-height: 1.1; }
  .subtitle { font-size: 0.69rem; color: var(--gold); font-style: italic; margin-top: 2px; }
  .integrity-badge { margin-left: auto; display: flex; align-items: center; gap: 5px; font-family: 'JetBrains Mono', monospace; font-size: 0.58rem; color: var(--green2); background: rgba(45,90,61,0.08); border: 1px solid rgba(45,90,61,0.2); border-radius: 20px; padding: 4px 10px; white-space: nowrap; }
  .integrity-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green2); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }

  .messages { flex: 1; overflow-y: auto; padding: 18px 16px; display: flex; flex-direction: column; gap: 16px; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
  .msg { display: flex; gap: 10px; animation: up 0.22s ease; }
  @keyframes up { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .msg.user { flex-direction: row-reverse; }
  .avatar { width: 33px; height: 33px; border-radius: 50%; display: grid; place-items: center; font-size: 14px; flex-shrink: 0; align-self: flex-end; }
  .avatar.ai { background: var(--green); box-shadow: 0 2px 8px rgba(45,90,61,0.25); }
  .avatar.user-av { background: var(--gold); box-shadow: 0 2px 8px rgba(200,150,62,0.25); }
  .bubble { max-width: 88%; padding: 13px 17px; border-radius: 16px; font-size: 0.875rem; line-height: 1.72; }
  .bubble.ai { background: white; border: 1px solid var(--border); border-bottom-left-radius: 4px; box-shadow: 0 2px 10px var(--shadow); }
  .bubble.user { background: var(--green); color: white; border-bottom-right-radius: 4px; }
  .error-bubble { border-color: #fca5a5 !important; background: #fff5f5 !important; color: #7f1d1d; }

  .bismillah { font-family: 'UthmanNaskh', serif; font-size: 1.55rem; line-height: 2; text-align: center; color: var(--green); margin-bottom: 10px; direction: rtl; }
  .greeting { font-weight: 600; margin-bottom: 13px; font-size: 0.92rem; }
  .mode-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 13px; }
  .mode-item { display: flex; gap: 9px; align-items: flex-start; font-size: 0.83rem; }
  .tag { font-family: 'JetBrains Mono', monospace; font-size: 0.56rem; background: var(--green); color: white; border-radius: 4px; padding: 2px 7px; white-space: nowrap; align-self: center; flex-shrink: 0; }
  .mode-item code { font-family: 'JetBrains Mono', monospace; background: rgba(200,150,62,0.12); padding: 1px 5px; border-radius: 3px; font-size: 0.79rem; }
  .warn-box { font-size: 0.74rem; color: var(--warn); background: var(--warn-bg); border: 1px solid rgba(146,64,14,0.18); border-radius: 5px; padding: 7px 11px; margin-top: 10px; }
  .transliteration-note { font-size: 0.76rem; color: var(--green2); background: rgba(45,90,61,0.06); border: 1px solid rgba(45,90,61,0.15); border-radius: 5px; padding: 6px 10px; margin-bottom: 10px; }
  .no-results { color: #6b7280; font-style: italic; padding: 8px 0; font-size: 0.84rem; }
  .no-results code { font-family: 'JetBrains Mono', monospace; background: rgba(200,150,62,0.12); padding: 1px 5px; border-radius: 3px; }

  .section-label { font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
  .section-label.gold { color: var(--gold); }
  .section-label.green { color: var(--green2); }
  .muted { color: #9ca3af; font-size: 0.58rem; text-transform: none; letter-spacing: 0; }
  .divider { height: 1px; background: var(--border); margin: 12px 0; }

  .arabic { font-family: 'UthmanNaskh', 'Scheherazade New', serif; font-size: 1.82rem; line-height: 2.55; text-align: right; direction: rtl; color: var(--ink); padding: 16px 20px; background: linear-gradient(135deg, rgba(200,150,62,0.05), rgba(45,90,61,0.04)); border-radius: 8px; border: 1px solid var(--border); margin-bottom: 11px; }
  .trans-block { background: rgba(45,90,61,0.04); border-left: 3px solid var(--green2); padding: 9px 13px; border-radius: 0 7px 7px 0; margin-bottom: 9px; }
  .trans-label { font-family: 'JetBrains Mono', monospace; font-size: 0.59rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--gold); margin-bottom: 4px; }
  .bangla { font-size: 0.97rem; line-height: 1.9; }
  .tafsir-text { font-size: 0.83rem; line-height: 1.85; color: #374151; font-style: italic; }
  .ayah-badge { display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: 0.66rem; background: var(--gold); color: white; padding: 2px 9px; border-radius: 12px; margin-bottom: 12px; }

  .surah-name-ar { font-family: 'UthmanNaskh', serif; font-size: 1.9rem; line-height: 2; text-align: center; color: var(--green); direction: rtl; margin-bottom: 12px; }
  .info-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  .info-label { padding: 5px 12px 5px 0; color: var(--gold); font-family: 'JetBrains Mono', monospace; font-size: 0.66rem; white-space: nowrap; vertical-align: top; }
  .info-val { padding: 5px 0; font-weight: 500; }

  .search-group { margin-bottom: 16px; }
  .search-group-hdr { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; font-weight: 600; color: var(--green); padding: 4px 0; border-bottom: 1px solid var(--border); margin-bottom: 7px; display: flex; justify-content: space-between; align-items: center; }
  .count-badge { font-size: 0.58rem; color: var(--gold); background: rgba(200,150,62,0.1); padding: 2px 7px; border-radius: 10px; }
  .search-ayah { padding: 7px 0; border-bottom: 1px dashed rgba(200,150,62,0.15); }
  .search-ayah:last-child { border-bottom: none; }
  .search-key { font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; color: var(--gold); margin-bottom: 3px; }
  .search-ar { font-family: 'UthmanNaskh', serif; font-size: 1.28rem; line-height: 2.1; direction: rtl; text-align: right; color: var(--ink); margin-bottom: 3px; }
  .search-en { font-size: 0.81rem; color: #4b5563; line-height: 1.65; font-style: italic; }

  .factual-answer { font-size: 0.92rem; line-height: 1.8; margin-bottom: 8px; }

  .dots { display: flex; gap: 4px; padding: 5px 2px; }
  .dots span { width: 7px; height: 7px; border-radius: 50%; background: var(--gold); animation: dot 1.2s infinite; }
  .dots span:nth-child(2) { animation-delay: 0.2s; }
  .dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes dot { 0%,80%,100%{transform:scale(0.8);opacity:0.4} 40%{transform:scale(1.2);opacity:1} }

  .input-area { padding: 12px 16px 18px; border-top: 1px solid var(--border); background: rgba(245,239,224,0.97); }
  .mode-hints { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 7px; }
  .hint { font-family: 'JetBrains Mono', monospace; font-size: 0.56rem; color: #9ca3af; background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.06); border-radius: 4px; padding: 2px 6px; }
  .chips { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 9px; }
  .chip { font-family: 'JetBrains Mono', monospace; font-size: 0.66rem; padding: 3px 9px; border-radius: 20px; border: 1px solid var(--border); background: rgba(200,150,62,0.06); color: var(--ink); cursor: pointer; transition: all 0.14s; }
  .chip:hover { background: var(--gold); color: white; border-color: var(--gold); }
  .input-row { display: flex; gap: 9px; align-items: flex-end; }
  .input-box { flex: 1; font-family: 'Lora', serif; font-size: 0.88rem; padding: 11px 15px; border: 1.5px solid var(--border); border-radius: 12px; background: white; color: var(--ink); outline: none; resize: none; min-height: 46px; max-height: 120px; transition: border-color 0.18s; box-shadow: 0 1px 5px rgba(0,0,0,0.05); }
  .input-box:focus { border-color: var(--gold); }
  .input-box::placeholder { color: #aaa; font-style: italic; font-size: 0.78rem; }
  .voice-btn { width: 46px; height: 46px; border-radius: 12px; border: 1.5px solid var(--border); background: white; cursor: pointer; font-size: 18px; display: grid; place-items: center; transition: all 0.14s; flex-shrink: 0; }
  .voice-btn:hover { border-color: var(--gold); }
  .voice-btn.listening { border-color: #ef4444; background: #fff5f5; animation: pulse-red 1s infinite; }
  @keyframes pulse-red { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.3)} 50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }
  .voice-hint { font-size: 0.7rem; color: #ef4444; text-align: center; margin-top: 6px; }
  .send-btn { width: 46px; height: 46px; border-radius: 12px; border: none; background: var(--green); color: white; cursor: pointer; font-size: 17px; display: grid; place-items: center; transition: all 0.14s; box-shadow: 0 2px 9px rgba(45,90,61,0.28); flex-shrink: 0; }
  .send-btn:hover:not(:disabled) { background: var(--green2); transform: translateY(-1px); }
  .send-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  @media (max-width: 600px) {
    .header { padding: 11px 13px 9px; }
    .messages { padding: 12px 9px; }
    .input-area { padding: 9px 11px 15px; }
    .bubble { max-width: 93%; font-size: 0.84rem; }
    .arabic, .surah-name-ar { font-size: 1.48rem; }
    .search-ar { font-size: 1.1rem; }
    .integrity-badge, .mode-hints { display: none; }
    .title { font-size: 1.15rem; }
  }
`;
