# 🚀 Hadi — Deployment Guide (Vercel only)

This project is designed to be deployed **directly on Vercel** — you do not
need to install Node.js, run `npm install`, or run anything on your own
machine. Vercel builds and hosts everything for you.

---

## ⚠️ সবচেয়ে গুরুত্বপূর্ণ নিয়ম · Critical Rule

**`api/` ফোল্ডার এবং `vercel.json` অবশ্যই repo ROOT-এ থাকতে হবে।**
কোনো subfolder-এর ভেতরে থাকলে Vercel serverless function কাজ করবে না।

সঠিক structure:
```
your-repo/           ← ROOT (এখানেই সব)
├── api/
│   └── ask.js       ← ✅ এখানে থাকতে MUST
├── public/
│   └── logo.svg
├── src/
├── vercel.json      ← ✅ এখানে থাকতে MUST
└── ...
```

---

## ধাপ ১ — GitHub repo তৈরি করুন

GitHub-এ একটা নতুন (empty) repository বানান, তারপর এই ফোল্ডারের সব ফাইল
সেই repo-তে আপলোড করুন — GitHub-এর ওয়েব "Add file → Upload files" দিয়েও
করা যায়, আলাদা কোনো টুল ইনস্টলের দরকার নেই।

---

## ধাপ ২ — Vercel-এ Import করুন

1. [vercel.com](https://vercel.com) → sign in with GitHub
2. **Add New → Project**
3. আপনার repo বেছে নিন → Vercel নিজে থেকেই Vite framework detect করবে
4. এখনই Deploy করবেন না — আগে নিচের ধাপে environment variable যোগ করুন

---

## ধাপ ৩ — Environment Variable যোগ করুন

**Project → Settings → Environment Variables**

| Name | Value | Environments |
|------|-------|--------------|
| `GROQ_API_KEY` | আপনার Groq API key (console.groq.com থেকে, বিনামূল্যে) | ✅ Production ✅ Preview |
| `ALLOWED_ORIGIN` *(optional but recommended)* | `https://your-app.vercel.app` | ✅ Production |
| `GROQ_MODEL` *(optional)* | e.g. `llama-3.3-70b-versatile` | ✅ Production |

> ⚠️ `VITE_` prefix দেবেন না। এই key শুধু server-side-এ (`api/ask.js`) ব্যবহার হয়,
> ব্রাউজারে কখনো পাঠানো হয় না।
>
> Groq API key সম্পূর্ণ **বিনামূল্যে** — কোনো credit card লাগে না।
> [console.groq.com](https://console.groq.com/keys) এ গিয়ে email/Google
> দিয়ে সাইন আপ করুন, "API Keys" থেকে একটা key বানান, এবং সেটা এখানে বসান।

---

## ধাপ ৪ — Deploy

**Deploy** বাটনে চাপুন। Vercel নিজে থেকেই build করবে এবং একটা লাইভ URL দেবে —
এই পুরো প্রক্রিয়ায় আপনার নিজের কম্পিউটারে কিছুই install করতে হয় না।

GitHub repo-তে যেকোনো নতুন push করলে Vercel অটোমেটিক redeploy করবে।

---

## ধাপ ৫ — যাচাই করুন

| পরীক্ষা | প্রত্যাশিত |
|---------|-----------|
| হোম লোড | আজকের আয়াত দেখাবে |
| `2:255` | আরবি + বাংলা + ইংরেজি + তাফসীর |
| সূরা ১ | ফাতিহার সব আয়াত |
| খোঁজ: সবর | আয়াত তালিকা |
| জিজ্ঞাসা: নামাজের ওয়াক্ত কয়টি? | Groq factual উত্তর দেবে |
| জিজ্ঞাসা: কোনো কোড লিখে দাও | ভদ্রভাবে প্রত্যাখ্যান করবে |
| জিজ্ঞাসা: ইসলাম-বহির্ভূত যেকোনো প্রশ্ন | ভদ্রভাবে প্রত্যাখ্যান করবে |
| Language বাটন | UI ভাষা পরিবর্তন হবে |
| Theme বাটন | থিম পরিবর্তন হবে |
| ব্রাউজার ট্যাব | অ্যানিমেটেড ফেভিকন দেখা যাবে |
| ▶ তিলাওয়াত | অডিও চলবে |
| 📤 শেয়ার | ইমেজ কার্ড ডাউনলোড হবে |

---

## Groq API key কীভাবে পাবেন

1. [console.groq.com](https://console.groq.com) → sign up (email বা Google, credit card লাগে না)
2. বাম মেনু থেকে **API Keys** → **Create API Key**
3. Key-টা কপি করে Vercel-এ `GROQ_API_KEY` হিসেবে বসান (ধাপ ৩ দেখুন)

Groq বিভিন্ন open-source মডেল (Llama ইত্যাদি) সুপার-ফাস্ট হার্ডওয়্যারে চালায়।
Free tier-এ প্রতিদিন হাজার হাজার request পাওয়া যায় — এই অ্যাপের মতো ছোট
প্রজেক্টের জন্য যথেষ্ট। ট্রাফিক অনেক বেশি হলে `GROQ_MODEL=llama-3.1-8b-instant`
সেট করুন — এটা `llama-3.3-70b-versatile`-এর চেয়ে বেশি free-tier rate limit দেয়।

এই প্রজেক্ট শুধু `api/ask.js`-এর মাধ্যমে Groq-কে কল করে — API key কখনো
ব্রাউজারে যায় না, এবং ভিজিটর কী প্রশ্ন করতে পারবে তা কঠোরভাবে সীমিত
(`api/ask.js`-এর উপরের কমেন্ট দেখুন)।

---

## সমস্যা সমাধান · Troubleshooting

**AI কাজ করছে না (500)**
→ `GROQ_API_KEY` Vercel-এ Production environment-এ আছে কিনা দেখুন
→ `VITE_` prefix নেই তো?
→ Save করার পরে Redeploy করেছেন?

**AI বলছে "Forbidden" (403)**
→ `ALLOWED_ORIGIN` ভুল ডোমেইনে সেট করা আছে — আপনার আসল Vercel URL দিন

**আয়াত লোড হচ্ছে না**
→ `api.quran.com` accessible কিনা চেক করুন

**অডিও চলছে না**
→ মোবাইলে প্রথমে user tap দরকার (browser autoplay policy)

**থিম বা ভাষা সেভ হচ্ছে না**
→ Incognito mode-এ localStorage কাজ করে না

---

বারাকাল্লাহু ফিকুম 🤲
