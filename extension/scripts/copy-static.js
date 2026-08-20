// ============================================
// XEROVA Browser Guard — Copy Static Assets
// ============================================
// Copies non-TypeScript files to dist/ after tsc compilation

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Ensure dist exists
if (!fs.existsSync(DIST)) {
  fs.mkdirSync(DIST, { recursive: true });
}

// 1. Copy manifest.json
fs.copyFileSync(
  path.join(ROOT, 'manifest.json'),
  path.join(DIST, 'manifest.json')
);

// 2. Copy popup HTML & CSS
const popupDist = path.join(DIST, 'popup');
if (!fs.existsSync(popupDist)) {
  fs.mkdirSync(popupDist, { recursive: true });
}
fs.copyFileSync(
  path.join(ROOT, 'src', 'popup', 'popup.html'),
  path.join(popupDist, 'popup.html')
);
fs.copyFileSync(
  path.join(ROOT, 'src', 'popup', 'popup.css'),
  path.join(popupDist, 'popup.css')
);

// 3. Copy icons
const iconsSrc = path.join(ROOT, 'icons');
const iconsDist = path.join(DIST, 'icons');
if (!fs.existsSync(iconsDist)) {
  fs.mkdirSync(iconsDist, { recursive: true });
}
if (fs.existsSync(iconsSrc)) {
  const iconFiles = fs.readdirSync(iconsSrc);
  for (const file of iconFiles) {
    fs.copyFileSync(
      path.join(iconsSrc, file),
      path.join(iconsDist, file)
    );
  }
}

console.log('✓ Static assets copied to dist/');
