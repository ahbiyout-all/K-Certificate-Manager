import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function createIcoFile(pngBuffersWithSizes) {
  const count = pngBuffersWithSizes.length;
  let offset = 6 + count * 16;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type: 1 = ICO
  header.writeUInt16LE(count, 4); // Count of images

  const dirEntries = [];
  const imageBodies = [];

  for (const item of pngBuffersWithSizes) {
    const { size, buffer } = item;
    const dir = Buffer.alloc(16);
    dir.writeUInt8(size >= 256 ? 0 : size, 0); // Width
    dir.writeUInt8(size >= 256 ? 0 : size, 1); // Height
    dir.writeUInt8(0, 2); // Color count
    dir.writeUInt8(0, 3); // Reserved
    dir.writeUInt16LE(1, 4); // Color planes
    dir.writeUInt16LE(32, 6); // Bits per pixel
    dir.writeUInt32LE(buffer.length, 8); // Image byte size
    dir.writeUInt32LE(offset, 12); // Image byte offset

    dirEntries.push(dir);
    imageBodies.push(buffer);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageBodies]);
}

async function run() {
  const inputPng = path.join(rootDir, 'public/assets/icons/app-logo.png');
  console.log('Generating multi-resolution transparent Windows .ICO and PNG assets from:', inputPng);

  const pngBase = fs.readFileSync(inputPng);

  const sizes = [256, 128, 64, 48, 32, 16];
  const pngBuffers = [];

  for (const s of sizes) {
    const buf = await sharp(pngBase)
      .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    pngBuffers.push({ size: s, buffer: buf });
  }

  const icoBuffer = createIcoFile(pngBuffers);

  // High-Res 512x512 PNG with Transparent Background
  const png512 = await sharp(pngBase)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // High-Res 256x256 PNG with Transparent Background
  const png256 = await sharp(pngBase)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // JPG fallback with dark slate background
  const jpg512 = await sharp(pngBase)
    .resize(512, 512)
    .flatten({ background: '#0F172A' })
    .jpeg({ quality: 96 })
    .toBuffer();

  const jpg256 = await sharp(pngBase)
    .resize(256, 256)
    .flatten({ background: '#0F172A' })
    .jpeg({ quality: 96 })
    .toBuffer();

  const targetFiles = [
    // WPF Assets
    { path: path.join(rootDir, 'src-wpf/KCertManager.Wpf/Assets/app.ico'), data: icoBuffer },
    { path: path.join(rootDir, 'src-wpf/KCertManager.Wpf/Assets/app-icon.ico'), data: icoBuffer },
    { path: path.join(rootDir, 'src-wpf/KCertManager.Wpf/Assets/app-logo.png'), data: png512 },
    { path: path.join(rootDir, 'src-wpf/KCertManager.Wpf/Assets/app-logo.jpg'), data: jpg512 },
    { path: path.join(rootDir, 'src-wpf/KCertManager.Wpf/Assets/app-icon.jpg'), data: jpg512 },
    { path: path.join(rootDir, 'src-wpf/KCertManager.Wpf/Assets/favicon.jpg'), data: jpg256 },

    // Public web assets
    { path: path.join(rootDir, 'public/assets/icons/app.ico'), data: icoBuffer },
    { path: path.join(rootDir, 'public/assets/icons/app-icon.ico'), data: icoBuffer },
    { path: path.join(rootDir, 'public/assets/icons/app-logo.png'), data: png512 },
    { path: path.join(rootDir, 'public/assets/icons/app-logo.jpg'), data: jpg512 },
    { path: path.join(rootDir, 'public/assets/icons/app-icon.png'), data: png512 },
    { path: path.join(rootDir, 'public/assets/icons/app-icon.jpg'), data: jpg512 },
    { path: path.join(rootDir, 'public/assets/favicon.jpg'), data: jpg256 },
    { path: path.join(rootDir, 'public/assets/app.ico'), data: icoBuffer },
    { path: path.join(rootDir, 'public/assets/app-logo.png'), data: png512 },
    { path: path.join(rootDir, 'public/favicon.ico'), data: icoBuffer },

    // Root icons
    { path: path.join(rootDir, 'app-icon.ico'), data: icoBuffer },
    { path: path.join(rootDir, 'app.ico'), data: icoBuffer },
    { path: path.join(rootDir, 'favicon.ico'), data: icoBuffer },

    // Source images
    { path: path.join(rootDir, 'src/assets/images/app_logo_1789868249262.jpg'), data: jpg512 },
    { path: path.join(rootDir, 'src/assets/images/app_icon_1789868264046.jpg'), data: jpg512 },

    // Dist assets
    { path: path.join(rootDir, 'dist/assets/app.ico'), data: icoBuffer },
    { path: path.join(rootDir, 'dist/assets/app-icon.ico'), data: icoBuffer },
    { path: path.join(rootDir, 'dist/assets/app-logo.png'), data: png512 },
    { path: path.join(rootDir, 'dist/assets/favicon.jpg'), data: jpg256 },
    { path: path.join(rootDir, 'dist/favicon.ico'), data: icoBuffer },
  ];

  for (const t of targetFiles) {
    fs.mkdirSync(path.dirname(t.path), { recursive: true });
    fs.writeFileSync(t.path, t.data);
    console.log(`✓ Updated: ${path.relative(rootDir, t.path)} (${t.data.length} bytes)`);
  }

  console.log('All icons successfully updated to the new user-provided K-Shield design!');
}

run().catch(console.error);
