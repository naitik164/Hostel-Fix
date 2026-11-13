const sharp = require('d:/HostelFix/frontend/node_modules/sharp');
const fs = require('fs');
const path = require('path');

const srcPath = 'C:/Users/Naitik Anand/.gemini/antigravity/brain/7ce30e1b-9937-486f-8067-d93e223c4418/.user_uploaded/media_1794542988662_a46a6835.png';
const outDir = path.resolve('frontend/public');

async function generateAssets() {
  console.log('Generating assets from:', srcPath);
  console.log('Output directory:', outDir);
  
  // 1. Full stacked logo (779 x 550)
  const fullCrop = sharp(srcPath).extract({ left: 121, top: 73, width: 779, height: 550 });
  await fullCrop.clone().png({ quality: 100, compressionLevel: 9 }).toFile(path.join(outDir, 'hostelfix-logo.png'));
  await fullCrop.clone().webp({ quality: 100, lossless: true }).toFile(path.join(outDir, 'hostelfix-logo.webp'));
  await fullCrop.clone().png().toFile(path.join(outDir, 'logo.png'));
  await fullCrop.clone().webp({ quality: 100, lossless: true }).toFile(path.join(outDir, 'logo.webp'));
  console.log('Generated full stacked logo: hostelfix-logo.png, hostelfix-logo.webp, logo.png, logo.webp');

  // 2. Icon tight crop (409 x 381)
  const iconCropBuffer = await sharp(srcPath).extract({ left: 297, top: 73, width: 409, height: 381 }).toBuffer();
  await sharp(iconCropBuffer).png().toFile(path.join(outDir, 'hostelfix-icon-tight.png'));
  await sharp(iconCropBuffer).webp({ quality: 100, lossless: true }).toFile(path.join(outDir, 'hostelfix-icon-tight.webp'));

  // 3. Icon centered in square canvas (512 x 512) - Scaled to fill square gracefully (500x466)
  const iconScaled = await sharp(iconCropBuffer)
    .resize(500, 500, { fit: 'inside' })
    .toBuffer();
  const scaledMeta = await sharp(iconScaled).metadata();
  const iconLeft = Math.round((512 - scaledMeta.width) / 2); // 6
  const iconTop = Math.round((512 - scaledMeta.height) / 2);  // 23
  
  const icon512 = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).composite([{ input: iconScaled, left: iconLeft, top: iconTop }]).png().toBuffer();

  await sharp(icon512).png().toFile(path.join(outDir, 'hostelfix-icon.png'));
  await sharp(icon512).webp({ quality: 100, lossless: true }).toFile(path.join(outDir, 'hostelfix-icon.webp'));
  await sharp(icon512).png().toFile(path.join(outDir, 'logo-icon.png'));
  await sharp(icon512).webp({ quality: 100, lossless: true }).toFile(path.join(outDir, 'logo-icon.webp'));

  // Multi-resolution icon sizes: 256, 192, 128, 64, 48, 32, 16
  const sizes = [256, 192, 128, 64, 48, 32, 16];
  for (const s of sizes) {
    const resized = sharp(icon512).resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
    await resized.clone().png().toFile(path.join(outDir, `hostelfix-icon-${s}.png`));
    await resized.clone().webp({ quality: 100, lossless: true }).toFile(path.join(outDir, `hostelfix-icon-${s}.webp`));
    
    // Overwrite legacy paths so existing code instantly benefits
    if (s === 128) {
      await resized.clone().png().toFile(path.join(outDir, 'logo-icon-128.png'));
      await resized.clone().webp({ quality: 100, lossless: true }).toFile(path.join(outDir, 'logo-icon-128.webp'));
    }
    if (s === 64) {
      await resized.clone().png().toFile(path.join(outDir, 'logo-icon-64.png'));
      await resized.clone().webp({ quality: 100, lossless: true }).toFile(path.join(outDir, 'logo-icon-64.webp'));
      await resized.clone().png().toFile(path.join(outDir, 'favicon-64.png'));
    }
    if (s === 48) {
      await resized.clone().webp({ quality: 100, lossless: true }).toFile(path.join(outDir, 'logo-icon-48.webp'));
    }
    if (s === 32) {
      await resized.clone().webp({ quality: 100, lossless: true }).toFile(path.join(outDir, 'logo-icon-32.webp'));
      await resized.clone().png().toFile(path.join(outDir, 'favicon-32.png'));
    }
    if (s === 192) {
      await resized.clone().png().toFile(path.join(outDir, 'favicon.png'));
    }
  }
  console.log('Generated multi-resolution icons & favicons');

  // 4. Horizontal lockup with Full Text (Icon + Wordmark + Subtitle)
  // Full text is left: 121, top: 465, width: 779, height: 158
  const fullTextBuffer = await sharp(srcPath).extract({ left: 121, top: 465, width: 779, height: 158 }).toBuffer();
  // Scale icon to height 158:
  const iconH158 = await sharp(iconCropBuffer).resize({ height: 158 }).toBuffer();
  const iconH158Meta = await sharp(iconH158).metadata();
  const gap1 = 28;
  const horiz1W = iconH158Meta.width + gap1 + 779;
  const horiz1H = 158;
  const horiz1 = await sharp({
    create: {
      width: horiz1W,
      height: horiz1H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).composite([
    { input: iconH158, left: 0, top: 0 },
    { input: fullTextBuffer, left: iconH158Meta.width + gap1, top: 0 }
  ]).png().toBuffer();

  await sharp(horiz1).png().toFile(path.join(outDir, 'hostelfix-logo-horizontal.png'));
  await sharp(horiz1).webp({ quality: 100, lossless: true }).toFile(path.join(outDir, 'hostelfix-logo-horizontal.webp'));
  console.log('Generated horizontal logo:', horiz1W, 'x', horiz1H);

  // 5. Horizontal lockup Clean (Icon + Wordmark only, no subtitle)
  // Wordmark is left: 199, top: 465, width: 623, height: 116
  const wmBuffer = await sharp(srcPath).extract({ left: 199, top: 465, width: 623, height: 116 }).toBuffer();
  // Scale icon to height 116:
  const iconH116 = await sharp(iconCropBuffer).resize({ height: 116 }).toBuffer();
  const iconH116Meta = await sharp(iconH116).metadata();
  const gap2 = 22;
  const horiz2W = iconH116Meta.width + gap2 + 623;
  const horiz2H = 116;
  const horiz2 = await sharp({
    create: {
      width: horiz2W,
      height: horiz2H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).composite([
    { input: iconH116, left: 0, top: 0 },
    { input: wmBuffer, left: iconH116Meta.width + gap2, top: 0 }
  ]).png().toBuffer();

  await sharp(horiz2).png().toFile(path.join(outDir, 'hostelfix-logo-horizontal-clean.png'));
  await sharp(horiz2).webp({ quality: 100, lossless: true }).toFile(path.join(outDir, 'hostelfix-logo-horizontal-clean.webp'));
  console.log('Generated clean horizontal logo:', horiz2W, 'x', horiz2H);

  // 6. Favicon SVG
  const icon128Buffer = await sharp(iconCropBuffer).resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const b64 = icon128Buffer.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">\n  <image width="128" height="128" href="data:image/png;base64,${b64}"/>\n</svg>\n`;
  fs.writeFileSync(path.join(outDir, 'favicon.svg'), svgContent, 'utf8');
  console.log('Generated favicon.svg');

  // Also write logo-icon.svg
  const icon512PngBuffer = await sharp(icon512).png().toBuffer();
  const b64_512 = icon512PngBuffer.toString('base64');
  const svg512Content = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">\n  <image width="512" height="512" href="data:image/png;base64,${b64_512}"/>\n</svg>\n`;
  fs.writeFileSync(path.join(outDir, 'logo-icon.svg'), svg512Content, 'utf8');
  console.log('Generated logo-icon.svg');

  // Clean up temporary test files
  if (fs.existsSync(path.join(outDir, 'test-full-logo.png'))) fs.unlinkSync(path.join(outDir, 'test-full-logo.png'));
  if (fs.existsSync(path.join(outDir, 'test-icon.png'))) fs.unlinkSync(path.join(outDir, 'test-icon.png'));
  console.log('Cleaned up test files');
}

generateAssets().then(() => {
  console.log('All assets generated successfully!');
  process.exit(0);
}).catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
