#!/usr/bin/env node
/**
 * Full-bleed "energy field" background art: a hooded silhouette (Morphe, no
 * face) surrounded by concentric glowing rings, on-brand green/gold instead
 * of a literal rainbow. Built to give every slide type a vivid backdrop the
 * way a reference carousel's aura art does — not just the hook/CTA slides.
 *
 *   node scripts/make-field-art.mjs
 *
 * Same reasoning as make-mocks.mjs: generated in-repo so a clean checkout
 * renders byte-identical, with no image pipeline and nothing to download.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STUDIO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = path.join(STUDIO, 'assets');

const FONT = fs.readFileSync(path.join(ASSETS, 'model-compare.svg'), 'utf8')
  .match(/@font-face \{ font-family:'Inter'[\s\S]*?\}/)[0];

const W = 1080, H = 1350;
const G = '#a3f0af';
const G_DIM = '#5fae6d';
const GOLD = '#FFD700';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * One field-art variant. `seed` shifts ring radii, hood tilt and the
 * turbulence seed so the four outputs read as related but distinct — the
 * same way the reference carousel's aura shifts pose and crop slide to slide.
 */
function fieldArt(seed = 0) {
  const cx = 540, cy = 760 + (seed % 2 === 0 ? 0 : -30);
  const tilt = (seed - 1.5) * 2.2; // degrees, small hood tilt per variant
  const turbSeed = 2 + seed;

  const ringColors = [G, G_DIM, GOLD, G, G_DIM, GOLD, G];
  const baseRadii = [150, 230, 310, 400, 490, 580, 670];
  const rings = baseRadii.map((r, i) => {
    const radius = r + (seed * 11) % 24;
    const color = ringColors[(i + seed) % ringColors.length];
    const opacity = Math.max(0.05, 0.42 - i * 0.055);
    const strokeW = 10 + (i % 3) * 4;
    return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${color}"
      stroke-width="${strokeW}" opacity="${opacity.toFixed(2)}"
      filter="url(#wobble)" style="mix-blend-mode:screen"/>`;
  }).join('\n  ');

  // Hood: a rounded arch over tapering shoulders, near-black with a thin
  // green rim-light on the hood's leading edge — the brand's own persona,
  // silhouette only, no face, ever.
  const hood = `
  <g transform="rotate(${tilt.toFixed(1)} ${cx} ${cy + 260})">
    <path d="M ${cx - 210} ${H + 40}
             C ${cx - 230} ${cy + 340}, ${cx - 190} ${cy + 40}, ${cx} ${cy - 40}
             C ${cx + 190} ${cy + 40}, ${cx + 230} ${cy + 340}, ${cx + 210} ${H + 40}
             Z" fill="#060606" stroke="rgba(163,240,175,0.30)" stroke-width="3"/>
    <ellipse cx="${cx}" cy="${cy - 10}" rx="128" ry="150" fill="#050505"
      stroke="rgba(163,240,175,0.45)" stroke-width="3"/>
  </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"
  role="img" aria-label="A hooded, faceless silhouette surrounded by concentric glowing green and gold rings on black">
  <defs><style>${FONT}</style>
    <filter id="wobble" x="-40%" y="-40%" width="180%" height="180%">
      <feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves="2" seed="${turbSeed}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="34"/>
      <feGaussianBlur stdDeviation="3"/>
    </filter>
    <filter id="softglow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="30"/></filter>
    <radialGradient id="core" cx="50%" cy="${((cy / H) * 100).toFixed(0)}%" r="55%">
      <stop offset="0%" stop-color="${G}" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="${G}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#000000"/>
  <rect width="${W}" height="${H}" fill="url(#core)"/>
  <g filter="url(#softglow)">
  ${rings}
  </g>
  <g>
  ${rings}
  </g>
  ${hood}
</svg>
`;
}

for (let i = 0; i < 4; i++) {
  const name = `field-${i + 1}.svg`;
  fs.writeFileSync(path.join(ASSETS, name), fieldArt(i));
  console.log(`  ${name}`);
}
console.log(`\n4 field-art backgrounds -> assets/  (${W}x${H})`);
