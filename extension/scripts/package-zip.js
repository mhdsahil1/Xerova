// ============================================
// XEROVA Browser Guard — Package Extension (.zip)
// ============================================
// Creates a distributable .zip archive of the extension dist folder

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const MANIFEST_PATH = path.join(DIST, 'manifest.json');

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error('Error: dist/manifest.json not found. Please run npm run build first.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
const version = manifest.version || '1.0.0';
const zipName = `xerova-browser-guard-v${version}.zip`;
const zipPath = path.join(ROOT, zipName);

// Remove existing zip if present
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

try {
  console.log(`Packaging extension v${version} from ${DIST}...`);
  // Use PowerShell Compress-Archive for reliable Windows archive creation
  execSync(`powershell -Command "Compress-Archive -Path '${DIST}\\*' -DestinationPath '${zipPath}' -Force"`, {
    stdio: 'inherit',
  });

  const stats = fs.statSync(zipPath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  console.log(`✓ Created: ${zipName} (${sizeKB} KB)`);
  console.log(`✓ Ready for distribution or Chrome Web Store upload!`);
} catch (error) {
  console.error('Packaging failed:', error.message);
  process.exit(1);
}
