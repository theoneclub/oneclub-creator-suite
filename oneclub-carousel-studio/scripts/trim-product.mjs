#!/usr/bin/env node
/**
 * Prepare a supplied product render for a CTA slide.
 *
 *   node scripts/trim-product.mjs assets/ebook-blueprint.png
 *
 * Two jobs, both mechanical — this never repaints the artwork:
 *
 *   1. Key the background out. A mockup usually arrives on white, and on a pure
 *      black slide that shows as a white rectangle. The key is a flood fill from
 *      the border inwards, NOT a global threshold: the book's own page block is
 *      white too, and a threshold would eat it.
 *   2. Trim to the subject. Renders arrive on a big landscape canvas; the slide
 *      wants the product filling its box, so crop to the remaining pixels.
 *
 * Runs in Chromium because that is the image decoder already in the toolchain.
 * The image goes in as a data URI: a file:// source will not decode into a
 * canvas from about:blank, it trips the origin check.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

const STUDIO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function loadChromium() {
  const pick = (m) => m?.chromium ?? m?.default?.chromium;
  for (const spec of ['playwright', 'playwright-core']) {
    try { const c = pick(await import(spec)); if (c) return c; } catch { /* next */ }
  }
  const entry = path.join(execSync('npm root -g', { encoding: 'utf8' }).trim(), 'playwright', 'index.js');
  const c = pick(await import(pathToFileURL(entry).href));
  if (c) return c;
  throw new Error('Playwright not found.');
}

const target = process.argv[2];
if (!target) {
  console.error('usage: node scripts/trim-product.mjs <image> [--tolerance 26] [--out <file>]');
  process.exit(2);
}
const src = path.resolve(target);
const argOf = (flag, dflt) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : dflt;
};
const tolerance = Number(argOf('--tolerance', 26));
const out = path.resolve(argOf('--out', src));

const chromium = await loadChromium();
const browser = await chromium.launch();
const page = await browser.newPage();

const result = await page.evaluate(async ({ url, tolerance }) => {
  const img = new Image();
  img.src = url;
  await img.decode();

  const W = img.naturalWidth, H = img.naturalHeight;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, W, H);
  const px = data.data;

  const at = (x, y) => (y * W + x) * 4;
  const corner = at(0, 0);
  const bg = [px[corner], px[corner + 1], px[corner + 2]];
  const bgAlpha = px[corner + 3];

  // Flood fill from every border pixel. Interior whites are unreachable and
  // therefore survive — which is the whole point of doing it this way.
  const seen = new Uint8Array(W * H);
  const stack = [];
  const near = (i) => Math.abs(px[i] - bg[0]) <= tolerance
    && Math.abs(px[i + 1] - bg[1]) <= tolerance
    && Math.abs(px[i + 2] - bg[2]) <= tolerance;

  for (let x = 0; x < W; x++) { stack.push([x, 0], [x, H - 1]); }
  for (let y = 0; y < H; y++) { stack.push([0, y], [W - 1, y]); }

  let cleared = 0;
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const k = y * W + x;
    if (seen[k]) continue;
    const i = k * 4;
    if (px[i + 3] === 0) { seen[k] = 1; continue; }
    if (!near(i)) continue;
    seen[k] = 1;
    px[i + 3] = 0;
    cleared++;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  // Bounding box of what is left.
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (px[at(x, y) + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { error: 'every pixel was keyed out — tolerance is too high' };

  ctx.putImageData(data, 0, 0);
  const cw = maxX - minX + 1, ch = maxY - minY + 1;
  const crop = document.createElement('canvas');
  crop.width = cw; crop.height = ch;
  crop.getContext('2d').drawImage(cv, minX, minY, cw, ch, 0, 0, cw, ch);

  return {
    source: `${W}x${H}`,
    bg: `rgb(${bg.join(',')}) alpha ${bgAlpha}`,
    cleared,
    cropped: `${cw}x${ch}`,
    ratio: (cw / ch).toFixed(3),
    dataUrl: crop.toDataURL('image/png'),
  };
}, { url: `data:image/png;base64,${fs.readFileSync(src).toString('base64')}`, tolerance });

await browser.close();

if (result.error) { console.error(result.error); process.exit(1); }

fs.writeFileSync(out, Buffer.from(result.dataUrl.split(',')[1], 'base64'));
console.log(`  source     ${result.source}`);
console.log(`  background ${result.bg}`);
console.log(`  keyed out  ${result.cleared.toLocaleString()} px`);
console.log(`  cropped to ${result.cropped}  (ratio ${result.ratio})`);
console.log(`  wrote      ${path.relative(STUDIO, out)}`);
