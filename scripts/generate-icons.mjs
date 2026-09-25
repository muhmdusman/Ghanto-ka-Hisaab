import sharp from 'sharp';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = join(__dirname, '..', 'public');
const faviconDir = join(publicDir, 'favicon_io');

const sourceLogo = join(publicDir, 'pwa-logo.png');

const sizes = [
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 },
];

async function generateIcons() {
  console.log('Generating PWA icons from pwa-logo.png...');

  for (const { name, size } of sizes) {
    const outputPath = join(faviconDir, name);
    await sharp(sourceLogo)
      .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(outputPath);
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }

  // Generate favicon.ico from 32x32
  const favicoPath = join(faviconDir, 'favicon.ico');
  await sharp(sourceLogo)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(favicoPath);
  console.log(`✓ Generated favicon.ico`);

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
