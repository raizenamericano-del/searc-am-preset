import jsQR from "jsqr";

export const QR_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const QR_MAX_DIMENSION = 1600;

/** Decode a QR from raw RGBA pixels. Returns null when no QR could be read. */
export function decodeQrFromPixels(data: Uint8ClampedArray, width: number, height: number): string | null {
  if (width <= 0 || height <= 0 || data.length !== width * height * 4) return null;
  const res = jsQR(data, width, height, { inversionAttempts: "attemptBoth" });
  return res?.data ? res.data : null;
}

/** Browser-only: load an image file, downscale, and try to decode at a couple of scales. */
export async function decodeQrFromFile(file: File): Promise<{ text: string | null; previewUrl: string }> {
  if (!file.type.startsWith("image/")) throw new Error("Berkas harus berupa gambar (PNG, JPG, WEBP).");
  if (file.size > QR_MAX_FILE_BYTES) throw new Error("Ukuran gambar maksimal 10 MB.");
  const previewUrl = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Gambar tidak dapat dibaca."));
    el.src = previewUrl;
  });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Browser tidak mendukung canvas.");
  for (const maxDim of [QR_MAX_DIMENSION, 900, 500]) {
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    const text = decodeQrFromPixels(ctx.getImageData(0, 0, w, h).data, w, h);
    if (text) return { text, previewUrl };
  }
  return { text: null, previewUrl };
}
