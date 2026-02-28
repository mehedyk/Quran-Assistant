# 🕌 Quran Assistant
**Verified · Bilingual (EN + বাংলা) · Anti-hallucination**

> "And We have certainly made the Quran easy for remembrance, so is there any who will remember?" — 54:17

---

## 🛡️ Security Architecture

This app is designed with **zero trust** principles:

### Data Integrity
- **Only** `api.quran.com` (official, maintained by Quran.com Foundation) is used for all Quranic text
- Arabic text: Uthmani script from verified digitized Mushaf
- Bengali translation: Muhiuddin Khan (most widely accepted in Bangladesh)
- English translation: Dr. Mustafa Khattab (The Clear Quran)
- Tafsir: Ibn Kathir (authenticated classical scholarship)

### AI Guardrails (Anti-Hallucination)
The AI layer (Claude) operates under **strict system prompts** that:
1. **Forbid** inventing any Quranic text, ayah numbers, or hadith
2. **Forbid** fabricating scholarly opinions
3. **Only allow** explaining data that was fetched from the verified API
4. If unsure → explicitly say "consult a qualified scholar"

This means the AI **cannot** corrupt, modify, or mix the Quran.

---

## 🚀 Setup & Run

```bash
npm install
npm run dev
```

### Environment Variables (for production)
Create `.env`:
```
VITE_ANTHROPIC_API_KEY=your_key_here
```

> ⚠️ **IMPORTANT**: Never commit `.env` to GitHub. Add it to `.gitignore`.

---

## 🌐 Deployment (Free)

### Option 1: Vercel (Recommended)
```bash
npm install -g vercel
vercel
```
- Add `VITE_ANTHROPIC_API_KEY` in Vercel dashboard → Settings → Environment Variables
- Auto-deploys on every git push ✅

### Option 2: Netlify
- Connect GitHub repo
- Build command: `npm run build`
- Publish directory: `dist`
- Add environment variable in Netlify dashboard

---

## 📱 Mobile App (Free — Capacitor)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "Quran Assistant" com.mehedyk.quranassistant
npm run build
npx cap add android
npx cap sync
npx cap open android  # Opens Android Studio
```

---

## 🔒 Security Checklist Before Going Public

- [ ] API key in `.env`, never in code
- [ ] Add `.env` to `.gitignore`
- [ ] Use Vercel/Netlify environment variables (server-side)
- [ ] Consider a backend proxy for the Anthropic API key (so it's never exposed in browser)
- [ ] Add rate limiting if you host publicly
- [ ] HTTPS always (Vercel/Netlify handle this automatically)

---

## 📁 Project Structure

```
quran-assistant/
├── src/
│   ├── App.jsx          ← Main app (UI + logic)
│   └── main.jsx         ← React entry point
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## 🧩 Feature Roadmap

- [x] Ayah lookup by reference (2:255)
- [x] Arabic + English + Bengali display
- [x] Ibn Kathir tafsir
- [x] Thematic search ("what does Quran say about...")
- [x] Surah info
- [ ] Audio recitation (quran.com API supports this)
- [ ] Bookmark system
- [ ] Offline mode (cached surahs)
- [ ] Dark mode
- [ ] Share ayah as image

---

## 📜 Data Sources

| Content | Source | License |
|---|---|---|
| Quranic Text | api.quran.com | Open |
| English Translation | The Clear Quran (Khattab) | Via quran.com API |
| Bengali Translation | Muhiuddin Khan | Via quran.com API |
| Tafsir | Ibn Kathir | Classical, public domain |

---

Built by **S.M. Mehedy Kawser** — may this be a sadaqah jariyah.