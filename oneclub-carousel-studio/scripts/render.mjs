#!/usr/bin/env node
/**
 * Slide HTML -> numbered 1080x1440 PNGs, plus the layout half of the QA pass
 * (auto-fit scale + overflow detection measured in the real browser).
 *
 *   node scripts/render.mjs output/2026-07-27-system-critique
 *   node scripts/render.mjs decks/2026-07-27-system-critique.json   # builds first
 *
 * Chromium comes from Playwright. This environment already has it; on a fresh
 * machine: npm i -D playwright && npx playwright install chromium
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { buildDeck } from './build.mjs';

const STUDIO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SLIDE_W = 1080;
const SLIDE_H = 1440;
const FIT_FLOOR = 0.62;

async function loadChromium() {
  const attempts = [];
  const pick = (mod) => mod?.chromium ?? mod?.default?.chromium; // CJS interop
  for (const spec of ['playwright', 'playwright-core']) {
    try {
      const c = pick(await import(spec));
      if (c) return c;
    } catch { /* fall through */ }
    attempts.push(spec);
  }
  try {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    const entry = path.join(globalRoot, 'playwright', 'index.js');
    if (fs.existsSync(entry)) {
      const c = pick(await import(pathToFileURL(entry).href));
      if (c) return c;
    }
    attempts.push(entry);
  } catch { attempts.push('npm root -g'); }
  throw new Error(`Playwright not found (tried: ${attempts.join(', ')}).\nInstall it: npm i -D playwright && npx playwright install chromium`);
}

async function main() {
  const args = process.argv.slice(2);
  const target = args.find((a) => !a.startsWith('--'));
  if (!target) {
    console.error('usage: node scripts/render.mjs <output-dir | deck.json>');
    process.exit(2);
  }

  let outDir = path.resolve(target);
  let buildFindings = [];
  if (outDir.endsWith('.json')) {
    const built = buildDeck(outDir, { force: args.includes('--force') });
    outDir = built.outDir;
    buildFindings = built.findings;
    if (!built.ok && !args.includes('--force')) {
      console.error('compliance errors — not rendering. Fix the deck or pass --force.');
      process.exit(1);
    }
  } else {
    const report = path.join(outDir, 'qa-report.json');
    if (fs.existsSync(report)) buildFindings = JSON.parse(fs.readFileSync(report, 'utf8')).findings || [];
  }

  const htmlDir = path.join(outDir, 'html');
  const slides = fs.readdirSync(htmlDir).filter((f) => /^slide-\d+\.html$/.test(f)).sort();
  if (!slides.length) throw new Error(`No slide HTML in ${htmlDir} — run build.mjs first.`);

  const chromium = await loadChromium();
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: SLIDE_W, height: SLIDE_H },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  const layout = [];
  for (const file of slides) {
    const url = pathToFileURL(path.join(htmlDir, file)).href;
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction(() => document.documentElement.dataset.ready === '1', null, { timeout: 15000 });

    const m = await page.evaluate(() => ({
      fit: parseFloat(document.documentElement.dataset.fit || '1'),
      overflow: document.documentElement.dataset.overflow === '1',
      overflowX: document.documentElement.dataset.overflowX === '1',
    }));

    const png = path.join(outDir, file.replace('.html', '.png'));
    await page.locator('#slide').screenshot({ path: png });

    const where = file.replace('.html', '');
    if (m.overflow || m.overflowX) {
      layout.push({ severity: 'error', where, rule: 'overflow', message: `Copy overflows the slide even at the ${FIT_FLOOR} auto-fit floor — cut words, do not shrink further.` });
    } else if (m.fit <= FIT_FLOOR + 0.001) {
      layout.push({ severity: 'warn', where, rule: 'fit-floor', message: `Auto-fit bottomed out at ${m.fit} — type is at minimum size and losing impact. Cut ~20% of the copy.` });
    } else if (m.fit < 0.8) {
      layout.push({ severity: 'warn', where, rule: 'fit', message: `Type scaled to ${m.fit} to fit. Tighten the copy if this slide is meant to punch.` });
    }
    console.log(`  ${file.replace('.html', '.png').padEnd(14)} fit ${m.fit.toFixed(2)}${m.overflow ? '  OVERFLOW' : ''}`);
  }

  await browser.close();

  const findings = [...buildFindings, ...layout];
  fs.writeFileSync(
    path.join(outDir, 'qa-report.json'),
    JSON.stringify({ deck: path.basename(outDir), stage: 'render', ok: !findings.some((f) => f.severity === 'error'), findings }, null, 2) + '\n'
  );

  // Refresh the grid so the QA table in the preview reflects the layout pass too.
  const deck = JSON.parse(fs.readFileSync(path.join(outDir, 'deck.json'), 'utf8'));
  const { renderGrid } = await import('./lib/template.mjs');
  fs.writeFileSync(path.join(outDir, 'grid.html'), renderGrid(deck, findings));

  console.log(`\nexported ${slides.length} PNGs -> ${path.relative(process.cwd(), outDir)}`);
  const errs = layout.filter((f) => f.severity === 'error');
  if (errs.length) {
    for (const e of errs) console.error(`  ERROR  ${e.where}  ${e.message}`);
    process.exit(1);
  }
  for (const w of layout) console.log(`  warn   ${w.where}  ${w.message}`);
  console.log(`\npreview: open ${path.relative(process.cwd(), path.join(outDir, 'grid.html'))}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
