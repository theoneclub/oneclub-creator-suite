#!/usr/bin/env node
/**
 * The UI mockups that hold the right column of a split slide.
 *
 *   node scripts/make-mocks.mjs
 *
 * Generated in-repo rather than designed in a tool, for the same reason the
 * rest of the art is: a clean checkout renders byte-identical slides offline
 * with no image pipeline. Layout is computed from CANVAS, so changing the
 * canvas reflows every panel instead of stranding hand-placed coordinates.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STUDIO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = path.join(STUDIO, 'assets');

// Inter, already base64'd into the committed art — reused so these carry
// labels with no font pipeline and no second copy of the face in the repo.
const FONT = fs.readFileSync(path.join(ASSETS, 'model-compare.svg'), 'utf8')
  .match(/@font-face \{ font-family:'Inter'[\s\S]*?\}/)[0];

/* The art column is ~540px wide and ~1360px tall. This ratio fills it. */
const W = 620;
const H = 1300;
const PAD = 34;
const IW = W - PAD * 2;          // inner width

const G = '#a3f0af';
const GREY = '#9CA3AF';
const DIM = '#4b5563';
const CARD = '#111111';
const LINE = 'rgba(255,255,255,0.09)';
const ON_FILL = '#0e150f';
const ON_LINE = 'rgba(163,240,175,0.34)';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const svg = (label, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(label)}">
  <defs><style>
    ${FONT}
    text { font-family:'Inter', sans-serif; }
    .lab { font-size:15px; font-weight:700; letter-spacing:.17em; fill:${GREY}; }
    .t   { font-size:21px; font-weight:700; fill:#ffffff; }
    .s   { font-size:16px; font-weight:400; fill:${GREY}; }
    .num { font-size:38px; font-weight:800; fill:#ffffff; letter-spacing:-.01em; }
  </style>
  <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${G}" stop-opacity=".16"/><stop offset="1" stop-color="${G}" stop-opacity="0"/>
  </linearGradient>
  <filter id="soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="22"/></filter>
  </defs>
${body}
</svg>
`;

const rect = (x, y, w, h, r = 18, fill = CARD, stroke = LINE) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"${stroke ? ` stroke="${stroke}"` : ''}/>`;

/** Window chrome: the frame every panel shares. */
const chrome = (title, badge) => `  ${rect(0, 0, W, H, 26, '#0a0a0a', LINE)}
  <circle cx="${PAD + 12}" cy="50" r="10" fill="${G}"/>
  <text class="lab" x="${PAD + 34}" y="56">${esc(title)}</text>
  <text class="lab" x="${W - PAD}" y="56" text-anchor="end">${esc(badge)}</text>
  <line x1="0" y1="88" x2="${W}" y2="88" stroke="${LINE}"/>`;

/** The headline block under the chrome. Returns [svg, nextY]. */
function intro(label, big, sub, y = 130) {
  const s = `  <text class="lab" x="${PAD}" y="${y}">${esc(label)}</text>
  <text class="num" x="${PAD}" y="${y + 54}">${esc(big)}</text>
  ${sub ? `<text class="s" x="${PAD}" y="${y + 88}">${esc(sub)}</text>` : ''}`;
  return [s, y + (sub ? 122 : 88)];
}

/**
 * Distribute n cards over the space between `top` and the footer.
 * Every panel calls this, so a canvas change reflows them all.
 */
function slots(top, n, { footer = 132, gap = 14 } = {}) {
  const bottom = H - PAD - footer - 22;
  const pitch = (bottom - top) / n;
  return {
    h: Math.round(pitch - gap),
    at: (i) => Math.round(top + i * pitch),
    footerY: H - PAD - footer,
    footerH: footer,
  };
}

/** The closing card at the base of every panel. */
const footer = (y, h, { icon, title, sub, on = true }) => `  ${rect(PAD, y, IW, h, 18, on ? ON_FILL : CARD, on ? ON_LINE : LINE)}
  ${icon}
  <text class="t" x="${PAD + 88}" y="${y + h / 2 - 4}" font-size="19"${on ? ` fill="${G}"` : ''}>${esc(title)}</text>
  <text class="s" x="${PAD + 88}" y="${y + h / 2 + 24}" font-size="15">${esc(sub)}</text>`;

const tickIcon = (cx, cy, r = 19) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${G}"/>
  <path d="M${cx - r * 0.42} ${cy + r * 0.02} l${r * 0.32} ${r * 0.36} L${cx + r * 0.46} ${cy - r * 0.34}" fill="none" stroke="#000" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;

/* ============================================================== the panels */

/** Member dashboard — the club, as a product. */
function clubPanel() {
  const steps = [
    ['Offer picked', 'One recurring offer', true],
    ['Angle built', 'Faceless, no camera', true],
    ['Thirty posts scheduled', 'Dated, in the calendar', true],
    ['Automation live', 'Comment fires the DM', false],
  ];
  const [head, y0] = intro('YOUR SYSTEM', '3 of 4 live', 'Everyone inside runs the same four steps.');
  const barY = y0 - 4;
  const s = slots(barY + 62, steps.length, { footer: 208 });
  const list = steps.map(([t, sub, on], i) => {
    const y = s.at(i);
    return `  ${rect(PAD, y, IW, s.h, 15)}
  ${on ? tickIcon(PAD + 38, y + s.h / 2, 15) : `<circle cx="${PAD + 38}" cy="${y + s.h / 2}" r="14" fill="none" stroke="${DIM}" stroke-width="2"/>`}
  <text class="t" x="${PAD + 70}" y="${y + s.h / 2 - 3}" font-size="19"${on ? '' : ` fill="${GREY}"`}>${esc(t)}</text>
  <text class="s" x="${PAD + 70}" y="${y + s.h / 2 + 22}" font-size="15">${esc(sub)}</text>`;
  }).join('\n');

  const votes = [58, 44, 74, 34, 52, 41].map((v, i) =>
    `<rect x="${PAD + 26 + i * 44}" y="${s.footerY + s.footerH - 30 - v}" width="26" height="${v}" rx="6" fill="${i === 2 ? G : 'rgba(163,240,175,0.26)'}"/>`).join('');

  return svg('The One Club member dashboard: the four-step build and the community-voted monthly fund', `${chrome('THE ONE CLUB', 'MEMBER VIEW')}
  <rect x="1" y="89" width="${W - 2}" height="220" fill="url(#glow)"/>
${head}
  ${rect(PAD, barY, IW, 12, 6, 'rgba(255,255,255,0.10)', null)}
  ${rect(PAD, barY, IW * 0.75, 12, 6, G, null)}
${list}
  ${rect(PAD, s.footerY, IW, s.footerH, 20)}
  <text class="lab" x="${PAD + 26}" y="${s.footerY + 40}">FREEDOM FUND</text>
  <text class="num" x="${PAD + 26}" y="${s.footerY + 88}" fill="${G}">$10,000</text>
  <text class="s" x="${PAD + 26}" y="${s.footerY + 116}" font-size="15">Monthly &#183; community-voted</text>
  ${votes}
  <text class="s" x="${W - PAD - 26}" y="${s.footerY + s.footerH - 12}" text-anchor="end" font-size="14" fill="${DIM}">Members vote</text>`);
}

/** Offer shortlist — five checked, one kept. */
function offerBoard() {
  const offers = [
    ['Design tool', 'One-time', '$', false],
    ['Course bundle', 'One-time', '$', false],
    ['AI writing app', 'Every month', '$$$', true],
    ['Ebook', 'One-time', '$', false],
    ['Hosting plan', 'Every month', '$$', false],
  ];
  const [head, y0] = intro('THE ONLY QUESTION', 'Pays again?', 'One-time money is a tip, not income.');
  const s = slots(y0 + 20, offers.length);
  const list = offers.map(([name, pays, size, pick], i) => {
    const y = s.at(i);
    return `  ${rect(PAD, y, IW, s.h, 16, pick ? ON_FILL : CARD, pick ? ON_LINE : LINE)}
  ${pick ? `<rect x="${PAD}" y="${y}" width="6" height="${s.h}" rx="3" fill="${G}"/>` : ''}
  <text class="t" x="${PAD + 32}" y="${y + s.h / 2 - 3}" font-size="19"${pick ? ` fill="${G}"` : ''}>${esc(name)}</text>
  <text class="s" x="${PAD + 32}" y="${y + s.h / 2 + 22}" font-size="15">Pays: ${esc(pays)}</text>
  <text x="${W - PAD - 24}" y="${y + s.h / 2 + 10}" text-anchor="end" font-size="27" font-weight="800" fill="${pick ? G : DIM}">${size}</text>`;
  }).join('\n');

  return svg('Offer shortlist: five offers checked, only the one that pays every month is kept', `${chrome('OFFER SHORTLIST', '5 CHECKED')}
${head}
${list}
${footer(s.footerY, s.footerH, {
    icon: tickIcon(PAD + 48, s.footerY + s.footerH / 2),
    title: 'Kept: 1',
    sub: 'Four rejected. That is the job done.',
  })}`);
}

/** The faceless script sheet. */
function angleSheet() {
  const lines = [
    ['HOOK', 'Most people pick the wrong offer.'],
    ['BODY', 'Here is the question that sorts it.'],
    ['PROOF', 'What happened when I kept one.'],
    ['CTA', 'One word, in the comments.'],
  ];
  const [head, y0] = intro('THE SCRIPT, EVERY TIME', 'Same four lines.', 'Swap the topic. Keep the shape.');
  const s = slots(y0 + 16, lines.length + 1);
  const list = lines.map(([k, t], i) => {
    const y = s.at(i);
    return `  ${rect(PAD, y, IW, s.h, 15)}
  <rect x="${PAD}" y="${y}" width="6" height="${s.h}" rx="3" fill="${G}"/>
  <text class="lab" x="${PAD + 28}" y="${y + s.h / 2 - 6}" fill="${G}">${esc(k)}</text>
  <text class="s" x="${PAD + 28}" y="${y + s.h / 2 + 24}" font-size="16" fill="#ffffff">${esc(t)}</text>`;
  }).join('\n');

  const chipY = s.at(lines.length) + 12;
  const chips = ['Screen record', 'Text on screen', 'AI voice'].map((c, i) => {
    const cw = (IW - 20) / 3;
    const x = PAD + i * (cw + 10);
    return `  ${rect(x, chipY, cw, 56, 15, 'rgba(163,240,175,0.10)', ON_LINE)}
  <text x="${x + cw / 2}" y="${chipY + 35}" text-anchor="middle" font-size="15" font-weight="700" fill="${G}">${esc(c)}</text>`;
  }).join('\n');

  return svg('A faceless script sheet: hook, body, proof, CTA, and three formats that need no camera', `${chrome('FACELESS ANGLE', 'NO CAMERA')}
  <rect x="1" y="89" width="${W - 2}" height="200" fill="url(#glow)"/>
${head}
${list}
${chips}
${footer(s.footerY, s.footerH, {
    icon: tickIcon(PAD + 48, s.footerY + s.footerH / 2),
    title: 'Camera: not required',
    sub: 'Your face is never the product.',
  })}`);
}

/** Thirty dated posts. */
function calendar() {
  const [head, y0] = intro('THE RHYTHM', '30 posts, dated.', 'Not thirty ideas. Thirty dates.');
  const fills = ['rgba(163,240,175,0.85)', 'rgba(163,240,175,0.44)', 'rgba(163,240,175,0.18)'];
  const legend = [['Teach', 0], ['Story', 1], ['Offer', 2]].map(([t, k], i) => {
    const x = PAD + i * 150;
    return `  ${rect(x, y0 + 4, 20, 20, 6, fills[k], null)}
  <text class="s" x="${x + 30}" y="${y0 + 20}" font-size="15">${esc(t)}</text>`;
  }).join('\n');

  const top = y0 + 48;
  const bottom = H - PAD - 132 - 22;
  const cols = 5, rowsN = 6;
  const cw = (IW - 4 * 12) / cols;
  const chh = Math.min((bottom - top - (rowsN - 1) * 12) / rowsN, cw * 0.92);
  const cells = Array.from({ length: 30 }, (_, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    const x = PAD + c * (cw + 12);
    const y = top + r * (chh + 12);
    return `  ${rect(x, y, cw, chh, 13, fills[i % 3], null)}
  <text x="${x + 11}" y="${y + 27}" font-size="17" font-weight="800" fill="#0a0a0a">${i + 1}</text>`;
  }).join('\n');

  return svg('A dated thirty-day posting calendar colour-coded by post type', `${chrome('THIRTY DAYS', 'DATED')}
${head}
${legend}
${cells}
${footer(H - PAD - 132, 132, {
    icon: tickIcon(PAD + 48, H - PAD - 132 + 66),
    title: 'Days 1 to 30 are research',
    sub: 'Judge the angle on day 31, not day 9.',
  })}`);
}

/** Comment to DM to email to follow-up. */
function automation() {
  const nodes = [
    ['They comment one word', 'Under the post', 0.85],
    ['The DM sends itself', 'Within seconds', 0.62],
    ['The email lands', 'With the whole thing', 0.42],
    ['Follow-up runs alone', 'For weeks after', 0.26],
  ];
  const [head, y0] = intro('WHILE YOU SLEEP', 'You touch step one.', 'The rest is wiring, not willpower.');
  const s = slots(y0 + 16, nodes.length, { footer: 96, gap: 34 });
  const list = nodes.map(([t, sub, a], i) => {
    const y = s.at(i);
    const link = i < nodes.length - 1
      ? `\n  <path d="M${W / 2} ${y + s.h} v18" stroke="${LINE}" stroke-width="3"/>
  <path d="M${W / 2 - 8} ${y + s.h + 10} l8 9 8-9" fill="none" stroke="${DIM}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
      : '';
    return `  ${rect(PAD, y, IW, s.h, 18)}
  ${rect(PAD + 24, y + s.h / 2 - 25, 50, 50, 14, `rgba(163,240,175,${a})`, null)}
  <text x="${PAD + 49}" y="${y + s.h / 2 + 9}" text-anchor="middle" font-size="22" font-weight="800" fill="#0a0a0a">${i + 1}</text>
  <text class="t" x="${PAD + 92}" y="${y + s.h / 2 - 3}" font-size="19">${esc(t)}</text>
  <text class="s" x="${PAD + 92}" y="${y + s.h / 2 + 22}" font-size="15">${esc(sub)}</text>${link}`;
  }).join('\n');

  return svg('The automation chain: comment, DM, email, follow-up, running unattended', `${chrome('AUTOMATION', 'RUNNING')}
  <ellipse cx="${W / 2}" cy="170" rx="200" ry="100" fill="${G}" opacity=".12" filter="url(#soft)"/>
${head}
${list}
  ${rect(PAD, s.footerY, IW, s.footerH, 18, ON_FILL, ON_LINE)}
  <circle cx="${PAD + 34}" cy="${s.footerY + s.footerH / 2}" r="8" fill="${G}"/>
  <text class="s" x="${PAD + 56}" y="${s.footerY + s.footerH / 2 + 6}" font-size="16" fill="${G}">Live &#183; 24 hours a day</text>`);
}

/** Forty tabs of half-finished plans. */
function tabs() {
  const items = [
    ['Affiliate course', '12% complete'],
    ['Podcast — ep. 214', 'Saved, never opened'],
    ['"Best AI tools" reel', 'Saved 3 weeks ago'],
    ['Another course', '0% complete'],
    ['Newsletter #47', 'Unread'],
    ['A plan you wrote', 'Two lines long'],
  ];
  const strip = Array.from({ length: 8 }, (_, i) =>
    `  ${rect(PAD - 8 + i * 70, 104, 62, 26, 8, 'rgba(255,255,255,0.05)')}`).join('\n');
  const [head, y0] = intro('WHAT IS OPEN RIGHT NOW', 'Six things started.', 'Nothing finished.', 172);
  const s = slots(y0 + 12, items.length, { footer: 84 });
  const list = items.map(([t, sub], i) => {
    const y = s.at(i);
    return `  ${rect(PAD, y, IW, s.h, 15)}
  ${rect(PAD + 22, y + s.h / 2 - 17, 34, 34, 10, 'rgba(255,255,255,0.06)', null)}
  <text class="t" x="${PAD + 70}" y="${y + s.h / 2 - 3}" font-size="18" fill="${GREY}">${esc(t)}</text>
  <text class="s" x="${PAD + 70}" y="${y + s.h / 2 + 20}" font-size="15" fill="${DIM}">${esc(sub)}</text>`;
  }).join('\n');

  return svg('Eight open tabs of half-finished plans, none of which say what to do tomorrow', `${chrome('YOUR ACTUAL PLAN', '41 TABS')}
${strip}
${head}
${list}
  ${rect(PAD, s.footerY, IW, s.footerH, 16)}
  <text class="s" x="${PAD + 26}" y="${s.footerY + s.footerH / 2 + 6}" font-size="15" fill="${DIM}">None of these say what to do tomorrow.</text>`);
}

/** The walkthrough the CTA hands over. */
function walkthrough() {
  const contents = [
    'How the offer gets picked',
    'The faceless angle, written out',
    'Thirty posts, dated',
    'The comment-to-inbox wiring',
    'What the club runs for you',
  ];
  const s = slots(400, contents.length);
  const list = contents.map((t, i) => {
    const y = s.at(i);
    const cy = y + s.h / 2;
    return `  <circle cx="${PAD + 22}" cy="${cy}" r="15" fill="rgba(163,240,175,0.14)" stroke="${ON_LINE}"/>
  <text x="${PAD + 22}" y="${cy + 5}" text-anchor="middle" font-size="15" font-weight="800" fill="${G}">${i + 1}</text>
  <text class="t" x="${PAD + 54}" y="${cy + 6}" font-size="18">${esc(t)}</text>
  <line x1="${PAD}" y1="${y + s.h + 6}" x2="${W - PAD}" y2="${y + s.h + 6}" stroke="${LINE}"/>`;
  }).join('\n');

  return svg('The One Club walkthrough: five chapters covering the whole build, sent by DM', `${chrome('THE ONE CLUB', 'WALKTHROUGH')}
  <ellipse cx="${W / 2}" cy="210" rx="210" ry="120" fill="${G}" opacity=".13" filter="url(#soft)"/>
  <text class="lab" x="${PAD}" y="150">THE WHOLE BUILD</text>
  <text x="${PAD}" y="220" font-size="52" font-weight="800" fill="#ffffff">Start to</text>
  <text x="${PAD}" y="278" font-size="52" font-weight="800" fill="${G}">finish.</text>
  <text class="s" x="${PAD}" y="320" font-size="16">Nothing held back for later.</text>
  <text class="lab" x="${PAD}" y="372">INSIDE</text>
${list}
${footer(s.footerY, s.footerH, {
    icon: `${rect(PAD + 26, s.footerY + s.footerH / 2 - 19, 38, 38, 11, G, null)}
  <path d="M${PAD + 36} ${s.footerY + s.footerH / 2} h19 M${PAD + 48} ${s.footerY + s.footerH / 2 - 8} l8 8 -8 8" stroke="#000" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    title: 'Sent straight to your DMs',
    sub: 'No link in the caption to hunt for.',
  })}`);
}

/** The fill-in-the-blank sheet — the deck's payoff, as a thing you can copy. */
function hookSheet() {
  const lines = [
    ['NEGATE', 'Nobody needs ______. They need ______.'],
    ['CORRECT', 'Most people think ______.'],
    ['BINARY', '______ &#10060;   ______ &#9989;'],
    ['WITHOUT', 'How to ______ without ______.'],
    ['REFRAME', 'Your ______ isn’t ______ — it’s ______.'],
    ['COUNT', 'The ___ ______ I actually reuse.'],
  ];
  const [head, y0] = intro('WRITE THE LINE FIRST', 'Fill the blanks.', 'Six shapes. Pick one, then write the post.');
  const s = slots(y0 + 16, lines.length, { footer: 108 });
  const list = lines.map(([k, t], i) => {
    const y = s.at(i);
    return `  ${rect(PAD, y, IW, s.h, 15)}
  <rect x="${PAD}" y="${y}" width="6" height="${s.h}" rx="3" fill="${G}"/>
  <text class="lab" x="${PAD + 28}" y="${y + s.h / 2 - 8}" fill="${G}">${esc(k)}</text>
  <text class="s" x="${PAD + 28}" y="${y + s.h / 2 + 22}" font-size="16" fill="#ffffff">${t}</text>`;
  }).join('\n');

  return svg('A hook worksheet: six fill-in-the-blank first-line shapes', `${chrome('FIRST LINE', '6 SHAPES')}
  <rect x="1" y="89" width="${W - 2}" height="200" fill="url(#glow)"/>
${head}
${list}
  ${rect(PAD, s.footerY, IW, s.footerH, 18)}
  <text class="s" x="${PAD + 26}" y="${s.footerY + 42}" font-size="15">Five to eight words. Say it out loud.</text>
  <text class="s" x="${PAD + 26}" y="${s.footerY + 74}" font-size="15" fill="${DIM}">If you run out of breath, it is too long.</text>`);
}

/** Vet any affiliate program in four questions — the deck's payoff, copyable. */
function programCheck() {
  // Deliberately plain. A beginner can answer all four in under a minute
  // without opening the program's terms page.
  const rows = [
    ['WOULD YOU SIGN UP?', 'If you would not pay for it, it shows.'],
    ['DOES IT PAY MONTHLY?', 'Or once, and you are back at zero.'],
    ['CAN YOU SHOW IT?', 'No screen to record means no faceless post.'],
    ['STILL USING IT IN A YEAR?', 'A tool they keep is a payment you keep.'],
  ];
  const [head, y0] = intro('BEFORE YOU PROMOTE ANYTHING', 'Four questions.', 'Three honest yeses, or leave it alone.');
  const s = slots(y0 + 20, rows.length, { footer: 132, gap: 22 });
  const list = rows.map(([k, t], i) => {
    const y = s.at(i);
    return `  ${rect(PAD, y, IW, s.h, 16)}
  <rect x="${PAD}" y="${y}" width="6" height="${s.h}" rx="3" fill="${G}"/>
  <rect x="${W - PAD - 54}" y="${y + s.h / 2 - 18}" width="36" height="36" rx="10" fill="none" stroke="${DIM}" stroke-width="2"/>
  <text class="lab" x="${PAD + 28}" y="${y + s.h / 2 - 10}" fill="${G}">${esc(k)}</text>
  <text class="s" x="${PAD + 28}" y="${y + s.h / 2 + 22}" font-size="16" fill="#ffffff">${esc(t)}</text>`;
  }).join('\n');

  return svg('A four-question checklist for vetting an affiliate program before promoting it', `${chrome('PROGRAM CHECK', '4 QUESTIONS')}
  <rect x="1" y="89" width="${W - 2}" height="200" fill="url(#glow)"/>
${head}
${list}
${footer(s.footerY, s.footerH, {
    icon: tickIcon(PAD + 48, s.footerY + s.footerH / 2),
    title: 'Three ticks minimum',
    sub: 'Two or fewer and it is not worth the posts.',
  })}`);
}

/** The size of the water — the industry, not anybody's income. */
function marketSize() {
  const [head, y0] = intro('THE SIZE OF THE WATER', 'It keeps rising.', 'Growing roughly 10-15% a year.');

  // Deliberately unlabelled by year: a dated axis goes stale, and the shape is
  // the whole point. Heights are a growth curve, not a claim about any figure.
  const bars = [0.34, 0.42, 0.52, 0.63, 0.76, 0.88, 1.0];
  const labels = ['', '', '', '', '', '', 'NOW'];
  const top = y0 + 40;
  const plotH = 740;
  const bw = 58, gap = (IW - bars.length * bw) / (bars.length - 1);

  const cols = bars.map((v, i) => {
    const h = Math.round(plotH * v);
    const x = PAD + i * (bw + gap);
    const y = top + plotH - h;
    const now = labels[i] === 'NOW';
    return `  ${rect(x, y, bw, h, 10, now ? G : 'rgba(163,240,175,0.26)', null)}
  ${now ? `<text class="lab" x="${x + bw / 2}" y="${y - 16}" text-anchor="middle" fill="${G}">NOW</text>` : ''}`;
  }).join('\n');

  return svg('A rising bar chart showing the affiliate industry growing year on year', `${chrome('AFFILIATE INDUSTRY', 'GROWING')}
  <rect x="1" y="89" width="${W - 2}" height="210" fill="url(#glow)"/>
${head}
${cols}
  <line x1="${PAD}" y1="${top + plotH + 8}" x2="${W - PAD}" y2="${top + plotH + 8}" stroke="${LINE}" stroke-width="2"/>
  <text class="s" x="${PAD}" y="${top + plotH + 40}" font-size="15" fill="${DIM}">Every year, bigger than the last</text>
${footer(H - PAD - 150, 150, {
    icon: tickIcon(PAD + 48, H - PAD - 150 + 75),
    title: 'This is the industry',
    sub: 'Not a projection, and not anyone’s income.',
  })}`);
}

/** Teaspoon or bucket — the same effort, twelve months apart. */
function teaspoonVsBucket() {
  const [head, y0] = intro('SAME SALE, TWELVE MONTHS ON', 'One resets. One stacks.', 'The same sale, twelve months apart.');

  const top = y0 + 74;
  const plotH = 690;
  const plotW = IW;
  const months = 12;
  const stepX = plotW / (months - 1);

  // Relative shapes only — one-time flat at its first month, recurring adding
  // one more unit every month. No units, so nothing here is a claim.
  const oneTime = Array.from({ length: months }, () => 0.10);
  const recurring = Array.from({ length: months }, (_, i) => 0.10 + (i / (months - 1)) * 0.86);

  const line = (vals) => vals.map((v, i) =>
    `${i ? 'L' : 'M'}${(PAD + i * stepX).toFixed(1)} ${(top + plotH - v * plotH).toFixed(1)}`).join(' ');

  const legend = [['One-time', 'rgba(255,255,255,0.32)'], ['Recurring', G]].map(([t, c], i) => {
    const x = PAD + i * 210;
    return `  ${rect(x, y0 + 8, 22, 22, 6, c, null)}
  <text class="s" x="${x + 32}" y="${y0 + 26}" font-size="16">${esc(t)}</text>`;
  }).join('\n');

  const grid = [0, 0.25, 0.5, 0.75, 1].map((g) =>
    `  <line x1="${PAD}" y1="${top + plotH - g * plotH}" x2="${W - PAD}" y2="${top + plotH - g * plotH}" stroke="${LINE}"/>`).join('\n');

  return svg('A line chart: one-time earnings stay flat over twelve months while recurring earnings climb', `${chrome('TEASPOON OR BUCKET', '12 MONTHS')}
${head}
${legend}
${grid}
  <path d="${line(oneTime)}" fill="none" stroke="rgba(255,255,255,0.32)" stroke-width="5" stroke-linecap="round"/>
  <path d="${line(recurring)}" fill="none" stroke="${G}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${PAD + plotW}" cy="${top + plotH * 0.04}" r="10" fill="${G}"/>
  <text class="s" x="${PAD}" y="${top + plotH + 36}" font-size="15" fill="${DIM}">Month 1</text>
  <text class="s" x="${W - PAD}" y="${top + plotH + 36}" font-size="15" text-anchor="end" fill="${DIM}">Month 12</text>
${footer(H - PAD - 150, 150, {
    icon: tickIcon(PAD + 48, H - PAD - 150 + 75),
    title: 'Same work either way',
    sub: 'Only one of them is still paying in month twelve.',
  })}`);
}

const PANELS = {
  'hook-sheet.svg': hookSheet,
  'program-check.svg': programCheck,
  'market-size.svg': marketSize,
  'teaspoon-vs-bucket.svg': teaspoonVsBucket,
  'oneclub-panel.svg': clubPanel,
  'oneclub-offer-board.svg': offerBoard,
  'oneclub-angle-sheet.svg': angleSheet,
  'oneclub-calendar.svg': calendar,
  'oneclub-automation.svg': automation,
  'oneclub-tabs.svg': tabs,
  'oneclub-walkthrough.svg': walkthrough,
};

for (const [name, make] of Object.entries(PANELS)) {
  fs.writeFileSync(path.join(ASSETS, name), make());
  console.log(`  ${name}`);
}
console.log(`\n${Object.keys(PANELS).length} panels -> assets/  (${W}x${H})`);
