import { useState, useEffect, useRef } from "react";

// ════════════════════════════════════════════════════════════════
// CONSTANTS — verified API source IDs, never changed without review
// ════════════════════════════════════════════════════════════════
const QURAN_API       = "https://api.quran.com/api/v4";
const TAFSIR_BN       = 165;  // Tafsir Ahsanul Bayaan (Bengali) — concise, for common readers
const TAFSIR_EN       = 169;  // Tafsir Ibn Kathir (English)     — fallback only
const TRANSLATION_EN  = 131;  // Dr. Mustafa Khattab — The Clear Quran
const TRANSLATION_BN  = 161;  // Muhiuddin Khan (Bengali)

// ════════════════════════════════════════════════════════════════
// FACTUAL Q&A — the ONLY questions AI is allowed to answer.
// "Why" questions, conceptual questions, rulings = BLOCKED.
// ════════════════════════════════════════════════════════════════
const FACTUAL_AI_SYSTEM_PROMPT = `You are a Quran reference assistant with very strict limits.

ALLOWED — you may answer ONLY these types of questions:
- "What are the 5 pillars of Islam?" (factual list)
- "When is Fajr salah?" / "What are the names of the prayer times?" (names/times)
- "What is the name of the longest surah?" (factual identifier)
- "How many ayat are in Al-Baqarah?" (factual count)
- "What does the word 'sabr' mean?" (word definition)
- "Which surah was revealed first?" (factual/historical)
- "What are the names of the prophets mentioned in the Quran?" (factual list)
- Questions using: what, when, which, who, how many, what is the name of

FORBIDDEN — you must REFUSE to answer:
- Any question starting with or implying "why"
- Any conceptual or interpretive question
- Any question asking for Islamic rulings or fatwa
- Any question requiring synthesis of multiple ayat into a conclusion
- Any question where the answer requires scholarly opinion or ijtihad

IF THE QUESTION IS FORBIDDEN, respond with exactly this text:
"This question requires scholarly interpretation (tafsir or ijtihad) which is beyond the scope of this reference tool. Please consult a qualified Islamic scholar or refer to verified tafsir resources. You can search for specific words in the Quran using: search: [word]"

IF THE QUESTION IS ALLOWED:
- Answer in 2-4 sentences maximum
- State only well-established, uncontested facts
- If you are even slightly uncertain, say "Please verify this with a scholar"
- Do not elaborate, do not give opinions, do not add context beyond the bare fact
- If user writes in Bengali, respond in Bengali

You are a dictionary and index, not a scholar.`;

// ════════════════════════════════════════════════════════════════
// API FUNCTIONS
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
    type:       "ayah",
    arabic:     arabic?.verse?.text_uthmani || null,
    english:    english?.verse?.translations?.[0]?.text || null,
    bengali:    bengali?.verse?.translations?.[0]?.text || null,
    tafsir:     tafsirText,
    tafsirName: tafsirBn?.tafsir?.text ? "তাফসীর আহসানুল বায়ান" : "Tafsir Ibn Kathir",
    key:        `${surah}:${ayah}`,
  };
}

async function fetchSurahMeta(surahNum) {
  const res = await fetch(`${QURAN_API}/chapters/${surahNum}?language=en`);
  if (!res.ok) throw new Error("Surah not found");
  const data = await res.json();
  return data?.chapter || null;
}

// Word search — returns ALL results up to 50, grouped by surah
async function searchByWord(query) {
  const res = await fetch(
    `${QURAN_API}/search?q=${encodeURIComponent(query)}&size=50&language=en&translations=${TRANSLATION_EN}`
  );
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  const results = data?.search?.results || [];

  const grouped = {};
  for (const r of results) {
    const [surah, ayah] = r.verse_key.split(":").map(Number);
    if (!grouped[surah]) grouped[surah] = { surah, ayat: [] };
    grouped[surah].ayat.push({
      key:     r.verse_key,
      ayah,
      arabic:  r.text,
      english: r.translations?.[0]?.text || null,
    });
  }
  return {
    type:   "search",
    query,
    groups: Object.values(grouped).sort((a, b) => a.surah - b.surah),
    total:  results.length,
  };
}

// Factual Q&A — strictly gated, short answers only
async function answerFactualQuestion(question) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 300,
      system:     FACTUAL_AI_SYSTEM_PROMPT,
      messages:   [{ role: "user", content: question }],
    }),
  });
  const data = await response.json();
  return data.content?.[0]?.text || "Unable to process. Please consult a scholar.";
}

// ════════════════════════════════════════════════════════════════
// INPUT PARSER
// ════════════════════════════════════════════════════════════════
function parseInput(raw) {
  const input = raw.trim();

  // Direct ayah reference: 2:255
  if (/^\d{1,3}:\d{1,3}$/.test(input)) {
    const [s, a] = input.split(":").map(Number);
    return { mode: "ayah", surah: s, ayah: a };
  }

  // Surah info: "surah 18"
  const surahMatch = input.match(/^(?:surah|sura|সূরা)\s+(\d+)$/i);
  if (surahMatch) return { mode: "surah", surahNum: parseInt(surahMatch[1]) };

  // Explicit search: "search: sabr"
  const searchMatch = input.match(/^(?:search|find|খোঁজ|খোঁজুন)[:\s]+(.+)$/i);
  if (searchMatch) return { mode: "search", query: searchMatch[1].trim() };

  // Everything else → factual Q&A (with hard AI guardrails)
  return { mode: "factual", question: input };
}

// ════════════════════════════════════════════════════════════════
// UTILITY
// ════════════════════════════════════════════════════════════════
function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<sup[^>]*>.*?<\/sup>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Surah name cache so search results show names, not just numbers
const surahNameCache = {};
async function getSurahName(num) {
  if (surahNameCache[num]) return surahNameCache[num];
  try {
    const res  = await fetch(`${QURAN_API}/chapters/${num}?language=en`);
    const data = await res.json();
    const name = `${data?.chapter?.name_simple} (${data?.chapter?.translated_name?.name || ""})`;
    surahNameCache[num] = name;
    return name;
  } catch { return `Surah ${num}`; }
}

// ════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════
export default function App() {
  const [messages, setMessages] = useState([{ role: "assistant", msgType: "welcome" }]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);

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
        const chapter = await fetchSurahMeta(parsed.surahNum);
        setMessages(prev => [...prev, { role: "assistant", msgType: "surah", data: chapter }]);

      } else if (parsed.mode === "search") {
        const result = await searchByWord(parsed.query);
        const enriched = await Promise.all(
          result.groups.map(async g => ({ ...g, surahName: await getSurahName(g.surah) }))
        );
        setMessages(prev => [...prev, { role: "assistant", msgType: "search", data: { ...result, groups: enriched } }]);

      } else {
        // Factual Q&A — AI answers with strict guardrails
        const answer = await answerFactualQuestion(parsed.question);
        setMessages(prev => [...prev, { role: "assistant", msgType: "factual", content: answer }]);
      }

    } catch (err) {
      setMessages(prev => [...prev, {
        role:    "assistant",
        msgType: "error",
        content: "Could not fetch data. Please check your connection. No response will be given without verified data.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{CSS}</style>

      <div className="header">
        <div className="header-top">
          <div className="logo">🕌</div>
          <div>
            <div className="title">القرآن الكريم</div>
            <div className="subtitle">Quran Reference — Verified · Bilingual · No Interpretation</div>
          </div>
          <div className="integrity-badge">
            <div className="integrity-dot" />
            NO AI INTERPRETATION
          </div>
        </div>
      </div>

      <div className="messages">
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        {loading && (
          <div className="msg">
            <div className="avatar ai">📖</div>
            <div className="bubble ai">
              <div className="loading-dots"><span /><span /><span /></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <div className="mode-hints">
          <span className="hint-chip">2:255 → ayah</span>
          <span className="hint-chip">Surah 18 → chapter info</span>
          <span className="hint-chip">search: sabr → word search</span>
          <span className="hint-chip">what / when / which → factual only</span>
        </div>
        <div className="examples">
          {["2:255", "25:27", "Surah 36", "search: patience", "search: সবর", "What are the prayer times?"].map(ex => (
            <button key={ex} className="example-chip" onClick={() => setInput(ex)}>{ex}</button>
          ))}
        </div>
        <div className="input-row">
          <textarea
            className="input-box"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder='2:255  ·  Surah 18  ·  search: sabr  ·  "What are the 5 pillars?"'
            rows={1}
          />
          <button className="send-btn" onClick={handleSubmit} disabled={loading || !input.trim()}>
            {loading ? "⏳" : "➤"}
          </button>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// MESSAGE BUBBLE — separate component, renders per msgType
// ════════════════════════════════════════════════════════════════
function MessageBubble({ msg }) {

  if (msg.role === "user") {
    return (
      <div className="msg user">
        <div className="avatar user-av">👤</div>
        <div className="bubble user">{msg.content}</div>
      </div>
    );
  }

  if (msg.msgType === "welcome") {
    return (
      <div className="msg">
        <div className="avatar ai">📖</div>
        <div className="bubble ai welcome-bubble">
          <div className="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
          <div className="welcome-greeting">As-salamu alaykum. This is a Quran Reference tool — not an interpreter.</div>
          <div className="welcome-modes">
            <div className="mode-row">
              <span className="mode-tag">📖 AYAH</span>
              <span>Type <code>2:255</code> to look up any verse — Arabic, English, Bengali, and tafsir.</span>
            </div>
            <div className="mode-row">
              <span className="mode-tag">📚 SURAH</span>
              <span>Type <code>Surah 36</code> for chapter facts (name, revelation, ayah count).</span>
            </div>
            <div className="mode-row">
              <span className="mode-tag">🔍 SEARCH</span>
              <span>Type <code>search: sabr</code> to find every ayah containing that word, grouped by surah.</span>
            </div>
            <div className="mode-row">
              <span className="mode-tag">❓ FACTUAL</span>
              <span>Ask <em>what, when, which, who, how many</em> — factual questions only. "Why" and interpretive questions are not answered here.</span>
            </div>
          </div>
          <div className="welcome-note">
            ⚠️ This tool does not interpret the Quran. It only shows verified data. For understanding, always consult a qualified scholar and verified tafsir.
          </div>
        </div>
      </div>
    );
  }

  if (msg.msgType === "error") {
    return (
      <div className="msg">
        <div className="avatar ai">📖</div>
        <div className="bubble ai error-bubble">{msg.content}</div>
      </div>
    );
  }

  if (msg.msgType === "factual") {
    return (
      <div className="msg">
        <div className="avatar ai">📖</div>
        <div className="bubble ai">
          <div className="mode-label factual-label">❓ Factual Reference</div>
          <div className="factual-text">{msg.content}</div>
          <div className="scholar-note">⚠️ Always verify with a qualified Islamic scholar.</div>
        </div>
      </div>
    );
  }

  if (msg.msgType === "ayah") {
    const d = msg.data;
    return (
      <div className="msg">
        <div className="avatar ai">📖</div>
        <div className="bubble ai ayah-bubble">
          <div className="ayah-key-tag">Ayah {d.key}</div>
          {d.arabic  && <div className="arabic-text">{d.arabic}</div>}
          {d.english && (
            <div className="translation-block">
              <div className="translation-label">🇬🇧 English — Dr. Mustafa Khattab</div>
              <div className="translation-text">{stripHtml(d.english)}</div>
            </div>
          )}
          {d.bengali && (
            <div className="translation-block">
              <div className="translation-label">🇧🇩 বাংলা — মুহিউদ্দীন খান</div>
              <div className="translation-text bangla-text">{stripHtml(d.bengali)}</div>
            </div>
          )}
          {d.tafsir && (
            <>
              <div className="tafsir-divider" />
              <div className="tafsir-header">
                <span>📚 {d.tafsirName}</span>
                <span className="tafsir-note">(source text — not AI generated)</span>
              </div>
              <div className="tafsir-text">
                {stripHtml(d.tafsir).slice(0, 700)}{stripHtml(d.tafsir).length > 700 ? "…" : ""}
              </div>
            </>
          )}
          <div className="scholar-note">ℹ️ Read tafsir in full context. Consult a qualified scholar for deeper understanding.</div>
        </div>
      </div>
    );
  }

  if (msg.msgType === "surah") {
    const c = msg.data;
    if (!c) return null;
    const fields = [
      ["Arabic Name",       c.name_arabic],
      ["Transliteration",   c.name_simple],
      ["Meaning",           c.translated_name?.name],
      ["Revelation Period", c.revelation_place ? c.revelation_place.charAt(0).toUpperCase() + c.revelation_place.slice(1) : null],
      ["Number of Ayat",    c.verses_count],
      ["Surah Number",      c.id],
    ].filter(([, v]) => v);
    return (
      <div className="msg">
        <div className="avatar ai">📖</div>
        <div className="bubble ai surah-bubble">
          <div className="mode-label">📚 Surah Information</div>
          <div className="surah-arabic">{c.name_arabic}</div>
          <table className="surah-table">
            <tbody>
              {fields.map(([label, val]) => (
                <tr key={label}>
                  <td className="surah-td-label">{label}</td>
                  <td className="surah-td-val">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="scholar-note">ℹ️ For deeper understanding of this surah, consult verified tafsir sources.</div>
        </div>
      </div>
    );
  }

  if (msg.msgType === "search") {
    const { query, groups, total } = msg.data;
    return (
      <div className="msg">
        <div className="avatar ai">📖</div>
        <div className="bubble ai search-bubble">
          <div className="mode-label search-label">
            🔍 Search: &ldquo;{query}&rdquo; — {total} result{total !== 1 ? "s" : ""} across {groups.length} surah{groups.length !== 1 ? "s" : ""}
          </div>
          {groups.length === 0 && (
            <div className="no-results">No ayat found. Try a different word or spelling.</div>
          )}
          {groups.map(g => (
            <div key={g.surah} className="search-surah-group">
              <div className="search-surah-header">
                <span>{g.surahName || `Surah ${g.surah}`}</span>
                <span className="search-surah-count">{g.ayat.length} ayah{g.ayat.length !== 1 ? "s" : ""}</span>
              </div>
              {g.ayat.map(a => (
                <div key={a.key} className="search-ayah">
                  <div className="search-ayah-key">{a.key}</div>
                  {a.arabic  && <div className="search-arabic">{a.arabic}</div>}
                  {a.english && <div className="search-english">{stripHtml(a.english)}</div>}
                </div>
              ))}
            </div>
          ))}
          <div className="scholar-note">ℹ️ Read each ayah in its full context. Use the ayah lookup (e.g. 2:255) for translations and tafsir.</div>
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
    --ink:       #1a1209;
    --parchment: #f5efe0;
    --gold:      #c8963e;
    --green:     #2d5a3d;
    --green2:    #3d7a52;
    --border:    rgba(200,150,62,0.3);
    --shadow:    rgba(26,18,9,0.15);
    --warn:      #92400e;
    --warn-bg:   #fffbeb;
  }

  html, body { height: 100%; }
  body {
    font-family: 'Lora', Georgia, serif;
    background: var(--parchment);
    color: var(--ink);
    min-height: 100vh;
    background-image:
      radial-gradient(ellipse at 20% 0%, rgba(200,150,62,0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 100%, rgba(45,90,61,0.06) 0%, transparent 50%);
  }
  #root { height: 100vh; display: flex; flex-direction: column; max-width: 860px; margin: 0 auto; }

  .header { padding: 18px 28px 14px; border-bottom: 1px solid var(--border); background: linear-gradient(180deg, rgba(245,239,224,0.98), rgba(237,228,204,0.95)); position: sticky; top: 0; z-index: 10; }
  .header-top { display: flex; align-items: center; gap: 14px; }
  .logo { width: 44px; height: 44px; background: var(--green); border-radius: 10px; display: grid; place-items: center; font-size: 22px; box-shadow: 0 2px 12px rgba(45,90,61,0.3); flex-shrink: 0; }
  .title { font-family: 'Lora', serif; font-size: 1.45rem; font-weight: 600; color: var(--green); }
  .subtitle { font-size: 0.7rem; color: var(--gold); font-style: italic; margin-top: 2px; }
  .integrity-badge { margin-left: auto; display: flex; align-items: center; gap: 5px; font-family: 'JetBrains Mono', monospace; font-size: 0.58rem; color: var(--green2); background: rgba(45,90,61,0.08); border: 1px solid rgba(45,90,61,0.2); border-radius: 20px; padding: 4px 10px; white-space: nowrap; }
  .integrity-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green2); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  .messages { flex: 1; overflow-y: auto; padding: 20px 18px; display: flex; flex-direction: column; gap: 18px; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
  .msg { display: flex; gap: 10px; animation: fadeUp 0.25s ease; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .msg.user { flex-direction: row-reverse; }
  .avatar { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; font-size: 15px; flex-shrink: 0; align-self: flex-end; }
  .avatar.ai { background: var(--green); box-shadow: 0 2px 8px rgba(45,90,61,0.3); }
  .avatar.user-av { background: var(--gold); box-shadow: 0 2px 8px rgba(200,150,62,0.3); }
  .bubble { max-width: 88%; padding: 14px 18px; border-radius: 16px; font-size: 0.88rem; line-height: 1.7; }
  .bubble.ai { background: white; border: 1px solid var(--border); border-bottom-left-radius: 4px; box-shadow: 0 2px 12px var(--shadow); }
  .bubble.user { background: var(--green); color: white; border-bottom-right-radius: 4px; }
  .error-bubble { border-color: #f87171 !important; background: #fff5f5 !important; color: #7f1d1d; }

  .bismillah { font-family: 'UthmanNaskh', serif; font-size: 1.6rem; line-height: 2; text-align: center; color: var(--green); margin-bottom: 10px; direction: rtl; }
  .welcome-greeting { font-weight: 600; margin-bottom: 14px; }
  .welcome-modes { display: flex; flex-direction: column; gap: 9px; margin-bottom: 14px; }
  .mode-row { display: flex; gap: 10px; align-items: flex-start; font-size: 0.83rem; }
  .mode-tag { font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; background: var(--green); color: white; border-radius: 4px; padding: 2px 7px; white-space: nowrap; align-self: center; flex-shrink: 0; }
  .mode-row code { font-family: 'JetBrains Mono', monospace; background: rgba(200,150,62,0.12); padding: 1px 5px; border-radius: 3px; font-size: 0.8rem; }
  .welcome-note { font-size: 0.78rem; color: var(--warn); background: var(--warn-bg); border: 1px solid rgba(146,64,14,0.2); border-radius: 6px; padding: 8px 12px; }

  .mode-label { font-family: 'JetBrains Mono', monospace; font-size: 0.63rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--gold); margin-bottom: 10px; }
  .factual-label { color: var(--green2); }
  .search-label { color: var(--green); }

  .arabic-text { font-family: 'UthmanNaskh', 'Scheherazade New', serif; font-size: 1.85rem; line-height: 2.6; text-align: right; direction: rtl; color: var(--ink); padding: 18px 20px; background: linear-gradient(135deg, rgba(200,150,62,0.05), rgba(45,90,61,0.04)); border-radius: 8px; border: 1px solid var(--border); margin-bottom: 12px; }
  .translation-block { background: rgba(45,90,61,0.04); border-left: 3px solid var(--green2); padding: 10px 14px; border-radius: 0 8px 8px 0; margin-bottom: 10px; }
  .translation-label { font-family: 'JetBrains Mono', monospace; font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--gold); margin-bottom: 4px; }
  .translation-text { font-size: 0.88rem; line-height: 1.75; }
  .bangla-text { font-size: 0.95rem; line-height: 1.85; }

  .tafsir-divider { height: 1px; background: var(--border); margin: 12px 0; }
  .tafsir-header { display: flex; align-items: center; gap: 8px; font-family: 'JetBrains Mono', monospace; font-size: 0.63rem; color: var(--gold); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
  .tafsir-note { color: #9ca3af; font-size: 0.58rem; }
  .tafsir-text { font-size: 0.84rem; line-height: 1.82; color: #374151; font-style: italic; }

  .ayah-key-tag { display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; background: var(--gold); color: white; padding: 2px 9px; border-radius: 12px; margin-bottom: 12px; }

  .surah-arabic { font-family: 'UthmanNaskh', serif; font-size: 2rem; line-height: 2; text-align: center; color: var(--green); direction: rtl; margin-bottom: 12px; }
  .surah-table { width: 100%; border-collapse: collapse; font-size: 0.86rem; }
  .surah-td-label { padding: 6px 12px 6px 0; color: var(--gold); font-family: 'JetBrains Mono', monospace; font-size: 0.68rem; white-space: nowrap; vertical-align: top; }
  .surah-td-val { padding: 6px 0; font-weight: 500; }

  .search-surah-group { margin-bottom: 18px; }
  .search-surah-header { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; font-weight: 600; color: var(--green); padding: 5px 0; border-bottom: 1px solid var(--border); margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
  .search-surah-count { font-size: 0.6rem; color: var(--gold); background: rgba(200,150,62,0.1); padding: 2px 7px; border-radius: 10px; }
  .search-ayah { padding: 8px 0; border-bottom: 1px dashed rgba(200,150,62,0.15); }
  .search-ayah:last-child { border-bottom: none; }
  .search-ayah-key { font-family: 'JetBrains Mono', monospace; font-size: 0.63rem; color: var(--gold); margin-bottom: 4px; }
  .search-arabic { font-family: 'UthmanNaskh', serif; font-size: 1.3rem; line-height: 2.1; direction: rtl; text-align: right; color: var(--ink); margin-bottom: 4px; }
  .search-english { font-size: 0.82rem; color: #4b5563; line-height: 1.65; font-style: italic; }
  .no-results { color: #6b7280; font-style: italic; padding: 10px 0; }

  .factual-text { font-size: 0.9rem; line-height: 1.75; margin-bottom: 10px; }
  .scholar-note { font-size: 0.74rem; color: var(--warn); background: var(--warn-bg); border: 1px solid rgba(146,64,14,0.15); border-radius: 5px; padding: 6px 10px; margin-top: 10px; }

  .loading-dots { display: flex; gap: 4px; padding: 6px 2px; }
  .loading-dots span { width: 7px; height: 7px; border-radius: 50%; background: var(--gold); animation: dot 1.2s infinite; }
  .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
  .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes dot { 0%,80%,100%{transform:scale(0.8);opacity:0.4} 40%{transform:scale(1.2);opacity:1} }

  .input-area { padding: 14px 18px 20px; border-top: 1px solid var(--border); background: linear-gradient(0deg, rgba(245,239,224,0.98), rgba(237,228,204,0.95)); }
  .mode-hints { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; }
  .hint-chip { font-family: 'JetBrains Mono', monospace; font-size: 0.57rem; color: #9ca3af; background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.06); border-radius: 4px; padding: 2px 7px; }
  .examples { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; }
  .example-chip { font-family: 'JetBrains Mono', monospace; font-size: 0.67rem; padding: 4px 10px; border-radius: 20px; border: 1px solid var(--border); background: rgba(200,150,62,0.06); color: var(--ink); cursor: pointer; transition: all 0.15s; }
  .example-chip:hover { background: var(--gold); color: white; border-color: var(--gold); }
  .input-row { display: flex; gap: 10px; align-items: flex-end; }
  .input-box { flex: 1; font-family: 'Lora', serif; font-size: 0.9rem; padding: 12px 16px; border: 1.5px solid var(--border); border-radius: 12px; background: white; color: var(--ink); outline: none; resize: none; min-height: 48px; max-height: 120px; transition: border-color 0.2s; box-shadow: 0 1px 6px rgba(0,0,0,0.05); }
  .input-box:focus { border-color: var(--gold); }
  .input-box::placeholder { color: #aaa; font-style: italic; font-size: 0.8rem; }
  .send-btn { width: 48px; height: 48px; border-radius: 12px; border: none; background: var(--green); color: white; cursor: pointer; font-size: 18px; display: grid; place-items: center; transition: all 0.15s; box-shadow: 0 2px 10px rgba(45,90,61,0.3); flex-shrink: 0; }
  .send-btn:hover:not(:disabled) { background: var(--green2); transform: translateY(-1px); }
  .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  @media (max-width: 600px) {
    .header { padding: 12px 14px 10px; }
    .messages { padding: 14px 10px; }
    .input-area { padding: 10px 12px 16px; }
    .bubble { max-width: 93%; font-size: 0.85rem; }
    .arabic-text { font-size: 1.5rem; }
    .search-arabic { font-size: 1.1rem; }
    .integrity-badge { display: none; }
    .title { font-size: 1.2rem; }
    .mode-hints { display: none; }
  }
`;
