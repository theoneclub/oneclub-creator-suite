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
  const li = items.map((it, i) => `
        <div class="row" style="--row-accent:${accent(i)}">
          ${numbered ? `<div class="n">${i + 1}</div>` : ''}
          <div class="txt">
            <div class="t">${inline(it.t)}</div>
            ${it.s ? `<div class="s">${inline(it.s)}</div>` : ''}
          </div>
        </div>`).join('');
  return `<div class="rows">${li}\n      </div>`;
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

/** Stat tiles: { value, label } — hook-slide proof chips. */
const tiles = (items = []) =>
  items.length
    ? `<div class="tiles">${items.map((t) => `<div class="tile"><b>${esc(t.value)}</b><span>${esc(t.label)}</span></div>`).join('')}</div>`
    : '';

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
  return [
    slide.kicker ? `<div class="kicker">${esc(slide.kicker)}</div>` : '',
    headline(slide.headline, tag),
    copyBlocks(slide.copy),
    rows(slide.rows, slide.numbered),
    versus(slide.versus),
    flow(slide.flow),
    big(slide.big),
    figure(slide.figure),
    panel(slide.stats),
    tiles(slide.tiles),
    slide.pull ? `<div class="pull">${inline(slide.pull)}</div>` : '',
    pill(slide.pill),
  ].filter(Boolean).join('\n      ');
}

export function renderSlide(deck, slide, index, bundlePath = '../../../ds-bundle-morphe') {
  const total = deck.slides.length;
  const photo = slide.type === 'hook' || slide.type === 'cta';
  const handle = deck.handle || '@theoneclub';
  const progress = Math.round(((index + 1) / total) * 100);

  const badges = (slide.badges || [])
    .map((b, i) => `<div class="badge badge--${i === 0 ? 'l' : 'r'}">${esc(typeof b === 'string' ? b : b.text)}</div>`)
    .join('\n    ');

  const layers = photo
    ? `${slide.image ? `<div class="art" style="background-image:url('${esc(slide.image)}')"></div>` : ''}
    <div class="scrim"></div>${badges ? '\n    ' + badges : ''}`
    : badges;

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
  <div class="slide slide--${esc(slide.type)}${photo && !slide.image ? ' slide--noart' : ''}" id="slide">
    ${layers}
    <main class="body">
      ${bodyFor(slide, index)}
    </main>
    <footer class="foot">
      <span class="handle">${esc(handle)}</span>
      <span class="bar"><i style="width:${progress}%"></i></span>
      <span class="count">${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
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
