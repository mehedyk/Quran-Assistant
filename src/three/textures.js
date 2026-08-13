// Procedural texture generation, adapted from the "Complete Shelf" demo
// (complete-shelf-main/index.html) for use inside Hadi's React/Vite build.
//
// IMPORTANT DIFFERENCE FROM THE ORIGINAL: in the source demo every one of
// these functions was a closure inside one big <script type="module"> block,
// with free access to top-level `renderer`, `scene`, `books`, etc. Here they
// take that state as explicit parameters instead, so this module has no
// hidden dependencies and can be unit-tested / reused by both the Read Mode
// book scene and the Book Library shelf scene.
//
// `book` descriptor shape expected by these functions (seeded per surah
// instead of hardcoded per the original demo's 7 volumes):
//   {
//     seed: string,          // e.g. `surah-${number}` — drives all randomness
//     cloth: string,         // hex, cover cloth color
//     foil: string,          // hex, foil/stamp color
//     motifKey: 'brackets' | 'paths' | 'caret' | 'orbits' | 'modules' | 'frames' | default
//     titleAr: string,       // Arabic title to stamp on the cover
//     titleSub?: string,     // optional subtitle (e.g. transliteration)
//   }

import * as THREE from "three";

/** Clones a base material into a transparent, independently-fadeable instance (for open/close crossfades). */
export function createFadeMaterial(baseMaterial) {
  const material = baseMaterial.clone();
  material.transparent = true;
  material.opacity = 1;
  return material;
}

/** FNV-1a style string hash -> uint32 seed. */
export function hashSeed(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Deterministic PRNG (mulberry32-family) from a uint32 seed. Same seed -> same book, always. */
export function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

/** Convenience: build a per-book RNG straight from its seed string. */
export function randomForBook(book) {
  return seededRandom(hashSeed(book.seed));
}

/**
 * Draws one of the geometric foil motifs (brackets/paths/caret/orbits/
 * modules/frames, or a default khatim-adjacent arc+triangle mark) onto a
 * 2D canvas context. Pure function — ctx in, ctx mutated, nothing else.
 */
export function drawMotif(ctx, book, width, height) {
  const foil = book.foil;
  ctx.save();
  ctx.strokeStyle = foil;
  ctx.fillStyle = foil;
  ctx.lineWidth = Math.max(3, width * 0.004);
  ctx.globalAlpha = 0.88;
  const centerX = width * 0.5;
  const centerY = height * 0.38;
  const size = Math.min(width, height) * 0.22;

  if (book.motifKey === "brackets") {
    for (let layer = 0; layer < 3; layer += 1) {
      const inset = layer * size * 0.22;
      const left = centerX - size + inset;
      const right = centerX + size - inset;
      const top = centerY - size * 0.72 + inset;
      const bottom = centerY + size * 0.72 - inset;
      ctx.beginPath();
      ctx.moveTo(left + size * 0.25, top);
      ctx.lineTo(left, top);
      ctx.lineTo(left, bottom);
      ctx.lineTo(left + size * 0.25, bottom);
      ctx.moveTo(right - size * 0.25, top);
      ctx.lineTo(right, top);
      ctx.lineTo(right, bottom);
      ctx.lineTo(right - size * 0.25, bottom);
      ctx.stroke();
    }
    ctx.fillRect(centerX - 3, centerY - 3, 6, 6);
  } else if (book.motifKey === "paths") {
    ctx.beginPath();
    ctx.moveTo(centerX - size, centerY + size * 0.35);
    ctx.bezierCurveTo(centerX - size * 0.2, centerY - size, centerX + size * 0.1, centerY + size, centerX + size, centerY - size * 0.25);
    ctx.stroke();
    ctx.globalAlpha = 0.52;
    ctx.beginPath();
    ctx.moveTo(centerX - size, centerY - size * 0.45);
    ctx.bezierCurveTo(centerX - size * 0.25, centerY + size, centerX + size * 0.3, centerY - size, centerX + size, centerY + size * 0.45);
    ctx.stroke();
    for (let point = -1; point <= 1; point += 1) {
      ctx.beginPath();
      ctx.arc(centerX + point * size, centerY - point * size * 0.25, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (book.motifKey === "caret") {
    ctx.beginPath();
    ctx.moveTo(centerX - size * 0.9, centerY + size * 0.6);
    ctx.lineTo(centerX, centerY - size * 0.65);
    ctx.lineTo(centerX + size * 0.9, centerY + size * 0.6);
    ctx.stroke();
    ctx.globalAlpha = 0.38;
    for (let line = -2; line <= 2; line += 1) {
      ctx.beginPath();
      ctx.moveTo(centerX - size, centerY + line * size * 0.28);
      ctx.lineTo(centerX + size, centerY + line * size * 0.28);
      ctx.stroke();
    }
  } else if (book.motifKey === "orbits") {
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, size, size * 0.42, -0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.58;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, size * 0.72, size, 0.52, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(centerX + size * 0.64, centerY - size * 0.34, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(centerX - 6, centerY - 6, 12, 12);
  } else if (book.motifKey === "modules") {
    const moduleSize = size * 0.54;
    const positions = [
      [-0.55, -0.5, "circle"],
      [0.25, -0.5, "rect"],
      [-0.55, 0.3, "rect"],
      [0.25, 0.3, "circle"]
    ];
    positions.forEach(([x, y, shape], index) => {
      ctx.globalAlpha = 0.45 + index * 0.12;
      if (shape === "circle") {
        ctx.beginPath();
        ctx.arc(centerX + x * size, centerY + y * size, moduleSize * 0.48, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(
          centerX + x * size - moduleSize * 0.5,
          centerY + y * size - moduleSize * 0.5,
          moduleSize,
          moduleSize
        );
      }
    });
  } else if (book.motifKey === "frames") {
    for (let layer = 0; layer < 4; layer += 1) {
      ctx.globalAlpha = 0.9 - layer * 0.17;
      const offset = layer * size * 0.18;
      ctx.strokeRect(
        centerX - size + offset,
        centerY - size * 0.7 + offset,
        size * 2 - offset * 2,
        size * 1.4 - offset * 2
      );
    }
    ctx.beginPath();
    ctx.moveTo(centerX - size, centerY - size * 0.7);
    ctx.lineTo(centerX + size, centerY + size * 0.7);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 0.78, 0.15, Math.PI * 1.82);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX - size * 0.72, centerY + size * 0.88);
    ctx.lineTo(centerX, centerY - size * 0.92);
    ctx.lineTo(centerX + size * 0.72, centerY + size * 0.88);
    ctx.stroke();
    ctx.globalAlpha = 0.48;
    ctx.beginPath();
    ctx.moveTo(centerX - size, centerY);
    ctx.lineTo(centerX + size, centerY);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Finishes a THREE.CanvasTexture with the demo's standard quality settings.
 * Takes `renderer` explicitly (it was a closure capture in the original) so
 * this module has no hidden global dependency.
 */
export function configureCanvasTexture(texture, renderer, { color = true, anisotropy = 16 } = {}) {
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(anisotropy, renderer.capabilities.getMaxAnisotropy());
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

// --- Adaptation note --------------------------------------------------
// The original demo mixes a numeric `book.seed` with `hashSeed(book.id)`
// per-function to get different-but-correlated randomness for each texture
// of the same book (cloth vs paper vs cover all need *different* noise, but
// noise that's stable across reloads for the *same* book). Our `book.seed`
// is a single string per surah (e.g. "surah-114"). This helper reproduces
// that "different but stable" property with one string seed instead of two
// numeric ones.
function subSeed(book, salt) {
  return seededRandom(hashSeed(`${book.seed}::${salt}`));
}

/**
 * Cover texture: cloth-color base + edge vignette + noise weave + foil
 * double-rule border + motif + Arabic title. No image atlas (the original
 * demo's 7 volumes used one) — every surah's cover is procedural, since we
 * need 114 distinct-but-consistent covers.
 *
 * `book.titleAr` (required) is the Arabic surah name to stamp on the cover.
 * `book.titleSub` (optional) is a short line under it (e.g. transliteration
 * or "Surah 114 · Makkiyah").
 */
export function makeCoverTexture(book, renderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 1152;
  const ctx = canvas.getContext("2d");
  const random = subSeed(book, "cover");

  ctx.fillStyle = book.cloth;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const edge = ctx.createLinearGradient(0, 0, canvas.width, 0);
  edge.addColorStop(0, "rgba(0,0,0,0.24)");
  edge.addColorStop(0.075, "rgba(255,255,255,0.035)");
  edge.addColorStop(0.5, "rgba(255,255,255,0.01)");
  edge.addColorStop(0.94, "rgba(0,0,0,0.06)");
  edge.addColorStop(1, "rgba(0,0,0,0.19)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let line = 0; line < 1250; line += 1) {
    const x = random() * canvas.width;
    const y = random() * canvas.height;
    const length = 4 + random() * 22;
    ctx.strokeStyle = random() > 0.5 ? "rgba(255,255,255,0.024)" : "rgba(0,0,0,0.025)";
    ctx.lineWidth = 0.6 + random() * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y + (random() - 0.5) * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = book.foil;
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, canvas.width - 84, canvas.height - 84);
  ctx.strokeRect(55, 55, canvas.width - 110, canvas.height - 110);
  ctx.globalAlpha = 1;

  drawMotif(ctx, book, canvas.width, canvas.height);

  ctx.fillStyle = book.foil;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '500 16px Inter, "Helvetica Neue", Arial, sans-serif';
  ctx.letterSpacing = "4px";
  ctx.fillText(book.eyebrow || "AL-HADI", canvas.width / 2, 92);

  const titleSize = book.titleAr.length > 6 ? 96 : 128;
  ctx.font = `400 ${titleSize}px "Aref Ruqaa", "UthmanNaskh", serif`;
  ctx.fillText(book.titleAr, canvas.width / 2, canvas.height * 0.68);

  if (book.titleSub) {
    ctx.font = '500 17px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.letterSpacing = "1.5px";
    ctx.fillText(book.titleSub.toUpperCase(), canvas.width / 2, canvas.height * 0.77);
  }

  return configureCanvasTexture(new THREE.CanvasTexture(canvas), renderer);
}

/**
 * Foil-only version of the cover (same layout, white-on-transparent) — used
 * as an emissive/foil-stamp layer blended over the cloth in the material
 * stack, matching the original's two-texture (base + foil) cover approach.
 */
export function makeFoilTexture(book, renderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 1152;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = '500 16px Inter, "Helvetica Neue", Arial, sans-serif';
  ctx.letterSpacing = "4px";
  ctx.fillText(book.eyebrow || "AL-HADI", canvas.width / 2, 92);

  const titleSize = book.titleAr.length > 6 ? 96 : 128;
  ctx.font = `400 ${titleSize}px "Aref Ruqaa", "UthmanNaskh", serif`;
  ctx.fillText(book.titleAr, canvas.width / 2, canvas.height * 0.68);

  if (book.titleSub) {
    ctx.font = '500 17px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.letterSpacing = "1.5px";
    ctx.fillText(book.titleSub.toUpperCase(), canvas.width / 2, canvas.height * 0.77);
  }

  return configureCanvasTexture(new THREE.CanvasTexture(canvas), renderer);
}

/** Woven-cloth bump map (grayscale height noise, tiled). Book-seeded so re-visits look identical. */
export function makeClothBumpTexture(book, renderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const random = subSeed(book, "cloth-bump");

  ctx.fillStyle = "#7f7f7f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let line = 0; line < 256; line += 2) {
    const value = Math.round(98 + random() * 70);
    ctx.strokeStyle = `rgb(${value},${value},${value})`;
    ctx.globalAlpha = 0.34 + random() * 0.18;
    ctx.lineWidth = 0.65 + random() * 0.45;
    ctx.beginPath();
    ctx.moveTo(0, line + (random() - 0.5));
    ctx.lineTo(256, line + (random() - 0.5));
    ctx.stroke();
  }

  for (let line = 1; line < 256; line += 3) {
    const value = Math.round(105 + random() * 58);
    ctx.strokeStyle = `rgb(${value},${value},${value})`;
    ctx.globalAlpha = 0.25 + random() * 0.14;
    ctx.lineWidth = 0.55 + random() * 0.35;
    ctx.beginPath();
    ctx.moveTo(line + (random() - 0.5), 0);
    ctx.lineTo(line + (random() - 0.5), 256);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 8);
  return configureCanvasTexture(texture, renderer, { color: false, anisotropy: 12 });
}

/** Normal + roughness maps for the cloth weave, procedurally derived from a height field. */
export function makeClothSurfaceMaps(book, renderer) {
  const size = 256;
  const heightField = new Float32Array(size * size);
  const normalCanvas = document.createElement("canvas");
  const roughnessCanvas = document.createElement("canvas");
  normalCanvas.width = roughnessCanvas.width = size;
  normalCanvas.height = roughnessCanvas.height = size;
  const normalContext = normalCanvas.getContext("2d");
  const roughnessContext = roughnessCanvas.getContext("2d");
  const normalImage = normalContext.createImageData(size, size);
  const roughnessImage = roughnessContext.createImageData(size, size);
  const phase = (hashSeed(book.seed) % 19) * 0.23;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const warp = Math.sin((x + phase) * Math.PI * 0.52);
      const weft = Math.sin((y - phase) * Math.PI * 0.41);
      const cross = Math.sin((x + y + phase) * Math.PI * 0.19);
      heightField[y * size + x] = 0.5 + warp * 0.18 + weft * 0.15 + cross * 0.045;
    }
  }

  const sampleHeight = (x, y) => {
    const wrappedX = (x + size) % size;
    const wrappedY = (y + size) % size;
    return heightField[wrappedY * size + wrappedX];
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = y * size + x;
      const pixel = index * 4;
      const dx = (sampleHeight(x + 1, y) - sampleHeight(x - 1, y)) * 1.5;
      const dy = (sampleHeight(x, y + 1) - sampleHeight(x, y - 1)) * 1.5;
      const length = Math.hypot(dx, dy, 1);
      normalImage.data[pixel] = Math.round(((-dx / length) * 0.5 + 0.5) * 255);
      normalImage.data[pixel + 1] = Math.round(((-dy / length) * 0.5 + 0.5) * 255);
      normalImage.data[pixel + 2] = Math.round(((1 / length) * 0.5 + 0.5) * 255);
      normalImage.data[pixel + 3] = 255;

      const roughness = Math.round(188 + heightField[index] * 56);
      roughnessImage.data[pixel] = roughness;
      roughnessImage.data[pixel + 1] = roughness;
      roughnessImage.data[pixel + 2] = roughness;
      roughnessImage.data[pixel + 3] = 255;
    }
  }

  normalContext.putImageData(normalImage, 0, 0);
  roughnessContext.putImageData(roughnessImage, 0, 0);

  const configureWeaveMap = (canvas, suffix) => {
    const texture = new THREE.CanvasTexture(canvas);
    texture.name = `${book.seed}-${suffix}`;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 8);
    return configureCanvasTexture(texture, renderer, { color: false, anisotropy: 12 });
  };

  return {
    normal: configureWeaveMap(normalCanvas, "cloth-normal"),
    roughness: configureWeaveMap(roughnessCanvas, "cloth-roughness")
  };
}

/** Clones a texture's wrap/repeat/offset for use as a grayscale emboss/bump map elsewhere. */
export function makeEmbossMap(sourceTexture, renderer, name) {
  const texture = new THREE.CanvasTexture(sourceTexture.image);
  texture.name = name;
  texture.wrapS = sourceTexture.wrapS;
  texture.wrapT = sourceTexture.wrapT;
  texture.repeat.copy(sourceTexture.repeat);
  texture.offset.copy(sourceTexture.offset);
  texture.center.copy(sourceTexture.center);
  texture.rotation = sourceTexture.rotation;
  return configureCanvasTexture(texture, renderer, { color: false, anisotropy: 16 });
}

/** Aged/uncoated paper grain: base wash + fiber strokes + flecks. Pure — no book-specific text. */
export function drawPaperSurface(ctx, width, height, random) {
  ctx.fillStyle = "#e8e1d3";
  ctx.fillRect(0, 0, width, height);

  const paperWash = ctx.createLinearGradient(0, 0, width, height);
  paperWash.addColorStop(0, "rgba(255,255,255,0.22)");
  paperWash.addColorStop(0.42, "rgba(255,255,255,0.035)");
  paperWash.addColorStop(1, "rgba(103,87,64,0.08)");
  ctx.fillStyle = paperWash;
  ctx.fillRect(0, 0, width, height);

  for (let fiber = 0; fiber < 2400; fiber += 1) {
    const x = random() * width;
    const y = random() * height;
    const length = 5 + random() * 34;
    const lightFiber = random() > 0.44;
    ctx.strokeStyle = lightFiber
      ? `rgba(255,255,255,${0.025 + random() * 0.045})`
      : `rgba(92,76,55,${0.018 + random() * 0.035})`;
    ctx.lineWidth = 0.45 + random() * 0.65;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(Math.min(width, x + length), y + (random() - 0.5) * 2.2);
    ctx.stroke();
  }

  for (let fleck = 0; fleck < 1200; fleck += 1) {
    const tone = Math.round(112 + random() * 94);
    ctx.fillStyle = `rgba(${tone},${tone - 5},${tone - 13},${0.016 + random() * 0.025})`;
    const size = 0.5 + random() * 1.1;
    ctx.fillRect(random() * width, random() * height, size, size);
  }
}

let sharedBlankPaperTexture = null;

/**
 * Blank aged-paper base texture, shared/cached across all pages (the paper
 * stock itself doesn't vary per surah — only the printed text on top does).
 * NOTE: unlike the original demo, this never bakes text onto the page —
 * live Arabic/translation text is a separate layer handled in Phase 2, so
 * it can be re-rendered on language toggle, font-size change, and per-ayah
 * highlight without regenerating the paper grain underneath it.
 */
export function makeBlankPaperTexture(renderer) {
  if (sharedBlankPaperTexture) return sharedBlankPaperTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 1152;
  const ctx = canvas.getContext("2d");
  const random = seededRandom(hashSeed("hadi-paper-stock"));
  drawPaperSurface(ctx, canvas.width, canvas.height, random);
  sharedBlankPaperTexture = configureCanvasTexture(new THREE.CanvasTexture(canvas), renderer);
  sharedBlankPaperTexture.userData.isSharedAsset = true; // never dispose per-rig — module-wide singleton, reused across every book
  return sharedBlankPaperTexture;
}

/**
 * Decorative endpaper (the pasted-down sheet facing the inside cover) —
 * cloth-tinted paper with a foil grid and a faded motif watermark.
 */
export function makeEndpaperTexture(book, renderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");
  const random = subSeed(book, "endpaper");
  drawPaperSurface(ctx, canvas.width, canvas.height, random);

  ctx.save();
  ctx.fillStyle = book.cloth;
  ctx.globalAlpha = 0.14;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = book.foil;
  ctx.lineWidth = 1;
  for (let x = 28; x < canvas.width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 24; y < canvas.height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.42;
  drawMotif(ctx, { ...book, foil: book.inkSoft || "#5c4c37" }, canvas.width, canvas.height);
  ctx.restore();

  const texture = configureCanvasTexture(new THREE.CanvasTexture(canvas), renderer, { anisotropy: 16 });
  texture.name = `${book.seed}-endpaper`;
  return texture;
}

let sharedContactShadowTexture = null;

/** Soft radial contact-shadow decal used under the book on the shelf. Not book-specific — shared/cached. */
export function makeContactShadowTexture(renderer) {
  if (sharedContactShadowTexture) return sharedContactShadowTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(256, 64, 10, 256, 64, 254);
  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.38, "rgba(255,255,255,0.62)");
  gradient.addColorStop(0.72, "rgba(255,255,255,0.18)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  sharedContactShadowTexture = configureCanvasTexture(new THREE.CanvasTexture(canvas), renderer, {
    color: false,
    anisotropy: 8
  });
  sharedContactShadowTexture.name = "soft-contact-shadow";
  sharedContactShadowTexture.userData.isSharedAsset = true;
  return sharedContactShadowTexture;
}

let sharedPageEdgeTextures = null;

/**
 * Fore-edge and head/tail-edge textures for the page block — fine
 * horizontal "signature" striations plus an edge vignette. Shared/cached:
 * the paper edge look is the same stock for every surah, only the cover
 * differs.
 */
export function makePageEdgeTextures(renderer) {
  if (sharedPageEdgeTextures) return sharedPageEdgeTextures;

  const makeEdgeTexture = (width, height, suffix) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const random = seededRandom(hashSeed(`hadi-page-edge-${suffix}`));

    ctx.fillStyle = "#dcd5c7";
    ctx.fillRect(0, 0, width, height);

    const pageStep = suffix === "fore-edge" ? 2 : 1.35;
    for (let y = 0; y < height; y += pageStep) {
      const shade = Math.round(106 + random() * 74);
      const signature = random() > 0.965;
      ctx.strokeStyle = `rgba(${shade},${shade - 3},${shade - 9},${signature ? 0.34 : 0.13 + random() * 0.13})`;
      ctx.lineWidth = signature ? 1.05 : 0.42 + random() * 0.42;
      ctx.beginPath();
      ctx.moveTo(0, y + (random() - 0.5) * 0.5);
      ctx.bezierCurveTo(
        width * 0.3,
        y + (random() - 0.5) * 0.9,
        width * 0.72,
        y + (random() - 0.5) * 0.9,
        width,
        y + (random() - 0.5) * 0.5
      );
      ctx.stroke();
    }

    const edgeShade = ctx.createLinearGradient(0, 0, width, 0);
    edgeShade.addColorStop(0, "rgba(58,48,35,0.18)");
    edgeShade.addColorStop(0.035, "rgba(255,255,255,0.04)");
    edgeShade.addColorStop(0.86, "rgba(255,255,255,0)");
    edgeShade.addColorStop(1, "rgba(58,48,35,0.12)");
    ctx.fillStyle = edgeShade;
    ctx.fillRect(0, 0, width, height);

    return configureCanvasTexture(new THREE.CanvasTexture(canvas), renderer);
  };

  sharedPageEdgeTextures = {
    fore: makeEdgeTexture(512, 2048, "fore-edge"),
    headTail: makeEdgeTexture(2048, 384, "head-tail-edge")
  };
  sharedPageEdgeTextures.fore.userData.isSharedAsset = true;
  sharedPageEdgeTextures.headTail.userData.isSharedAsset = true;
  return sharedPageEdgeTextures;
}

/** Spine cloth texture — same weave-noise treatment as the cover, in the spine's tall/narrow aspect. */
export function makeSpineTexture(book, renderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 1536;
  const ctx = canvas.getContext("2d");
  const random = subSeed(book, "spine-cloth");
  ctx.fillStyle = book.cloth;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const shade = ctx.createLinearGradient(0, 0, canvas.width, 0);
  shade.addColorStop(0, "rgba(0,0,0,0.2)");
  shade.addColorStop(0.14, "rgba(255,255,255,0.055)");
  shade.addColorStop(0.62, "rgba(255,255,255,0.012)");
  shade.addColorStop(1, "rgba(0,0,0,0.16)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let thread = 0; thread < 1900; thread += 1) {
    const x = random() * canvas.width;
    const y = random() * canvas.height;
    const vertical = random() > 0.42;
    ctx.strokeStyle = random() > 0.5
      ? `rgba(255,255,255,${0.018 + random() * 0.038})`
      : `rgba(0,0,0,${0.018 + random() * 0.032})`;
    ctx.lineWidth = 0.45 + random() * 0.7;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      vertical ? x + (random() - 0.5) * 1.2 : x + 8 + random() * 28,
      vertical ? y + 8 + random() * 34 : y + (random() - 0.5) * 1.2
    );
    ctx.stroke();
  }

  const bottomShade = ctx.createLinearGradient(0, canvas.height * 0.82, 0, canvas.height);
  bottomShade.addColorStop(0, "rgba(0,0,0,0)");
  bottomShade.addColorStop(1, "rgba(0,0,0,0.12)");
  ctx.fillStyle = bottomShade;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return configureCanvasTexture(new THREE.CanvasTexture(canvas), renderer, { anisotropy: 16 });
}

/** Spine foil stamp: surah number banner + vertical Arabic title + a small khatim mark near the tail. */
export function makeSpineFoilTexture(book, renderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 1536;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.4;
  ctx.strokeRect(34, 38, canvas.width - 68, canvas.height - 76);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '500 22px Inter, "Helvetica Neue", Arial, sans-serif';
  ctx.letterSpacing = "5px";
  ctx.fillText(book.eyebrow || "AL-HADI", canvas.width * 0.5, 118);

  ctx.save();
  ctx.translate(canvas.width * 0.5, canvas.height * 0.5);
  ctx.rotate(Math.PI / 2);
  const spineTitleSize = book.titleAr.length > 6 ? 58 : 72;
  ctx.font = `400 ${spineTitleSize}px "Aref Ruqaa", "UthmanNaskh", serif`;
  ctx.letterSpacing = "0px";
  ctx.fillText(book.titleAr, 0, 0);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(canvas.width * 0.5, canvas.height - 120, 24, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(canvas.width * 0.5 - 24, canvas.height - 120);
  ctx.lineTo(canvas.width * 0.5 + 24, canvas.height - 120);
  ctx.stroke();

  return configureCanvasTexture(new THREE.CanvasTexture(canvas), renderer);
}

/** Back cover: cloth base, weave noise, and a soft off-center vignette (no text — foil layer carries that). */
export function makeBackCoverTexture(book, renderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 1152;
  const ctx = canvas.getContext("2d");
  const random = subSeed(book, "back-cloth");

  ctx.fillStyle = book.cloth;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const edgeShade = ctx.createLinearGradient(0, 0, canvas.width, 0);
  edgeShade.addColorStop(0, "rgba(0,0,0,0.15)");
  edgeShade.addColorStop(0.05, "rgba(255,255,255,0.028)");
  edgeShade.addColorStop(0.84, "rgba(255,255,255,0)");
  edgeShade.addColorStop(1, "rgba(0,0,0,0.11)");
  ctx.fillStyle = edgeShade;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let thread = 0; thread < 2600; thread += 1) {
    const x = random() * canvas.width;
    const y = random() * canvas.height;
    const length = 5 + random() * 30;
    ctx.strokeStyle = random() > 0.5
      ? `rgba(255,255,255,${0.018 + random() * 0.03})`
      : `rgba(0,0,0,${0.016 + random() * 0.028})`;
    ctx.lineWidth = 0.45 + random() * 0.65;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y + (random() - 0.5) * 1.5);
    ctx.stroke();
  }

  const vignette = ctx.createRadialGradient(
    canvas.width * 0.62, canvas.height * 0.38, 20,
    canvas.width * 0.62, canvas.height * 0.38, canvas.width * 0.75
  );
  vignette.addColorStop(0, "rgba(255,255,255,0.03)");
  vignette.addColorStop(1, "rgba(0,0,0,0.09)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return configureCanvasTexture(new THREE.CanvasTexture(canvas), renderer);
}

/** Back-cover foil: eyebrow banner, a concentric-ring khatim mark, Arabic title, closing line. */
export function makeBackFoilTexture(book, renderer) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 1152;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.font = '500 16px Inter, "Helvetica Neue", Arial, sans-serif';
  ctx.letterSpacing = "3px";
  ctx.fillText(book.eyebrow || "AL-HADI", 68, 82);
  ctx.globalAlpha = 0.72;
  ctx.fillRect(68, 108, 176, 2);
  ctx.globalAlpha = 1;

  ctx.lineWidth = 1.5;
  for (let ring = 0; ring < 5; ring += 1) {
    ctx.globalAlpha = 0.24 - ring * 0.032;
    ctx.beginPath();
    ctx.arc(548, 374, 74 + ring * 38, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(348, 374);
  ctx.lineTo(704, 374);
  ctx.moveTo(548, 174);
  ctx.lineTo(548, 574);
  ctx.stroke();

  ctx.textAlign = "right";
  const backTitleSize = book.titleAr.length > 6 ? 52 : 62;
  ctx.font = `400 ${backTitleSize}px "Aref Ruqaa", "UthmanNaskh", serif`;
  ctx.fillText(book.titleAr, 700, 956);
  if (book.titleSub) {
    ctx.font = '500 15px Inter, "Helvetica Neue", Arial, sans-serif';
    ctx.letterSpacing = "2.6px";
    ctx.fillText(book.titleSub.toUpperCase(), 698, 1004);
  }
  ctx.globalAlpha = 0.68;
  ctx.fillRect(68, 1040, 632, 1.5);
  ctx.globalAlpha = 1;
  ctx.fillText("HADI · QURAN REFERENCE", 700, 1080);

  return configureCanvasTexture(new THREE.CanvasTexture(canvas), renderer);
}

let sharedWalnutMaps = null;

/**
 * Procedural walnut wood-grain (color + roughness), shared/cached across
 * the whole shelf — the shelf itself isn't book-specific. Canvas-drawn
 * rather than a downloaded photo texture: keeps the whole visual system
 * on one licensing-free, self-contained generation approach instead of
 * mixing in an external image asset of unclear provenance.
 */
export function makeWalnutMaps(renderer) {
  if (sharedWalnutMaps) return sharedWalnutMaps;
  const width = 512;
  const height = 512;
  const random = seededRandom(hashSeed("hadi-walnut-shelf"));

  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = width;
  colorCanvas.height = height;
  const colorCtx = colorCanvas.getContext("2d");

  const base = colorCtx.createLinearGradient(0, 0, width, 0);
  base.addColorStop(0, "#5a3c28");
  base.addColorStop(0.5, "#6b4a34");
  base.addColorStop(1, "#4e321f");
  colorCtx.fillStyle = base;
  colorCtx.fillRect(0, 0, width, height);

  // Long horizontal grain streaks with gentle sine waviness, varied opacity/tone.
  for (let streak = 0; streak < 260; streak += 1) {
    const y = random() * height;
    const tone = random() > 0.5 ? "rgba(30,18,10,0.10)" : "rgba(120,86,54,0.09)";
    colorCtx.strokeStyle = tone;
    colorCtx.lineWidth = 0.6 + random() * 2.2;
    const waveAmp = 2 + random() * 6;
    const waveFreq = 0.008 + random() * 0.014;
    colorCtx.beginPath();
    for (let x = 0; x <= width; x += 8) {
      const yy = y + Math.sin(x * waveFreq + streak) * waveAmp;
      if (x === 0) colorCtx.moveTo(x, yy); else colorCtx.lineTo(x, yy);
    }
    colorCtx.stroke();
  }

  // Occasional darker knots.
  for (let knot = 0; knot < 5; knot += 1) {
    const x = random() * width;
    const y = random() * height;
    const radius = 6 + random() * 14;
    const gradient = colorCtx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, "rgba(20,12,7,0.55)");
    gradient.addColorStop(0.6, "rgba(20,12,7,0.18)");
    gradient.addColorStop(1, "rgba(20,12,7,0)");
    colorCtx.fillStyle = gradient;
    colorCtx.beginPath();
    colorCtx.ellipse(x, y, radius, radius * 0.62, random() * Math.PI, 0, Math.PI * 2);
    colorCtx.fill();
  }

  const colorTexture = new THREE.CanvasTexture(colorCanvas);
  colorTexture.wrapS = THREE.RepeatWrapping;
  colorTexture.wrapT = THREE.RepeatWrapping;
  colorTexture.repeat.set(3, 1);
  configureCanvasTexture(colorTexture, renderer, { anisotropy: 16 });
  colorTexture.userData.isSharedAsset = true;

  const roughnessCanvas = document.createElement("canvas");
  roughnessCanvas.width = width;
  roughnessCanvas.height = height;
  const roughnessCtx = roughnessCanvas.getContext("2d");
  const roughnessRandom = seededRandom(hashSeed("hadi-walnut-roughness"));
  for (let y = 0; y < height; y += 1) {
    const value = Math.round(150 + Math.sin(y * 0.05) * 20 + roughnessRandom() * 30);
    roughnessCtx.fillStyle = `rgb(${value},${value},${value})`;
    roughnessCtx.fillRect(0, y, width, 1);
  }
  const roughnessTexture = new THREE.CanvasTexture(roughnessCanvas);
  roughnessTexture.wrapS = THREE.RepeatWrapping;
  roughnessTexture.wrapT = THREE.RepeatWrapping;
  roughnessTexture.repeat.set(3, 1);
  configureCanvasTexture(roughnessTexture, renderer, { color: false, anisotropy: 16 });
  roughnessTexture.userData.isSharedAsset = true;

  sharedWalnutMaps = { color: colorTexture, roughness: roughnessTexture };
  return sharedWalnutMaps;
}
