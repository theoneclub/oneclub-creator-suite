// Fix garbled emoji sequences in TSX files.
// Most critical: JSX-breaking } chars from corrupted 4-byte emojis.
const fs = require('fs');
const path = require('path');

function applyHexReplacement(filePath, hexFrom, strTo) {
  const pattern = Buffer.from(hexFrom.replace(/\s/g,''), 'hex');
  const replacement = Buffer.from(strTo);
  let buf = fs.readFileSync(filePath);
  let changed = false;
  while (buf.includes(pattern)) {
    const idx = buf.indexOf(pattern);
    buf = Buffer.concat([buf.slice(0, idx), replacement, buf.slice(idx + pattern.length)]);
    changed = true;
  }
  if (changed) fs.writeFileSync(filePath, buf);
  return changed;
}

function applyStrReplacement(filePath, from, to) {
  const buf = fs.readFileSync(filePath, 'utf8');
  if (!buf.includes(from)) return false;
  fs.writeFileSync(filePath, buf.split(from).join(to), 'utf8');
  return true;
}

const base = process.cwd();
const p = rel => path.join(base, rel);
const FFFD = '�';

// ── Global hex replacements (applied to ALL tsx files) ──────────────────────
// Key byte mappings (original UTF-8 byte → Win-1252 char → bad-fix result byte):
// 80→€→AC, 82→‚→1A, 83→ƒ→92, 85→…→26, 86→†→20(space!), 87→‡→21,
// 88→ˆ→C6, 89→‰→30, 8A→Š→60(`), 8B→‹→39(9), 8C→Œ→52(R),
// 8E→Ž→7D(}), 91→'→18, 92→'→19, 93→"→1C, 94→"→1D,
// 95→•→22("), 96→–→13, 97→—→14, 98→˜→DC, 99→™→22("),
// 9A→š→61(a), 9B→›→3A(:), 9C→œ→53(S), 9E→ž→7E(~), 9F→Ÿ→78(x)
// Bytes 0xA0-0xFF: same in both, but standalone → EFBFBD (replacement char)
// So a 4-byte emoji F0 9Y XX ZZ → EFBFBD [bad(9Y)] [bad(XX)] [bad(ZZ)]

// IMPORTANT: apply longest matches first
const HEX_RULES = [
  // 🗑️ Wastebasket U+1F5D1 = F0 9F 97 91 + VS16
  // 9F→78('x'), 97→14, 91→18, EF B8 8F→EFB88F
  ['EFBFBD781418EFB88F', '🗑️'],
  // ⚙️ Gear U+2699 = E2 9A 99 + VS16
  // 9A→61('a'), 99→™→22('"'), EFB88F
  ['EFBFBD6122EFB88F', '⚙️'],
  // ▶️ Play U+25B6 + VS16 = E2 96 B6 EF B8 8F
  // 96→–→13, B6→standalone
  ['EFBFBD13B6EFB88F', '▶️'],
  // ⚠️ Warning U+26A0 = E2 9A A0 + VS16
  // 9A→61('a'), A0→standalone
  ['EFBFBD61A0EFB88F', '⚠️'],
  // 📋 Clipboard U+1F4CB = F0 9F 93 8B
  // 9F→78('x'), 93→"→1C, 8B→‹→39('9')
  ['EFBFBD781C39', '📋'],
  // 📊 Bar chart U+1F4CA = F0 9F 93 8A
  // 9F→78, 93→1C, 8A→Š→60('`')
  ['EFBFBD781C60', '📊'],
  // 📅 Calendar U+1F4C5 = F0 9F 93 85
  // 9F→78, 93→1C, 85→…→26('&')
  ['EFBFBD781C26', '📅'],
  // 📧 Email U+1F4E7 = F0 9F 93 A7
  // 9F→78, 93→1C, A7→standalone
  ['EFBFBD781CA7', '📧'],
  // 📱 Phone U+1F4F1 = F0 9F 93 B1
  // 9F→78, 93→1C, B1→standalone
  ['EFBFBD781CB1', '📱'],
  // 📸 Camera U+1F4F8 = F0 9F 93 B8
  ['EFBFBD781CB8', '📸'],
  // 📤 Outbox U+1F4E4 = F0 9F 93 A4
  ['EFBFBD781CA4', '📤'],
  // 📲 Mobile with arrow U+1F4F2 = F0 9F 93 B2
  ['EFBFBD781CB2', '📲'],
  // 🎬 Clapperboard U+1F3AC = F0 9F 8E AC
  // 9F→78('x'), 8E→Ž→7D('}'), AC→standalone
  ['EFBFBD787DAC', '🎬'],
  // ✅ Check U+2705 = E2 9C 85
  // 9C→œ→53('S'), 85→…→26('&')
  ['EFBFBD5326', '✅'],
  // ✨ Sparkles U+2728 = E2 9C A8
  // 9C→'S', A8→standalone
  ['EFBFBD53A8', '✨'],
  // 🌐 Globe U+1F310 = F0 9F 8C 90
  // 9F→78('x'), 8C→Œ→52('R'), 90→standalone
  ['EFBFBD785290', '🌐'],
  // 👤 Bust U+1F464 = F0 9F 91 A4
  // 9F→78, 91→'→18, A4→standalone
  ['EFBFBD7818A4', '👤'],
  // 🧠 Brain U+1F9E0 = F0 9F A7 A0
  // 9F→78, A7→standalone (A7>9F so not special), A0→standalone
  ['EFBFBD78A7A0', '🧠'],
  // 🚀 Rocket U+1F680 = F0 9F 9A 80
  // 9F→78, 9A→š→61('a'), 80→€→AC→standalone
  ['EFBFBD7861AC', '🚀'],
  // ↺ Counter-CW U+21BA = E2 86 BA
  // 86→†→20(space!), BA→standalone
  ['EFBFBD20BA', '↺'],
  // ▼ Down-triangle U+25BC = E2 96 BC
  // 96→–→13, BC→standalone
  ['EFBFBD13BC', '▼'],
  // ⭐ Star U+2B50 = E2 AD 90
  // AD→normal(AD), 90→standalone
  // E2 AD 90: AD is latin1/win1252 same → stays AD; 90→U+0090→0x90 standalone
  // E2: 3-byte lead; AD: continuation (valid!); 90: in special range→U+0090→0x90 standalone
  // Wait: 90 in Win-1252 is undefined → U+0090; bad fix: 0x0090 & 0xFF = 0x90 → standalone UTF-8 → EFBFBD
  // So: E2 AD → valid 2-byte prefix → but it's 3-byte emoji E2 AD 90
  // After Win-1252: E2→â, AD→­(soft-hyphen,U+00AD), 90→U+0090
  // Bad fix: â→E2, ­→AD, U+0090→90 (standalone)
  // Bytes in file: E2 AD 90 → decoded: E2 AD starts 3-byte, 90 not continuation? Wait 90=0x90 is in 0x80-0xBF so IS a continuation byte! 90 is between 80 and BF, so it's a valid continuation byte.
  // Wait, I was wrong earlier. 0x90 = 144, and valid continuation range is 0x80-0xBF (128-191). 0x90 < 0xBF so it IS a valid continuation byte.
  // But Win-1252 byte 0x90 → U+0090 → 0x90 & 0xFF = 0x90. As UTF-8: E2 AD 90 → U+2B50 = ⭐!
  // Wait, does that mean ⭐ was CORRECTLY fixed by our earlier bad-fix script?? Let me re-examine.
  // E2 AD 90 after Win-1252 encoding:
  //   E2 → â (U+00E2, same in both)
  //   AD → ­ (U+00AD, soft hyphen, same in both - NOT in special range)
  //   90 → U+0090 (C1 control, undefined in Win-1252 but treated as U+0090)
  // After our bad fix: Buffer.from('â­', 'latin1'):
  //   â = U+00E2 → byte 0xE2
  //   ­ = U+00AD → byte 0xAD
  //    = U+0090 → byte 0x90
  // Bytes: E2 AD 90 → decoded as UTF-8: U+2B50 = ⭐ ✓
  // So ⭐ was CORRECTLY restored! No fix needed.

  // 🔗 Link U+1F517 = F0 9F 94 97
  // 9F→78, 94→"→1D, 97→—→14
  ['EFBFBD781D14', '🔗'],
  // 🔍 Magnifier U+1F50D = F0 9F 94 8D
  // 9F→78, 94→1D, 8D→undefined Win-1252→U+008D→0x8D standalone
  ['EFBFBD781DEFBFBD', '🔍'],
  // 🪝 Hook U+1FA9D = F0 9F AA 9D
  // 9F→78, AA→normal, 9D→undefined Win-1252→U+009D→0x9D standalone
  ['EFBFBD78AA9D', '🪝'],
  // 🎵 Music note U+1F3B5 = F0 9F 8E B5
  // 9F→78, 8E→7D('}'), B5→standalone
  ['EFBFBD787DB5', '🎵'],
  // 🎯 Target U+1F3AF = F0 9F 8E AF
  // 9F→78, 8E→7D('}'), AF→standalone
  ['EFBFBD787DAF', '🎯'],
  // 💼 Briefcase U+1F4BC = F0 9F 92 BC
  // 9F→78, 92→'→19, BC→standalone
  ['EFBFBD7819BC', '💼'],
  // 🤝 Handshake U+1F91D = F0 9F A4 9D
  // 9F→78, A4→normal, 9D→0x9D standalone
  ['EFBFBD78A49D', '🤝'],
  // ✏️ Pencil U+270F + VS16 = E2 9C 8F EF B8 8F
  // 9C→'S', 8F→undefined→U+008F→0x8F standalone
  ['EFBFBD538FEFB88F', '✏️'],
  // ⏳ Hourglass U+23F3 = E2 8F B3
  // 8F→U+008F→0x8F standalone, then B3→standalone
  // E2 + 0x8F → invalid (0x8F not valid continuation) → EFBFBD, then 0x8F standalone → EFBFBD, then B3 standalone → EFBFBD
  // So ⏳ → EFBFBD EFBFBD B3 ... let's just catch what we can
  // 💬 Speech bubble U+1F4AC = F0 9F 92 AC
  // 9F→78, 92→'→19, AC→standalone
  ['EFBFBD7819AC', '💬'],
  // 📝 Memo U+1F4DD = F0 9F 93 9D
  // 9F→78, 93→1C, 9D→undefined Win1252→U+009D→0x9D standalone
  ['EFBFBD781C9D', '📝'],
  // 📌 Pin U+1F4CC = F0 9F 93 8C
  // 9F→78, 93→1C, 8C→Œ→52('R')
  ['EFBFBD781C52', '📌'],
  // ➕ Plus U+2795 = E2 9E 95
  // 9E→ž→7E('~'), 95→•→22('"')
  ['EFBFBD7E22', '➕'],
];

const TSX_FILES = [
  'components/screens/AdminScreen.tsx',
  'components/screens/BrainScreen.tsx',
  'components/screens/ContentScreen.tsx',
  'components/screens/EmailScreen.tsx',
  'components/screens/OutreachScreen.tsx',
  'components/screens/SMSScreen.tsx',
  'components/ui/SequenceBuilder.tsx',
  'components/MatrixRain.tsx',
  'components/Spinner.tsx',
  'components/Toast.tsx',
];

console.log('Applying global hex replacements...');
TSX_FILES.forEach(rel => {
  const fp = p(rel);
  if (!fs.existsSync(fp)) return;
  HEX_RULES.forEach(([hex, emoji]) => { applyHexReplacement(fp, hex, emoji); });
});
console.log('Done.');

// ── File-specific string patches ────────────────────────────────────────────
function patch(rel, pairs) {
  const fp = p(rel);
  if (!fs.existsSync(fp)) return;
  let content = fs.readFileSync(fp, 'utf8');
  let changed = false;
  for (const [from, to] of pairs) {
    if (from instanceof RegExp) {
      const r = content.replace(from, to); if (r !== content) { content = r; changed = true; }
    } else if (content.includes(from)) {
      content = content.split(from).join(to); changed = true;
    }
  }
  if (changed) { fs.writeFileSync(fp, content, 'utf8'); console.log('Patched: ' + rel); }
}

patch('components/screens/ContentScreen.tsx', [
  [FFFD + 'S' + FFFD + ' CONTENT', '✨ CONTENT'],
  ['emoji="' + FFFD + 'x' + FFFD + '" label="TITLE"', 'emoji="📝" label="TITLE"'],
  ['emoji="' + FFFD + 'x' + FFFD + '"', 'emoji="💬"'],  // generic fallback
  ['emoji="' + FFFD + 'x}' + FFFD + '"', 'emoji="🪝"'],
  ['>' + FFFD + 'x}' + FFFD + ' FULL SCRIPT', '>🎬 FULL SCRIPT'],
  ['>' + FFFD + ' ' + FFFD + ' REGEN', '>↺ REGEN'],
  ['>' + FFFD + 'x9<', '>📋<'],
  // Swipe file toggle arrows (two replacement chars without space between)
  [/'��' : '��'/g, "'▼' : '▶'"],
  [/'�' : '�'/g, "'▼' : '▶'"],
]);

patch('components/screens/AdminScreen.tsx', [
  ["'✅ Added to Glo", "'✅ Added to Glo"],  // already correct if hex worked
  [FFFD + 'S' + FFFD + ' Added to Glo', '✅ Added to Glo'],
  ['> ' + FFFD + '</div>', '> 🔒</div>'],
  ['The One Club ' + FFFD + ' Op', 'The One Club ⚙️ Op'],
  ['ENTER ' + FFFD + ' \n', 'ENTER 🔑\n'],
  ['>' + FFFD + 'x LOCK', '>🔒 LOCK'],
  ["'brain' ? '" + FFFD + "x" + FFFD + FFFD + " GLOBAL BRAI", "'brain' ? '🧠 GLOBAL BRAI"],
  [" : '" + FFFD + FFFD + " USAGE STATS", " : '📊 USAGE STATS"],
  ["/> : '" + FFFD + "a" + FFFD + " ADD'", "/> : '➕ ADD'"],
  ["'youtube' ? '" + FFFD + FFFD + "️'", "'youtube' ? '▶️'"],
  ["'pdf' ? '" + FFFD + "x'", "'pdf' ? '📄'"],
  [": '" + FFFD + "xR" + FFFD + "'}<", ": '🔗'}<"],
]);

patch('components/screens/BrainScreen.tsx', [
  [FFFD + 'x' + FFFD + FFFD + ' Source adde', '✅ Source adde'],
  ['\n          ' + FFFD + 'x' + FFFD + FFFD + ' BRAND BRAIN', '\n          🧠 BRAND BRAIN'],
  ["'" + FFFD + 'xR' + FFFD + ' GLOBAL LIBRARY', "'🌐 GLOBAL LIBRARY"],
  ["LIBRARY' : '" + FFFD + 'x' + FFFD + " MY LIBRARY'", "LIBRARY' : '👤 MY LIBRARY'"],
  [FFFD + FFFD + ' {activeSourc', '⚡ {activeSourc'],
  ['sources active ' + FFFD + ' all', 'sources active — all'],
  ['regularly ' + FFFD + ' content', 'regularly — content'],
  ["'youtube' ? '" + FFFD + FFFD + "️'", "'youtube' ? '▶️'"],
  ["'pdf' ? '" + FFFD + "x'", "'pdf' ? '📄'"],
  [": '" + FFFD + 'xR' + FFFD + "'}<", ": '🔗'}<"],
  // Garbled loading bar (katakana turned to noise)
  [/�[� \x00-\x1f]{5,}�<\/span>/, '████████████████████</span>'],
  [FFFD + 'x URL', '🔗 URL'],
  [FFFD + 'S' + FFFD + '️ MANUAL PASTE', '✏️ MANUAL PASTE'],
  ["/> : '" + FFFD + 'a' + FFFD + " FEED IN'", "/> : '⚡ FEED IN'"],
  ["'" + FFFD + 'x' + FFFD + FFFD + " Analysing...'", "'⏳ Analysing...'"],
  ["'...' : '" + FFFD + 'a' + FFFD + " FEED IN'", "'...' : '⚡ FEED IN'"],
]);

patch('components/screens/EmailScreen.tsx', [
  ['EMAIL ${i + 1} ' + FFFD + ' ${e.subject}', 'EMAIL ${i + 1} — ${e.subject}'],
  [FFFD + 'x' + FFFD + ' EMAIL', '📧 EMAIL'],
  [FFFD + 'a' + FFFD + ' START BUILDI', '🚀 START BUILDI'],
  ['> ' + FFFD + ' ' + FFFD + ' RESET', '>↺ RESET'],
  [' ' + FFFD + ' ' + FFFD + ' RESET', ' ↺ RESET'],
  [FFFD + '!️ EXPORT CSV', '📤 EXPORT CSV'],
]);

patch('components/screens/OutreachScreen.tsx', [
  ["'instagram', label: '" + FFFD + 'x' + FFFD + " Instagram DM'", "'instagram', label: '📸 Instagram DM'"],
  ["'tiktok', label: '" + FFFD + 'x}' + FFFD + " TikTok DM'", "'tiktok', label: '🎵 TikTok DM'"],
  ["'linkedin', label: '" + FFFD + 'x' + FFFD + " LinkedIn'", "'linkedin', label: '💼 LinkedIn'"],
  ["'email', label: '" + FFFD + 'x' + FFFD + " Cold Email'", "'email', label: '📧 Cold Email'"],
  ['SSAGE ${i + 1} ' + FFFD + ' ${m.purpose}', 'SSAGE ${i + 1} — ${m.purpose}'],
  ['`' + FFFD + 'x' + FFFD + ' Notes:', '`📝 Notes:'],
  [FFFD + 'x' + FFFD + FFFD + ' OUTREACH', '🤝 OUTREACH'],
  [FFFD + 'a' + FFFD + ' BUILD SEQUEN', '🚀 BUILD SEQUEN'],
  ['?.label} ' + FFFD + '  {targetType}', '?.label} → {targetType}'],
  [' ' + FFFD + ' ' + FFFD + ' RESET', ' ↺ RESET'],
  [FFFD + 'x9 EXPORT FULL', '📋 EXPORT FULL'],
]);

patch('components/screens/SMSScreen.tsx', [
  ['(${m.purpose}) ' + FFFD + ' ${m.sendDay}', '(${m.purpose}) — ${m.sendDay}'],
  [FFFD + 'x' + FFFD + ' SMS', '📱 SMS'],
  [FFFD + 'a' + FFFD + ' BUILD CAMPAI', '🚀 BUILD CAMPAI'],
  [' ' + FFFD + ' ' + FFFD + ' RESET', ' ↺ RESET'],
  [FFFD + '!️ EXPORT CSV', '📤 EXPORT CSV'],
  [FFFD + 'x9 COPY FULL C', '📋 COPY FULL C'],
]);

patch('components/ui/SequenceBuilder.tsx', [
  [FFFD + 'S APPROVED', '✓ APPROVED'],  // check-mark ✓ was correct ASCII
  ['>' + FFFD + 'x}' + FFFD + ' THIS EMAIL', '>🎯 THIS EMAIL'],
  [FFFD + 'x& {item.sendD', '📅 {item.sendD'],
  [FFFD + 'a' + FFFD + '️ Message 1 m', '⚠️ Message 1 m'],
  ['>' + FFFD + 'x}' + FFFD + ' PERSONALISA', '>🎯 PERSONALISA'],
  ["'" + FFFD + ' ' + FFFD + " REGENERATE'", "'↺ REGENERATE'"],
  [FFFD + 'S APPROVE & BU', '✓ APPROVE & BU'],
  ['BUILD NEXT ' + FFFD + ' \n', 'BUILD NEXT →\n'],
  ['BUILD NEXT ' + FFFD + ' →\n', 'BUILD NEXT →\n'],  // avoid double if already fixed
]);

// Fix MatrixRain CHARS line
patch('components/MatrixRain.tsx', [
  [/const CHARS = '[^']*'/, "const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'"],
]);

// ── Report remaining replacement chars ──────────────────────────────────────
console.log('\n=== Remaining replacement chars ===');
TSX_FILES.forEach(rel => {
  const fp = p(rel);
  if (!fs.existsSync(fp)) return;
  const content = fs.readFileSync(fp, 'utf8');
  const matches = [];
  for (let i = 0; i < content.length; i++) {
    if (content.charCodeAt(i) === 0xFFFD) {
      const ctx = content.slice(Math.max(0,i-15), i+15).replace(/[\x00-\x1f]/g,'?');
      matches.push(ctx);
    }
  }
  if (matches.length) {
    console.log('\n  ' + rel + ': ' + matches.length + ' replacement chars');
    [...new Set(matches)].slice(0,5).forEach(m => console.log('    ...' + m + '...'));
  }
});

console.log('\nAll done!');
