# هادي — Hadi Quran Reference

<div align="center">

**যাচাইকৃত কুরআন রেফারেন্স · বাংলা · কোনো AI ব্যাখ্যা নেই**

*Verified Quran Reference · Bengali-first · No AI Interpretation*

</div>

---

## সংক্ষিপ্ত পরিচয় (About)

Hadi is a mobile-first Quran reference application built primarily for Bangladeshi Muslims. It provides verified Quran data — Arabic text, Bengali and English translations, tafsir, word search, and per-ayah audio recitation — without generating any AI interpretation of the Quran.

The guiding principle: **an AI should never interpret the words of Allah**. Hadi is a dictionary and index, not a scholar. For meaning and understanding, users are always directed to qualified scholars and verified tafsir.

> "নিশ্চয়ই আমি কুরআন অবতীর্ণ করেছি এবং আমিই তার রক্ষক।" — সূরা আল-হিজর (১৫:৯)

---

## বৈশিষ্ট্য (Features)

### কোনো AI ব্যাখ্যা নেই (Zero AI Interpretation)
- আয়াত লুকআপ, সূরা তথ্য, শব্দ অনুসন্ধান — সবই সরাসরি API থেকে যাচাইকৃত ডেটা
- AI শুধুমাত্র সংকীর্ণ তথ্যভিত্তিক প্রশ্নে ব্যবহৃত হয় (কী, কখন, কোনটি, কে)
- "কেন" এবং ব্যাখ্যামূলক প্রশ্ন সম্পূর্ণ প্রত্যাখ্যাত

### ৫টি পেজ
| পেজ | বিবরণ |
|-----|--------|
| 🏠 হোম | আজকের আয়াত, দ্রুত লুকআপ, নেভিগেশন কার্ড |
| 🔍 অনুসন্ধান | বাংলা/ইংরেজি শব্দ দিয়ে সব আয়াত খুঁজুন |
| 📖 সূরা | ১১৪টি সূরা ব্রাউজ করুন, সম্পূর্ণ সূরা পড়ুন |
| ❓ জিজ্ঞাসা | তথ্যভিত্তিক প্রশ্ন শুধুমাত্র |
| 🔖 সংরক্ষিত | বুকমার্ক করা আয়াত |

### অন্যান্য বৈশিষ্ট্য
- **৩টি থিম**: নূর (আলো), লায়ল (রাত), সবজ (সবুজ) — এক বাটনে পরিবর্তন
- **আজকের আয়াত**: তারিখ-ভিত্তিক, সবার জন্য একই আয়াত
- **প্রতিটি আয়াতে তিলাওয়াত**: Sheikh Mishary Rashid Al-Afasy-এর কণ্ঠে
- **শেয়ার কার্ড**: সুন্দর ইমেজ কার্ড তৈরি করে WhatsApp/Facebook-এ শেয়ার করুন
- **বুকমার্ক**: LocalStorage-এ সংরক্ষণ, কোনো অ্যাকাউন্ট লাগবে না
- **সাম্প্রতিক অনুসন্ধান**: LocalStorage-এ, দ্রুত পুনরায় অনুসন্ধান
- **রেফারেন্স লিংক**: প্রতিটি আয়াতে quran.com-এর লিংক — নিজে যাচাই করুন
- **মোবাইল-ফার্স্ট**: বটম ট্যাব বার, safe area support, সম্পূর্ণ মোবাইল অপ্টিমাইজড

---

## ডেটা উৎস (Data Sources)

| ডেটা | উৎস | ID |
|------|------|----|
| আরবি টেক্সট | Uthmani Script | — |
| বাংলা অনুবাদ | মুহিউদ্দীন খান | `161` |
| ইংরেজি অনুবাদ | Dr. Mustafa Khattab | `131` |
| বাংলা তাফসীর | তাফসীর আহসানুল বায়ান | `165` |
| ইংরেজি তাফসীর | Tafsir Ibn Kathir (fallback) | `169` |
| অডিও | Sheikh Mishary Rashid Al-Afasy | Islamic.Network CDN |
| API | [api.quran.com](https://api.quran.com/api/v4) | v4 |

---

## প্রযুক্তি (Tech Stack)

```
Frontend:   React 18 + Vite
Language:   JavaScript (ES Modules)
Styling:    CSS-in-JS (inline stylesheet)
Fonts:      Hind Siliguri (Bengali UI)
            Playfair Display (English headings)
            KFGQPC Uthman Taha Naskh (Arabic)
Storage:    localStorage (bookmarks, recent searches, theme)
AI:         Anthropic Claude (factual Q&A only, via serverless proxy)
Deploy:     Vercel (frontend + serverless function)
```

---

## AI ব্যবহার নীতি (AI Usage Policy)

```
অনুমোদিত (ALLOWED):
  ✓ ইসলামের পাঁচ স্তম্ভের নাম
  ✓ নামাজের ওয়াক্তের নাম
  ✓ সূরার নাম বা আয়াত সংখ্যা
  ✓ আরবি শব্দের অর্থ
  ✓ কোন সূরা কোথায় নাজিল হয়েছে

নিষিদ্ধ (FORBIDDEN):
  ✗ কেন (why) প্রশ্ন
  ✗ ব্যাখ্যামূলক প্রশ্ন
  ✗ ফতোয়া বা রুলিং
  ✗ একাধিক আয়াত সংশ্লেষণ
  ✗ আলেমের মতামত প্রয়োজন এমন প্রশ্ন
```

---

## স্থানীয়ভাবে চালানো (Local Development)

```bash
# ক্লোন করুন
git clone https://github.com/yourusername/hadi-quran.git
cd hadi-quran

# নির্ভরতা ইনস্টল করুন
npm install

# এনভায়রনমেন্ট ভেরিয়েবল সেট করুন
cp .env.example .env
# .env ফাইলে ANTHROPIC_API_KEY যোগ করুন

# চালান
npm run dev
```

`.env` ফাইল তৈরি করুন:
```
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

---

## প্রজেক্ট স্ট্রাকচার (Project Structure)

```
hadi-quran/
├── api/
│   └── ask.js              # Vercel serverless function (Anthropic proxy)
├── src/
│   ├── App.jsx             # Main app + all pages + components
│   ├── main.jsx            # React entry point
│   ├── hooks/
│   │   ├── useTheme.js     # Theme management
│   │   └── useAudio.js     # Per-ayah audio playback
│   └── utils/
│       ├── constants.js    # Themes, word map, helper functions
│       ├── api.js          # All API calls (quran.com + Anthropic)
│       └── storage.js      # localStorage (bookmarks, recent, theme)
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── .env.example
├── .gitignore
├── DEPLOY.md               # Deployment instructions
└── README.md               # This file
```

---

## রোডম্যাপ (Roadmap)

### v2 (বর্তমান)
- [x] হোমপেজ + আজকের আয়াত
- [x] শব্দ অনুসন্ধান (বাংলা + ইংরেজি → আরবি)
- [x] সূরা ব্রাউজার + সম্পূর্ণ সূরা
- [x] প্রতি আয়াতে অডিও তিলাওয়াত
- [x] বুকমার্ক (localStorage)
- [x] শেয়ার ইমেজ কার্ড
- [x] ৩টি থিম
- [x] রেফারেন্স লিংক
- [x] মোবাইল অপ্টিমাইজড

### v3 (পরিকল্পিত)
- [ ] ক্রস-ডিভাইস বুকমার্ক সিঙ্ক (Supabase)
- [ ] ভয়েস অনুসন্ধান
- [ ] অফলাইন সাপোর্ট (PWA)
- [ ] তাজওয়ীদ কালার কোডিং
- [ ] একাধিক ক্বারী নির্বাচন

---

## অবদান (Contributing)

Pull request স্বাগত। বড় পরিবর্তনের জন্য আগে একটি issue খুলুন।

---

## লাইসেন্স (License)

```
MIT License

Copyright (c) 2026 Hadi Quran Reference

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
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## গুরুত্বপূর্ণ নোট (Important Note)

এই অ্যাপ্লিকেশন কুরআনের ব্যাখ্যা বা তাফসীর প্রদান করে না। যেকোনো ধর্মীয় বিষয়ে সিদ্ধান্ত নেওয়ার আগে একজন যোগ্য ইসলামী আলেমের সাথে পরামর্শ করুন।

*This application does not provide interpretation or tafsir of the Quran. Please consult a qualified Islamic scholar for any religious guidance.*

---

<div align="center">
بَارَكَ اللَّهُ فِيكُمْ
</div>
