#!/usr/bin/env node
/**
 * Full-bleed background art, one DISTINCT scene per slide instead of one
 * motif recolored ten times. Each function draws a different composition
 * tied to what its slide actually says: a loop glyph, a flow diagram, a
 * stack of cards, a gauge, a tiled repeat pattern, broadcast waves. Same
 * on-brand palette (green/gold on black) throughout, so the set still reads
 * as one carousel — the variety is in the composition, not just the color.
 *
 *   node scripts/make-scene-art.mjs
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
const G_DIM = '#3f6b48';
const GOLD = '#FFD700';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const defs = `<style>${FONT}</style>
  <filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="glowSoft" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="40"/></filter>`;

const wrap = (label, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(label)}">
  <defs>${defs}</defs>
  <rect width="${W}" height="${H}" fill="#000000"/>
${body}
</svg>
`;

/** 1. HOOK — a single glowing infinity loop, off-centre lower third. */
function loopSymbol() {
  const cx = 540, cy = 980, r = 150, gap = 8;
  const path = `M ${cx - r} ${cy}
    a ${r} ${r} 0 1 0 ${r * 2} 0
    a ${r} ${r} 0 1 0 -${r * 2} 0 Z`;
  return wrap('A single glowing infinity loop, lower half of a black frame', `
  <ellipse cx="${cx}" cy="${cy}" rx="420" ry="300" fill="${G}" opacity="0.10" filter="url(#glowSoft)"/>
  <g stroke="${G}" fill="none" stroke-width="22" stroke-linecap="round" filter="url(#glow)">
    <path d="M ${cx - r * 1.9} ${cy}
      c 0 -${r} ${r} -${r} ${r} 0
      c 0 ${r} ${r} ${r} ${r} 0
      c 0 -${r} ${r} -${r} ${r} 0
      c 0 ${r} -${r} ${r} -${r} 0"/>
  </g>
  <g stroke="${GOLD}" fill="none" stroke-width="6" stroke-linecap="round" opacity="0.8">
    <path d="M ${cx - r * 1.9} ${cy}
      c 0 -${r} ${r} -${r} ${r} 0
      c 0 ${r} ${r} ${r} ${r} 0
      c 0 -${r} ${r} -${r} ${r} 0
      c 0 ${r} -${r} ${r} -${r} 0"/>
  </g>`);
}

/** 2. STAKES — three nodes in a triangle, connected in a loop: offer -> post -> click.
 *  No text on the nodes — this sits behind real body copy, and a second set
 *  of words competing with the headline is what caused the actual bug here. */
function triLoop() {
  const pts = [[300, 1230], [780, 1230], [540, 990]];
  const lines = [[0, 1], [1, 2], [2, 0]].map(([a, b]) =>
    `<line x1="${pts[a][0]}" y1="${pts[a][1]}" x2="${pts[b][0]}" y2="${pts[b][1]}" stroke="${G}" stroke-width="3" opacity="0.4" filter="url(#glow)"/>`
  ).join('\n  ');
  const nodes = pts.map(([x, y], i) => `
  <circle cx="${x}" cy="${y}" r="40" fill="#050505" stroke="${i === 2 ? GOLD : G}" stroke-width="4" opacity="0.85" filter="url(#glow)"/>`).join('');
  return wrap('Three connected nodes in a triangle, low in the frame, forming a loop', `
  <ellipse cx="540" cy="1150" rx="440" ry="260" fill="${G}" opacity="0.05" filter="url(#glowSoft)"/>
  ${lines}
  ${nodes}`);
}

/** 3. STEP 1 — a stack of cards, one pulled forward and lit. */
function cardStack() {
  const cards = [
    [540, 1290, 0.18, false], [540, 1220, 0.28, false], [540, 1150, 0.4, false],
  ].map(([x, y, o]) => `<rect x="${x - 190}" y="${y - 100}" width="380" height="200" rx="22" fill="#0a0a0a" stroke="${G}" stroke-width="2" opacity="${o}"/>`).join('\n  ');
  return wrap('A stack of dim cards low in the frame, behind one bright card pulled forward and lit', `
  <ellipse cx="540" cy="1080" rx="380" ry="260" fill="${G}" opacity="0.08" filter="url(#glowSoft)"/>
  ${cards}
  <rect x="330" y="980" width="420" height="230" rx="26" fill="#0a140c" stroke="${G}" stroke-width="4" opacity="0.9" filter="url(#glow)"/>
  <circle cx="410" cy="1030" r="14" fill="${GOLD}" opacity="0.9"/>
  <rect x="446" y="1022" width="210" height="18" rx="9" fill="${G}" opacity="0.6"/>
  <rect x="446" y="1058" width="150" height="12" rx="6" fill="${G}" opacity="0.3"/>
  <rect x="370" y="1120" width="280" height="12" rx="6" fill="${G}" opacity="0.2"/>`);
}

/** 4. STEP 2 — many faint radiating lines, one bright line picked. */
function oneAngle() {
  const cx = 540, cy = 1230, n = 14, len = 320;
  const lines = Array.from({ length: n }, (_, i) => {
    const a = (Math.PI / (n - 1)) * i - Math.PI - Math.PI / 6;
    const x2 = cx + Math.cos(a) * len, y2 = cy + Math.sin(a) * len;
    const bright = i === 5;
    return `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${bright ? GOLD : G}" stroke-width="${bright ? 7 : 2}" opacity="${bright ? 0.95 : 0.16}" ${bright ? 'filter="url(#glow)"' : ''}/>`;
  }).join('\n  ');
  return wrap('Many faint lines fanning upward from a low point, one bright line picked among them', `
  ${lines}
  <circle cx="${cx}" cy="${cy}" r="18" fill="${G}" opacity="0.9" filter="url(#glow)"/>`);
}

/** 5. STEP 3 — a minimal hood glyph, the one slide that actually is about facelessness. */
function maskGlyph() {
  const cx = 540, cy = 1180;
  return wrap('A minimal hooded outline low in the frame with a blank oval where a face would be', `
  <ellipse cx="${cx}" cy="${cy}" rx="320" ry="260" fill="${G}" opacity="0.07" filter="url(#glowSoft)"/>
  <path d="M ${cx - 200} ${cy + 220}
    C ${cx - 220} ${cy - 40}, ${cx - 130} ${cy - 220}, ${cx} ${cy - 220}
    C ${cx + 130} ${cy - 220}, ${cx + 220} ${cy - 40}, ${cx + 200} ${cy + 220}
    Z" fill="none" stroke="${G}" stroke-width="5" opacity="0.9" filter="url(#glow)"/>
  <ellipse cx="${cx}" cy="${cy - 20}" rx="100" ry="118" fill="#050505" stroke="${GOLD}" stroke-width="3" opacity="0.8"/>`);
}

/** 6. STEP 4 — a dial/gauge sitting in the "auto" zone, needle steady. No
 *  label text, same reasoning as triLoop: this sits behind real body copy. */
function autoGauge() {
  const cx = 540, cy = 1220, r = 260;
  const arc = (start, end, color, op) => {
    const p = (deg) => {
      const a = (Math.PI / 180) * deg;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    };
    const [x1, y1] = p(start), [x2, y2] = p(end);
    return `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${color}" stroke-width="24" opacity="${op}" stroke-linecap="round"/>`;
  };
  const needleAngle = -190;
  const na = (Math.PI / 180) * needleAngle;
  return wrap('A dial gauge low in the frame with a needle resting steady in the calm zone', `
  ${arc(-215, -160, G, 0.7)}
  ${arc(-160, -20, G_DIM, 0.3)}
  <circle cx="${cx}" cy="${cy}" r="14" fill="${GOLD}" opacity="0.9"/>
  <line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(na) * (r - 40)).toFixed(1)}" y2="${(cy + Math.sin(na) * (r - 40)).toFixed(1)}" stroke="${GOLD}" stroke-width="7" stroke-linecap="round" opacity="0.9" filter="url(#glow)"/>`);
}

/** 7. STEP 5 — a tiled grid of small repeat glyphs: the pattern, made literal. */
function repeatGrid() {
  const glyph = (x, y, bright) => `<g transform="translate(${x} ${y})" opacity="${bright ? 0.95 : 0.16}">
    <circle r="20" fill="none" stroke="${bright ? GOLD : G}" stroke-width="4"/>
    <path d="M -10 0 a 10 10 0 1 1 20 0" fill="none" stroke="${bright ? GOLD : G}" stroke-width="4"/>
  </g>`;
  const rows = 6, cols = 5, gx = 220, gy = 210, ox = 100, oy = 260;
  let out = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bright = r === 3 && c === 2;
      out += glyph(ox + c * gx, oy + r * gy, bright);
    }
  }
  return wrap('A grid of small faint repeat-loop glyphs tiled across the frame, one lit brighter than the rest', out);
}

/** 8. VALUE mechanism — broadcast waves from a single point, filling the frame. */
function broadcastWaves() {
  const cx = 540, cy = 1150;
  const rings = [90, 220, 360, 510, 670].map((r, i) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${i % 2 ? GOLD : G}" stroke-width="3" opacity="${0.5 - i * 0.08}"/>`
  ).join('\n  ');
  return wrap('Concentric broadcast rings emanating from a single bright point low in the frame', `
  <ellipse cx="${cx}" cy="${cy}" rx="500" ry="420" fill="${G}" opacity="0.07" filter="url(#glowSoft)"/>
  ${rings}
  <circle cx="${cx}" cy="${cy}" r="22" fill="${G}" filter="url(#glow)"/>`);
}

/** 9. RECEIPTS — the loop glyph again, now solid and complete: an intentional bookend. */
function loopSymbolBright() {
  const cx = 540, cy = 1040, r = 170;
  return wrap('A solid, brightly lit infinity loop, complete', `
  <ellipse cx="${cx}" cy="${cy}" rx="460" ry="340" fill="${G}" opacity="0.14" filter="url(#glowSoft)"/>
  <g stroke="${G}" fill="none" stroke-width="30" stroke-linecap="round" filter="url(#glow)">
    <path d="M ${cx - r * 1.9} ${cy}
      c 0 -${r} ${r} -${r} ${r} 0
      c 0 ${r} ${r} ${r} ${r} 0
      c 0 -${r} ${r} -${r} ${r} 0
      c 0 ${r} -${r} ${r} -${r} 0"/>
  </g>
  <g stroke="${GOLD}" fill="none" stroke-width="9" stroke-linecap="round">
    <path d="M ${cx - r * 1.9} ${cy}
      c 0 -${r} ${r} -${r} ${r} 0
      c 0 ${r} ${r} ${r} ${r} 0
      c 0 -${r} ${r} -${r} ${r} 0
      c 0 ${r} -${r} ${r} -${r} 0"/>
  </g>`);
}

/** 10. CTA — a quiet radial glow only, so the product cover stays the hero. */
function ctaGlow() {
  return wrap('A soft green radial glow low in the frame, no other imagery', `
  <ellipse cx="540" cy="1000" rx="520" ry="380" fill="${G}" opacity="0.10" filter="url(#glowSoft)"/>
  <ellipse cx="540" cy="1000" rx="260" ry="200" fill="${GOLD}" opacity="0.05" filter="url(#glowSoft)"/>`);
}

const SCENES = {
  'scene-loop.svg': loopSymbol,
  'scene-triloop.svg': triLoop,
  'scene-cardstack.svg': cardStack,
  'scene-oneangle.svg': oneAngle,
  'scene-mask.svg': maskGlyph,
  'scene-gauge.svg': autoGauge,
  'scene-repeatgrid.svg': repeatGrid,
  'scene-broadcast.svg': broadcastWaves,
  'scene-loop-bright.svg': loopSymbolBright,
  'scene-cta-glow.svg': ctaGlow,
};

for (const [name, make] of Object.entries(SCENES)) {
  fs.writeFileSync(path.join(ASSETS, name), make());
  console.log(`  ${name}`);
}
console.log(`\n${Object.keys(SCENES).length} scenes -> assets/  (${W}x${H})`);
