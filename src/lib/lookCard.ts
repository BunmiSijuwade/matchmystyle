/** Draws a 1080x1350 shareable "look card" from verified look-board products. */
export interface CardPiece { label: string; imageUrl: string | null; price: string | null }
export interface CardInput { aesthetic: string | null; request: string | null; total: string; pieces: CardPiece[] }
export interface CardResult { blob: Blob; url: string; proxied: string[]; failed: string[] }

const W = 1080, H = 1350;
const CREAM = "#FAFAF8", INK = "#1A1A1A", MUTED = "#7A6F68", TAUPE = "#6F5A42", BLANK = "#F5EDE4";
const TILTS = [-2, 1.5, -1, 2];
const SERIF = "'Instrument Serif', Georgia, serif";
const SANS = "Manrope, sans-serif";

const proxyUrl = (u: string) => `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/image-proxy?url=${encodeURIComponent(u)}`;

const loadImg = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error("load failed"));
  img.src = src;
});

/** True if drawing this image would taint a canvas. */
const taints = (img: HTMLImageElement) => {
  try {
    const c = document.createElement("canvas"); c.width = c.height = 1;
    const x = c.getContext("2d")!; x.drawImage(img, 0, 0, 1, 1); x.getImageData(0, 0, 1, 1);
    return false;
  } catch { return true; }
};

async function loadSafe(url: string, proxied: string[]): Promise<HTMLImageElement | null> {
  try { const img = await loadImg(url); if (!taints(img)) return img; } catch { /* fall through */ }
  try {
    const img = await loadImg(proxyUrl(url));
    proxied.push(new URL(url).hostname);
    return taints(img) ? null : img;
  } catch { return null; }
}

const truncate = (ctx: CanvasRenderingContext2D, text: string, max: number) => {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
};

function polaroid(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, tilt: number, piece: CardPiece, img: HTMLImageElement | null) {
  const pad = 18, band = 70, w = size + pad * 2, h = size + pad + band;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((tilt * Math.PI) / 180);
  ctx.shadowColor = "rgba(26,26,26,0.14)"; ctx.shadowBlur = 36; ctx.shadowOffsetY = 12;
  ctx.fillStyle = "#FFFFFF"; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.shadowColor = "transparent";
  const ix = -w / 2 + pad, iy = -h / 2 + pad;
  if (img) {
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, ix, iy, size, size);
  } else { ctx.fillStyle = BLANK; ctx.fillRect(ix, iy, size, size); }
  const by = iy + size;
  ctx.textBaseline = "middle";
  ctx.font = `400 24px ${SANS}`;
  const pw = piece.price ? ctx.measureText(piece.price).width + 16 : 0;
  ctx.fillStyle = INK; ctx.font = `italic 30px ${SERIF}`; ctx.textAlign = "left";
  ctx.fillText(truncate(ctx, piece.label, size - pw), ix, by + band / 2);
  if (piece.price) {
    ctx.fillStyle = MUTED; ctx.font = `400 24px ${SANS}`; ctx.textAlign = "right";
    ctx.fillText(piece.price, w / 2 - pad, by + band / 2);
  }
  ctx.restore();
}

export async function renderLookCard(input: CardInput): Promise<CardResult> {
  await Promise.all([
    document.fonts.load(`30px ${SERIF}`), document.fonts.load(`italic 30px ${SERIF}`),
    document.fonts.load(`400 24px ${SANS}`), document.fonts.load(`500 36px ${SANS}`), document.fonts.load(`600 32px ${SANS}`),
  ]).catch(() => undefined);
  await document.fonts.ready;

  const pieces = input.pieces.slice(0, 4);
  const proxied: string[] = [];
  const imgs = await Promise.all(pieces.map((p) => (p.imageUrl ? loadSafe(p.imageUrl, proxied) : Promise.resolve(null))));
  const failed = pieces.filter((p, i) => p.imageUrl && !imgs[i]).map((p) => p.label);

  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
  const M = 80;

  // header
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
  ctx.fillStyle = MUTED; ctx.font = `600 22px ${SANS}`;
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "4px";
  ctx.fillText("THE LOOK", M, 110);
  (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "0px";
  ctx.fillStyle = INK; ctx.font = `84px ${SERIF}`;
  ctx.fillText(truncate(ctx, input.aesthetic ?? "your look", W - M * 2), M, 200);
  if (input.request) {
    ctx.fillStyle = MUTED; ctx.font = `400 28px ${SANS}`;
    const line = input.request.toLowerCase().trim();
    ctx.fillText(truncate(ctx, line.length > 60 ? `${line.slice(0, 60).trimEnd()}…` : line, W - M * 2), M, 250);
  }

  // polaroids: area y 300..1180
  const top = 300, bottom = 1180, mid = (top + bottom) / 2;
  const n = pieces.length;
  if (n === 1) polaroid(ctx, W / 2, mid, 620, TILTS[0], pieces[0], imgs[0]);
  else if (n === 2) {
    const s = 400;
    [0, 1].forEach((i) => polaroid(ctx, W / 2 + (i ? 1 : -1) * 240, mid, s, TILTS[i], pieces[i], imgs[i]));
  } else if (n > 2) {
    const s = 330, dx = 210, rowH = (bottom - top) / 2;
    pieces.forEach((p, i) => {
      const row = Math.floor(i / 2), col = i % 2;
      const cx = n === 3 && i === 2 ? W / 2 : W / 2 + (col ? dx : -dx);
      polaroid(ctx, cx, top + rowH * row + rowH / 2, s, TILTS[i % 4], p, imgs[i]);
    });
  }

  // footer
  const fy = 1250;
  ctx.textAlign = "left"; ctx.fillStyle = INK; ctx.font = `600 32px ${SANS}`;
  ctx.fillText(`total ${input.total}`, M, fy);
  ctx.font = `500 36px ${SANS}`;
  const a = ctx.measureText("Match").width, z = ctx.measureText("Style").width;
  ctx.font = `italic 36px ${SERIF}`;
  const my = ctx.measureText("My").width + 4;
  let x = W - M - (a + my + z);
  ctx.font = `500 36px ${SANS}`; ctx.fillStyle = INK; ctx.fillText("Match", x, fy); x += a + 2;
  ctx.font = `italic 36px ${SERIF}`; ctx.fillStyle = TAUPE; ctx.fillText("My", x, fy); x += my;
  ctx.font = `500 36px ${SANS}`; ctx.fillStyle = INK; ctx.fillText("Style", x, fy);
  ctx.font = `400 20px ${SANS}`; ctx.fillStyle = MUTED; ctx.textAlign = "right";
  ctx.fillText("matchmystyle.lovable.app", W - M, fy + 38);

  const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/png"));
  return { blob, url: URL.createObjectURL(blob), proxied: [...new Set(proxied)], failed };
}
