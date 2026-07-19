const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
  favicon: 32,
  icon: 1024,
  splash: 1242,
  adaptive: 1024
};

async function generateIcons() {
  const svgBuffer = fs.readFileSync(path.join(__dirname, '../assets/favicon.svg'));

  // Generate favicon.png
  await sharp(svgBuffer)
    .resize(sizes.favicon, sizes.favicon)
    .png()
    .toFile(path.join(__dirname, '../assets/favicon.png'));

  // Generate icon.png
  await sharp(svgBuffer)
    .resize(sizes.icon, sizes.icon)
    // iOS App Store icons must be fully opaque and contain no alpha channel.
    .flatten({ background: '#071417' })
    .removeAlpha()
    .png()
    .toFile(path.join(__dirname, '../assets/icon.png'));

  // Generate splash icon
  await sharp(svgBuffer)
    .resize(sizes.splash, sizes.splash)
    .flatten({ background: '#071417' })
    .removeAlpha()
    .png()
    .toFile(path.join(__dirname, '../assets/splash-icon.png'));

  // Generate adaptive icon
  await sharp(svgBuffer)
    .resize(sizes.adaptive, sizes.adaptive)
    .flatten({ background: '#071417' })
    .removeAlpha()
    .png()
    .toFile(path.join(__dirname, '../assets/adaptive-icon.png'));

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
