# 🚀 Hadi — Deployment Guide

---

## প্রয়োজনীয় জিনিস (Prerequisites)

- [Node.js](https://nodejs.org) v18 বা তার উপরে
- [Git](https://git-scm.com)
- [GitHub](https://github.com) অ্যাকাউন্ট
- [Vercel](https://vercel.com) অ্যাকাউন্ট (GitHub দিয়ে সাইন আপ করুন)
- Anthropic API Key — [console.anthropic.com](https://console.anthropic.com)

---

## ধাপ ১ — GitHub রিপোজিটরি তৈরি করুন

```bash
# প্রজেক্ট ফোল্ডারে যান
cd hadi-quran

# Git শুরু করুন
git init
git add .
git commit -m "initial commit: Hadi Quran Reference v2"

# GitHub-এ নতুন repository তৈরি করুন (github.com/new)
# তারপর:
git remote add origin https://github.com/YOUR_USERNAME/hadi-quran.git
git branch -M main
git push -u origin main
```

---

## ধাপ ২ — Vercel-এ Deploy করুন

### অপশন A — GitHub Integration (সহজ, প্রস্তাবিত)

1. [vercel.com](https://vercel.com) → **Add New Project**
2. GitHub repository নির্বাচন করুন: `hadi-quran`
3. Framework: **Vite** (Vercel নিজেই চিনবে)
4. **Deploy** চাপুন — প্রথমবার AI কাজ করবে না, কিন্তু বাকি সব করবে
5. পরের ধাপে API Key যোগ করুন, তারপর Redeploy

### অপশন B — Vercel CLI

```bash
# Vercel CLI ইনস্টল করুন
npm i -g vercel

# Deploy করুন
vercel

# প্রশ্নের উত্তর:
# Set up and deploy? → Y
# Which scope? → আপনার অ্যাকাউন্ট
# Link to existing project? → N
# Project name? → hadi-quran
# Directory? → ./
# Override settings? → N
```

---

## ধাপ ৩ — Environment Variable যোগ করুন ⚠️ গুরুত্বপূর্ণ

এটি ছাড়া AI (জিজ্ঞাসা পেজ) কাজ করবে না।

1. **vercel.com** → আপনার প্রজেক্ট → **Settings** → **Environment Variables**
2. নিচের ভেরিয়েবলটি যোগ করুন:

| Name | Value | Environments |
|------|-------|--------------|
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...আপনার আসল key...` | ✅ Production ✅ Preview ✅ Development |

3. **Save** চাপুন

> ⚠️ `VITE_` prefix দেবেন না। Key সার্ভার-সাইডে থাকে, ব্রাউজারে যায় না।

---

## ধাপ ৪ — Redeploy করুন

**Vercel Dashboard** → **Deployments** → সর্বশেষ deployment → **⋯** → **Redeploy**

অথবা GitHub-এ যেকোনো পরিবর্তন push করলে auto-deploy হবে।

---

## ধাপ ৫ — যাচাই করুন

আপনার URL খুলুন এবং এগুলো পরীক্ষা করুন:

| পরীক্ষা | প্রত্যাশিত ফলাফল |
|---------|-----------------|
| হোম পেজ লোড | আজকের আয়াত দেখাবে |
| `2:255` লুকআপ | আরবি + বাংলা + ইংরেজি + তাফসীর |
| সূরা ব্রাউজ → সূরা ১ | ফাতিহার সব আয়াত |
| খোঁজ: সবর | আয়াত তালিকা |
| জিজ্ঞাসা: "নামাজের ওয়াক্ত কয়টি?" | AI উত্তর দেবে |
| থিম বাটন | থিম পরিবর্তন হবে |
| অডিও বাটন | তিলাওয়াত চলবে |

---

## লোকাল ডেভেলপমেন্ট

```bash
# নির্ভরতা ইনস্টল
npm install

# .env ফাইল তৈরি করুন
echo "ANTHROPIC_API_KEY=sk-ant-api03-your-key" > .env

# চালান
npm run dev

# http://localhost:5173 এ খুলবে
```

> **নোট**: লোকাল dev-এ `/api/ask` কাজ নাও করতে পারে কারণ Vercel serverless functions লোকালি আলাদাভাবে চলে।
> লোকাল AI test করতে: `npm i -g vercel && vercel dev`

---

## প্রজেক্ট স্ট্রাকচার যাচাই করুন

আপনার GitHub repo root-এ ঠিক এভাবে থাকতে হবে:

```
your-repo/                  ← repo ROOT (এখানেই সব থাকবে)
├── api/
│   └── ask.js              ← ⚠️ এটি root-এ থাকা MUST
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── hooks/
│   └── utils/
├── index.html
├── package.json
├── vite.config.js
├── vercel.json             ← ⚠️ এটিও root-এ থাকা MUST
├── .gitignore
├── DEPLOY.md
└── README.md
```

> ⚠️ `api/` ফোল্ডার যদি কোনো subfolder-এর ভেতরে থাকে (যেমন `hadi-quran/api/`) তাহলে Vercel serverless function কাজ করবে না।

---

## কাস্টম ডোমেইন যোগ করুন (ঐচ্ছিক)

1. Vercel Dashboard → **Settings** → **Domains**
2. আপনার ডোমেইন লিখুন (যেমন: `hadi.app` বা `hadiapp.com`)
3. DNS settings-এ Vercel-এর নির্দেশ অনুসরণ করুন

---

## সমস্যা সমাধান (Troubleshooting)

### AI কাজ করছে না (400/500 error)
- Vercel Environment Variables-এ `ANTHROPIC_API_KEY` আছে কিনা চেক করুন
- Key-এ `VITE_` prefix নেই তো?
- Redeploy করুন — env var save করার পরে redeploy করতে হবে

### আয়াত লোড হচ্ছে না
- `api.quran.com` accessible কিনা চেক করুন
- Browser console-এ CORS error আছে কিনা দেখুন

### অডিও চলছে না
- Mobile-এ প্রথমবার user interaction দরকার (autoplay policy)
- `cdn.islamic.network` blocked নয় তো?

### থিম সেভ হচ্ছে না
- Browser-এ localStorage enabled আছে কিনা চেক করুন
- Incognito/Private mode-এ localStorage কাজ করে না

---

## নিরাপত্তা চেকলিস্ট (Security Checklist)

- [x] `ANTHROPIC_API_KEY` শুধু Vercel Environment Variables-এ
- [x] `.env` ফাইল `.gitignore`-এ আছে
- [x] API key কখনো browser source code-এ দেখা যায় না
- [x] `/api/ask` শুধু POST accept করে
- [x] HTTPS Vercel-এ automatic
- [x] Security headers `vercel.json`-এ সেট করা

---

## আপডেট Deploy করুন

```bash
# পরিবর্তন করুন
git add .
git commit -m "update: description of changes"
git push

# Vercel auto-deploy করবে GitHub push-এ
```

---

বারাকাল্লাহু ফিকুম 🤲
