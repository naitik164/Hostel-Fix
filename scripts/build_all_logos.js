import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sharp = require(path.resolve('frontend/node_modules/sharp'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../frontend/public');

const COLORS = {
  forest: '#2A3F38',
  darkForest: '#202E22',
  botanical: '#22503B',
  olive: '#6A8A64',
  sage: '#A7B88C',
  lightSage: '#C1CEA6',
  lime: '#C3DC9B',
  paleSage: '#DADFB9',
  ivory: '#EBECDE',
  cream: '#E8EFD3',
  softWhite: '#F9FBF6',
};

/**
 * Returns the exact SVG path data for the unified wrench + swoop shape.
 */
function getWrenchSwoopPath() {
  return `M 46 186
          C 66 208, 106 218, 144 212
          C 170 206, 192 192, 206 168
          C 214 154, 222 144, 218 138
          C 216 134, 212 134, 206 138
          L 194 148
          C 188 152, 182 148, 180 142
          L 174 126
          C 170 118, 162 118, 158 126
          C 154 136, 158 152, 168 166
          C 154 182, 128 196, 94 196
          C 72 196, 56 190, 46 186 Z`;
}

/**
 * Generates the house, window, bed, and wrench symbol.
 * ViewBox: 0 0 240 240
 */
function createSymbolSVG({ houseColor, wrenchColor, id = 'sym' }) {
  return `
    <g id="${id}">
      <!-- House Roof: Apex at (114, 34), eaves at (44, 94) and (184, 94) -->
      <path d="M 44 94 L 114 34 L 184 94" 
            fill="none" 
            stroke="${houseColor}" 
            stroke-width="14" 
            stroke-linecap="round" 
            stroke-linejoin="round" />

      <!-- Left Wall: from eave (60, 98) down to base (60, 188) -->
      <path d="M 60 98 L 60 188" 
            fill="none" 
            stroke="${houseColor}" 
            stroke-width="14" 
            stroke-linecap="round" />

      <!-- Right Wall: upper portion down to (168, 136) -->
      <path d="M 168 98 L 168 136" 
            fill="none" 
            stroke="${houseColor}" 
            stroke-width="14" 
            stroke-linecap="round" />

      <!-- 4-Pane Square Window under apex -->
      <rect x="101" y="60" width="10" height="10" rx="2.5" fill="${houseColor}" />
      <rect x="117" y="60" width="10" height="10" rx="2.5" fill="${houseColor}" />
      <rect x="101" y="76" width="10" height="10" rx="2.5" fill="${houseColor}" />
      <rect x="117" y="76" width="10" height="10" rx="2.5" fill="${houseColor}" />

      <!-- Hostel Bunk Bed Structure -->
      <!-- Left Bed Post -->
      <rect x="80" y="108" width="8" height="84" rx="4" fill="${houseColor}" />
      <!-- Right Bed Post -->
      <rect x="138" y="108" width="8" height="84" rx="4" fill="${houseColor}" />
      
      <!-- Top Bunk Mattress Rail -->
      <rect x="80" y="132" width="66" height="8" rx="4" fill="${houseColor}" />
      <!-- Top Bunk Pillow -->
      <rect x="86" y="120" width="20" height="9" rx="4.5" fill="${houseColor}" />

      <!-- Bottom Bunk Mattress Rail -->
      <rect x="80" y="168" width="66" height="8" rx="4" fill="${houseColor}" />
      <!-- Bottom Bunk Pillow -->
      <rect x="86" y="156" width="20" height="9" rx="4.5" fill="${houseColor}" />

      <!-- Integrated Curved Swoop & Maintenance Wrench -->
      <path d="${getWrenchSwoopPath()}" fill="${wrenchColor}" />
    </g>
  `;
}

/**
 * 1. logo-icon.svg - The Official App Icon Squircle
 * 512 x 512
 */
function createLogoIconSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Deep Forest to Botanical Gradient -->
    <linearGradient id="appIconBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2A3F38" />
      <stop offset="40%" stop-color="#22503B" />
      <stop offset="100%" stop-color="#202E22" />
    </linearGradient>

    <!-- Top-center ambient highlight -->
    <radialGradient id="topGlow" cx="50%" cy="25%" r="60%">
      <stop offset="0%" stop-color="#3B594E" stop-opacity="0.45" />
      <stop offset="100%" stop-color="#202E22" stop-opacity="0" />
    </radialGradient>

    <!-- Soft drop shadow for icon elements -->
    <filter id="iconDepth" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#141E17" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Squircle Base with 116px radius (22.6%) -->
  <rect x="16" y="16" width="480" height="480" rx="116" ry="116" fill="url(#appIconBg)" />
  <rect x="16" y="16" width="480" height="480" rx="116" ry="116" fill="url(#topGlow)" />
  <!-- Subtle inner border -->
  <rect x="16" y="16" width="480" height="480" rx="116" ry="116" fill="none" stroke="#A7B88C" stroke-width="2" stroke-opacity="0.18" />

  <!-- Centered Symbol (Scale 1.7, translated to center) -->
  <g transform="translate(52, 52) scale(1.7)" filter="url(#iconDepth)">
    ${createSymbolSVG({ houseColor: COLORS.ivory, wrenchColor: COLORS.lime, id: 'appIconMark' })}
  </g>
</svg>`;
}

/**
 * 2. favicon.svg - Standalone Browser Tab Icon
 */
function createFaviconSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="favBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2A3F38" />
      <stop offset="100%" stop-color="#202E22" />
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="120" height="120" rx="28" fill="url(#favBg)" />
  <g transform="translate(10, 10) scale(0.45)">
    ${createSymbolSVG({ houseColor: COLORS.ivory, wrenchColor: COLORS.lime, id: 'favMark' })}
  </g>
</svg>`;
}

/**
 * 3. logo-full.svg / logo-light.svg
 * Horizontal wordmark + symbol for light backgrounds (#EBECDE, #F9FBF6, #FFFFFF)
 * Dimensions: 800 x 240
 */
function createLogoLightSVG({ withTagline = true } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 240" width="800" height="240">
  <defs>
    <style>
      .wm-hostel {
        font-family: 'Plus Jakarta Sans', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 800;
        font-size: 84px;
        letter-spacing: -0.035em;
        fill: ${COLORS.forest};
      }
      .wm-fix {
        font-family: 'Plus Jakarta Sans', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 800;
        font-size: 84px;
        letter-spacing: -0.035em;
        fill: ${COLORS.botanical};
      }
      .tagline {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 600;
        font-size: 20px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        fill: ${COLORS.olive};
      }
    </style>
  </defs>

  <!-- Left Icon Mark (Deep Forest house with Soft Lime wrench accent) -->
  <g transform="translate(10, 0)">
    ${createSymbolSVG({ houseColor: COLORS.forest, wrenchColor: COLORS.lime, id: 'lightMark' })}
  </g>

  <!-- Wordmark "HostelFix" -->
  <g transform="translate(255, 142)">
    <text class="wm-hostel" x="0" y="0">Hostel</text>
    <text class="wm-fix" x="282" y="0">Fix</text>
    
    <!-- Smooth Lime Swoop Arc underneath "Fix" -->
    <path d="M 284 18 
             C 320 30, 376 30, 420 18 
             C 376 25, 320 25, 284 18 Z" 
          fill="${COLORS.lime}" />
  </g>

  ${withTagline ? `
  <!-- Tagline: Complaint • Maintenance • Resolution -->
  <g transform="translate(258, 192)">
    <text class="tagline" x="0" y="0">
      Complaint
      <tspan fill="${COLORS.lime}" font-size="24">  •  </tspan>
      Maintenance
      <tspan fill="${COLORS.lime}" font-size="24">  •  </tspan>
      Resolution
    </text>
  </g>` : ''}
</svg>`;
}

/**
 * 4. logo-dark.svg
 * Horizontal wordmark + symbol for dark forest backgrounds (#2A3F38, #202E22)
 * Dimensions: 800 x 240
 */
function createLogoDarkSVG({ withTagline = true } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 240" width="800" height="240">
  <defs>
    <style>
      .wm-hostel-dark {
        font-family: 'Plus Jakarta Sans', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 800;
        font-size: 84px;
        letter-spacing: -0.035em;
        fill: ${COLORS.ivory};
      }
      .wm-fix-dark {
        font-family: 'Plus Jakarta Sans', 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 800;
        font-size: 84px;
        letter-spacing: -0.035em;
        fill: ${COLORS.lime};
      }
      .tagline-dark {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 600;
        font-size: 20px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        fill: ${COLORS.paleSage};
      }
    </style>
  </defs>

  <!-- Left Icon Mark -->
  <g transform="translate(10, 0)">
    ${createSymbolSVG({ houseColor: COLORS.ivory, wrenchColor: COLORS.lime, id: 'darkMark' })}
  </g>

  <!-- Wordmark "HostelFix" -->
  <g transform="translate(255, 142)">
    <text class="wm-hostel-dark" x="0" y="0">Hostel</text>
    <text class="wm-fix-dark" x="282" y="0">Fix</text>
    
    <!-- Smooth Lime Swoop Arc underneath "Fix" -->
    <path d="M 284 18 
             C 320 30, 376 30, 420 18 
             C 376 25, 320 25, 284 18 Z" 
          fill="${COLORS.lime}" />
  </g>

  ${withTagline ? `
  <!-- Tagline: Complaint • Maintenance • Resolution -->
  <g transform="translate(258, 192)">
    <text class="tagline-dark" x="0" y="0">
      Complaint
      <tspan fill="${COLORS.lime}" font-size="24">  •  </tspan>
      Maintenance
      <tspan fill="${COLORS.lime}" font-size="24">  •  </tspan>
      Resolution
    </text>
  </g>` : ''}
</svg>`;
}

async function run() {
  console.log('Generating production-ready logo assets for HostelFix...');

  const logoIconSVG = createLogoIconSVG();
  const faviconSVG = createFaviconSVG();
  const logoLightSVG = createLogoLightSVG({ withTagline: true });
  const logoDarkSVG = createLogoDarkSVG({ withTagline: true });
  const logoFullSVG = createLogoLightSVG({ withTagline: false });

  // 1. Write SVG assets
  fs.writeFileSync(path.join(publicDir, 'logo-icon.svg'), logoIconSVG);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSVG);
  fs.writeFileSync(path.join(publicDir, 'logo-light.svg'), logoLightSVG);
  fs.writeFileSync(path.join(publicDir, 'logo-dark.svg'), logoDarkSVG);
  fs.writeFileSync(path.join(publicDir, 'logo-full.svg'), logoFullSVG);
  console.log('✓ Generated 5 core SVG files.');

  // 2. Generate Raster WebP and PNG Assets from SVG via Sharp
  const iconBuffer = Buffer.from(logoIconSVG);
  const fullBuffer = Buffer.from(logoFullSVG);
  const favBuffer = Buffer.from(faviconSVG);

  // High-res logo-icon (512x512)
  await sharp(iconBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'logo-icon.png'));
  await sharp(iconBuffer).resize(512, 512).webp({ quality: 95 }).toFile(path.join(publicDir, 'logo-icon.webp'));

  // 128x128
  await sharp(iconBuffer).resize(128, 128).png().toFile(path.join(publicDir, 'logo-icon-128.png'));
  await sharp(iconBuffer).resize(128, 128).webp({ quality: 95 }).toFile(path.join(publicDir, 'logo-icon-128.webp'));

  // 64x64
  await sharp(iconBuffer).resize(64, 64).png().toFile(path.join(publicDir, 'logo-icon-64.png'));
  await sharp(iconBuffer).resize(64, 64).webp({ quality: 95 }).toFile(path.join(publicDir, 'logo-icon-64.webp'));

  // 48x48
  await sharp(iconBuffer).resize(48, 48).webp({ quality: 95 }).toFile(path.join(publicDir, 'logo-icon-48.webp'));

  // Favicons
  await sharp(favBuffer).resize(64, 64).png().toFile(path.join(publicDir, 'favicon.png'));
  await sharp(favBuffer).resize(64, 64).png().toFile(path.join(publicDir, 'favicon-64.png'));
  await sharp(favBuffer).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32.png'));

  // Horizontal Full Logo
  await sharp(fullBuffer).resize(800, 240).png().toFile(path.join(publicDir, 'logo.png'));
  await sharp(fullBuffer).resize(800, 240).webp({ quality: 95 }).toFile(path.join(publicDir, 'logo.webp'));

  console.log('✓ Rendered all raster formats (WebP, PNG, Favicons at 512, 128, 64, 48, 32px).');
}

run().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
