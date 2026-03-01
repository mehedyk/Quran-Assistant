# 🕌 Quran Assistant
**Verified · Bilingual (EN + বাংলা) · No AI Interpretation**

> "And We have certainly made the Quran easy for remembrance, so is there any who will remember?" — 54:17

---

## ⚠️ Integrity Statement

This tool does **not** interpret the Quran. It does not synthesize, explain, or reason about Quranic meaning using AI. Every piece of Islamic content displayed comes from verified, authenticated sources through the `api.quran.com` API.

The AI layer has exactly one permitted function: answering **narrow factual questions** (what, when, which, who, how many). "Why" questions, interpretive questions, and anything requiring scholarly opinion are **architecturally blocked** — the AI is instructed to refuse and redirect to scholars.

If you display this tool to others, please make sure they understand: **a software tool is not a scholar.**

---

## 🗂️ What the App Does

| Mode | How to use | What happens |
|---|---|---|
| **Ayah lookup** | Type `2:255` | Fetches Arabic (KFGQPC Uthman Taha Naskh font), English (Dr. Khattab), Bengali (Muhiuddin Khan), and tafsir (Ahsanul Bayaan / Ibn Kathir fallback). No AI. |
| **Surah info** | Type `Surah 18` | Fetches chapter facts from API: name, revelation period, ayah count. No AI. |
| **Word search** | Type `search: sabr` | Searches all 6,236 ayat for the word. Returns every match grouped by surah with Arabic and English. No AI. |
| **Factual Q&A** | Ask `What are the prayer times?` | AI answers **only** factual, non-interpretive questions. Refuses "why" and conceptual questions. |

---

## 🔒 Anti-Hallucination Architecture

The core design principle: **the AI never generates Islamic content from its own knowledge.**

```
User Input
    │
    ▼
┌─────────────────────────────────────────────┐
│ Input Parser                                 │
│  - ayah ref (2:255) → API fetch, no AI       │
│  - surah ref (Surah 18) → API fetch, no AI   │
│  - search: word → API search, no AI          │
│  - factual question → AI with hard limits    │
└─────────────────────────────────────────────┘
    │
    ▼ (for factual Q&A only)
┌─────────────────────────────────────────────┐
│ AI Guardrails (System Prompt)                │
│  ✅ ALLOWED: what, when, which, who, count   │
│  ❌ BLOCKED: why, how to, explain, interpret │
│  ❌ BLOCKED: rulings, ijtihad, opinions      │
│  ❌ BLOCKED: any synthesis of multiple ayat  │
│  → If blocked: redirects to scholar          │
└─────────────────────────────────────────────┘
```

---

## 📖 Data Sources

| Content | Source | Cost |
|---|---|---|
| Arabic text | `api.quran.com` — Uthmani Mushaf | Free |
| English translation | Dr. Mustafa Khattab (ID: 131) | Free via API |
| Bengali translation | Muhiuddin Khan (ID: 161) | Free via API |
| Bengali tafsir (primary) | Ahsanul Bayaan (ID: 165) | Free via API |
| English tafsir (fallback) | Ibn Kathir (ID: 169) | Free via API |
| Arabic font | KFGQPC Uthman Taha Naskh — King Fahd Quran Printing Complex | Free |

---

## 🚀 Setup & Run Locally

### 1. Clone and install

```bash
git clone https://github.com/mehedyk/quran-assistant.git
cd quran-assistant
npm install
```

### 2. Set your API key

Create a `.env` file in the project root:

```bash
# .env
VITE_ANTHROPIC_API_KEY=your_key_here
```

> **Never commit `.env` to Git.** It is already in `.gitignore`.

### 3. Connect the key in `src/App.jsx`

In the `answerFactualQuestion` function, update the fetch headers:

```js
headers: {
  "Content-Type": "application/json",
  "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
  "anthropic-version": "2023-06-01",
  "anthropic-dangerous-direct-browser-access": "true",
},
```

### 4. Run

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## 🌐 Deploy to Vercel (Free)

### Option A — Vercel CLI

```bash
npm install -g vercel
npm run build
vercel
```

Follow the prompts. Then go to:  
**Vercel Dashboard → Your Project → Settings → Environment Variables**

Add:
```
VITE_ANTHROPIC_API_KEY = sk-ant-...
```

Redeploy once after adding the variable.

### Option B — GitHub Integration (Recommended)

1. Push this repo to your GitHub (`github.com/mehedyk/quran-assistant`)
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Add `VITE_ANTHROPIC_API_KEY` in the Environment Variables section during setup
4. Click Deploy

Every `git push` to `main` will auto-deploy. ✅

> **Production note:** For a production app, move the Anthropic API call to a backend function (Vercel Serverless Function or Edge Function) so the API key is never exposed in the browser bundle. The `vercel.json` in this repo includes a basic rewrite setup for this.

---

## 📱 Mobile App (Android — Free)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Quran Assistant" com.mehedyk.quranassistant --web-dir dist
npm run build
npx cap add android
npx cap sync
npx cap open android
```

Requires Android Studio. Free to build; Google Play publishing = $25 one-time fee.

---

## 🔒 Security Checklist

- [ ] `.env` is in `.gitignore` — never pushed
- [ ] API key set in Vercel environment variables, not in code
- [ ] `anthropic-dangerous-direct-browser-access` header understood — move to backend for production
- [ ] HTTPS enforced automatically by Vercel
- [ ] No user data is collected or stored anywhere

---

## 📁 Project Structure

```
quran-assistant/
├── src/
│   ├── App.jsx          ← Entire app: API, logic, UI, CSS
│   └── main.jsx         ← React entry point
├── index.html
├── vite.config.js
├── vercel.json          ← Vercel deployment config
├── package.json
├── .gitignore
└── README.md
```

---

## 🗺️ Roadmap

- [x] Ayah lookup — Arabic + EN + BN + tafsir
- [x] Surah info
- [x] Word/keyword search, grouped by surah
- [x] Factual Q&A with strict AI guardrails
- [x] KFGQPC Uthman Taha Naskh (Classic Madani) font
- [x] Tafsir Ahsanul Bayaan (Bengali primary)
- [ ] Audio recitation per ayah (quran.com supports this)
- [ ] Bookmark ayat locally
- [ ] Share ayah as image card
- [ ] PWA offline support (cache frequently used surahs)
- [ ] Android app via Capacitor

---

## 🤲 Intention

This project is built as *sadaqah jariyah* — ongoing charity. May it benefit the Ummah and be counted as a good deed for everyone who contributed to it.

**وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ**  
*"My success is only through Allah."* — Quran 11:88

---

Built by **S.M. Mehedy Kawser** — [github.com/mehedyk](https://github.com/mehedyk) · [mehedy.netlify.app](https://mehedy.netlify.app)
