// Renders real Quran page content onto a canvas texture for one physical
// page face (a leaf's front or back). This is the piece nothing in the
// source demo has any equivalent of — its pages were 8 fixed decorative
// mockup images.
//
// Reuses the exact PAGE_SIZE=6-ayat-per-page chunking the existing flat
// DOM reader already uses (see ReadMode.jsx) so paging behaves identically
// in both surfaces during the transition period.
//
// Returns hitboxes in normalized 0..1 texture-UV space so the scene engine
// can turn a raycaster hit's `.uv` into "which ayah was tapped" for
// tap-to-play, matching the flat reader's click-any-ayah behavior.

import * as THREE from "three";
import { drawPaperSurface, seededRandom, hashSeed, configureCanvasTexture } from "./textures.js";

export const PAGE_SIZE = 6; // must match ReadMode.jsx's PAGE_SIZE

export function paginateAyat(ayat) {
  const pages = [];
  for (let i = 0; i < ayat.length; i += PAGE_SIZE) pages.push(ayat.slice(i, i + PAGE_SIZE));
  return pages;
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = trial;
    }
  });
  if (line) lines.push(line);
  return lines;
}

const CANVAS_WIDTH = 700;
const CANVAS_HEIGHT = 1015; // ~ matches bookRig's page aspect (pageWidth/pageHeight ≈ 0.69)

/**
 * @param {Array} ayahs - up to PAGE_SIZE ayah objects: { verse_number, text_uthmani, translations }
 * @param {'off'|'bn'|'en'} lang
 * @param {number|null} activeVerseNumber - currently-playing ayah, highlighted
 * @param {number|null} nextVerseNumber - about-to-play ayah, lightly highlighted
 * @returns {{ texture: THREE.CanvasTexture, hitboxes: Array<{verseNumber:number, u0:number,v0:number,u1:number,v1:number}> }}
 */
export function renderPageFace(renderer, { ayahs, lang, activeVerseNumber, nextVerseNumber, surahNameAr, pageLabel }) {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  const random = seededRandom(hashSeed("hadi-paper-stock"));
  drawPaperSurface(ctx, canvas.width, canvas.height, random);

  const marginX = 64;
  const contentWidth = canvas.width - marginX * 2;
  const hitboxes = [];

  ctx.fillStyle = "rgba(92,76,55,0.55)";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = '600 15px Inter, "Helvetica Neue", Arial, sans-serif';
  ctx.fillText(surahNameAr || "", canvas.width / 2, 46);
  ctx.fillRect(canvas.width / 2 - 22, 58, 44, 1);

  let cursorY = 110;

  (ayahs || []).forEach((ayah) => {
    const isActive = activeVerseNumber === ayah.verse_number;
    const isNext = nextVerseNumber === ayah.verse_number;
    const blockTop = cursorY;

    ctx.textAlign = "right";
    ctx.direction = "rtl";
    ctx.fillStyle = "#9c7a35";
    ctx.font = '600 13px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillText(String(ayah.verse_number), canvas.width - marginX, cursorY);
    cursorY += 6;

    ctx.font = '400 30px "UthmanNaskh", "Aref Ruqaa", serif';
    ctx.fillStyle = "#241a10";
    ctx.textAlign = "right";
    const arabicLines = wrapText(ctx, ayah.text_uthmani || "", contentWidth);
    arabicLines.forEach((line) => {
      cursorY += 40;
      ctx.fillText(line, canvas.width - marginX, cursorY);
    });
    cursorY += 14;

    if (lang !== "off") {
      const resourceId = lang === "bn" ? 161 : 131;
      const raw = ayah.translations?.find((tr) => Number(tr.resource_id) === resourceId)?.text || "";
      const plain = raw.replace(/<[^>]*>/g, "");
      if (plain) {
        ctx.font = '400 16px "Hind Siliguri", Inter, sans-serif';
        ctx.fillStyle = "rgba(60,48,34,0.82)";
        ctx.direction = "ltr";
        ctx.textAlign = "left";
        const translationLines = wrapText(ctx, plain, contentWidth);
        translationLines.forEach((line) => {
          cursorY += 24;
          ctx.fillText(line, marginX, cursorY);
        });
        cursorY += 8;
      }
    }

    const blockBottom = cursorY + 6;
    if (isActive || isNext) {
      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = isActive ? "rgba(212,175,55,0.16)" : "rgba(212,175,55,0.07)";
      ctx.fillRect(marginX - 12, blockTop - 22, contentWidth + 24, blockBottom - blockTop + 16);
      ctx.restore();
    }

    hitboxes.push({
      verseNumber: ayah.verse_number,
      u0: 0, u1: 1,
      v0: 1 - blockBottom / canvas.height,
      v1: 1 - (blockTop - 22) / canvas.height
    });

    cursorY = blockBottom + 20;
    ctx.direction = "ltr";
  });

  if (pageLabel) {
    ctx.textAlign = "center";
    ctx.direction = "ltr";
    ctx.fillStyle = "rgba(92,76,55,0.5)";
    ctx.font = '500 13px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.fillText(pageLabel, canvas.width / 2, canvas.height - 34);
  }

  const texture = configureCanvasTexture(new THREE.CanvasTexture(canvas), renderer);
  texture.userData.isPageContentTexture = true; // safe to dispose later — NOT the shared cached blank-paper texture
  return { texture, hitboxes };
}

/** Blank page face for slots beyond the surah's actual content (tail end of the last gathering). */
export function renderBlankFace(renderer) {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  const random = seededRandom(hashSeed("hadi-paper-stock"));
  drawPaperSurface(ctx, canvas.width, canvas.height, random);
  const texture = configureCanvasTexture(new THREE.CanvasTexture(canvas), renderer);
  texture.userData.isPageContentTexture = true;
  return { texture, hitboxes: [] };
}
