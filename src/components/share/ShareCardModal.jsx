import { useState, useEffect, useRef } from "react";
import { Download, Share2 } from "lucide-react";
import { stripHtml } from "../../utils/constants.js";

// Seven card templates: one per waqt palette (so a share card can echo
// whichever time-of-day theme the person is reading in) plus the
// brand's signature Emerald look and a high-drama "Poster" style.
// Deliberately no figures, faces, or iconography of any living thing —
// every style is built from geometry, gradients, and type, in line
// with how Islamic decorative art traditionally avoids figurative
// imagery.
const CARD_STYLES = [
  { key: "emerald", label: "Emerald",  bg1: "#0d2b1c", bg2: "#081a11", ink: "#f0e8d8", sub: "#a9c9b6", gold: "#d4af37", frame: "ornate" },
  { key: "fajr",    label: "Fajr",     bg1: "#16213a", bg2: "#0f172a", ink: "#f1f5f9", sub: "#94a3b8", gold: "#38bdf8", frame: "ornate" },
  { key: "dhuhr",   label: "Dhuhr",    bg1: "#fffbeb", bg2: "#fde8b8", ink: "#431407", sub: "#92400e", gold: "#c2410c", frame: "minimal" },
  { key: "asr",     label: "Asr",      bg1: "#fff1de", bg2: "#fbcfa0", ink: "#431407", sub: "#9a3412", gold: "#ea580c", frame: "minimal" },
  { key: "maghrib", label: "Maghrib",  bg1: "#3a2245", bg2: "#20131f", ink: "#fdf2f8", sub: "#e3b8d6", gold: "#fb923c", frame: "ornate" },
  { key: "isha",    label: "Isha",     bg1: "#0a0f1f", bg2: "#020617", ink: "#f8fafc", sub: "#94a3b8", gold: "#d4af37", frame: "ornate" },
  { key: "poster",  label: "Poster",   bg1: "#0b0b0d", bg2: "#000000", ink: "#f5f0e6", sub: "#c9a86a", gold: "#d4af37", frame: "poster" },
];

const W = 900, H = 1125; // 4:5 — reads well as a feed/story card

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(" ");
  let line = "", lines = [];
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineH));
  return y + lines.length * lineH;
}

// A single continuous 8-point starburst — alternating outer/inner
// radius around one path, not two overlapping shapes, so there's no
// risk of it reading as a hexagram or any other symbol. Just a plain
// geometric sun-burst, a common motif in Islamic ornamental borders.
function drawKhatim(ctx, cx, cy, r, stroke, lineWidth = 1.4) {
  const points = 8;
  const innerR = r * 0.45;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : innerR;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = rad * Math.cos(a), y = rad * Math.sin(a);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawCornerBracket(ctx, x, y, size, flipX, flipY, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, size); ctx.lineTo(0, 0); ctx.lineTo(size, 0);
  ctx.stroke();
  ctx.restore();
}

function drawBrandMark(ctx, x, y, gold, ink) {
  // Small circular emblem + khatim + wordmark — a consistent,
  // professional-courtesy watermark on every template.
  ctx.save();
  ctx.strokeStyle = gold; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.stroke();
  drawKhatim(ctx, x, y, 7, gold, 1);
  ctx.textAlign = "left"; ctx.direction = "ltr";
  ctx.font = "600 15px 'Hind Siliguri', sans-serif";
  ctx.fillStyle = ink;
  ctx.fillText("هادي  ·  Hadi Quran", x + 22, y + 5);
  ctx.restore();
}

function draw(ctx, style, ayah) {
  ctx.clearRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, W * 0.3, H);
  g.addColorStop(0, style.bg1); g.addColorStop(1, style.bg2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  if (style.frame === "poster") {
    // vignette for drama
    const vg = ctx.createRadialGradient(W/2, H/2, H*0.25, W/2, H/2, H*0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    const bs = 70;
    drawCornerBracket(ctx, 36, 36, bs, false, false, style.gold);
    drawCornerBracket(ctx, W-36, 36, bs, true, false, style.gold);
    drawCornerBracket(ctx, 36, H-36, bs, false, true, style.gold);
    drawCornerBracket(ctx, W-36, H-36, bs, true, true, style.gold);
  } else if (style.frame === "ornate") {
    ctx.strokeStyle = `${style.gold}55`; ctx.lineWidth = 1.5;
    ctx.strokeRect(28, 28, W-56, H-56);
    ctx.strokeStyle = `${style.gold}88`; ctx.lineWidth = 1;
    ctx.strokeRect(36, 36, W-72, H-72);
    [[60,60],[W-60,60],[60,H-60],[W-60,H-60]].forEach(([x,y]) => drawKhatim(ctx, x, y, 16, `${style.gold}66`, 1));
    // faint large khatim watermark, centered behind the verse
    drawKhatim(ctx, W/2, H/2 - 40, 210, `${style.gold}0e`, 2);
  } else {
    ctx.strokeStyle = `${style.gold}40`; ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, W-80, H-80);
  }

  // reference badge (pill)
  const badge = `${ayah.surahName || ""}  ·  ${ayah.key || ""}`;
  ctx.font = "600 22px 'Hind Siliguri', sans-serif";
  const bw = ctx.measureText(badge).width + 56;
  ctx.fillStyle = style.gold;
  const bx = W/2 - bw/2, by = 96, bh = 46;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(bx, by, bw, bh, 23) : ctx.rect(bx, by, bw, bh);
  ctx.fill();
  ctx.fillStyle = style.frame === "minimal" ? "#fff" : "#1a1209";
  ctx.textAlign = "center";
  ctx.fillText(badge, W/2, by + bh/2 + 7);

  // Arabic — the hero content
  ctx.direction = "rtl"; ctx.textAlign = "center";
  ctx.fillStyle = style.ink;
  ctx.font = style.frame === "poster" ? "700 52px 'Amiri', serif" : "600 46px 'Amiri', serif";
  const arabicBottom = wrapText(ctx, ayah.arabic || "", W/2, 340, W-160, style.frame === "poster" ? 78 : 68);

  // translation
  ctx.direction = "ltr"; ctx.textAlign = "center";
  ctx.fillStyle = style.sub;
  ctx.font = "400 26px 'Hind Siliguri', sans-serif";
  wrapText(ctx, stripHtml(ayah.bengali || ayah.english || "").slice(0, 220), W/2, Math.max(arabicBottom + 60, H-320), W-200, 40);

  drawBrandMark(ctx, 56, H - 48, style.gold, style.sub);
}

export default function ShareCardModal({ t, ayah, onClose }) {
  const canvasRef = useRef(null);
  const [styleIdx, setStyleIdx] = useState(0);
  const style = CARD_STYLES[styleIdx];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W; canvas.height = H;
    draw(canvas.getContext("2d"), style, ayah);
  }, [ayah, styleIdx]);

  function download() {
    const a = document.createElement("a");
    a.download = `hadi-${ayah.key}-${style.key}.png`;
    a.href = canvasRef.current.toDataURL("image/png");
    a.click();
  }

  async function share() {
    const canvas = canvasRef.current;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `hadi-${ayah.key}.png`, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: "Hadi", text: `${ayah.surahName} ${ayah.key}` }); }
        catch { /* user cancelled — no-op */ }
      } else {
        download();
      }
    }, "image/png");
  }

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal share-card-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>{t.shareCard}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="share-style-row">
          {CARD_STYLES.map((s, i) => (
            <button
              key={s.key}
              className={`share-style-swatch ${i === styleIdx ? "active" : ""}`}
              style={{ background: `linear-gradient(135deg, ${s.bg1}, ${s.bg2})`, borderColor: s.gold }}
              onClick={() => setStyleIdx(i)}
              title={s.label}
              aria-label={s.label}
            />
          ))}
        </div>

        <canvas ref={canvasRef} style={{ width: "100%", borderRadius: 10, display: "block" }} />

        <div className="share-actions-row">
          <button className="btn-primary" style={{ flex: 1 }} onClick={download}>
            <Download size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />{t.download}
          </button>
          {canNativeShare && (
            <button className="btn-primary" style={{ flex: 1 }} onClick={share}>
              <Share2 size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />{t.share}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
