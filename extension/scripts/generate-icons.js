// ============================================
// XEROVA Browser Guard — Generate PNG Icons
// ============================================
// Creates PNG icons at required sizes from the source image.
// Run: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

// Since we can't use image processing libraries without installing them,
// we'll create simple SVG-based icons and use them as placeholders.
// For production, replace with properly sized PNGs.

const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const sizes = [16, 32, 48, 128];

// Create an SVG icon that can be used directly
const createSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" rx="24" fill="#12141a"/>
  <path d="M64 18L28 36v28c0 24.8 15.4 48 36 54 20.6-6 36-29.2 36-54V36L64 18z" 
        fill="none" stroke="#2dd4bf" stroke-width="6" stroke-linejoin="round"/>
  <path d="M52 64l10 10 16-20" 
        fill="none" stroke="#2dd4bf" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

for (const size of sizes) {
  const svgContent = createSVG(size);
  const filename = `icon-${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svgContent);
  console.log(`✓ Created ${filename}`);
}

// Also create a PNG placeholder note
fs.writeFileSync(
  path.join(iconsDir, 'README.md'),
  `# Extension Icons

These SVG icons are used as development placeholders.

For Chrome Web Store submission, convert to PNG at:
- 16×16 (toolbar)
- 32×32 (toolbar @2x)
- 48×48 (extensions page)
- 128×128 (Chrome Web Store)

The source design uses XEROVA brand cyan (#2dd4bf) on dark background (#12141a).
`
);

console.log('✓ Icon generation complete');
