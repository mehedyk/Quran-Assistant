# هادي — Hadi Quran Reference

<div align="center">

**যাচাইকৃত কুরআন রেফারেন্স · বাংলা ও ইংরেজি · কোনো AI ব্যাখ্যা নেই**

*Verified Quran Reference · Bengali & English · No AI Interpretation*

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)

</div>

---

## সংক্ষিপ্ত পরিচয় · About

Hadi is a mobile-first, bilingual Quran reference application built primarily for Bangladeshi Muslims. It provides verified Quran data — Arabic text, Bengali and English translations, tafsir, word search, and per-ayah audio recitation — without generating any AI interpretation of the Quran.

> *"قُلْ إِنَّ صَلَاتِي وَنُسُكِي وَمَحْيَايَ وَمَمَاتِي لِلَّهِ رَبِّ الْعَالَمِينَ"*
> — সূরা আল-আনআম (৬:১৬২)

**The guiding principle:** an AI should never interpret the words of Allah. Hadi is a dictionary and index — not a scholar. For meaning and understanding, users are always directed to qualified scholars and verified tafsir.

---

## বৈশিষ্ট্য · Features

### ৬টি পেজ · 6 Pages

| পেজ | বিবরণ |
|-----|--------|
| 🏠 হোম / Home | আজকের আয়াত, দ্রুত লুকআপ, নেভিগেশন |
| 🔍 অনুসন্ধান / Search | বাংলা ও ইংরেজি শব্দ → আরবি ম্যাপিং → সঠিক ফলাফল |
| 📖 সূরা / Surahs | ১১৪টি সূরা ব্রাউজ, সম্পূর্ণ সূরা পড়ুন |
| ❓ জিজ্ঞাসা / Ask | তথ্যভিত্তিক প্রশ্ন — কী, কখন, কোনটি, কে |
| 🔖 সংরক্ষিত / Saved | বুকমার্ক করা আয়াত |
| ✨ পরিচয় / About | নিয়ত, দোয়া, ক্রেডিট |

### মূল বৈশিষ্ট্য · Core Features

- **🌐 দ্বিভাষিক UI** — বাংলা ও ইংরেজি, এক বাটনে পরিবর্তন, পছন্দ সংরক্ষিত
- **🎨 ৩টি থিম** — নূর (দিন), লায়ল (রাত), সবজ (পাণ্ডুলিপি) — প্রতিটি স্বতন্ত্র
- **📱 মোবাইল + 💻 ডেস্কটপ** — সত্যিকারের রেসপনসিভ: মোবাইলে বটম ট্যাব বার, ডেস্কটপে সাইডবার
- **🔍 স্মার্ট শব্দ অনুসন্ধান** — বাংলা/ইংরেজি → আরবি ম্যাপিং (সবর→صبر)
- **▶ প্রতি আয়াতে তিলাওয়াত** — Sheikh Mishary Rashid Al-Afasy
- **📤 শেয়ার কার্ড** — সুন্দর ইমেজ কার্ড ডাউনলোড, WhatsApp/Facebook শেয়ার
- **🔖 বুকমার্ক** — localStorage, কোনো অ্যাকাউন্ট লাগবে না
- **🕐 সাম্প্রতিক অনুসন্ধান** — localStorage, দ্রুত পুনরায় অনুসন্ধান
- **📅 আজকের আয়াত** — তারিখ-ভিত্তিক, নিরঙ্কুশ, সবার জন্য একই
- **🔗 রেফারেন্স লিংক** — প্রতিটি আয়াতে quran.com-এর লিংক

---

## ডেটা উৎস · Data Sources

| ডেটা | উৎস | ID |
|------|------|----|
| আরবি টেক্সট | Uthmani Script via api.quran.com | — |
| বাংলা অনুবাদ | মুহিউদ্দীন খান | `161` |
| ইংরেজি অনুবাদ | Dr. Mustafa Khattab | `131` |
| বাংলা তাফসীর | তাফসীর আহসানুল বায়ান | `165` |
| ইংরেজি তাফসীর | Tafsir Ibn Kathir (fallback) | `169` |
| অডিও | Sheikh Mishary Rashid Al-Afasy | Islamic.Network CDN |
| API | [api.quran.com](https://api.quran.com/api/v4) | v4 |

---

## প্রযুক্তি · Tech Stack

```
Frontend:   React 18 + Vite
Fonts:      Hind Siliguri (Bengali UI)
            Playfair Display (English headings)
            KFGQPC Uthman Taha Naskh (Arabic)
Storage:    localStorage (bookmarks, searches, theme, language)
AI:         Anthropic Claude — factual Q&A only, via serverless proxy
Deploy:     Vercel (frontend + serverless function)
```

---

## AI ব্যবহার নীতি · AI Policy

```
অনুমোদিত (ALLOWED):
  ✓ পাঁচ স্তম্ভের নাম, নামাজের ওয়াক্ত, সূরার তথ্য
  ✓ আয়াত সংখ্যা, আরবি শব্দের অর্থ, ঐতিহাসিক তথ্য
  ✓ কী / কখন / কোনটি / কে / কতটি

নিষিদ্ধ (FORBIDDEN):
  ✗ কেন (why) প্রশ্ন
  ✗ ব্যাখ্যামূলক বা ধর্মতাত্ত্বিক প্রশ্ন
  ✗ ফতোয়া বা রুলিং
  ✗ আলেমের মতামত প্রয়োজন এমন যেকোনো প্রশ্ন
```

---

## লোকাল ডেভেলপমেন্ট · Local Development

```bash
git clone https://github.com/mehedyk/hadi-quran.git
cd hadi-quran
npm install

# Environment variable
echo "ANTHROPIC_API_KEY=sk-ant-api03-your-key" > .env

npm run dev
# Opens at http://localhost:5173
```

---

## প্রজেক্ট স্ট্রাকচার · Project Structure

```
hadi-quran/
├── api/
│   └── ask.js              # Vercel serverless proxy (Anthropic)
├── src/
│   ├── App.jsx             # All pages + components + CSS
│   ├── main.jsx            # React entry
│   ├── hooks/
│   │   ├── useTheme.js     # 3-theme system with CSS variables
│   │   └── useAudio.js     # Per-ayah audio playback
│   └── utils/
│       ├── constants.js    # Themes, word map, Ayah of Day
│       ├── api.js          # quran.com + Anthropic calls
│       └── storage.js      # localStorage abstraction
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── .env.example
├── .gitignore
├── DEPLOY.md
└── README.md
```

---

## রোডম্যাপ · Roadmap

### v2 (বর্তমান)
- [x] হোমপেজ + আজকের আয়াত
- [x] বাংলা/ইংরেজি UI ভাষা টগল
- [x] ৩টি স্বতন্ত্র থিম
- [x] মোবাইল + ডেস্কটপ রেসপনসিভ লেআউট
- [x] শব্দ অনুসন্ধান (বাংলা + ইংরেজি → আরবি)
- [x] সূরা ব্রাউজার + সম্পূর্ণ সূরা
- [x] প্রতি আয়াতে অডিও তিলাওয়াত
- [x] বুকমার্ক + সাম্প্রতিক অনুসন্ধান (localStorage)
- [x] শেয়ার ইমেজ কার্ড
- [x] রেফারেন্স লিংক
- [x] About পেজ + Footer

### v3 (পরিকল্পিত)
- [ ] ভয়েস অনুসন্ধান
- [ ] অফলাইন সাপোর্ট (PWA)
- [ ] ক্রস-ডিভাইস সিঙ্ক (Supabase)
- [ ] একাধিক ক্বারী নির্বাচন
- [ ] তাজওয়ীদ কালার কোডিং

---

## বানিয়েছেন · Built By

**[মেহেদী](https://github.com/mehedyk)** · [mehedy.netlify.app](https://mehedy.netlify.app/)

আল্লাহর সন্তুষ্টির জন্য এবং এই উম্মাহর জন্য।
*For the pleasure of Allah, and for this Ummah.*

---

## লাইসেন্স · License

```
MIT License — Copyright (c) 2026 Mehedy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## গুরুত্বপূর্ণ · Important

এই অ্যাপ্লিকেশন কুরআনের ব্যাখ্যা প্রদান করে না। যেকোনো ধর্মীয় বিষয়ে একজন যোগ্য ইসলামী আলেমের সাথে পরামর্শ করুন।

*This app does not interpret the Quran. Please consult a qualified Islamic scholar for religious guidance.*

---

<div align="center">بَارَكَ اللَّهُ فِيكُمْ</div>
