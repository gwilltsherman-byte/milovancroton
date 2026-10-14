// Development tool only. Requires sharp; the app itself has no added dependency.
// NODE_PATH=/path/to/node_modules node tools/generate-brand.cjs
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/brand/milo-symbol.svg'), 'utf8');
const glyph = source.match(/<path\b[^>]*\/>/)[0];
const green = '#234c3b', leaf = '#d4e6b5';
const svg = (body, title) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${title}">${body}</svg>\n`;
const icon = scale => svg(`<rect width="64" height="64" fill="${green}"/><g fill="${leaf}" transform="translate(${32*(1-scale)} ${32*(1-scale)}) scale(${scale})">${glyph}</g>`, 'Milo bull app icon');
// Keep the vector origin inside every exported PNG, without a tool-specific dependency.
async function writePNG(file, sourceSVG, size) {
  const png = await sharp(Buffer.from(sourceSVG)).resize(size,size).png().toBuffer();
  const origin = 'Origin: original Milo bull vector in assets/brand/milo-symbol.svg, authored for Milo on 2026-10-13. Rasterized by tools/generate-brand.cjs with sharp; no generative raster imagery.';
  const data = Buffer.from('impeccable:prompt\0' + origin, 'latin1');
  const type = Buffer.from('tEXt');
  let crc = 0xffffffff;
  for (const byte of Buffer.concat([type,data])) {
    crc ^= byte;
    for (let bit=0;bit<8;bit++) crc = (crc>>>1) ^ ((crc&1) ? 0xedb88320 : 0);
  }
  const chunk=Buffer.alloc(data.length+12);
  chunk.writeUInt32BE(data.length,0);type.copy(chunk,4);data.copy(chunk,8);chunk.writeUInt32BE((crc^0xffffffff)>>>0,chunk.length-4);
  fs.writeFileSync(path.join(root,file),Buffer.concat([png.subarray(0,-12),chunk,png.subarray(-12)]));
}
async function run() {
  fs.writeFileSync(path.join(root, 'assets/brand/milo-symbol-light.svg'), source.replace(green, leaf));
  fs.writeFileSync(path.join(root, 'assets/brand/milo-app-icon.svg'), icon(.82));
  // A dedicated compact version uses the same silhouette without the tiny eye cuts.
  const compact = glyph.replace(/ZM22 33[^\"]*/, 'Z');
  const favicon = svg(`<rect width="64" height="64" rx="13" fill="${green}"/><g fill="${leaf}">${compact}</g>`, 'Milo');
  fs.writeFileSync(path.join(root, 'favicon.svg'), favicon);
  for (const [file, size, scale] of [['icon-192.png',192,.82],['icon-512.png',512,.82],['icon-maskable-512.png',512,.70],['apple-touch-icon.png',180,.82]]) {
    await writePNG(file,icon(scale),size);
  }
  await writePNG('favicon-32.png',favicon,32);
  const indexPath=path.join(root,'index.html');
  let html=fs.readFileSync(indexPath,'utf8');
  html=html.replace(/<svg class="milo-mark"[\s\S]*?<\/svg>/, `<svg class="milo-mark" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true" focusable="false">${glyph}</svg>`);
  fs.writeFileSync(indexPath,html);
  console.log('Generated Milo header mark, vector assets, favicons and four app icons.');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
