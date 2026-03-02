# 🚀 Deployment Instructions — Quran Assistant

---

## Your Project Structure

```
quran-final/
├── api/
│   └── ask.js          ← Vercel serverless function (Anthropic proxy)
├── src/
│   ├── App.jsx         ← Entire frontend
│   └── main.jsx        ← React entry point
├── index.html
├── package.json
├── vite.config.js
├── vercel.json         ← Deployment config
└── .gitignore
```

---

## Step 1 — Push to GitHub

Replace your existing repo files with these. Then:

```bash
git add .
git commit -m "fix: serverless proxy, Bengali search, final architecture"
git push
```

---

## Step 2 — Set Environment Variable in Vercel

Go to:
**vercel.com → Your Project → Settings → Environment Variables**

Add this **one** variable:

| Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-your-real-key-here` |

- Environment: ✅ Production  ✅ Preview  ✅ Development
- Click **Save**

> ⚠️ This is NOT `VITE_ANTHROPIC_API_KEY` — no VITE_ prefix.
> The key lives on the server now, never in the browser.

---

## Step 3 — Redeploy

In Vercel dashboard:
**Deployments → the latest deployment → ⋯ menu → Redeploy**

Or just push any change to GitHub — it auto-deploys.

---

## Step 4 — Verify It Works

Open your app URL and test these in order:

| Input | Expected result |
|---|---|
| `2:255` | Arabic text + English + Bengali + tafsir |
| `Surah 36` | Chapter info table (Ya-Sin) |
| `search: sabr` | List of ayat grouped by surah |
| `search: সবর` | Same results — auto-converts to "sabr" with a note |
| `What are the prayer times?` | Short factual answer from AI |
| `Why does Allah allow suffering?` | Refused — redirects to scholar |

---

## Running Locally (optional)

```bash
npm install
npm run dev
```

For local factual Q&A to work, create a `.env` file:
```
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

---

## What Each File Does

**`api/ask.js`**
Vercel serverless function. When the frontend calls `/api/ask`, this function runs on Vercel's servers, adds your secret API key, and forwards the request to Anthropic. Users in Bangladesh call your Vercel server — Anthropic's geo-restrictions don't apply.

**`vercel.json`**
Tells Vercel: build with Vite, route `/api/*` to serverless functions, route everything else to `index.html` (needed for React SPA), add security headers.

**`src/App.jsx`**
The entire app. Four modes:
- Ayah lookup → pure API, no AI
- Surah info → pure API, no AI
- Word search → pure API, no AI (Bengali auto-transliterated)
- Factual Q&A → AI via proxy, strict guardrails, refuses "why" questions

---

## Security Checklist

- [x] API key is in Vercel environment variables only
- [x] API key never appears in browser source code
- [x] `.env` is in `.gitignore` — never committed
- [x] HTTPS enforced automatically by Vercel
- [x] Security headers set in `vercel.json`
- [x] AI cannot interpret Quran — only answers factual questions
- [x] AI refuses "why", conceptual, and ruling questions

---

بِسْمِ اللَّهِ — may it be accepted. 🤲
