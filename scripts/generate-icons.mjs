// Generates PWA / favicon PNGs from public/icons/logo.svg. Run: node scripts/generate-icons.mjs
import sharp from "sharp";
import { readFile } from "node:fs/promises";

const svg = await readFile(new URL("../public/icons/logo.svg", import.meta.url));
const out = (p) => new URL(`../public/${p}`, import.meta.url).pathname;

for (const size of [192, 512]) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(out(`icons/icon-${size}.png`));
}
await sharp(svg, { density: 384 }).resize(180, 180).png().toFile(out("icons/apple-touch-icon.png"));
await sharp(svg, { density: 384 }).resize(32, 32).png().toFile(out("icons/favicon-32.png"));
// maskable: logo inside the 80% safe zone on a solid background
const inner = await sharp(svg, { density: 384 }).resize(384, 384).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: "#05070d" } })
  .composite([{ input: inner, top: 64, left: 64 }])
  .png()
  .toFile(out("icons/icon-maskable-512.png"));
console.log("icons generated");
