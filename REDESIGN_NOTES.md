# Hadi — Figma redesign migration notes

Source of truth for **function**: the existing app. Source of truth for **visuals**: `Al Hadi remake.fig`
(decoded directly from the file's node data: exact colours, sizes, spacing, fonts — not from the thumbnail).

## 1. What the Figma contains
One **Home** page, designed once and drawn in five frames (1440×2600) — one per waqt. Layout is identical in all five;
only colour roles change (and which tab is active):

| Figma frame | Theme key | Look |
|---|---|---|
| Fajr | `fajr` | dark teal / green |
| Dhuhr | `dhuhr` | light |
| Asr | `asr` | warm beige / cream |
| Maghrib | `maghrib` | dark purple |
| Isha | `isha` | dark navy / blue |

Shared structure: Navigation (wordmark, 6 links, Saved, language) → Prayer-theme selector → Hero (+ dawn arch + theme badge)
→ Quick lookup → Daily ayah → Surah carousel → Explore Hadi (4 cards) → Reading-journey invite → Footer (About, How-to).

### Design tokens (per theme, from the frames)
| Role | Fajr | Dhuhr | Asr | Maghrib | Isha |
|---|---|---|---|---|---|
| page `--bg` | #101f26 | #f6f8f4 | #fbf3e5 | #281d32 | #101524 |
| panel `--surface` | #172b33 | #ffffff | #fffaf1 | #33253e | #192035 |
| raised `--surface2` | #1e363f | #e8eee8 | #f1e4cf | #44304e | #232c46 |
| border `--line` | #30464c | #d5dfd9 | #deceb5 | #5a405e | #35405c |
| text `--text` | #f1f0e7 | #1f3439 | #473829 | #fff0e9 | #eff0fb |
| muted `--muted` | #aabbb9 | #5d7277 | #7a6852 | #c7afc7 | #acb6d0 |
| accent `--accent` | #b8dcca | #2c697a | #885c37 | #eeb2ad | #bac6f0 |
| on-accent | #102a26 | #ffffff | #fff9ef | #392233 | #171f39 |
| ornament | #d6be8b | #796234 | #8b632b | #dab58e | #cdbd92 |

All text/background pairs meet WCAG AA (≥ 4.5:1). Fonts: Hind Siliguri (UI), Noto Serif Bengali (hero headline), Amiri (wordmark / arch), Inter (small captions).

## 2. Original application — feature inventory
React 18 + Vite SPA (no router; page state in `App.jsx`), Quran.com API, AlQuran Cloud audio, one serverless route (`api/ask.js`), localStorage.
Pages/features: Home (quick lookup, ayah of the day, surah discovery carousel, feature cards) · Word Search · Surah Browser · Surah page
(play whole surah, queue, now-playing bar) · Ayah page (Arabic, Bengali + English translation, tafsir, play, bookmark, share card, copy) ·
Read Mode + 3D Book Library · Saved (bookmarks) · Journey (verses read, active days, progress ring, pinned verses, share) · Ask (fact Q&A) ·
About · How-to modal (first visit) · Bengali/English toggle · five-waqt theme system with ripple-wipe and persistence ·
mobile drawer, bottom tab bar, theme orb · Share-card image generator (canvas).

## 3. Feature → design integration map
| Existing functionality | Was | Now (Figma location) | Status |
|---|---|---|---|
| Navigate Home / Search / Surah / Read Mode / Journey / Ask | sidebar | Sidebar (toggle) + header primary links | ✅ |
| Saved verses | sidebar | Header "সংরক্ষিত" button + Explore card | ✅ |
| About | sidebar | Footer "পরিচয়" (+ drawer) | ✅ |
| How-to modal | sidebar "?" | Footer link (+ drawer, + first-visit auto-open) | ✅ |
| Language toggle | sidebar/topnav | Header "বাং / EN" (+ drawer) | ✅ |
| Theme selector (5 waqt) | orb | Prayer-theme tabs (≥768 px); orb kept on phones | ✅ |
| Quick lookup `2:255` → ayah | Home panel | Quick-lookup panel + chips | ✅ |
| Word search from Home | Home panel | Same; now actually runs the query on the Search page* | ✅ fixed |
| Ayah of the day (+ recite, open) | Home card | Daily-ayah card (+ Save, new in design) | ✅ |
| Surah discovery (8 random real surahs) | marquee | Endless drifting carousel + arrows, dots, "all surahs" | ✅ |
| Search / Saved / Ask entry cards | Home cards | Explore cards (+ Read Mode) | ✅ |
| Surah browser | Home card + sidebar | Header "সূরা", hero button, carousel link | ✅ |
| Journey | sidebar | Header + journey invitation card | ✅ |
| Mobile drawer / bottom tab bar | yes | Kept (drawer carries all 8 destinations) | ✅ |
| Share-card styles (Fajr…Isha) | own palettes | Re-coloured to the Figma palette | ✅ |
| All inner pages (Surah, Ayah, Read Mode, Search, Saved, Journey, Ask, About, modals) | legacy tokens | Re-themed via remapped tokens; same markup/logic | ✅ |

\* The old Home passed `initialQuery` to the Search page but the page ignored it. Fixed. Bengali numerals (২:২৫৫) are now accepted too, matching the Figma placeholder.

## 4. Theme architecture
`THEMES` in `src/utils/constants.js` holds the five palettes. `useTheme` writes them as CSS variables on `<html>` (plus `color-scheme` and the
browser `theme-color`). New semantic tokens (`--surface`, `--line`, `--accent`, …) are used by the redesigned shell/home; the **legacy** variable
names (`--bg2`, `--bg3`, `--ink*`, `--gold*`, `--green*`, `--fill`, `--border`) are remapped onto the same palette so untouched components re-theme automatically.
No page is duplicated. Persistence: existing `hadi_theme` localStorage key. Switching only changes CSS variables, so forms, data and sessions are untouched.

## 5. Files
**Modified:** `index.html`, `src/App.jsx`, `src/utils/constants.js`, `src/hooks/useTheme.js`, `src/components/home/SurahCarousel.jsx`, `src/utils/storage.js` (sidebar default),
`src/components/layout/ThemeOrb.jsx`, `src/components/layout/WaqtArcPicker.jsx`, `src/components/share/ShareCardModal.jsx`
**New:** `src/styles/design.css`, `src/hooks/useThemeWipe.js`,
`src/components/layout/{SiteHeader,SidebarNav,PrayerThemeTabs,SiteFooter,Logo}.jsx`, `src/components/layout/themeIcons.js`,
`src/components/home/{HeroSection,QuickLookup,DailyAyah,ExploreSection,JourneyInvite}.jsx`, `docs/redesign-screenshots/*`, this file.
**Removed code (not files):** old top-bar/hero/home-card/`AyahCard` markup and their CSS; inline `Logo` moved to its own file; the sidebar markup now lives in `SidebarNav.jsx` (shared with the drawer).
No dependency added; `package.json`, `api/`, `vercel.json` untouched.

## 6. Behaviour changes caused by the design (documented, not silent)
1. **Sidebar restored (coexists with the header).** The original collapsible desktop sidebar (≥1024px) is back, with a collapse toggle in the header (`hadi_sidebar_collapsed` persisted). It is **collapsed by default** on a first visit so the page matches the Figma frame exactly; once opened it stays open across reloads. While it is open on desktops narrower than 1680px, the header text links hide (the sidebar carries them) to avoid crowding; on wider screens both show. Tablet/phone keep the drawer / tab bar.
2. **Carousel keeps the endless drift.** Cards (random real sample of 8) glide continuously and loop seamlessly (3 copies, duplicates hidden from assistive tech); drift pauses on hover/touch/focus and is off for reduced-motion. The Figma arrows glide one card, a manual swipe takes over and drift resumes ~2s later, dots show the leading card, tap opens the surah.
3. **Theme orb** now shows on phones only; ≥768 px the design's tab row replaces it (same wipe animation, same persistence). Long-press-to-cycle remains on the phone orb.
4. **Quran verse text** keeps the app's UthmanNaskh font (full Uthmani mark coverage); Amiri is used for the wordmark and arch, as in the Figma.
5. Playfair Display (old heading font) replaced by Hind Siliguri to match the design.
6. Default theme for new visitors is still Dhuhr (existing behaviour), not Fajr.

## 7. Verification (what was actually run)
Environment limit: the sandbox had **no network**, so `npm install` / `vite build` could not run. Instead the app was bundled with esbuild
(`lucide-react` and `three` stubbed; real Quran API replaced by a mock inside the test harness only — nothing mocked in the project) and driven in headless Chromium.
- Bundle: 0 errors, 0 warnings; every import resolves.
- 44 browser checks + 27 sidebar/carousel checks (toggle, persistence, header coexistence at 1024/1440/1920, drift, hover pause, arrows, endless loop both ways, swipe takeover, reduced motion) passed: all routes via header/footer/drawer/tab bar; theme switch ×5 (CSS vars, `data-theme`, localStorage), persistence after reload, form text kept across theme switch, arrow-key navigation of the tabs; EN/BN toggle; quick chips, Bengali-digit reference, word search carry-over; daily-ayah save/unsave ↔ Saved page; carousel arrows/dots/tile; explore/hero/journey CTAs; tablet drawer; phone orb/tab bar.
- 0 console/page errors and 0 horizontal overflow at 1440, 820 and 390 px (Fajr + Dhuhr at all three; all five themes at 1440).
- Geometry at 1440 matches the Figma node sizes exactly (header 96, theme row 76, pill 596×50, arch 450×508 at x=850, panel 1248×150, cards 294×232 / 294×199, journey 1248×218, daily card 1248×302).

## 8. Known remaining issues / not verified
- **Run `npm install && npm run build` locally** — not possible here. Nothing in `package.json` changed, so it should build as before.
- **3D Book Library / Read Mode (three.js)** was rendered with a stub: page loads and routes were checked, WebGL output was not. Its scene has its own fixed palette (unchanged); only surrounding UI re-themes.
- **Fonts**: Google Fonts were unreachable in the sandbox, so screenshots used fallback fonts; widths with real Hind Siliguri / Noto Serif Bengali will differ slightly.
- **Bengali surah names**: the Quran API (`language=en`) gives only transliteration + English meaning; carousel cards show those (the Figma sample shows Bengali names — adding them would need a new data source or API param, left untouched).
- Live Quran API, audio playback and the `/api/ask` serverless route were not exercised (no network).
- Figma screenshots comparison was by measured geometry and visual review of the generated frames, not pixel diff (Figma can't be rendered here).
