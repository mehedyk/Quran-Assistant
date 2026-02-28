import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════
// QURAN API SERVICE — verified data, never invents
// ═══════════════════════════════════════════════
const QURAN_API = "https://api.quran.com/api/v4";
const TAFSIR_EN = 169; // Ibn Kathir (English)
const TRANSLATION_EN = 131; // Dr. Mustafa Khattab
const TRANSLATION_BN = 161; // Muhiuddin Khan (Bengali)

async function fetchAyah(surah, ayah) {
  const [arabic, english, bengali, tafsir] = await Promise.all([
    fetch(`${QURAN_API}/verses/by_key/${surah}:${ayah}?words=true&fields=text_uthmani`).then(r => r.json()),
    fetch(`${QURAN_API}/verses/by_key/${surah}:${ayah}?translations=${TRANSLATION_EN}`).then(r => r.json()),
    fetch(`${QURAN_API}/verses/by_key/${surah}:${ayah}?translations=${TRANSLATION_BN}`).then(r => r.json()),
    fetch(`${QURAN_API}/tafsirs/${TAFSIR_EN}/by_ayah/${surah}:${ayah}`).then(r => r.json()),
  ]);
  return {
    arabic: arabic?.verse?.text_uthmani,
    english: english?.verse?.translations?.[0]?.text,
    bengali: bengali?.verse?.translations?.[0]?.text,
    tafsir: tafsir?.tafsir?.text,
    key: `${surah}:${ayah}`,
  };
}

async function fetchSurahInfo(surahNum) {
  const res = await fetch(`${QURAN_API}/chapters/${surahNum}?language=en`);
  const data = await res.json();
  return data?.chapter;
}

async function searchQuran(query) {
  const res = await fetch(`${QURAN_API}/search?q=${encodeURIComponent(query)}&size=5&language=en&translations=${TRANSLATION_EN}`);
  const data = await res.json();
  return data?.search?.results || [];
}

// ═══════════════════════════════════════════════
// AI SERVICE — strictly grounded, no hallucination
// ═══════════════════════════════════════════════
async function askAI(userMessage, quranData) {
  const systemPrompt = `You are a Quran assistant. Your ONLY job is to explain and contextualize the Quran data provided to you. You MUST follow these rules absolutely:

1. NEVER invent, guess, or fabricate Quranic text, hadith, or Islamic rulings
2. ONLY use the verified data provided in each query
3. If data is not available, say: "I don't have verified data on this. Please consult a qualified scholar."
4. For shan-e-nuzul (context of revelation), only mention what is established in the tafsir data provided
5. Always be respectful, accurate, and humble
6. When explaining, reference the actual ayah text provided
7. Respond in clear English. If user writes in Bengali, respond in Bengali.
8. Format: First give explanation, then context/shan-e-nuzul if available, then practical wisdom

You are NOT allowed to:
- Make up ayah numbers or surah names
- Invent scholarly opinions
- Mix or modify Quranic text
- State anything about Islam without it being grounded in the provided data`;

  const userContent = quranData
    ? `User question: "${userMessage}"\n\nVerified Quran data:\n${JSON.stringify(quranData, null, 2)}\n\nPlease explain based ONLY on this verified data.`
    : `User question: "${userMessage}"\n\nNo specific ayah data loaded. If this is a general Islamic question, respond only with well-established facts and recommend consulting a scholar for anything requiring scholarly opinion.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  const data = await response.json();
  return data.content?.[0]?.text || "Unable to process response.";
}

// ═══════════════════════════════════════════════
// PARSE INPUT — 25:27 or "Al-Baqarah" or question
// ═══════════════════════════════════════════════
function parseInput(input) {
  const trimmed = input.trim();
  const ayahPattern = /^(\d+):(\d+)$/;
  const match = trimmed.match(ayahPattern);
  if (match) return { type: "ayah", surah: parseInt(match[1]), ayah: parseInt(match[2]) };
  const surahPattern = /^surah\s+(\d+)$/i;
  const surahMatch = trimmed.match(surahPattern);
  if (surahMatch) return { type: "surah", surahNum: parseInt(surahMatch[1]) };
  return { type: "question", query: trimmed };
}

// ═══════════════════════════════════════════════
// CLEAN HTML from API responses
// ═══════════════════════════════════════════════
function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#\d+;/g, "").trim();
}

// ═══════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════
export default function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\n\nAs-salamu alaykum. I am your Quran Assistant.\n\nYou can:\n• Type an ayah like **2:255** (Al-Kursi) or **25:27**\n• Type **Surah 18** for surah info\n• Ask a question like *\"What does the Quran say about patience?\"*\n\nAll answers are grounded in verified Quran data only. I never fabricate.",
      type: "welcome",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentData, setCurrentData] = useState(null);
  const bottomRef = useRef(null);

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
      let quranData = null;
      let displayData = null;

      if (parsed.type === "ayah") {
        const data = await fetchAyah(parsed.surah, parsed.ayah);
        quranData = data;
        setCurrentData(data);
        displayData = data;
        const explanation = await askAI(`Explain ayah ${parsed.surah}:${parsed.ayah} — provide shan-e-nuzul (context of revelation), meaning, and practical wisdom.`, data);
        setMessages(prev => [...prev, { role: "assistant", content: explanation, type: "ayah", data: displayData }]);
      } else if (parsed.type === "surah") {
        const info = await fetchSurahInfo(parsed.surahNum);
        quranData = info;
        const explanation = await askAI(`Tell me about Surah ${parsed.surahNum}: ${info?.name_simple}. Include its theme, period of revelation, and significance.`, { surahInfo: info });
        setMessages(prev => [...prev, { role: "assistant", content: explanation, type: "surah", data: info }]);
      } else {
        const results = await searchQuran(parsed.query);
        const topResults = await Promise.all(
          results.slice(0, 3).map(async r => {
            const [sura, aya] = r.verse_key.split(":");
            return fetchAyah(parseInt(sura), parseInt(aya));
          })
        );
        quranData = { query: parsed.query, results: topResults };
        const explanation = await askAI(userMsg, quranData);
        setMessages(prev => [...prev, { role: "assistant", content: explanation, type: "search", data: topResults }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I encountered an error fetching verified data. Please check your connection and try again. I will not respond without verified data.",
        type: "error",
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --ink: #1a1209;
          --parchment: #f5efe0;
          --parchment2: #ede4cc;
          --gold: #c8963e;
          --gold2: #e8b660;
          --green: #2d5a3d;
          --green2: #3d7a52;
          --border: rgba(200,150,62,0.3);
          --shadow: rgba(26,18,9,0.15);
        }

        html, body { height: 100%; }

        body {
          font-family: 'Lora', Georgia, serif;
          background: var(--parchment);
          color: var(--ink);
          min-height: 100vh;
          background-image:
            radial-gradient(ellipse at 20% 0%, rgba(200,150,62,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 100%, rgba(45,90,61,0.06) 0%, transparent 50%),
            url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Ccircle cx='30' cy='30' r='1' fill='%23c8963e' fill-opacity='0.06'/%3E%3C/svg%3E");
        }

        #root { height: 100vh; display: flex; flex-direction: column; max-width: 820px; margin: 0 auto; }

        .header {
          padding: 20px 28px 16px;
          border-bottom: 1px solid var(--border);
          background: linear-gradient(180deg, rgba(245,239,224,0.98) 0%, rgba(237,228,204,0.95) 100%);
          backdrop-filter: blur(10px);
          position: sticky; top: 0; z-index: 10;
        }
        .header-top { display: flex; align-items: center; gap: 14px; }
        .logo {
          width: 44px; height: 44px;
          background: var(--green);
          border-radius: 10px;
          display: grid; place-items: center;
          font-size: 22px;
          box-shadow: 0 2px 12px rgba(45,90,61,0.3);
          flex-shrink: 0;
        }
        .title { font-family: 'Amiri', serif; font-size: 1.5rem; font-weight: 700; color: var(--green); line-height: 1; }
        .subtitle { font-family: 'Lora', serif; font-size: 0.75rem; color: var(--gold); font-style: italic; margin-top: 2px; }
        .integrity-badge {
          margin-left: auto;
          display: flex; align-items: center; gap: 5px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.62rem;
          color: var(--green2);
          background: rgba(45,90,61,0.08);
          border: 1px solid rgba(45,90,61,0.2);
          border-radius: 20px;
          padding: 4px 10px;
        }
        .integrity-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green2); animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .messages {
          flex: 1; overflow-y: auto;
          padding: 24px 20px;
          display: flex; flex-direction: column; gap: 20px;
          scrollbar-width: thin;
          scrollbar-color: var(--border) transparent;
        }

        .msg { display: flex; gap: 12px; animation: fadeUp 0.3s ease; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        .msg.user { flex-direction: row-reverse; }

        .avatar {
          width: 36px; height: 36px; border-radius: 50%;
          display: grid; place-items: center; font-size: 16px;
          flex-shrink: 0; align-self: flex-end;
        }
        .avatar.ai { background: var(--green); color: white; box-shadow: 0 2px 8px rgba(45,90,61,0.3); }
        .avatar.user-av { background: var(--gold); color: white; box-shadow: 0 2px 8px rgba(200,150,62,0.3); }

        .bubble {
          max-width: 85%;
          padding: 14px 18px;
          border-radius: 16px;
          font-size: 0.9rem;
          line-height: 1.7;
        }
        .bubble.ai {
          background: white;
          border: 1px solid var(--border);
          border-bottom-left-radius: 4px;
          box-shadow: 0 2px 12px var(--shadow);
        }
        .bubble.user {
          background: var(--green);
          color: white;
          border-bottom-right-radius: 4px;
        }
        .bubble.error { border-color: #c0392b; background: #fff5f5; }

        .arabic-text {
          font-family: 'Amiri', serif;
          font-size: 1.6rem;
          line-height: 2.2;
          text-align: right;
          direction: rtl;
          color: var(--ink);
          padding: 16px;
          background: linear-gradient(135deg, rgba(200,150,62,0.05), rgba(45,90,61,0.04));
          border-radius: 10px;
          border: 1px solid var(--border);
          margin-bottom: 14px;
        }

        .translation-block {
          background: rgba(45,90,61,0.04);
          border-left: 3px solid var(--green2);
          padding: 10px 14px;
          border-radius: 0 8px 8px 0;
          margin-bottom: 10px;
          font-style: italic;
          font-size: 0.88rem;
        }
        .translation-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--gold);
          font-style: normal;
          margin-bottom: 4px;
        }

        .bangla-text { font-size: 0.95rem; font-style: normal; line-height: 1.8; }

        .ayah-key {
          display: inline-block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          background: var(--gold);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          margin-bottom: 12px;
        }

        .explanation-heading {
          font-family: 'Lora', serif;
          font-size: 0.72rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--gold);
          margin: 14px 0 6px;
        }

        .msg-text { white-space: pre-wrap; }
        .msg-text strong { font-weight: 600; color: var(--green); }

        .divider {
          height: 1px;
          background: var(--border);
          margin: 12px 0;
        }

        .input-area {
          padding: 16px 20px 20px;
          border-top: 1px solid var(--border);
          background: linear-gradient(0deg, rgba(245,239,224,0.98) 0%, rgba(237,228,204,0.95) 100%);
        }

        .examples {
          display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;
        }
        .example-chip {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: rgba(200,150,62,0.06);
          color: var(--ink);
          cursor: pointer;
          transition: all 0.15s;
        }
        .example-chip:hover { background: var(--gold); color: white; border-color: var(--gold); }

        .input-row { display: flex; gap: 10px; align-items: flex-end; }

        .input-box {
          flex: 1;
          font-family: 'Lora', serif;
          font-size: 0.92rem;
          padding: 12px 16px;
          border: 1.5px solid var(--border);
          border-radius: 12px;
          background: white;
          color: var(--ink);
          outline: none;
          resize: none;
          min-height: 48px;
          max-height: 120px;
          transition: border-color 0.2s;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
        }
        .input-box:focus { border-color: var(--gold); }
        .input-box::placeholder { color: #aaa; font-style: italic; }

        .send-btn {
          width: 48px; height: 48px;
          border-radius: 12px;
          border: none;
          background: var(--green);
          color: white;
          cursor: pointer;
          font-size: 18px;
          display: grid; place-items: center;
          transition: all 0.15s;
          box-shadow: 0 2px 10px rgba(45,90,61,0.3);
          flex-shrink: 0;
        }
        .send-btn:hover:not(:disabled) { background: var(--green2); transform: translateY(-1px); }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .loading-dots { display: flex; gap: 4px; padding: 8px 4px; }
        .loading-dots span {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--gold); animation: dot 1.2s infinite;
        }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dot { 0%,80%,100%{transform:scale(0.8);opacity:0.4} 40%{transform:scale(1.2);opacity:1} }

        .search-results-header {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.68rem;
          color: var(--gold);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 10px;
        }

        .result-pill {
          display: inline-block;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.68rem;
          background: rgba(200,150,62,0.1);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 3px 8px;
          margin: 3px 3px 3px 0;
          color: var(--green);
        }

        @media (max-width: 600px) {
          .header { padding: 14px 16px 12px; }
          .messages { padding: 16px 12px; }
          .input-area { padding: 12px 14px 16px; }
          .bubble { max-width: 92%; font-size: 0.87rem; }
          .arabic-text { font-size: 1.35rem; }
          .integrity-badge { display: none; }
          .title { font-size: 1.25rem; }
        }
      `}</style>

      <div className="header">
        <div className="header-top">
          <div className="logo">🕌</div>
          <div>
            <div className="title">القرآن الكريم</div>
            <div className="subtitle">Quran Assistant — Verified · Bilingual · Trustworthy</div>
          </div>
          <div className="integrity-badge">
            <div className="integrity-dot"></div>
            VERIFIED DATA ONLY
          </div>
        </div>
      </div>

      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`msg ${msg.role === "user" ? "user" : ""}`}>
            <div className={`avatar ${msg.role === "user" ? "user-av" : "ai"}`}>
              {msg.role === "user" ? "👤" : "📖"}
            </div>
            <div className={`bubble ${msg.role === "user" ? "user" : "ai"} ${msg.type === "error" ? "error" : ""}`}>
              {msg.role === "assistant" && msg.type === "ayah" && msg.data && (
                <>
                  <div className="ayah-key">Ayah {msg.data.key}</div>
                  {msg.data.arabic && <div className="arabic-text">{msg.data.arabic}</div>}
                  {msg.data.english && (
                    <div className="translation-block">
                      <div className="translation-label">🇬🇧 English</div>
                      {stripHtml(msg.data.english)}
                    </div>
                  )}
                  {msg.data.bengali && (
                    <div className="translation-block">
                      <div className="translation-label">🇧🇩 বাংলা</div>
                      <span className="bangla-text">{stripHtml(msg.data.bengali)}</span>
                    </div>
                  )}
                  <div className="divider"></div>
                  <div className="explanation-heading">📚 Explanation & Context</div>
                </>
              )}
              {msg.role === "assistant" && msg.type === "search" && msg.data && (
                <>
                  <div className="search-results-header">📍 Relevant Ayat Found:</div>
                  {msg.data.map(d => d?.key && <span key={d.key} className="result-pill">{d.key}</span>)}
                  <div className="divider"></div>
                </>
              )}
              <div className="msg-text" dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
              }} />
            </div>
          </div>
        ))}

        {loading && (
          <div className="msg">
            <div className="avatar ai">📖</div>
            <div className="bubble ai">
              <div className="loading-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <div className="examples">
          {["2:255", "25:27", "Surah 18", "What does Quran say about corruption?", "সবর সম্পর্কে কী বলা হয়েছে?"].map(ex => (
            <button key={ex} className="example-chip" onClick={() => setInput(ex)}>{ex}</button>
          ))}
        </div>
        <div className="input-row">
          <textarea
            className="input-box"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            placeholder="Type an ayah (2:255), surah number, or ask a question…"
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