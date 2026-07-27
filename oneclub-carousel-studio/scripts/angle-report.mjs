#!/usr/bin/env node
/**
 * Which angle actually converts.
 *
 *   node scripts/angle-report.mjs [automation/engagement-log.csv]
 *
 * Reads the weekly Buffer/ManyChat/Brevo numbers you log after each carousel
 * and ranks the 7 rotating angles by what matters at each step of the funnel:
 * comments per 1k views (does the hook earn the trigger), DM->email conversion
 * (does the angle survive the handoff), and saves per 1k (does it earn the
 * re-read). Data beats design — this is the file that tells you what to write
 * next, once you have five carousels logged.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STUDIO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.resolve(process.argv[2] || path.join(STUDIO, 'automation', 'engagement-log.csv'));

if (!fs.existsSync(file)) {
  console.error(`No engagement log at ${file}\nStart one by copying automation/engagement-log.csv and filling a row per posted carousel.`);
  process.exit(1);
}

const lines = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/).filter((l) => l && !l.startsWith('#'));
const head = lines.shift().split(',').map((h) => h.trim());
const rows = lines.map((l) => {
  // naive CSV — the log has no embedded commas by design
  const cells = l.split(',').map((c) => c.trim());
  return Object.fromEntries(head.map((h, i) => [h, cells[i] ?? '']));
});

const num = (v) => (v === '' || v === undefined ? null : Number(v));
const per1k = (n, views) => (views ? (n / views) * 1000 : null);
const fmt = (v, d = 2) => (v === null || Number.isNaN(v) ? '  —  ' : v.toFixed(d).padStart(5));

const posted = rows.filter((r) => num(r.views));
if (!posted.length) {
  console.log('Log has no rows with view counts yet. Fill in views/comments/saves after the first week.');
  process.exit(0);
}

const byAngle = new Map();
for (const r of posted) {
  const key = r.angle || 'unlabelled';
  if (!byAngle.has(key)) byAngle.set(key, []);
  byAngle.get(key).push(r);
}

const summary = [...byAngle.entries()].map(([angle, rs]) => {
  const sum = (k) => rs.reduce((a, r) => a + (num(r[k]) || 0), 0);
  const views = sum('views');
  const comments = sum('comments');
  const emails = sum('emails');
  const dms = sum('dms');
  return {
    angle,
    posts: rs.length,
    views,
    commentsPer1k: per1k(comments, views),
    savesPer1k: per1k(sum('saves'), views),
    dmToEmail: dms ? (emails / dms) * 100 : null,
    emails,
    founding: sum('founding500'),
  };
});

summary.sort((a, b) => (b.commentsPer1k ?? 0) - (a.commentsPer1k ?? 0));

const W = Math.max(24, ...summary.map((s) => s.angle.length));
console.log(`\nAngle performance · ${posted.length} carousels · ${file.replace(STUDIO + '/', '')}\n`);
console.log(`${'ANGLE'.padEnd(W)}  POSTS   VIEWS   CMT/1k  SAVE/1k  DM→EMAIL  EMAILS  F500`);
console.log('-'.repeat(W + 54));
for (const s of summary) {
  console.log(
    `${s.angle.padEnd(W)}  ${String(s.posts).padStart(5)}  ${String(s.views).padStart(6)}  ` +
    `${fmt(s.commentsPer1k)}   ${fmt(s.savesPer1k)}   ${fmt(s.dmToEmail, 1)}%   ${String(s.emails).padStart(6)}  ${String(s.founding).padStart(4)}`
  );
}

if (posted.length < 5) {
  console.log(`\n${posted.length} carousels logged. The ranking starts meaning something at 5 — keep posting before you act on it.`);
} else {
  const [best] = summary;
  const worst = summary[summary.length - 1];
  console.log(`\nWrite more: ${best.angle} — ${fmt(best.commentsPer1k)} comments per 1k views.`);
  if (summary.length > 1) console.log(`Write less:  ${worst.angle} — ${fmt(worst.commentsPer1k)} per 1k.`);
  const bestConv = [...summary].filter((s) => s.dmToEmail !== null).sort((a, b) => b.dmToEmail - a.dmToEmail)[0];
  if (bestConv && bestConv.angle !== best.angle) {
    console.log(`Note: ${bestConv.angle} converts DMs to emails best (${fmt(bestConv.dmToEmail, 1)}%) even though it earns fewer comments — that is a nurture-quality signal, not a hook signal.`);
  }
}
console.log('');
