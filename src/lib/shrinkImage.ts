// Shrinks a photo in the browser before it is sent to analyze-outfit, so the upload and the AI step
// handle a ~1280px JPEG instead of a full-size phone photo. Never throws: on any failure (e.g. a format
// this browser can't decode) it returns the original file, so analysis behaves exactly as before.

export const MAX_EDGE = 1280;
export const JPEG_QUALITY = 0.82;
/** Files already this small and within MAX_EDGE are sent as-is. */
export const SMALL_ENOUGH_BYTES = 400 * 1024;

/** Target size that fits within maxEdge on the longest side, keeping the aspect ratio. Never upscales. */
export function targetSize(width: number, height: number, maxEdge = MAX_EDGE) {
  const longest = Math.max(width, height);
  if (!longest || longest <= maxEdge) return { width, height, scaled: false };
  const scale = maxEdge / longest;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)), scaled: true };
}

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void } | null> {
  // createImageBitmap is in every browser we support; without it we just send the original.
  if (typeof createImageBitmap !== "function") return null;
  // from-image applies the photo's EXIF rotation, so portrait phone photos stay upright.
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
}

export async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const img = await decode(file);
    if (!img) return file;
    const t = targetSize(img.width, img.height);
    if (!t.scaled && file.size <= SMALL_ENOUGH_BYTES) {
      img.close();
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = t.width;
    canvas.height = t.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      img.close();
      return file;
    }
    ctx.drawImage(img.source, 0, 0, t.width, t.height);
    img.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
