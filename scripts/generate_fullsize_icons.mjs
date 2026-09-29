import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. High Resolution Full-Bleed Vector SVG (Fills 96% of the 512x512 canvas)
const fullBleedSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A1128" />
      <stop offset="35%" stop-color="#101F42" />
      <stop offset="70%" stop-color="#1C2D5A" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>

    <!-- Metallic Gold Outer Border Gradient -->
    <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF3B0" />
      <stop offset="25%" stop-color="#FFD700" />
      <stop offset="50%" stop-color="#F59E0B" />
      <stop offset="75%" stop-color="#FFE57F" />
      <stop offset="100%" stop-color="#B45309" />
    </linearGradient>

    <!-- Shield Inner Fill Gradient -->
    <linearGradient id="shieldFill" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E3A8A" />
      <stop offset="40%" stop-color="#1E293B" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>

    <!-- Certificate Gold Seal Gradient -->
    <linearGradient id="sealGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFBEB" />
      <stop offset="30%" stop-color="#FDE047" />
      <stop offset="60%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#B45309" />
    </linearGradient>

    <!-- Korean Taegeuk Red & Blue Accent -->
    <linearGradient id="taegeukRed" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EF4444" />
      <stop offset="100%" stop-color="#991B1B" />
    </linearGradient>
    <linearGradient id="taegeukBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3B82F6" />
      <stop offset="100%" stop-color="#1E3A8A" />
    </linearGradient>

    <!-- Radial Glow -->
    <radialGradient id="centerGlow" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.45" />
      <stop offset="60%" stop-color="#1D4ED8" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Filter for 3D Drop Shadows -->
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#000000" flood-opacity="0.65" />
    </filter>
    <filter id="keyGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#F59E0B" flood-opacity="0.75" />
    </filter>
  </defs>

  <!-- 1. Full-Bleed Rounded Base Tile (Occupies 98% of canvas for maximum desktop footprint) -->
  <rect x="8" y="8" width="496" height="496" rx="100" ry="100" fill="url(#bgGrad)" stroke="url(#goldBorder)" stroke-width="12" filter="url(#dropShadow)" />

  <!-- Inner Bevel Highlight -->
  <rect x="18" y="18" width="476" height="476" rx="90" ry="90" fill="none" stroke="#FFFFFF" stroke-opacity="0.15" stroke-width="3" />

  <!-- Ambient Glow -->
  <circle cx="256" cy="240" r="210" fill="url(#centerGlow)" />

  <!-- 2. Large Security Shield Emblem (Full Height Presence) -->
  <g filter="url(#dropShadow)">
    <!-- Outer Shield Border -->
    <path d="M 256 50 
             C 365 50 435 75 445 130 
             C 445 295 365 405 256 455 
             C 147 405 67 295 67 130 
             C 77 75 147 50 256 50 Z" 
          fill="url(#shieldFill)" 
          stroke="url(#goldBorder)" 
          stroke-width="14" 
          stroke-linejoin="round" />

    <!-- Shield Inner Contrast Rim -->
    <path d="M 256 68 
             C 350 68 418 90 425 138 
             C 425 282 355 385 256 432 
             C 157 385 87 282 87 138 
             C 94 90 162 68 256 68 Z" 
          fill="none" 
          stroke="#38BDF8" 
          stroke-opacity="0.35" 
          stroke-width="4" />
  </g>

  <!-- 3. Central Certificate Sheet & Digital Seal Graphic -->
  <g filter="url(#dropShadow)">
    <!-- White Certificate Document with Folded Corner -->
    <rect x="156" y="115" width="200" height="235" rx="14" ry="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="4" />
    <path d="M 316 115 L 356 155 L 316 155 Z" fill="#E2E8F0" />
    
    <!-- Security Watermark Lines -->
    <rect x="180" y="145" width="115" height="10" rx="5" fill="#94A3B8" />
    <rect x="180" y="168" width="152" height="7" rx="3.5" fill="#CBD5E1" />
    <rect x="180" y="185" width="152" height="7" rx="3.5" fill="#CBD5E1" />
    <rect x="180" y="202" width="120" height="7" rx="3.5" fill="#CBD5E1" />

    <!-- Government/Bank Security Ribbon -->
    <path d="M 230 230 L 256 215 L 282 230 L 275 270 L 256 260 L 237 270 Z" fill="url(#taegeukRed)" />
    <path d="M 237 270 L 256 260 L 275 270 L 270 282 L 256 274 L 242 282 Z" fill="url(#taegeukBlue)" />

    <!-- Gold Official Seal Badge -->
    <circle cx="256" cy="235" r="28" fill="url(#sealGold)" stroke="#B45309" stroke-width="2" />
    <circle cx="256" cy="235" r="22" fill="none" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="1.5" stroke-dasharray="3,2" />
    <!-- Lock inside seal -->
    <rect x="250" y="233" width="12" height="10" rx="2" fill="#78350F" />
    <path d="M 252 233 L 252 228 C 252 225.5 260 225.5 260 228 L 260 233" fill="none" stroke="#78350F" stroke-width="2" />
  </g>

  <!-- 4. Prominent Golden Security Key (Super Sharp & Large Across the Foreground) -->
  <g filter="url(#keyGlow)" transform="translate(0, 30)">
    <!-- Golden Key Loop with Korean Taegeuk / K accent -->
    <circle cx="205" cy="305" r="46" fill="url(#sealGold)" stroke="#78350F" stroke-width="5" />
    <circle cx="205" cy="305" r="22" fill="#0A1128" stroke="#B45309" stroke-width="4" />
    
    <!-- Key Stem -->
    <rect x="245" y="295" width="135" height="20" rx="5" fill="url(#sealGold)" stroke="#78350F" stroke-width="4" />
    
    <!-- Key Teeth / Digital Bit Cuts -->
    <rect x="325" y="315" width="16" height="24" rx="3" fill="url(#sealGold)" stroke="#78350F" stroke-width="3" />
    <rect x="355" y="315" width="16" height="34" rx="3" fill="url(#sealGold)" stroke="#78350F" stroke-width="3" />
  </g>

  <!-- 5. Bold "K-CERT" Gold Inset Badge at Bottom Shield Area -->
  <g filter="url(#dropShadow)">
    <rect x="156" y="400" width="200" height="42" rx="10" fill="#090E1D" stroke="url(#goldBorder)" stroke-width="3.5" />
    <text x="256" y="429" font-family="'Pretendard', 'Segoe UI', Arial, sans-serif" font-weight="900" font-size="22" fill="url(#sealGold)" text-anchor="middle" letter-spacing="3.5">
      K-CERT
    </text>
  </g>

  <!-- 6. Corner Sparkles for High Fidelity Luxury Finish -->
  <g fill="#FFFBEB">
    <path d="M 120 110 Q 120 125 105 125 Q 120 125 120 140 Q 120 125 135 125 Q 120 125 120 110 Z" />
    <path d="M 395 120 Q 395 132 383 132 Q 395 132 395 144 Q 395 132 407 132 Q 395 132 395 120 Z" />
    <path d="M 380 370 Q 380 380 370 380 Q 380 380 380 390 Q 380 380 390 380 Q 380 380 380 370 Z" />
  </g>
</svg>
`;

/**
 * Builds a standard Windows .ICO binary containing multiple PNG frames
 */
function createIcoFile(pngBuffersWithSizes) {
  const count = pngBuffersWithSizes.length;
  // Header: 6 bytes
  // Directory entries: 16 bytes each
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
    dir.writeUInt8(size >= 256 ? 0 : size, 0); // Width (0 means 256)
    dir.writeUInt8(size >= 256 ? 0 : size, 1); // Height (0 means 256)
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
  console.log('Generating maximum-size, full-bleed icon assets across resolutions...');
  const svgBuffer = Buffer.from(fullBleedSvg);

  const sizes = [256, 128, 64, 48, 32, 16];
  const pngBuffers = [];

  for (const s of sizes) {
    const buf = await sharp(svgBuffer)
      .resize(s, s, { fit: 'contain' })
      .png({ compressionLevel: 9 })
      .toBuffer();
    pngBuffers.push({ size: s, buffer: buf });
  }

  // 512x512 High-Res PNG & JPG
  const png512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();
  const jpg512 = await sharp(svgBuffer).resize(512, 512).jpeg({ quality: 96 }).toBuffer();
  const jpg256 = await sharp(svgBuffer).resize(256, 256).jpeg({ quality: 96 }).toBuffer();

  const icoBuffer = createIcoFile(pngBuffers);

  // Targets to write
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

    // Source images
    { path: path.join(rootDir, 'src/assets/images/app_logo_1789868249262.jpg'), data: jpg512 },
    { path: path.join(rootDir, 'src/assets/images/app_icon_1789868264046.jpg'), data: jpg512 },
  ];

  for (const t of targetFiles) {
    fs.mkdirSync(path.dirname(t.path), { recursive: true });
    fs.writeFileSync(t.path, t.data);
    console.log(`✓ Generated: ${path.relative(rootDir, t.path)} (${t.data.length} bytes)`);
  }

  console.log('All full-bleed desktop icons generated successfully!');
}

run().catch(err => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
