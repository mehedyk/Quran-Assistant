// Animated favicon: no GIF/APNG needed. We draw frames on an in-memory
// canvas and periodically swap the <link rel="icon"> href for a data URL.
// This is a well-supported technique (works in every major browser,
// unlike animated .ico/.gif favicons which most browsers freeze on the
// first frame) and needs no extra network requests or dependencies.
//
// Respects prefers-reduced-motion by rendering a single static frame.

const SIZE   = 64;
const FRAMES = 24;
const FRAME_MS = 90;

function buildFrame(ctx, t) {
  // t: 0..1 progress through the loop
  ctx.clearRect(0, 0, SIZE, SIZE);

  // background disc
  const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  grad.addColorStop(0, "#2a6840");
  grad.addColorStop(1, "#0f2e1c");
  ctx.beginPath();
  ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // rotating crescent
  const angle = t * Math.PI * 2;
  ctx.save();
  ctx.translate(SIZE * 0.62, SIZE * 0.4);
  ctx.rotate(angle * 0.15); // gentle wobble, not a full spin
  ctx.beginPath();
  ctx.arc(0, 0, SIZE * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = "#f0c060";
  ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(SIZE * 0.07, -SIZE * 0.03, SIZE * 0.17, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalCompositeOperation = "source-over";

  // twinkling star (pulses in size/opacity)
  const pulse = (Math.sin(angle) + 1) / 2; // 0..1
  const starSize = SIZE * (0.09 + pulse * 0.05);
  ctx.save();
  ctx.globalAlpha = 0.55 + pulse * 0.45;
  ctx.translate(SIZE * 0.36, SIZE * 0.66);
  drawStar(ctx, 0, 0, 5, starSize, starSize / 2.3);
  ctx.fillStyle = "#f0c060";
  ctx.fill();
  ctx.restore();
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    let x = cx + Math.cos(rot) * outerR;
    let y = cy + Math.sin(rot) * outerR;
    ctx.lineTo(x, y);
    rot += step;
    x = cx + Math.cos(rot) * innerR;
    y = cy + Math.sin(rot) * innerR;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerR);
  ctx.closePath();
}

export function startAnimatedFavicon() {
  if (typeof document === "undefined") return;

  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  if (reducedMotion) {
    buildFrame(ctx, 0);
    link.href = canvas.toDataURL("image/png");
    return;
  }

  let frame = 0;
  let stopped = false;

  function tick() {
    if (stopped) return;
    buildFrame(ctx, frame / FRAMES);
    link.href = canvas.toDataURL("image/png");
    frame = (frame + 1) % FRAMES;
  }

  const intervalId = setInterval(tick, FRAME_MS);
  tick();

  // Pause when tab is hidden — saves battery/CPU, and avoids animating
  // a favicon nobody can see.
  document.addEventListener("visibilitychange", () => {
    stopped = document.hidden;
  });

  return () => {
    stopped = true;
    clearInterval(intervalId);
  };
}
