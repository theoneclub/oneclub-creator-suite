// Final targeted fix for remaining garbled emoji sequences.
// Run AFTER fix-emojis.js has been applied.
const fs = require('fs');
const path = require('path');

const base = process.cwd();
const p = rel => path.join(base, rel);

function replaceBuf(fp, hexFrom, strTo) {
  const pattern = Buffer.from(hexFrom.replace(/\s/g,''), 'hex');
  const replacement = Buffer.from(strTo, 'utf8');
  let buf = fs.readFileSync(fp);
  let n = 0;
  while (buf.includes(pattern)) {
    const idx = buf.indexOf(pattern);
    buf = Buffer.concat([buf.slice(0, idx), replacement, buf.slice(idx + pattern.length)]);
    n++;
  }
  if (n) { fs.writeFileSync(fp, buf); console.log(`  hex: replaced ${n}x in ${path.basename(fp)}`); }
  return n;
}

function replaceStr(fp, from, to) {
  let c = fs.readFileSync(fp, 'utf8');
  if (!c.includes(from)) return 0;
  const n = c.split(from).length - 1;
  fs.writeFileSync(fp, c.split(from).join(to), 'utf8');
  console.log(`  str: replaced ${n}x "${from.slice(0,30).replace(/[\x00-\x1f]/g,'?')}" → "${to}" in ${path.basename(fp)}`);
  return n;
}

const FFFD = '�';

// ── Missing hex rules (patterns that weren't in fix-emojis.js) ────────────────

// ⚡ Lightning (E2 9A A1): 9A→61('a'), A1→standalone→EFBFBD
// Bad fix: E2 61 A1 → EFBFBD 61 EFBFBD
const FILES = [
  'components/screens/AdminScreen.tsx',
  'components/screens/BrainScreen.tsx',
  'components/screens/ContentScreen.tsx',
  'components/screens/EmailScreen.tsx',
  'components/screens/OutreachScreen.tsx',
  'components/screens/SMSScreen.tsx',
  'components/ui/SequenceBuilder.tsx',
];

console.log('=== Adding missing hex replacements ===');
FILES.forEach(rel => {
  // ⚡ Lightning bolt — generate/build buttons
  replaceBuf(p(rel), 'EFBFBD61EFBFBD', '⚡');
  // 🔒 Lock (F0 9F 94 92): 9F→78, 94→1D, 92→19 → EFBFBD781D19
  replaceBuf(p(rel), 'EFBFBD781D19', '🔒');
  // → Right arrow (E2 86 92): 86→20(space!), 92→19 → EFBFBD2019
  replaceBuf(p(rel), 'EFBFBD2019', '→');
  // ✓ Check mark (E2 9C 93): 9C→53('S'), 93→1C → EFBFBD531C
  replaceBuf(p(rel), 'EFBFBD531C', '✓');
});

// ── Context-specific string replacements for EFBFBD781CEFBFBD pattern ───────
// This pattern (FFFD + 'x' +  + FFFD) comes from F0 9F 93 [0xA0-0xBF]
// which includes 📧 📱 📸 💬(no, different bytes) etc.
// We distinguish by surrounding text.

const PAT_93 = FFFD + 'x' + '' + FFFD;  // = EFBFBD 78 1C EFBFBD

console.log('\n=== Context-specific fixes for FFFD-x-\\u001c-FFFD pattern ===');

replaceStr(p('components/screens/ContentScreen.tsx'),
  'emoji="' + PAT_93 + '" label="TITLE"', 'emoji="📝" label="TITLE"');
replaceStr(p('components/screens/ContentScreen.tsx'),
  'emoji="' + PAT_93 + '" label="CAPTION"', 'emoji="💬" label="CAPTION"');
replaceStr(p('components/screens/ContentScreen.tsx'),
  'emoji="' + PAT_93 + '" label="CTA"', 'emoji="🎯" label="CTA"');
// Remaining generic PAT_93 in ContentScreen
replaceStr(p('components/screens/ContentScreen.tsx'),
  'emoji="' + PAT_93 + '"', 'emoji="📎"');

replaceStr(p('components/screens/EmailScreen.tsx'),
  PAT_93 + ' EMAIL', '📧 EMAIL');
replaceStr(p('components/screens/SMSScreen.tsx'),
  PAT_93 + ' SMS', '📱 SMS');

// OutreachScreen: FFFD x  FFFD for Instagram and LinkedIn (💼 was different bytes)
replaceStr(p('components/screens/OutreachScreen.tsx'),
  "'" + PAT_93 + " Instagram DM'", "'📸 Instagram DM'");
replaceStr(p('components/screens/OutreachScreen.tsx'),
  "'" + PAT_93 + " Cold Email'", "'📧 Cold Email'");
// LinkedIn 💼 = F0 9F 92 BC: 92→19, BC→EFBFBD → FFFD + x +  + FFFD
const PAT_92 = FFFD + 'x' + '' + FFFD;
replaceStr(p('components/screens/OutreachScreen.tsx'),
  "'" + PAT_92 + " LinkedIn'", "'💼 LinkedIn'");

// BrainScreen remaining
replaceStr(p('components/screens/BrainScreen.tsx'),
  PAT_93 + ' MY LIBRARY', '👤 MY LIBRARY');

// Generic pattern for remaining PAT_93 in outreach
replaceStr(p('components/screens/OutreachScreen.tsx'), PAT_93, '📱');

// ── Other remaining patterns ─────────────────────────────────────────────────

// AdminScreen: ⚙️ ADMIN header (after EFBFBD61 was replaced with ⚡, check if admin header is now correct)
// Original: FFFD 'a' '"' ️ ADMIN — the ⚙️ rule should have caught it but let me verify
replaceStr(p('components/screens/AdminScreen.tsx'),
  FFFD + 'a"️ ADMIN', '⚙️ ADMIN');

// AdminScreen: GLOBAL BRAIN tab
// Pattern: FFFD x FFFD FFFD GLOBAL BRAIN → brain emoji (FFFD x was caught by 🧠 rule if pattern was right)
// 🧠 Brain = F0 9F A7 A0: 9F→78, A7→normal(A7, standalone→FFFD), A0→standalone→FFFD → EFBFBD78EFBFBDEFBFBD
// But wait: A7 = 0xA7 which is in 0x80-0xBF → standalone continuation → FFFD
// Pattern: EFBFBD 78 EFBFBD EFBFBD (since A7 and A0 both become FFFD)
const BRAIN_PAT = FFFD + 'x' + FFFD + FFFD;
replaceStr(p('components/screens/AdminScreen.tsx'), "'" + BRAIN_PAT + " GLOBAL BRAI", "'🧠 GLOBAL BRAI");
replaceStr(p('components/screens/BrainScreen.tsx'), '\n          ' + BRAIN_PAT + ' BRAND BRAIN', '\n          🧠 BRAND BRAIN');
replaceStr(p('components/screens/BrainScreen.tsx'), BRAIN_PAT + ' Source adde', '✅ Source adde');

// BrainScreen: active sources counter ⚡ (was 2 FFFD pattern)
// Actually this might be a different pattern. Let me handle with buf inspection.
// The ⚡ hex rule already ran above.

// AdminScreen: USAGE STATS (📊 was caught by EFBFBD781C60 rule)
// The " : '📊 USAGE STATS" should be there if rule worked

// Admin panel header panel (🔒 rule already ran)

// SequenceBuilder: BUILD NEXT → (the → pattern was EFBFBD2019, should now be fixed)
// Also: ↺ REGENERATE, ✓ APPROVE
replaceStr(p('components/ui/SequenceBuilder.tsx'), FFFD + 'S APPROVED', '✓ APPROVED');
replaceStr(p('components/ui/SequenceBuilder.tsx'), FFFD + 'S APPROVE & BU', '✓ APPROVE & BU');
replaceStr(p('components/ui/SequenceBuilder.tsx'), "'" + FFFD + ' ' + FFFD + " REGENERATE'", "'↺ REGENERATE'");

// ── Final report ─────────────────────────────────────────────────────────────
console.log('\n=== Remaining replacement chars ===');
const ALL_FILES = [
  'components/screens/AdminScreen.tsx',
  'components/screens/BrainScreen.tsx',
  'components/screens/ContentScreen.tsx',
  'components/screens/EmailScreen.tsx',
  'components/screens/OutreachScreen.tsx',
  'components/screens/SMSScreen.tsx',
  'components/ui/SequenceBuilder.tsx',
  'components/MatrixRain.tsx',
];
ALL_FILES.forEach(rel => {
  const fp = p(rel);
  if (!fs.existsSync(fp)) return;
  const c = fs.readFileSync(fp, 'utf8');
  const n = [...c].filter(ch => ch.charCodeAt(0) === 0xFFFD).length;
  if (n > 0) {
    let shown = 0;
    for (let i = 0; i < c.length && shown < 3; i++) {
      if (c.charCodeAt(i) === 0xFFFD) {
        const ctx = c.slice(Math.max(0,i-10), i+20).replace(/[\x00-\x1f]/g,'?');
        console.log('  ' + rel.split('/').pop() + ': ...' + ctx + '...');
        shown++;
      }
    }
    console.log('  TOTAL in ' + rel + ': ' + n);
  } else {
    console.log('  ✓ ' + rel.split('/').pop() + ': clean');
  }
});
console.log('\nDone.');
