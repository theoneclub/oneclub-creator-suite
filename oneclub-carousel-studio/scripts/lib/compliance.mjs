/**
 * Compliance + structure QA for One Club carousels.
 * These are the hard rules from the brand memory (lib/prompts.ts) expressed as code
 * so a slide can never ship having quietly broken one.
 *
 * Severity: 'error' blocks export. 'warn' is reported and shipped.
 */

// EBOOK / BLUEPRINT are the carousel-only triggers — kept out of the reel
// rotation so carousel conversion stays measurable on its own.
export const TRIGGER_ROTATION = ['FREEDOM', 'ESCAPE', 'SYSTEM', 'FOUNDING', 'FREE', 'IN', 'BLUEPRINT', 'EBOOK'];

const RULES = [
  {
    id: 'money-claim',
    severity: 'error',
    // Any dollar figure except the Freedom Fund's $10,000.
    test: (t) => (t.match(/\$\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?\s?[kKmM]?\b/g) || []).filter((m) => !/^\$\s?10,?000$/.test(m.trim())),
    message: (hits) => `Dollar figure(s) ${hits.join(', ')} — no specific dollar figures as personal income results. Only "$10,000 monthly, community-voted" (Freedom Fund) is allowed.`,
  },
  {
    id: 'freedom-fund-framing',
    severity: 'error',
    // If $10,000 appears it must be framed as the community-voted monthly fund.
    test: (t) => (/\$\s?10,?000/.test(t) && !/(community|voted|vote)/i.test(t) ? ['$10,000'] : []),
    message: () => 'Freedom Fund must be framed as "$10,000 monthly, community-voted" — the community/vote wording is missing on this slide.',
  },
  {
    id: 'banned-freedom-fund-phrase',
    severity: 'error',
    test: (t) => (t.match(/no\s+(loan|equity)/gi) || []),
    message: (hits) => `Banned Freedom Fund phrasing: "${hits.join('", "')}". Never say "no loan, no equity".`,
  },
  {
    id: 'guarantee',
    severity: 'error',
    test: (t) => (t.match(/\b(guarantee[ds]?|guaranteed|risk[- ]free|100%\s+(sure|certain)|promise you'?ll)\b/gi) || []),
    message: (hits) => `Outcome guarantee language: "${hits.join('", "')}". Emotional hooks only, never guarantees.`,
  },
  {
    id: 'income-promise',
    severity: 'error',
    test: (t) => (t.match(/\b(make|earn|pull(ing)?|bank(ing)?)\s+\$?[\d,]+/gi) || []),
    message: (hits) => `Income promise: "${hits.join('", "')}". No earnings figures anywhere.`,
  },
  {
    id: 'stale-year',
    severity: 'error',
    test: (t) => (t.match(/\b20(2[0-5])\b/g) || []),
    message: (hits) => `Stale year "${hits.join('", "')}" — brand rule is to write forward (2026+), never a past year.`,
  },
  {
    id: 'banned-voice-words',
    severity: 'warn',
    test: (t) => (t.match(/\b(hustle|grind|synergy|leverage)\b/gi) || []),
    message: (hits) => `Off-voice word(s): "${hits.join('", "')}". Brand memory lists these as words to avoid.`,
  },
  {
    id: 'long-sentence',
    severity: 'warn',
    // A slide is read in about two seconds. Long sentences lose people.
    test: (t) => (t.split(/(?<=[.!?])\s+|\n/)
      .map((x) => x.trim())
      .filter((x) => x.split(/\s+/).filter(Boolean).length > 20)),
    message: (hits) => `Sentence runs ${hits[0].split(/\s+/).length} words: "${hits[0].slice(0, 60)}…". Break it up — nothing on a slide should run past 20.`,
  },
  {
    id: 'passive-income',
    severity: 'warn',
    test: (t) => (t.match(/\bpassive income\b/gi) || []),
    message: () => '"Passive income" reads as a claim. Prefer "recurring income" — that is the brand\'s framing.',
  },
];

/** Run the text rules over one string. */
export function checkText(text, where) {
  const findings = [];
  for (const rule of RULES) {
    const hits = rule.test(text);
    if (hits.length) findings.push({ where, rule: rule.id, severity: rule.severity, message: rule.message(hits) });
  }
  return findings;
}

/** Flatten every user-visible string on a slide, whatever block it lives in. */
export function slideText(slide) {
  const parts = [slide.kicker, slide.step, slide.headline, slide.trigger, slide.ctaLead, slide.instruction, slide.pull, slide.flag];
  parts.push(typeof slide.note === 'string' ? slide.note : slide.note?.text);
  parts.push(...(slide.copy || []));
  for (const r of slide.rows || []) parts.push(r.t, r.s);
  for (const c of slide.cards || []) parts.push(c.t, c.s);
  if (slide.mock) parts.push(typeof slide.mock === 'string' ? undefined : slide.mock.caption);
  for (const f of slide.flow || []) parts.push(f.k, f.t, f.s);
  if (slide.big) parts.push(slide.big.value, slide.big.label, slide.big.sub);
  if (slide.figure) parts.push(slide.figure.caption);
  for (const b of slide.badges || []) parts.push(typeof b === 'string' ? b : b.text);
  if (slide.versus) parts.push(slide.versus.no?.t, slide.versus.no?.s, slide.versus.yes?.t, slide.versus.yes?.s);
  for (const t of slide.tiles || []) parts.push(t.value, t.label);
  for (const s of slide.stats?.items || []) parts.push(s.label, s.value);
  if (slide.stats?.caption) parts.push(slide.stats.caption);
  if (slide.pill) {
    const p = slide.pill;
    parts.push(typeof p === 'string' ? p : [p.before, p.word, p.text].filter(Boolean).join(' '));
  }
  return parts
    .filter((x) => x !== undefined && x !== null && x !== '')
    .map(String)
    .join(' \n ')
    .replace(/\[\[|\]\]|\{\{|\}\}|\(\(|\)\)/g, '');
}

/**
 * Structure + compliance QA over a whole deck.
 * Returns { findings, ok } where ok === false if any error-severity finding exists.
 */
export function auditDeck(deck) {
  const findings = [];
  const push = (severity, where, rule, message) => findings.push({ severity, where, rule, message });

  // A `single` deck is a one-off asset — a hook test, a story frame. The five
  // beats and the caption rules don't apply, but every text rule still does.
  const single = deck.kind === 'single';

  // ---- the 5 beats, non-negotiable ----
  if (!single) {
  const types = deck.slides.map((s) => s.type);
  if (types[0] !== 'hook') push('error', 'deck', 'beat-order', 'Slide 1 must be the HOOK.');
  if (types[1] !== 'stakes') push('error', 'deck', 'beat-order', 'Slide 2 must be the STAKES.');
  if (!types.includes('value')) push('error', 'deck', 'beat-order', 'Deck has no VALUE slides — beats 3-7 are the teaching.');
  if (!types.includes('receipts')) push('error', 'deck', 'beat-order', 'Deck is missing the RECEIPTS slide (second-to-last).');
  if (types[types.length - 1] !== 'cta') push('error', 'deck', 'beat-order', 'Final slide must be the CTA.');
  if (types.indexOf('receipts') !== types.length - 2 && types.includes('receipts')) {
    push('warn', 'deck', 'beat-order', 'RECEIPTS is usually the second-to-last slide.');
  }
  if (deck.slides.length < 5 || deck.slides.length > 10) {
    push('warn', 'deck', 'length', `${deck.slides.length} slides. 5 is the floor (one beat each); 8-10 is the sweet spot for saves.`);
  }
  }

  const caption = deck.caption || '';

  // ---- CTA / trigger word ----
  if (!single) {
  const trigger = (deck.trigger || '').toUpperCase();
  if (!TRIGGER_ROTATION.includes(trigger)) {
    push('error', 'deck', 'trigger', `Trigger "${deck.trigger}" is not in the live rotation (${TRIGGER_ROTATION.join(' / ')}).`);
  }
  const cta = deck.slides[deck.slides.length - 1];
  if (cta && (cta.trigger || '').toUpperCase() !== trigger) {
    push('error', 'slide:cta', 'trigger', `CTA slide word "${cta.trigger}" does not match deck trigger "${trigger}".`);
  }
  const otherTriggers = TRIGGER_ROTATION.filter((w) => w !== trigger && w.length > 2);
  const ctaBody = cta ? slideText(cta).toUpperCase() : '';
  const collisions = otherTriggers.filter((w) => new RegExp(`\\b${w}\\b`).test(ctaBody));
  if (collisions.length) {
    push('warn', 'slide:cta', 'trigger', `CTA slide also contains rotation word(s) ${collisions.join(', ')} — ambiguous triggers split ManyChat attribution.`);
  }

  // ---- caption ----
  if (!caption) {
    push('error', 'caption', 'caption', 'Caption is empty — the comment trigger lives in the caption, not just the slide.');
  } else {
    const aboveFold = caption.slice(0, 125);
    if (!new RegExp(`comment\\s+(the\\s+word\\s+)?["'\u201c\u2018]?${trigger}`, 'i').test(aboveFold)) {
      push('error', 'caption', 'caption', `"Comment ${trigger}" must appear in the first 125 characters (above the fold).`);
    }
    if (caption.length > 2200) push('error', 'caption', 'caption', `Caption is ${caption.length} chars — Instagram caps at 2200.`);
  }

  const tags = deck.hashtags || [];
  if (tags.length < 8 || tags.length > 20) push('warn', 'hashtags', 'hashtags', `${tags.length} hashtags. 10-15 is the working range.`);
  const badTags = tags.filter((t) => !/^#[A-Za-z0-9_]+$/.test(t));
  if (badTags.length) push('error', 'hashtags', 'hashtags', `Malformed hashtag(s): ${badTags.join(', ')}`);
  }

  // ---- per-slide text rules + copy length sanity ----
  deck.slides.forEach((slide, i) => {
    const where = `slide ${String(i + 1).padStart(2, '0')} (${slide.type})`;
    findings.push(...checkText(slideText(slide), where));

    const headline = (slide.headline || '').replace(/\[\[|\]\]/g, '');
    const cap = slide.type === 'hook' ? 150 : 110;
    if (headline.length > cap) {
      push('warn', where, 'headline-length', `Headline is ${headline.length} chars (soft cap ${cap}) — it will auto-fit smaller and lose impact.`);
    }
    // 2026 carousel data: hook headlines land hardest at 5-8 words.
    if (slide.type === 'hook') {
      const words = headline.split(/\s+/).filter(Boolean).length;
      if (words > 10) push('warn', where, 'hook-length', `Hook is ${words} words. The pattern that performs is 5-8 — cut it down.`);
    }
    const copyLen = (slide.copy || []).join(' ').length;
    if (copyLen > 420) push('warn', where, 'copy-length', `${copyLen} chars of body copy — over ~420 the slide stops being readable in-feed.`);
  });

  // ---- caption text rules ----
  findings.push(...checkText(caption, 'caption'));

  return { findings, ok: !findings.some((f) => f.severity === 'error') };
}
