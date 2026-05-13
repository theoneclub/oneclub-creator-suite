// Final cleanup pass — fixes all remaining garbled chars after fix-final.js
const fs = require('fs');
const path = require('path');
const base = process.cwd();
const p = rel => path.join(base, rel);

function replaceBuf(fp, hexFrom, strTo) {
  const pattern = Buffer.from(hexFrom, 'hex');
  const replacement = Buffer.from(strTo, 'utf8');
  let buf = fs.readFileSync(fp);
  let n = 0;
  while (buf.includes(pattern)) {
    const idx = buf.indexOf(pattern);
    buf = Buffer.concat([buf.slice(0, idx), replacement, buf.slice(idx + pattern.length)]);
    n++;
  }
  if (n) { fs.writeFileSync(fp, buf); console.log(`  ✓ ${hexFrom.slice(0,14)}… → "${strTo}" x${n} in ${path.basename(fp)}`); }
  return n;
}

function replaceStr(fp, from, to) {
  let c = fs.readFileSync(fp, 'utf8');
  if (!c.includes(from)) return 0;
  const n = c.split(from).length - 1;
  fs.writeFileSync(fp, c.split(from).join(to), 'utf8');
  console.log(`  ✓ str x${n}: "${from.slice(0,35).replace(/[\x00-\x1f]/g,'?')}" → "${to}" in ${path.basename(fp)}`);
  return n;
}

const FFFD = '�';

// Pattern legend:
// efbfbd1d              = FFFD \x1D  → — (em dash, U+2014 = E2 80 94)
// efbfbd7819efbfbd      = FFFD x \x19 FFFD → 💬 (F0 9F 92 AC)
// efbfbd20efbfbd        = FFFD ' '  FFFD   → ↺  (E2 86 BA)
// efbfbd13efbfbdefb88f  = FFFD \x13 FFFD FE0F → ▶️ (E2 96 B6 + VS16)
// efbfbd13efbfbd        = FFFD \x13 FFFD  → ▼ (E2 96 BC) — context-specific
// efbfbd7818efbfbd      = FFFD x \x18 FFFD → 👤 (F0 9F 91 A4)
// efbfbd14efbfbd        = FFFD \x14 FFFD  → ●  (E2 97 8F)
// efbfbd781c1e          = FFFD x \x1C \x1E → 📄 (F0 9F 93 84)

console.log('=== Pass 1: global hex replacements ===');

// ▶️ YouTube source icon (must run BEFORE bare ef bf bd 13 ef bf bd rule)
const BRAIN_ADMIN = [
  'components/screens/AdminScreen.tsx',
  'components/screens/BrainScreen.tsx',
];
BRAIN_ADMIN.forEach(rel => {
  replaceBuf(p(rel), 'efbfbd13efbfbdefb88f', '▶️'); // YouTube ▶️
  replaceBuf(p(rel), 'efbfbd781c1e',          '📄'); // PDF 📄
});

// Em dash across multiple files
[
  'components/screens/AdminScreen.tsx',
  'components/screens/BrainScreen.tsx',
  'components/screens/EmailScreen.tsx',
  'components/screens/OutreachScreen.tsx',
  'components/screens/SMSScreen.tsx',
].forEach(rel => replaceBuf(p(rel), 'efbfbd1d', '—'));

// BrainScreen only
replaceBuf(p('components/screens/BrainScreen.tsx'), 'efbfbd7818efbfbd', '👤'); // MY LIBRARY
replaceBuf(p('components/screens/BrainScreen.tsx'), 'efbfbd14efbfbd',   '●'); // active sources ●

// ContentScreen only
replaceBuf(p('components/screens/ContentScreen.tsx'), 'efbfbd7819efbfbd', '💬'); // CAPTION
replaceBuf(p('components/screens/ContentScreen.tsx'), 'efbfbd20efbfbd',   '↺'); // ↺ REGEN

console.log('\n=== Pass 2: context-specific string replacements ===');

// ContentScreen swipe file chevrons — both branches give identical hex pattern,
// replace the whole ternary at once to assign ▲ (open) vs ▼ (closed)
replaceStr(
  p('components/screens/ContentScreen.tsx'),
  `{showSwipeFile ? '\u{FFFD}\x13\u{FFFD}' : '\u{FFFD}\x13\u{FFFD}'}`,
  `{showSwipeFile ? '▲' : '▼'}`
);

// ── Final report ─────────────────────────────────────────────────────────────
console.log('\n=== Remaining replacement chars ===');
const ALL = [
  'components/screens/AdminScreen.tsx',
  'components/screens/BrainScreen.tsx',
  'components/screens/ContentScreen.tsx',
  'components/screens/EmailScreen.tsx',
  'components/screens/OutreachScreen.tsx',
  'components/screens/SMSScreen.tsx',
  'components/ui/SequenceBuilder.tsx',
  'components/MatrixRain.tsx',
];
ALL.forEach(rel => {
  const fp = p(rel);
  if (!fs.existsSync(fp)) return;
  const c = fs.readFileSync(fp, 'utf8');
  const n = [...c].filter(ch => ch.charCodeAt(0) === 0xFFFD).length;
  if (n > 0) {
    let shown = 0;
    for (let i = 0; i < c.length && shown < 3; i++) {
      if (c.charCodeAt(i) === 0xFFFD) {
        const ctx = c.slice(Math.max(0, i - 15), i + 25).replace(/[\x00-\x1f]/g, '?');
        console.log('  ' + path.basename(fp) + ': ...' + ctx + '...');
        shown++;
      }
    }
    console.log(`  TOTAL in ${rel}: ${n}`);
  } else {
    console.log('  ✓ ' + path.basename(fp) + ': clean');
  }
});
console.log('\nDone.');
