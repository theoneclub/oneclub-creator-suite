/**
 * Deck JSON -> slide HTML. One file per slide, 1080x1440.
 * Slide HTML links the design bundle by relative path, so an exported folder
 * stays editable: tweak ds-bundle-morphe/carousel.css, re-render, done.
 */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Accent cycle for row cards / stat bars — locked palette only. */
const ACCENTS = ['var(--green)', 'var(--yellow)', 'var(--green-soft)'];
const accent = (i) => ACCENTS[i % ACCENTS.length];

/** Inline markup: [[green]] {{yellow}} ((boxed)) **bold**  ·  \n = line break */
export function inline(s = '') {
  return esc(s)
    .replace(/\[\[(.+?)\]\]/gs, '<span class="hl">$1</span>')
    .replace(/\{\{(.+?)\}\}/gs, '<span class="hlY">$1</span>')
    .replace(/\(\((.+?)\)\)/gs, '<span class="box">$1</span>')
    .replace(/\*\*(.+?)\*\*/gs, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

const copyBlocks = (copy = []) => copy.map((p) => `<p class="copy">${inline(p)}</p>`).join('\n      ');

/** Row cards: { t, s } — optional `numbered` turns them into a ranked list. */
function rows(items = [], numbered = false) {
  if (!items.length) return '';
  // Two cards told to fill the frame end up pinned to opposite edges with a
  // hole between them. Past two, space-evenly reads as a list.
  const few = items.length <= 2;
  const li = items.map((it, i) => `
        <div class="row" style="--row-accent:${accent(i)}">
          ${numbered ? `<div class="n">${i + 1}</div>` : ''}
          <div class="txt">
            <div class="t">${inline(it.t)}</div>
            ${it.s ? `<div class="s">${inline(it.s)}</div>` : ''}
          </div>
        </div>`).join('');
  return `<div class="rows${few ? ' rows--few' : ''}">${li}\n      </div>`;
}

/** Stat panel: { label, value, bar (0-1), muted } — bars are relative, never absolute claims. */
function panel(stats) {
  if (!stats?.items?.length) return '';
  const max = Math.max(...stats.items.map((s) => Number(s.bar ?? 0)), 1);
  const body = stats.items.map((s, i) => `
        <div class="stat${s.muted ? ' stat--muted' : ''}" style="--row-accent:${accent(i)}">
          <div class="lab">${inline(s.label)}</div>
          <div class="track"><div class="fill" style="width:${Math.round((Number(s.bar ?? 0) / max) * 100)}%"></div></div>
          <div class="val">${esc(s.value ?? '')}</div>
        </div>`).join('');
  return `<div class="panel">
        ${stats.caption ? `<div class="cap">${esc(stats.caption)}</div>` : ''}${body}
      </div>`;
}

/** Stat tiles: { value, label } — hook-slide proof chips. Add `icon` and they
 *  become the stacked icon cards instead of a three-across row. */
function tiles(items = []) {
  if (!items.length) return '';
  const withIcons = items.some((t) => t.icon);
  const body = items.map((t) => (t.icon
    ? `<div class="tile"><div class="ico">${icon(t.icon)}</div><div class="txt"><b>${esc(t.value)}</b><span>${esc(t.label)}</span></div></div>`
    : `<div class="tile"><b>${esc(t.value)}</b><span>${esc(t.label)}</span></div>`)).join('');
  return `<div class="tiles${withIcons ? ' tiles--icon' : ''}">${body}</div>`;
}

/** Step flow: { k, t, s } — the model in one picture. Three or four steps max. */
function flow(items = []) {
  if (!items.length) return '';
  const vertical = items.length > 3;
  const steps = items.map((it, i) => `
        <div class="step" style="--row-accent:${accent(i)}">
          ${it.k ? `<div class="k">${esc(it.k)}</div>` : ''}
          <div class="t">${inline(it.t)}</div>
          ${it.s ? `<div class="s">${inline(it.s)}</div>` : ''}
        </div>`);
  return `<div class="flow${vertical ? ' flow--v' : ''}">${steps.join('\n        <div class="arw">&rarr;</div>')}\n      </div>`;
}

/** Big number: { value, label, sub } — one idea, impossible to scroll past. */
const big = (b) =>
  b ? `<div class="big"><b>${esc(b.value)}</b><div class="l">${inline(b.label)}</div>${b.sub ? `<div class="s">${inline(b.sub)}</div>` : ''}</div>` : '';

/** Figure: an image inside a content slide, with an optional caption. */
const figure = (f) =>
  f
    ? `<figure class="figure${f.cover ? ' figure--cover' : ''}" style="${f.ratio ? `--ratio:${esc(f.ratio)}` : ''}"><div class="shot" style="background-image:url('${esc(f.image)}')"></div>${f.caption ? `<figcaption>${inline(f.caption)}</figcaption>` : ''}</figure>`
    : '';

/** Versus: { no: {t, s}, yes: {t, s} } — the ❌/✅ contrast, the highest-signal
 *  device in the outlier set. Left is what they're doing, right is the swap. */
function versus(v) {
  if (!v) return '';
  const side = (o, kind, mark) => `
        <div class="side side--${kind}">
          <div class="mark">${mark}</div>
          <div class="t">${inline(o.t)}</div>
          ${o.s ? `<div class="s">${inline(o.s)}</div>` : ''}
        </div>`;
  return `<div class="versus">${side(v.no, 'no', '\u274C')}${side(v.yes, 'yes', '\u2705')}\n      </div>`;
}

/** Product: the lead magnet itself. `{ image, width }` — CTA slides. */
const product = (p) =>
  p ? `<div class="product"${p.width ? ` style="--product-w:${esc(p.width)}"` : ''}><div class="shot" style="background-image:url('${esc(p.image)}')"></div></div>` : '';

/* ---- icons ----------------------------------------------------------------
   Stroke glyphs for the icon tiles on `cards` and icon `tiles`. Deliberately
   few: an icon set that keeps growing is a design smell, not a feature. */
const ICON_PATHS = {
  eye: '<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  bag: '<path d="M4 8h16l-1.2 12H5.2L4 8Z"/><path d="M8.5 8V6.2a3.5 3.5 0 0 1 7 0V8"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/>',
  doc: '<path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>',
  users: '<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0"/><path d="M16 7.2a3 3 0 0 1 0 5.6"/><path d="M17.5 15.5a5.5 5.5 0 0 1 3 4"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"/>',
  bolt: '<path d="M13.5 2.5 5 13.5h5.5L10 21.5 19 10h-5.5l0-7.5Z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  vote: '<path d="M4 12.5 9.5 18 20 6"/><rect x="2.5" y="2.5" width="19" height="19" rx="3"/>',
  lock: '<rect x="4.5" y="10" width="15" height="11" rx="2.5"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10"/>',
  seed: '<path d="M12 21V11"/><path d="M12 11c0-4 3-7 8-7 0 5-3 8-8 8Z"/><path d="M12 14c0-3-2.5-5.5-6.5-5.5 0 4 2.5 6.5 6.5 6.5Z"/>',
};
const icon = (name) => {
  const d = ICON_PATHS[name] || ICON_PATHS.bolt;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
};

/** Hand-drawn arrows for the `note` aside. Deliberately imperfect curves. */
const ARROWS = {
  curve: `<svg viewBox="0 0 210 130" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" aria-hidden="true">
        <path d="M8 12C34 74 78 106 150 108"/><path d="M126 92l28 17-25 15"/>
      </svg>`,
  down: `<svg viewBox="0 0 120 190" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" aria-hidden="true">
        <path d="M42 8c22 44 24 90 13 158"/><path d="M32 138l22 32 27-26"/>
      </svg>`,
  // the curve, mirrored — for an aside that sits below the thing it points at
  up: `<svg viewBox="0 0 210 130" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" aria-hidden="true">
        <path d="M8 118C34 56 78 24 150 22"/><path d="M124 34l30-13-21-19"/>
      </svg>`,
};
const ARROW_DIRS = new Set(['curve', 'down', 'up']);

/** Handwritten aside pointing at the artwork: `{ text, arrow }`. */
function note(n) {
  if (!n) return '';
  const o = typeof n === 'string' ? { text: n } : n;
  const dir = ARROW_DIRS.has(o.arrow) ? o.arrow : 'curve';
  return `<div class="note note--${dir}">
        ${o.text ? `<div class="hand">${esc(o.text)}</div>` : ''}
        ${o.arrow === false ? '' : `<div class="arrow">${ARROWS[dir]}</div>`}
      </div>`;
}

/** Chained icon cards: `{ icon, t, s, on }` — the "what happens next" stack. */
function cards(items = [], flag) {
  if (!items.length) return '';
  const list = items.map((c) => `
        <div class="card${c.on ? ' card--on' : ''}">
          <div class="ico">${icon(c.icon)}</div>
          <div class="txt">
            <div class="t">${inline(c.t)}</div>
            ${c.s ? `<div class="s">${inline(c.s)}</div>` : ''}
          </div>
        </div>`).join('');
  return `<div class="cards">${list}${flag ? `\n        <div class="flagline">${esc(flag)}</div>` : ''}\n      </div>`;
}

/** The device / UI artwork that holds the right column of a split slide. */
const mock = (m) => {
  if (!m) return '';
  const o = typeof m === 'string' ? { image: m } : m;
  return `<div class="mock" style="background-image:url('${esc(o.image)}')${o.ratio ? `;--mock-ratio:${esc(o.ratio)}` : ''}"></div>`;
};

/** Outlined pill with a filled arrow chip — names what the slide is about to do. */
const label = (l) =>
  (l ? `<div class="labelpill"><span class="dot">&rarr;</span>${esc(typeof l === 'string' ? l : l.text)}</div>` : '');

/** Info card: three short lines in a bordered box, the middle one accented. */
function infocard(c) {
  if (!c) return '';
  return `<div class="infocard">
        ${c.icon ? `<div class="ico">${icon(c.icon)}</div>` : ''}
        <div class="txt">
          ${c.t ? `<div class="a">${inline(c.t)}</div>` : ''}
          ${c.accent ? `<div class="b">${inline(c.accent)}</div>` : ''}
          ${c.s ? `<div class="c">${inline(c.s)}</div>` : ''}
        </div>
      </div>`;
}

/** The big rounded comment button — the CTA's one tappable-looking thing. */
const button = (b) => (b ? `<div class="bigbtn">${esc(typeof b === 'string' ? b : b.text)}</div>` : '');

/** CTA block: the one word we want typed, at the size it deserves. */
function ctaBlock(slide) {
  // The button already says the word — printing both is the same ask twice.
  if (!slide.trigger || slide.button) return '';
  return `<div class="ctablock">
        <div class="rule"></div>
        <div class="lead">${esc(slide.ctaLead || 'Comment')}</div>
        <div class="word">&ldquo;${esc(slide.trigger)}&rdquo;</div>
        ${slide.instruction ? `<div class="tail">${inline(slide.instruction)}</div>` : ''}
      </div>`;
}

/** Yellow action pill. `word` renders in the display face. */
function pill(p) {
  if (!p) return '';
  const o = typeof p === 'string' ? { text: p } : p;
  return `<div class="pill${o.ghost ? ' pill--ghost' : ''}">${o.before ? `<span>${esc(o.before)}</span>` : ''}${o.word ? `<span class="word">${esc(o.word)}</span>` : ''}${o.text ? `<span>${esc(o.text)}</span>` : ''}</div>`;
}

/** Headlines: an authored \n is a hard break, not a suggestion. Lines that are
 *  too wide shrink via the fit pass instead of re-wrapping where they like. */
function headline(text, tag) {
  if (!text) return '';
  if (!text.includes('\n')) return `<${tag}>${inline(text)}</${tag}>`;
  const lines = text.split('\n').map((l) => `<span class="ln">${inline(l)}</span>`).join('');
  return `<${tag} class="stacked">${lines}</${tag}>`;
}

function bodyFor(slide, index) {
  const tag = index === 0 || slide.type === 'cta' ? 'h1' : 'h2';
  const blocks = [
    slide.step ? `<div class="steppill">${esc(slide.step)}</div>` : '',
    label(slide.label),
    slide.kicker ? `<div class="kicker">${esc(slide.kicker)}</div>` : '',
    headline(slide.headline, tag),
    copyBlocks(slide.copy),
    ctaBlock(slide.trigger && slide.type === 'cta' ? slide : {}),
    rows(slide.rows, slide.numbered),
    versus(slide.versus),
    flow(slide.flow),
    big(slide.big),
    figure(slide.figure),
    panel(slide.stats),
    tiles(slide.tiles),
    cards(slide.cards, slide.flag),
    slide.pull ? `<div class="pull">${inline(slide.pull)}</div>` : '',
    product(slide.product),
    infocard(slide.infocard),
    button(slide.button),
    pill(slide.pill),
    note(slide.note),
  ].filter(Boolean);

  return blocks.join('\n      ');
}

export function renderSlide(deck, slide, index, bundlePath = '../../../ds-bundle-morphe') {
  const total = deck.slides.length;
  const photo = slide.type === 'hook' || slide.type === 'cta';
  const split = Boolean(slide.mock || slide.split);
  const handle = deck.handle || '@theoneclub';
  const progress = Math.round(((index + 1) / total) * 100);

  const badges = (slide.badges || [])
    .map((b, i) => `<div class="badge badge--${i === 0 ? 'l' : 'r'}">${esc(typeof b === 'string' ? b : b.text)}</div>`)
    .join('\n    ');

  // The artwork is a slide-level layer, not a body child: the slide clips it, so
  // it can bleed past the safe margin without landing in the body's scroll box
  // and tripping the overflow QA on every split slide.
  const artcol = slide.mock ? `<div class="artcol">${mock(slide.mock)}</div>` : '';

  // The word repeated huge and hollow behind the copy. A slide-level layer for
  // the same reason the artwork is one: it must not enter the body's scroll box.
  const ghost = slide.ghost
    ? `<div class="ghost" aria-hidden="true">${Array.from({ length: 5 }, () => `<span>${esc(slide.ghost)}</span>`).join('')}</div>`
    : '';

  // A photograph rarely composes itself around the headline. `imageFit` and
  // `imagePos` are raw background-size / background-position, so a deck can
  // place the subject clear of the type instead of settling for centre-cover.
  const artStyle = [
    `background-image:url('${esc(slide.image || '')}')`,
    slide.imageFit ? `background-size:${esc(slide.imageFit)}` : '',
    slide.imagePos ? `background-position:${esc(slide.imagePos)}` : '',
  ].filter(Boolean).join(';');

  const layers = photo
    ? `${slide.image ? `<div class="art" style="${artStyle}"></div>` : ''}
    <div class="scrim"></div>${ghost ? '\n    ' + ghost : ''}${artcol ? '\n    ' + artcol : ''}${badges ? '\n    ' + badges : ''}`
    : `${ghost}${artcol}${badges ? '\n    ' + badges : ''}`;

  return `<!doctype html>
<html lang="en" data-ready="0">
<head>
<meta charset="utf-8">
<title>${esc(deck.slug)} — slide ${index + 1}</title>
<link rel="stylesheet" href="${bundlePath}/fonts/fonts.css">
<link rel="stylesheet" href="${bundlePath}/tokens.css">
<link rel="stylesheet" href="${bundlePath}/carousel.css">
</head>
<body>
  <div class="slide slide--${esc(slide.type)}${photo && !slide.image ? ' slide--noart' : ''}${split ? ' slide--split' : ''}${slide.scrim ? ` slide--scrim-${esc(slide.scrim)}` : ''}${slide.align ? ` slide--align-${esc(slide.align)}` : ''}" id="slide"${slide.splitRatio ? ` style="--split:${esc(slide.splitRatio)}"` : ''}>
    ${layers}${deck.chip && total > 1 ? `\n    <div class="chip">${index + 1}/${total}</div>` : ''}
    <main class="body">
      ${bodyFor(slide, index)}
    </main>
    <footer class="foot">
      <span class="handle">${esc(handle)}</span>
      ${total > 1
        ? `<span class="bar"><i style="width:${progress}%"></i></span>
      <span class="count">${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>`
        : '<span class="bar"></span>'}
    </footer>
  </div>
<script>
/* Auto-fit: shrink type until the body stops overflowing.
   Records the final scale so the QA pass can flag slides that hit the floor. */
(function () {
  var FLOOR = 0.62, STEP = 0.02;
  function fit() {
    var slide = document.getElementById('slide');
    var body  = slide.querySelector('.body');
    var scale = 1;
    slide.style.setProperty('--fit', scale);
    var guard = 0;
    var over = function () {
      return body.scrollHeight > body.clientHeight + 1 || body.scrollWidth > body.clientWidth + 1;
    };
    while (over() && scale > FLOOR && guard++ < 40) {
      scale = Math.round((scale - STEP) * 100) / 100;
      slide.style.setProperty('--fit', scale);
    }
    /* a short block floating at the top reads as a mistake — centre it.
       (scrollHeight is never < clientHeight, so measure the children.) */
    var kids = body.children;
    var contentH = kids.length
      ? (kids[kids.length - 1].offsetTop + kids[kids.length - 1].offsetHeight) - kids[0].offsetTop
      : 0;
    if (contentH < body.clientHeight * 0.82) body.classList.add('body--centred');

    var root = document.documentElement;
    root.dataset.fit = String(scale);
    root.dataset.overflow  = body.scrollHeight > body.clientHeight + 1 ? '1' : '0';
    root.dataset.overflowX = body.scrollWidth  > body.clientWidth  + 1 ? '1' : '0';
    root.dataset.ready = '1';
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  else window.addEventListener('load', fit);
})();
</script>
</body>
</html>
`;
}

/** Contact-sheet preview: the set as a swipe strip + as it lands on the IG grid. */
export function renderGrid(deck, findings) {
  const total = deck.slides.length;
  const frames = Array.from({ length: total }, (_, i) => {
    const f = `slide-${String(i + 1).padStart(2, '0')}.html`;
    return `<figure class="thumb"><div class="hold"><iframe src="html/${f}" scrolling="no" loading="eager"></iframe></div><figcaption>${String(i + 1).padStart(2, '0')} · ${esc(deck.slides[i].type)}</figcaption></figure>`;
  }).join('\n');

  const rowsHtml = findings.map((f) => `<tr class="${f.severity}"><td>${f.severity.toUpperCase()}</td><td>${esc(f.where)}</td><td>${esc(f.rule)}</td><td>${esc(f.message)}</td></tr>`).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(deck.slug)} — grid preview</title>
<link rel="stylesheet" href="../../ds-bundle-morphe/fonts/fonts.css">
<style>
  :root { --green:#a3f0af; --yellow:#FFD700; --grey:#9CA3AF; --dim:#1f2937; }
  * { box-sizing: border-box; }
  body { margin:0; background:#000; color:#fff; font-family:'Inter',system-ui,sans-serif; padding:48px 40px 96px; }
  h1 { font-size:22px; letter-spacing:.24em; text-transform:uppercase; margin:0 0 6px; }
  h1 b { color:var(--green); }
  .meta { color:var(--grey); font-size:14px; margin-bottom:36px; }
  .meta code { color:var(--yellow); }
  h2 { font-size:13px; letter-spacing:.24em; text-transform:uppercase; color:var(--grey); margin:44px 0 16px; font-weight:600; }
  .strip { display:flex; gap:16px; overflow-x:auto; padding-bottom:16px; }
  .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:4px; max-width:520px; }
  .grid .hold { border:1px solid var(--dim); }
  .thumb { margin:0; }
  .thumb figcaption { font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--grey); margin-top:8px; }
  .strip .hold { width:270px; height:360px; }
  .grid  .hold { width:100%; aspect-ratio:3/4; }
  .hold { position:relative; overflow:hidden; flex:0 0 auto; background:#000; }
  iframe { position:absolute; top:0; left:0; width:1080px; height:1440px; border:0; transform-origin:top left; }
  .strip iframe { transform:scale(0.25); }
  .grid  iframe { transform:scale(0.1574); }
  .caption { white-space:pre-wrap; background:#111; border:1px solid var(--dim); border-left:3px solid var(--green); padding:20px 24px; font-size:14px; line-height:1.6; max-width:820px; color:#e5e7eb; }
  .tags { color:var(--grey); font-size:13px; margin-top:12px; max-width:820px; line-height:1.8; }
  table { border-collapse:collapse; width:100%; max-width:1100px; font-size:13px; }
  td { border-bottom:1px solid var(--dim); padding:10px 12px; vertical-align:top; color:#cbd5e1; }
  tr.error td:first-child { color:#ef4444; font-weight:700; }
  tr.warn  td:first-child { color:var(--yellow); font-weight:700; }
  .clean { color:var(--green); font-size:14px; }
</style>
</head>
<body>
  <h1>The One <b>Club</b> — ${esc(deck.slug)}</h1>
  <div class="meta">${esc(deck.date)} · angle: ${esc(deck.angle)} · trigger: <code>${esc(deck.trigger)}</code> · ${total} slides · 1080×1440</div>

  <h2>Swipe order</h2>
  <div class="strip">${frames}</div>

  <h2>How it lands on the grid</h2>
  <div class="grid">${frames}</div>

  <h2>Caption</h2>
  <div class="caption">${esc(deck.caption)}</div>
  <div class="tags">${esc((deck.hashtags || []).join(' '))}</div>

  <h2>QA</h2>
  ${findings.length ? `<table>${rowsHtml}</table>` : '<p class="clean">Clean — no compliance or layout findings.</p>'}
</body>
</html>
`;
}
