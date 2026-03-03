# 🚀 Hadi v2 — Deployment Guide

---

## প্রয়োজনীয় · Prerequisites

- Node.js v18+
- Git + GitHub account
- Vercel account (sign up with GitHub at vercel.com)
- Anthropic API Key from [console.anthropic.com](https://console.anthropic.com)

---

## ⚠️ সবচেয়ে গুরুত্বপূর্ণ নিয়ম · Critical Rule

**`api/` ফোল্ডার এবং `vercel.json` অবশ্যই repo ROOT-এ থাকতে হবে।**
কোনো subfolder-এর ভেতরে থাকলে Vercel serverless function কাজ করবে না।

সঠিক structure:
```
your-repo/           ← ROOT (এখানেই সব)
├── api/
│   └── ask.js       ← ✅ এখানে থাকতে MUST
├── src/
├── vercel.json      ← ✅ এখানে থাকতে MUST
└── ...
```

ভুল:
```
your-repo/
└── hadi-v3/         ← ❌ এভাবে subfolder হলে AI কাজ করবে না
    ├── api/
    └── ...
```

---

## ধাপ ১ — ফাইল প্রস্তুত করুন

Zip খুলুন। `hadi-v3/` ফোল্ডারের **ভেতরের সব ফাইল** আপনার GitHub repo-তে কপি করুন।

---

## ধাপ ২ — GitHub-এ Push করুন

```bash
cd your-repo-folder
git add .
git commit -m "Hadi v2 — complete rebuild"
git push
```

---

## ধাপ ৩ — Vercel-এ Environment Variable যোগ করুন

**vercel.com → Project → Settings → Environment Variables**

| Name | Value | Environments |
|------|-------|--------------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | ✅ Production ✅ Preview ✅ Development |

> ⚠️ `VITE_` prefix দেবেন না। Key শুধু server-side-এ থাকে।

---

## ধাপ ৪ — Redeploy করুন

Vercel Dashboard → Deployments → সর্বশেষটি → ⋯ → **Redeploy**

GitHub-এ push করলেও auto-deploy হয়।

---

## ধাপ ৫ — যাচাই করুন

| পরীক্ষা | প্রত্যাশিত |
|---------|-----------|
| হোম লোড | আজকের আয়াত দেখাবে |
| `2:255` | আরবি + বাংলা + ইংরেজি + তাফসীর |
| সূরা ১ | ফাতিহার সব আয়াত |
| খোঁজ: সবর | আয়াত তালিকা |
| জিজ্ঞাসা: নামাজের ওয়াক্ত কয়টি? | AI উত্তর দেবে |
| Language বাটন | UI ভাষা পরিবর্তন হবে |
| Theme বাটন | থিম পরিবর্তন হবে |
| ▶ তিলাওয়াত | অডিও চলবে |
| 📤 শেয়ার | ইমেজ কার্ড ডাউনলোড হবে |

---

## লোকাল ডেভেলপমেন্ট

```bash
npm install
echo "ANTHROPIC_API_KEY=sk-ant-api03-your-key" > .env
npm run dev
# http://localhost:5173
```

> AI locally test করতে: `npm i -g vercel && vercel dev`

---

## সমস্যা সমাধান · Troubleshooting

**AI কাজ করছে না (400/500)**
→ `ANTHROPIC_API_KEY` Vercel-এ আছে কিনা দেখুন
→ `VITE_` prefix নেই তো?
→ Save করার পরে Redeploy করেছেন?

**আয়াত লোড হচ্ছে না**
→ `api.quran.com` accessible কিনা চেক করুন

**অডিও চলছে না**
→ মোবাইলে প্রথমে user tap দরকার (browser autoplay policy)

**থিম বা ভাষা সেভ হচ্ছে না**
→ Incognito mode-এ localStorage কাজ করে না

---

বারাকাল্লাহু ফিকুম 🤲
