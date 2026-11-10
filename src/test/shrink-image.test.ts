import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_EDGE, shrinkImage, targetSize } from "@/lib/shrinkImage";

describe("targetSize", () => {
  it("keeps photos already within the max edge", () => {
    expect(targetSize(800, 1000)).toEqual({ width: 800, height: 1000, scaled: false });
    expect(targetSize(MAX_EDGE, 900)).toEqual({ width: MAX_EDGE, height: 900, scaled: false });
  });

  it("scales a tall phone photo so the longest side is the max edge", () => {
    expect(targetSize(3024, 4032)).toEqual({ width: 960, height: MAX_EDGE, scaled: true });
  });

  it("scales a wide photo by its width", () => {
    expect(targetSize(4000, 2000)).toEqual({ width: MAX_EDGE, height: 640, scaled: true });
  });

  it("never upscales and never returns zero", () => {
    expect(targetSize(0, 0).scaled).toBe(false);
    expect(targetSize(10000, 1).height).toBe(1);
  });
});

describe("shrinkImage", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns non-images and GIFs untouched", async () => {
    const txt = new File(["hello"], "a.txt", { type: "text/plain" });
    const gif = new File([new Uint8Array(10)], "a.gif", { type: "image/gif" });
    expect(await shrinkImage(txt)).toBe(txt);
    expect(await shrinkImage(gif)).toBe(gif);
  });

  it("falls back to the original file when the browser can't decode it", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn(() => Promise.reject(new Error("unsupported"))));
    const heic = new File([new Uint8Array(2048)], "photo.heic", { type: "image/heic" });
    expect(await shrinkImage(heic)).toBe(heic);
  });

  it("sends small photos within the max edge as-is", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn(() => Promise.resolve({ width: 900, height: 1200, close: vi.fn() })));
    const small = new File([new Uint8Array(50 * 1024)], "small.jpg", { type: "image/jpeg" });
    expect(await shrinkImage(small)).toBe(small);
  });
});

describe("shrinkImage without a decoder", () => {
  it("sends the original when createImageBitmap is unavailable", async () => {
    vi.stubGlobal("createImageBitmap", undefined);
    const big = new File([new Uint8Array(3 * 1024 * 1024)], "big.jpg", { type: "image/jpeg" });
    expect(await shrinkImage(big)).toBe(big);
    vi.unstubAllGlobals();
  });
});
