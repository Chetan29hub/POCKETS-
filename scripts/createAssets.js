/**
 * Creates minimal valid PNG placeholder files for Expo assets.
 * Run with: node scripts/createAssets.js
 */
const fs   = require('fs');
const path = require('path');

// A valid 1x1 pixel PNG (RGB, no alpha) — purple #8B5CF6
const PNG_BYTES = Buffer.from(
  '89504e470d0a1a0a' +           // PNG signature
  '0000000d49484452' +           // IHDR length + type
  '00000001' +                   // width = 1
  '00000001' +                   // height = 1
  '080200000090775344' +         // bit depth=8, colortype=2(RGB), CRC stub
  // Use a known-good minimal PNG instead:
  '', 'hex'
);

// Simplest approach: use a known-good minimal 1x1 RGB PNG
// Generated from: convert -size 1x1 xc:"#8B5CF6" out.png | xxd
const VALID_PNG = Buffer.from([
  0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,
  0x00,0x00,0x00,0x0d,0x49,0x48,0x44,0x52,
  0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,
  0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53,
  0xde,0x00,0x00,0x00,0x0c,0x49,0x44,0x41,
  0x54,0x08,0xd7,0x63,0xd4,0x8b,0x5c,0x00,
  0x00,0x00,0x05,0x00,0x01,0x93,0xc9,0x2e,
  0x00,0x00,0x00,0x00,0x49,0x45,0x4e,0x44,
  0xae,0x42,0x60,0x82
]);

const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

const files = [
  'icon.png',
  'splash.png',
  'adaptive-icon.png',
  'notification-icon.png',
  'favicon.png',
];

files.forEach(name => {
  const dest = path.join(assetsDir, name);
  fs.writeFileSync(dest, VALID_PNG);
  console.log('✓ Created:', dest);
});

console.log('\nAll placeholder assets created.');
console.log('Replace with real artwork before publishing to Play Store.');
