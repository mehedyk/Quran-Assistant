import { useState, useEffect, useRef } from "react";

// ════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════
const QURAN_API      = "https://api.quran.com/api/v4";
const TAFSIR_BN      = 165;  // Tafsir Ahsanul Bayaan (Bengali) — concise, for common readers
const TAFSIR_EN      = 169;  // Tafsir Ibn Kathir (English)     — fallback only
const TRANSLATION_EN = 131;  // Dr. Mustafa Khattab — The Clear Quran
const TRANSLATION_BN = 161;  // Muhiuddin Khan (Bengali)

// ════════════════════════════════════════════════════════════════
// ANTHROPIC PROXY — calls /api/ask (our Vercel serverless fn)
// The API key lives on the server. Never in the browser.
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

  if (!response.ok) throw new Error(`AI proxy error: ${response.status}`);
  const data = await response.json();
  return data.content?.[0]?.text || null;
}

// ════════════════════════════════════════════════════════════════
// FACTUAL Q&A SYSTEM PROMPT
// AI is a dictionary/index only. Not a scholar. Not an interpreter.
// ════════════════════════════════════════════════════════════════
const FACTUAL_SYSTEM = `You are a Quran reference assistant with very strict limits.

ALLOWED — answer ONLY these types of questions:
- "What are the 5 pillars of Islam?" (factual list)
- "What are the names of the prayer times?" (factual names)
- "What is the name of the longest surah?" (factual identifier)
- "How many ayat are in Al-Baqarah?" (factual count)
- "What does the word 'sabr' mean in Arabic?" (word definition)
- "Which surah was revealed first?" (factual/historical)
- "What are the names of the prophets mentioned in the Quran?" (factual list)
- Questions using: what, when, which, who, how many

FORBIDDEN — refuse ALL of these:
- Any question starting with or implying "why"
- Any conceptual or interpretive question ("what does Islam say about X")
- Any question asking for rulings (halal/haram), fatwa, or ijtihad
- Any question requiring synthesis of multiple ayat into a conclusion
- Any question where the answer requires scholarly opinion

IF FORBIDDEN, respond with exactly:
"This question requires scholarly interpretation which is beyond the scope of this reference tool. Please consult a qualified Islamic scholar or verified tafsir. You can search for specific words using: search: [word]"

IF ALLOWED:
- Answer in 2-4 sentences maximum
- State only well-established, uncontested facts
- If even slightly uncertain, say "Please verify this with a scholar"
- Do not elaborate or give opinions
- If user writes in Bengali, respond in Bengali

You are a dictionary and index, not a scholar.`;

// ════════════════════════════════════════════════════════════════
// QURAN API FUNCTIONS — no AI involved, pure verified data
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
    arabic:     arabic?.verse?.text_uthmani     || null,
    english:    english?.verse?.translations?.[0]?.text || null,
    bengali:    bengali?.verse?.translations?.[0]?.text || null,
    tafsir:     tafsirText,
    tafsirName: tafsirBn?.tafsir?.text ? "তাফসীর আহসানুল বায়ান" : "Tafsir Ibn Kathir",
    key:        `${surah}:${ayah}`,
  };
}

async function fetchSurahMeta(num) {
  const res = await fetch(`${QURAN_API}/chapters/${num}?language=en`);
  if (!res.ok) throw new Error("Surah not found");
  const data = await res.json();
  return data?.chapter || null;
}

async function searchByWord(query) {
  const res = await fetch(
    `${QURAN_API}/search?q=${encodeURIComponent(query)}&size=50&language=en&translations=${TRANSLATION_EN}`
  );
  if (!res.ok) throw new Error("Search failed");
  const data  = await res.json();
  const items = data?.search?.results || [];

  // Group by surah
  const grouped = {};
  for (const r of items) {
    const [s, a] = r.verse_key.split(":").map(Number);
    if (!grouped[s]) grouped[s] = { surah: s, ayat: [] };
    grouped[s].ayat.push({
      key:     r.verse_key,
      arabic:  r.text,
      english: r.translations?.[0]?.text || null,
    });
  }
  return {
    query,
    groups: Object.values(grouped).sort((a, b) => a.surah - b.surah),
    total:  items.length,
  };
}

// ════════════════════════════════════════════════════════════════
// SURAH NAME CACHE — so search results show names not just numbers
// ════════════════════════════════════════════════════════════════
const nameCache = {};
async function getSurahName(num) {
  if (nameCache[num]) return nameCache[num];
  try {
    const res  = await fetch(`${QURAN_API}/chapters/${num}?language=en`);
    const data = await res.json();
    const name = `${data?.chapter?.name_simple} (${data?.chapter?.translated_name?.name || ""})`;
    nameCache[num] = name;
    return name;
  } catch { return `Surah ${num}`; }
}

// ════════════════════════════════════════════════════════════════
// INPUT PARSER
// ════════════════════════════════════════════════════════════════
function parseInput(raw) {
  const s = raw.trim();

  // 2:255 — ayah reference
  if (/^\d{1,3}:\d{1,3}$/.test(s)) {
    const [su, ay] = s.split(":").map(Number);
    return { mode: "ayah", surah: su, ayah: ay };
  }

  // "surah 18" — chapter info
  const surahM = s.match(/^(?:surah|sura|সূরা)\s+(\d+)$/i);
  if (surahM) return { mode: "surah", num: parseInt(surahM[1]) };

  // "search: sabr" — word search
  const searchM = s.match(/^(?:search|find|খোঁজ|খোঁজুন)[:\s]+(.+)$/i);
  if (searchM) return { mode: "search", query: searchM[1].trim() };

  // everything else → factual Q&A with strict AI guardrails
  return { mode: "factual", question: s };
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

// ════════════════════════════════════════════════════════════════
// APP
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
        // Pure API fetch — no AI
        const data = await fetchAyah(parsed.surah, parsed.ayah);
        setMessages(prev => [...prev, { role: "assistant", msgType: "ayah", data }]);

      } else if (parsed.mode === "surah") {
        // Pure API fetch — no AI
        const chapter = await fetchSurahMeta(parsed.num);
        setMessages(prev => [...prev, { role: "assistant", msgType: "surah", data: chapter }]);

      } else if (parsed.mode === "search") {
        // Pure API search — no AI
        const result   = await searchByWord(parsed.query);
        const enriched = await Promise.all(
          result.groups.map(async g => ({ ...g, surahName: await getSurahName(g.surah) }))
        );
        setMessages(prev => [...prev, { role: "assistant", msgType: "search", data: { ...result, groups: enriched } }]);

      } else {
        // Factual Q&A — AI via secure proxy, strict limits
        const answer = await callAI(FACTUAL_SYSTEM, parsed.question, 300);
        setMessages(prev => [...prev, {
          role: "assistant", msgType: "factual",
          content: answer || "Unable to process. Please consult a scholar.",
        }]);
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role:    "assistant",
        msgType: "error",
        content: "Could not fetch data. Please check your connection and try again.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  const EXAMPLE_CHIPS = ["2:255", "25:27", "Surah 36", "search: patience", "search: সবর", "What are the prayer times?"];

  return (
    <>
      <style>{CSS}</style>

      {/* HEADER */}
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

      {/* MESSAGES */}
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

      {/* INPUT */}
      <div className="input-area">
        <div className="mode-hints">
          <span className="hint">2:255 → ayah</span>
          <span className="hint">Surah 18 → chapter</span>
          <span className="hint">search: sabr → word search</span>
          <span className="hint">what / when / which → factual only</span>
        </div>
        <div className="chips">
          {EXAMPLE_CHIPS.map(ex => (
            <button key={ex} className="chip" onClick={() => setInput(ex)}>{ex}</button>
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
// BUBBLE COMPONENT
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
        <p className="greeting">As-salamu alaykum. This is a Quran Reference tool — not an interpreter.</p>
        <div className="mode-list">
          <div className="mode-item"><span className="tag green">📖 AYAH</span><span>Type <code>2:255</code> — get Arabic, English, Bengali &amp; tafsir.</span></div>
          <div className="mode-item"><span className="tag green">📚 SURAH</span><span>Type <code>Surah 36</code> — get chapter facts.</span></div>
          <div className="mode-item"><span className="tag green">🔍 SEARCH</span><span>Type <code>search: sabr</code> — every ayah with that word, grouped by surah.</span></div>
          <div className="mode-item"><span className="tag green">❓ FACTUAL</span><span>Ask <em>what, when, which, who</em> — factual only. "Why" and interpretive questions are refused.</span></div>
        </div>
        <div className="warn-box">⚠️ This tool shows verified data only. For understanding and meaning, always consult a qualified scholar and verified tafsir.</div>
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
        <div className="section-label gold">❓ Factual Reference</div>
        <p className="factual-answer">{msg.content}</p>
        <div className="warn-box">⚠️ Always verify with a qualified Islamic scholar.</div>
      </div>
    </div>
  );

  if (msg.msgType === "ayah") {
    const d = msg.data;
    return (
      <div className="msg">
        <div className="avatar ai">📖</div>
        <div className="bubble ai">
          <span className="ayah-badge">Ayah {d.key}</span>
          {d.arabic  && <div className="arabic">{d.arabic}</div>}
          {d.english && <div className="trans-block"><div className="trans-label">🇬🇧 English — Dr. Mustafa Khattab</div><div>{stripHtml(d.english)}</div></div>}
          {d.bengali && <div className="trans-block"><div className="trans-label">🇧🇩 বাংলা — মুহিউদ্দীন খান</div><div className="bangla">{stripHtml(d.bengali)}</div></div>}
          {d.tafsir  && (
            <>
              <div className="divider" />
              <div className="section-label gold">📚 {d.tafsirName} <span className="muted">(source text — not AI generated)</span></div>
              <div className="tafsir-text">{stripHtml(d.tafsir).slice(0, 700)}{stripHtml(d.tafsir).length > 700 ? "…" : ""}</div>
            </>
          )}
          <div className="warn-box">ℹ️ Read tafsir in full context. Consult a qualified scholar for deeper understanding.</div>
        </div>
      </div>
    );
  }

  if (msg.msgType === "surah") {
    const c = msg.data;
    if (!c) return null;
    const rows = [
      ["Arabic Name",       c.name_arabic],
      ["Transliteration",   c.name_simple],
      ["Meaning",           c.translated_name?.name],
      ["Revelation Period", c.revelation_place ? c.revelation_place[0].toUpperCase() + c.revelation_place.slice(1) : null],
      ["Number of Ayat",    c.verses_count],
      ["Surah Number",      c.id],
    ].filter(([, v]) => v);
    return (
      <div className="msg">
        <div className="avatar ai">📖</div>
        <div className="bubble ai">
          <div className="section-label gold">📚 Surah Information</div>
          <div className="surah-name-ar">{c.name_arabic}</div>
          <table className="info-table">
            <tbody>
              {rows.map(([label, val]) => (
                <tr key={label}>
                  <td className="info-label">{label}</td>
                  <td className="info-val">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="warn-box">ℹ️ For deeper understanding, consult verified tafsir sources.</div>
        </div>
      </div>
    );
  }

  if (msg.msgType === "search") {
    const { query, groups, total } = msg.data;
    return (
      <div className="msg">
        <div className="avatar ai">📖</div>
        <div className="bubble ai">
          <div className="section-label green">
            🔍 &ldquo;{query}&rdquo; — {total} result{total !== 1 ? "s" : ""} in {groups.length} surah{groups.length !== 1 ? "s" : ""}
          </div>
          {groups.length === 0 && <p className="muted" style={{fontStyle:"italic",padding:"8px 0"}}>No ayat found. Try a different word or spelling.</p>}
          {groups.map(g => (
            <div key={g.surah} className="search-group">
              <div className="search-group-hdr">
                <span>{g.surahName || `Surah ${g.surah}`}</span>
                <span className="count-badge">{g.ayat.length} ayah{g.ayat.length !== 1 ? "s" : ""}</span>
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
          <div className="warn-box">ℹ️ Read each ayah in its full context. Use the ayah lookup (e.g. 2:255) for translations and tafsir.</div>
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
    --ink:     #1a1209;
    --parch:   #f5efe0;
    --gold:    #c8963e;
    --green:   #2d5a3d;
    --green2:  #3d7a52;
    --border:  rgba(200,150,62,0.28);
    --shadow:  rgba(26,18,9,0.12);
    --warn:    #92400e;
    --warn-bg: #fffbeb;
  }

  html, body { height: 100%; }
  body { font-family: 'Lora', Georgia, serif; background: var(--parch); color: var(--ink); min-height: 100vh;
    background-image: radial-gradient(ellipse at 20% 0%, rgba(200,150,62,0.08) 0%, transparent 50%),
                      radial-gradient(ellipse at 80% 100%, rgba(45,90,61,0.06) 0%, transparent 50%); }
  #root { height: 100vh; display: flex; flex-direction: column; max-width: 860px; margin: 0 auto; }

  /* HEADER */
  .header { padding: 16px 26px 14px; border-bottom: 1px solid var(--border); background: rgba(245,239,224,0.97); position: sticky; top: 0; z-index: 10; backdrop-filter: blur(8px); }
  .header-top { display: flex; align-items: center; gap: 13px; }
  .logo { width: 42px; height: 42px; background: var(--green); border-radius: 10px; display: grid; place-items: center; font-size: 20px; box-shadow: 0 2px 10px rgba(45,90,61,0.3); flex-shrink: 0; }
  .title { font-size: 1.4rem; font-weight: 600; color: var(--green); line-height: 1.1; }
  .subtitle { font-size: 0.69rem; color: var(--gold); font-style: italic; margin-top: 2px; }
  .integrity-badge { margin-left: auto; display: flex; align-items: center; gap: 5px; font-family: 'JetBrains Mono', monospace; font-size: 0.58rem; color: var(--green2); background: rgba(45,90,61,0.08); border: 1px solid rgba(45,90,61,0.2); border-radius: 20px; padding: 4px 10px; white-space: nowrap; }
  .integrity-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green2); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }

  /* MESSAGES */
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

  /* WELCOME */
  .bismillah { font-family: 'UthmanNaskh', serif; font-size: 1.55rem; line-height: 2; text-align: center; color: var(--green); margin-bottom: 10px; direction: rtl; }
  .greeting { font-weight: 600; margin-bottom: 13px; }
  .mode-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 13px; }
  .mode-item { display: flex; gap: 9px; align-items: flex-start; font-size: 0.83rem; }
  .tag { font-family: 'JetBrains Mono', monospace; font-size: 0.58rem; border-radius: 4px; padding: 2px 7px; white-space: nowrap; align-self: center; flex-shrink: 0; color: white; }
  .tag.green { background: var(--green); }
  .mode-item code { font-family: 'JetBrains Mono', monospace; background: rgba(200,150,62,0.12); padding: 1px 5px; border-radius: 3px; font-size: 0.79rem; }
  .warn-box { font-size: 0.74rem; color: var(--warn); background: var(--warn-bg); border: 1px solid rgba(146,64,14,0.18); border-radius: 5px; padding: 7px 11px; margin-top: 10px; }

  /* SHARED */
  .section-label { font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
  .section-label.gold { color: var(--gold); }
  .section-label.green { color: var(--green2); }
  .muted { color: #9ca3af; font-size: 0.58rem; }
  .divider { height: 1px; background: var(--border); margin: 12px 0; }

  /* ARABIC */
  .arabic { font-family: 'UthmanNaskh', 'Scheherazade New', serif; font-size: 1.82rem; line-height: 2.55; text-align: right; direction: rtl; color: var(--ink); padding: 16px 20px; background: linear-gradient(135deg, rgba(200,150,62,0.05), rgba(45,90,61,0.04)); border-radius: 8px; border: 1px solid var(--border); margin-bottom: 11px; }

  /* TRANSLATIONS */
  .trans-block { background: rgba(45,90,61,0.04); border-left: 3px solid var(--green2); padding: 9px 13px; border-radius: 0 7px 7px 0; margin-bottom: 9px; }
  .trans-label { font-family: 'JetBrains Mono', monospace; font-size: 0.59rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--gold); margin-bottom: 4px; }
  .bangla { font-size: 0.95rem; line-height: 1.85; }

  /* TAFSIR */
  .tafsir-text { font-size: 0.83rem; line-height: 1.82; color: #374151; font-style: italic; }

  /* AYAH BADGE */
  .ayah-badge { display: inline-block; font-family: 'JetBrains Mono', monospace; font-size: 0.66rem; background: var(--gold); color: white; padding: 2px 9px; border-radius: 12px; margin-bottom: 12px; }

  /* SURAH INFO */
  .surah-name-ar { font-family: 'UthmanNaskh', serif; font-size: 1.9rem; line-height: 2; text-align: center; color: var(--green); direction: rtl; margin-bottom: 12px; }
  .info-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  .info-label { padding: 5px 12px 5px 0; color: var(--gold); font-family: 'JetBrains Mono', monospace; font-size: 0.66rem; white-space: nowrap; vertical-align: top; }
  .info-val { padding: 5px 0; font-weight: 500; }

  /* SEARCH */
  .search-group { margin-bottom: 16px; }
  .search-group-hdr { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; font-weight: 600; color: var(--green); padding: 4px 0; border-bottom: 1px solid var(--border); margin-bottom: 7px; display: flex; justify-content: space-between; align-items: center; }
  .count-badge { font-size: 0.58rem; color: var(--gold); background: rgba(200,150,62,0.1); padding: 2px 7px; border-radius: 10px; }
  .search-ayah { padding: 7px 0; border-bottom: 1px dashed rgba(200,150,62,0.15); }
  .search-ayah:last-child { border-bottom: none; }
  .search-key { font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; color: var(--gold); margin-bottom: 3px; }
  .search-ar { font-family: 'UthmanNaskh', serif; font-size: 1.28rem; line-height: 2.1; direction: rtl; text-align: right; color: var(--ink); margin-bottom: 3px; }
  .search-en { font-size: 0.81rem; color: #4b5563; line-height: 1.65; font-style: italic; }

  /* FACTUAL */
  .factual-answer { font-size: 0.9rem; line-height: 1.75; margin-bottom: 8px; }

  /* LOADING */
  .dots { display: flex; gap: 4px; padding: 5px 2px; }
  .dots span { width: 7px; height: 7px; border-radius: 50%; background: var(--gold); animation: dot 1.2s infinite; }
  .dots span:nth-child(2) { animation-delay: 0.2s; }
  .dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes dot { 0%,80%,100%{transform:scale(0.8);opacity:0.4} 40%{transform:scale(1.2);opacity:1} }

  /* INPUT */
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
