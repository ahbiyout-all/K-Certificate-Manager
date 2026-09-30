import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Transparent Background, Huge Shield Emblem (Fills 96% of canvas, 100% transparent around shield)
const fullBleedTransparentSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Metallic Gold Outer Border Gradient -->
    <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF8DC" />
      <stop offset="20%" stop-color="#FFD700" />
      <stop offset="45%" stop-color="#F59E0B" />
      <stop offset="75%" stop-color="#FFE082" />
      <stop offset="100%" stop-color="#92400E" />
    </linearGradient>

    <!-- Shield Inner Fill Gradient -->
    <linearGradient id="shieldFill" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E3A8A" />
      <stop offset="35%" stop-color="#1E293B" />
      <stop offset="70%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>

    <!-- Certificate Gold Seal Gradient -->
    <linearGradient id="sealGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFBEB" />
      <stop offset="30%" stop-color="#FDE047" />
      <stop offset="60%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#B45309" />
    </linearGradient>

    <!-- Key Shading Gradient -->
    <linearGradient id="keyBody" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FEF08A" />
      <stop offset="30%" stop-color="#FBBF24" />
      <stop offset="70%" stop-color="#D97706" />
      <stop offset="100%" stop-color="#78350F" />
    </linearGradient>

    <!-- Korean Taegeuk Red & Blue Accent -->
    <linearGradient id="taegeukRed" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EF4444" />
      <stop offset="100%" stop-color="#991B1B" />
    </linearGradient>
    <linearGradient id="taegeukBlue" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#1E3A8A" />
    </linearGradient>

    <!-- Inner Shield Glow -->
    <radialGradient id="shieldCenterGlow" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.4" />
      <stop offset="60%" stop-color="#1D4ED8" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Drop Shadow for 3D Floating Effect on Desktop Wallpaper -->
    <filter id="shieldShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.5" />
    </filter>
    <filter id="elemShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000000" flood-opacity="0.55" />
    </filter>
    <filter id="keyGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#F59E0B" flood-opacity="0.75" />
    </filter>
  </defs>

  <!-- NOTE: NO BACKGROUND BOX! Outside the shield is 100% transparent so desktop wallpaper shows through without being blocked! -->

  <!-- Security Shield Silhouette (Enlarged to fill ~96% of 512x512 canvas) -->
  <g filter="url(#shieldShadow)">
    <!-- Outer Heavy Metallic Golden Shield Frame -->
    <path d="M 256 16 
             C 385 16 476 46 492 115 
             C 492 325 385 448 256 498 
             C 127 448 20 325 20 115 
             C 36 46 127 16 256 16 Z" 
          fill="url(#shieldFill)" 
          stroke="url(#goldBorder)" 
          stroke-width="18" 
          stroke-linejoin="round" />

    <!-- Shield Inner Bevel Highlight -->
    <path d="M 256 36 
             C 368 36 450 62 464 122 
             C 464 308 368 424 256 470 
             C 144 424 48 308 48 122 
             C 62 62 144 36 256 36 Z" 
          fill="none" 
          stroke="#38BDF8" 
          stroke-opacity="0.45" 
          stroke-width="4.5" />

    <!-- Shield Ambient Core Radial Glow -->
    <path d="M 256 42 
             C 360 42 440 68 452 125 
             C 452 300 360 415 256 460 
             C 152 415 60 300 60 125 
             C 72 68 152 42 256 42 Z" 
          fill="url(#shieldCenterGlow)" />
  </g>

  <!-- Central Certificate Sheet (Large & Crisp) -->
  <g filter="url(#elemShadow)">
    <rect x="146" y="90" width="220" height="260" rx="16" ry="16" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="4" />
    <!-- Folded Corner -->
    <path d="M 322 90 L 366 134 L 322 134 Z" fill="#E2E8F0" />
    <path d="M 322 90 L 322 134 L 366 134" fill="none" stroke="#94A3B8" stroke-width="2" />
    
    <!-- Security Text & Watermark Lines -->
    <rect x="172" y="122" width="125" height="11" rx="5.5" fill="#64748B" />
    <rect x="172" y="148" width="168" height="8" rx="4" fill="#CBD5E1" />
    <rect x="172" y="167" width="168" height="8" rx="4" fill="#CBD5E1" />
    <rect x="172" y="186" width="130" height="8" rx="4" fill="#CBD5E1" />

    <!-- Government/Bank Security Ribbon -->
    <path d="M 226 218 L 256 200 L 286 218 L 278 262 L 256 250 L 234 262 Z" fill="url(#taegeukRed)" />
    <path d="M 234 262 L 256 250 L 278 262 L 272 276 L 256 266 L 240 276 Z" fill="url(#taegeukBlue)" />

    <!-- Gold Official Seal Badge -->
    <circle cx="256" cy="224" r="32" fill="url(#sealGold)" stroke="#B45309" stroke-width="2.5" />
    <circle cx="256" cy="224" r="25" fill="none" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="1.8" stroke-dasharray="3.5,2.5" />
    <!-- Security Lock Icon inside Seal -->
    <rect x="249" y="222" width="14" height="12" rx="2.5" fill="#78350F" />
    <path d="M 251.5 222 L 251.5 216 C 251.5 213 260.5 213 260.5 216 L 260.5 222" fill="none" stroke="#78350F" stroke-width="2.5" />
  </g>

  <!-- Large 3D Master Key (Spanning Foreground with Vibrant Gold Shine) -->
  <g filter="url(#keyGlow)" transform="translate(0, 24)">
    <!-- Key Loop / Bow -->
    <circle cx="200" cy="308" r="52" fill="url(#keyBody)" stroke="#78350F" stroke-width="5.5" />
    <circle cx="200" cy="308" r="25" fill="#0F172A" stroke="#B45309" stroke-width="4.5" />
    <circle cx="200" cy="308" r="14" fill="url(#keyBody)" />
    
    <!-- Key Shaft -->
    <rect x="245" y="296" width="150" height="24" rx="6" fill="url(#keyBody)" stroke="#78350F" stroke-width="4.5" />
    
    <!-- Key Teeth / Digital Bit Cuts -->
    <rect x="336" y="318" width="18" height="28" rx="3.5" fill="url(#keyBody)" stroke="#78350F" stroke-width="3.5" />
    <rect x="368" y="318" width="18" height="38" rx="3.5" fill="url(#keyBody)" stroke="#78350F" stroke-width="3.5" />
  </g>

  <!-- Bottom Gold Badge: "K-CERT" -->
  <g filter="url(#elemShadow)">
    <rect x="156" y="420" width="200" height="46" rx="12" fill="#090E1D" stroke="url(#goldBorder)" stroke-width="4" />
    <text x="256" y="452" font-family="'Pretendard', 'Segoe UI', Arial, sans-serif" font-weight="900" font-size="24" fill="url(#sealGold)" text-anchor="middle" letter-spacing="4">
      K-CERT
    </text>
  </g>
</svg>
`;

/**
 * Builds a standard Windows .ICO binary containing multiple PNG frames with 32-bit RGBA transparency
 */
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
    dir.writeUInt8(size >= 256 ? 0 : size, 0); // Width (0 means 256)
    dir.writeUInt8(size >= 256 ? 0 : size, 1); // Height (0 means 256)
    dir.writeUInt8(0, 2); // Color count
    dir.writeUInt8(0, 3); // Reserved
    dir.writeUInt16LE(1, 4); // Color planes
    dir.writeUInt16LE(32, 6); // Bits per pixel (32-bit RGBA for full alpha transparency)
    dir.writeUInt32LE(buffer.length, 8); // Image byte size
    dir.writeUInt32LE(offset, 12); // Image byte offset

    dirEntries.push(dir);
    imageBodies.push(buffer);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageBodies]);
}

async function run() {
  console.log('Generating maximum-size desktop icons with 100% TRANSPARENT backgrounds...');
  const svgBuffer = Buffer.from(fullBleedTransparentSvg);

  const sizes = [256, 128, 64, 48, 32, 16];
  const pngBuffers = [];

  for (const s of sizes) {
    // Render with transparent background
    const buf = await sharp(svgBuffer)
      .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    pngBuffers.push({ size: s, buffer: buf });
  }

  // 512x512 High-Res PNG with Transparent Background
  const png512 = await sharp(svgBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();

  // For JPEG fallbacks, composite over a dark navy/slate background
  const jpg512 = await sharp(svgBuffer)
    .resize(512, 512)
    .flatten({ background: '#0F172A' })
    .jpeg({ quality: 96 })
    .toBuffer();

  const jpg256 = await sharp(svgBuffer)
    .resize(256, 256)
    .flatten({ background: '#0F172A' })
    .jpeg({ quality: 96 })
    .toBuffer();

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

    // Root shortcuts for installer / packaging
    { path: path.join(rootDir, 'app-icon.ico'), data: icoBuffer },
    { path: path.join(rootDir, 'app.ico'), data: icoBuffer },

    // Source images
    { path: path.join(rootDir, 'src/assets/images/app_logo_1789868249262.jpg'), data: jpg512 },
    { path: path.join(rootDir, 'src/assets/images/app_icon_1789868264046.jpg'), data: jpg512 },
  ];

  for (const t of targetFiles) {
    fs.mkdirSync(path.dirname(t.path), { recursive: true });
    fs.writeFileSync(t.path, t.data);
    console.log(`✓ Generated: ${path.relative(rootDir, t.path)} (${t.data.length} bytes)`);
  }

  console.log('All transparent, full-size desktop icons generated successfully!');
}

run().catch(err => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
