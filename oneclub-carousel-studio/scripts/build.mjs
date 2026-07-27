#!/usr/bin/env node
/**
 * Deck JSON -> slide HTML + grid preview + compliance report.
 *
 *   node scripts/build.mjs decks/2026-07-27-system-critique.json [--force]
 *
 * Writes to output/<date>-<slug>/. Exits 1 on any error-severity finding
 * unless --force, so a non-compliant deck cannot be rendered by accident.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditDeck } from './lib/compliance.mjs';
import { renderSlide, renderGrid } from './lib/template.mjs';

const STUDIO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function buildDeck(deckPath, { force = false } = {}) {
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  for (const key of ['slug', 'date', 'trigger', 'slides']) {
    if (!deck[key]) throw new Error(`Deck is missing required field "${key}" (${deckPath})`);
  }

  const outDir = path.join(STUDIO, 'output', `${deck.date}-${deck.slug}`);
  const htmlDir = path.join(outDir, 'html');
  fs.mkdirSync(htmlDir, { recursive: true });

  deck.slides.forEach((slide, i) => {
    const file = path.join(htmlDir, `slide-${String(i + 1).padStart(2, '0')}.html`);
    fs.writeFileSync(file, renderSlide(deck, slide, i));
  });

  const { findings, ok } = auditDeck(deck);
  fs.writeFileSync(path.join(outDir, 'grid.html'), renderGrid(deck, findings));
  fs.writeFileSync(path.join(outDir, 'caption.txt'), `${deck.caption}\n\n${(deck.hashtags || []).join(' ')}\n`);
  fs.writeFileSync(path.join(outDir, 'deck.json'), JSON.stringify(deck, null, 2) + '\n');
  fs.writeFileSync(
    path.join(outDir, 'qa-report.json'),
    JSON.stringify({ deck: deck.slug, date: deck.date, stage: 'build', ok, findings }, null, 2) + '\n'
  );

  return { deck, outDir, findings, ok, force };
}

function report(findings) {
  if (!findings.length) return console.log('  clean — no compliance or structure findings');
  for (const f of findings) {
    const tag = f.severity === 'error' ? 'ERROR' : 'warn ';
    console.log(`  ${tag}  ${f.where.padEnd(22)} ${f.rule.padEnd(24)} ${f.message}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const deckArg = args.find((a) => !a.startsWith('--'));
  if (!deckArg) {
    console.error('usage: node scripts/build.mjs <deck.json> [--force]');
    process.exit(2);
  }

  const { deck, outDir, findings, ok } = buildDeck(path.resolve(deckArg), { force });
  console.log(`\nbuilt ${deck.slides.length} slides -> ${path.relative(process.cwd(), outDir)}`);
  console.log(`preview: ${path.relative(process.cwd(), path.join(outDir, 'grid.html'))}\n`);
  report(findings);

  if (!ok && !force) {
    console.error('\ncompliance errors present — fix the deck, or re-run with --force to build anyway. Not export-ready.');
    process.exit(1);
  }
  console.log('\nnext: node scripts/render.mjs ' + path.relative(process.cwd(), outDir));
}
