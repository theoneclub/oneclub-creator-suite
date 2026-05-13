const fs = require('fs');
const path = require('path');

// These files were corrupted by the PowerShell Set-Content encoding bug
// Fix: read as UTF-8 (which contains double-encoded bytes), then reinterpret as Latin1->UTF8
const files = [
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

let fixed = 0;
files.forEach(f => {
  const fullPath = path.join(process.cwd(), f);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf8');
  // Re-interpret the double-encoded string: each char code = one byte of original UTF-8
  const corrected = Buffer.from(content, 'latin1').toString('utf8');
  // Only write back if something changed
  if (corrected !== content) {
    fs.writeFileSync(fullPath, corrected, 'utf8');
    console.log('Fixed: ' + f);
    fixed++;
  } else {
    console.log('OK (no change): ' + f);
  }
});
console.log('\nDone. Fixed ' + fixed + ' files.');
